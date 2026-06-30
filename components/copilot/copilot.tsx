'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * CoachScore Copilot UI (COPILOT-P0) — a floating, streaming chat assistant on
 * every page so a new player never feels lost. Talks to /api/copilot (grounded,
 * rate-limited Anthropic). Reads the plain-text stream incrementally. Degrades
 * gracefully: a clear note on 503 (not configured) / 429 (rate-limited). No chat
 * library — a small client island.
 */
interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hey! I'm the CoachScore Copilot. Ask me how scoring works, what to upgrade, or anything about your Clash of Clans account.",
};

// Feature 4 · P2: short conversation memory persisted across reloads. Bounded so
// it never grows without limit; "Clear chat" is the explicit forget control.
const STORAGE_KEY = 'coachscore.copilot.v1';
const MAX_PERSISTED = 50;

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Restore persisted conversation once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return;
      const stored = JSON.parse(raw) as Msg[];
      if (Array.isArray(stored) && stored.length > 0) {
        setMessages([GREETING, ...stored]);
      }
    } catch {
      /* corrupt/blocked storage — start fresh */
    }
  }, []);

  // Persist on change (greeting excluded; capped).
  useEffect(() => {
    try {
      const toStore = messages
        .filter((m) => m !== GREETING)
        .slice(-MAX_PERSISTED);
      if (toStore.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      /* storage blocked — non-fatal */
    }
  }, [messages]);

  function forget() {
    setMessages([GREETING]);
    setNote(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (text === '' || busy) return;
    const userMsg: Msg = { role: 'user', content: text };
    // Anthropic requires the first turn to be a user turn — drop any leading
    // assistant turns (the greeting, or a restored greeting that lost reference
    // equality after a localStorage round-trip).
    const convo: Msg[] = [...messages, userMsg];
    while (convo.length > 0 && convo[0]?.role === 'assistant') convo.shift();
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: convo }),
      });
      if (res.status === 503) {
        setNote('The Copilot is not available right now.');
        return;
      }
      if (res.status === 429) {
        setNote('A lot of questions at once — give it a few seconds.');
        return;
      }
      if (!res.ok || res.body === null) {
        setNote('Something went wrong — try again.');
        return;
      }
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch {
      setNote('Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={
          open ? 'Close CoachScore Copilot' : 'Open CoachScore Copilot'
        }
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-violet-gradient text-white shadow-glow-violet transition hover:shadow-glow-violet-sm"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {open ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          )}
        </svg>
      </button>

      {open ? (
        <div className="fixed bottom-20 right-4 z-40 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a14] shadow-2xl">
          <header className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-2.5">
            <div>
              <p className="text-sm font-bold text-white">CoachScore Copilot</p>
              <p className="text-[11px] text-[var(--muted)]">
                Clash of Clans + product help · AI, grounded in your data
              </p>
            </div>
            <button
              type="button"
              onClick={forget}
              disabled={busy || messages.length <= 1}
              className="shrink-0 rounded-md px-2 py-1 text-[11px] text-[var(--muted)] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
              title="Clear this conversation"
            >
              Clear
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-violet-gradient px-3 py-2 text-sm text-white'
                    : 'mr-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-white/5 px-3 py-2 text-sm text-[var(--fg)]/90'
                }
              >
                {m.content || (busy ? '…' : '')}
              </div>
            ))}
            {note ? <p className="text-xs text-amber-300/90">{note}</p> : null}
            <div ref={endRef} />
          </div>
          <div className="flex gap-2 border-t border-white/10 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send();
              }}
              placeholder="Ask the Copilot…"
              disabled={busy}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:border-brand-violet/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || input.trim() === ''}
              className="rounded-lg bg-violet-gradient px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
