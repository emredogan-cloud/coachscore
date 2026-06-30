'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from './markdown';

/**
 * CoachScore Copilot UI (Phase 5 redesign) — a premium, floating strategy
 * advisor on every page. Talks to /api/copilot (grounded, rate-limited,
 * tool-using Anthropic) and reads the plain-text stream incrementally. Now with
 * the tactician mascot, a markdown renderer for structured answers, per-message
 * timestamps + copy, a typing indicator, and a glowing shield launcher.
 * Degrades gracefully (503 not-configured / 429 rate-limited). Client island.
 */
interface Msg {
  role: 'user' | 'assistant';
  content: string;
  ts?: number;
}

const GREETING: Msg = {
  role: 'assistant',
  content:
    "Hey! I'm the CoachScore Copilot. Ask me **how scoring works**, **what to upgrade**, or anything about your Clash of Clans account.",
};

const MASCOT = '/assets/generated/mascot-tactician.webp';

// Feature 4 · P2: short conversation memory persisted across reloads. Bounded so
// it never grows without limit; "Clear" is the explicit forget control.
const STORAGE_KEY = 'coachscore.copilot.v1';
const MAX_PERSISTED = 50;

function clockTime(ts?: number): string {
  if (ts === undefined) return '';
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function Copilot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
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

  async function copy(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — non-fatal */
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (text === '' || busy) return;
    const userMsg: Msg = { role: 'user', content: text, ts: Date.now() };
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
        body: JSON.stringify({
          messages: convo.map((m) => ({ role: m.role, content: m.content })),
        }),
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
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: '', ts: Date.now() },
      ]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copyArr = [...m];
          const last = copyArr[copyArr.length - 1];
          if (last && last.role === 'assistant') {
            copyArr[copyArr.length - 1] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return copyArr;
        });
      }
    } catch {
      setNote('Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  }

  const lastIsEmptyAssistant =
    busy &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content === '';

  return (
    <>
      {!open ? (
        <button
          type="button"
          aria-label="Open CoachScore Copilot"
          aria-expanded={false}
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-40 transition hover:scale-105 active:scale-95"
        >
          <Image
            src="/assets/generated/copilot-fab.webp"
            alt=""
            width={60}
            height={60}
            className="drop-shadow-[0_0_18px_rgba(168,85,247,0.55)]"
          />
        </button>
      ) : null}

      {open ? (
        <div className="fixed bottom-4 right-4 z-40 flex h-[32rem] max-h-[calc(100vh-2rem)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-brand-gold/25 bg-ink-950/95 shadow-glow-violet backdrop-blur-md">
          <header className="px-4 pb-2 pt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Image
                  src={MASCOT}
                  alt=""
                  width={38}
                  height={38}
                  className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
                <div>
                  <p className="text-sm font-bold text-white">
                    CoachScore{' '}
                    <span className="text-brand-violet-light">Copilot</span>
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Strategy advisor · grounded in your data
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={forget}
                  disabled={busy || messages.length <= 1}
                  className="rounded-md px-2 py-1 text-[11px] text-[var(--muted)] transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  title="Clear this conversation"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close Copilot"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* gold gem divider */}
            <div
              className="mt-2 flex items-center justify-center gap-2"
              aria-hidden
            >
              <span className="h-px w-full bg-gradient-to-r from-transparent to-brand-gold/40" />
              <span className="h-2 w-2 rotate-45 rounded-[2px] bg-gradient-to-br from-brand-gold-light to-brand-gold" />
              <span className="h-px w-full bg-gradient-to-l from-transparent to-brand-gold/40" />
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex flex-col items-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-violet-gradient px-3 py-2 text-sm text-white">
                    {m.content}
                  </div>
                  {m.ts ? (
                    <span className="mr-1 mt-0.5 text-[10px] text-[var(--muted)]">
                      {clockTime(m.ts)}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <Image
                    src={MASCOT}
                    alt=""
                    width={26}
                    height={26}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="group min-w-0 max-w-[88%]">
                    <div className="rounded-2xl rounded-bl-sm border border-white/8 bg-white/[0.04] px-3 py-2 text-sm text-[var(--fg)]/90">
                      {m.content ? (
                        <Markdown content={m.content} />
                      ) : lastIsEmptyAssistant ? (
                        <span
                          className="inline-flex gap-1"
                          aria-label="Copilot is typing"
                        >
                          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-brand-violet-light" />
                          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-brand-violet-light [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-brand-violet-light [animation-delay:300ms]" />
                        </span>
                      ) : null}
                    </div>
                    {m.content ? (
                      <div className="mt-0.5 flex items-center gap-2 pl-1">
                        {m.ts ? (
                          <span className="text-[10px] text-[var(--muted)]">
                            {clockTime(m.ts)}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void copy(m.content, i)}
                          className="text-[10px] text-[var(--muted)] opacity-0 transition hover:text-white group-hover:opacity-100"
                        >
                          {copied === i ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {note ? <p className="text-xs text-amber-300/90">{note}</p> : null}
            <div ref={endRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-white/8 p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void send();
              }}
              placeholder="Ask the Copilot…"
              disabled={busy}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-[var(--muted)] focus:border-brand-violet/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || input.trim() === ''}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-gradient text-white shadow-glow-violet-sm transition hover:shadow-glow-violet disabled:opacity-50"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
