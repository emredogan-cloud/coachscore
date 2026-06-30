/**
 * Conversation memory (Feature 4 · P2). Pure memory policy: a verbatim short-term
 * window of recent turns + a rolling-summary trigger for older turns, assembled
 * into the context sent to the model. The summary *text* is produced by a cheap
 * model call elsewhere; this module owns the deterministic, testable decisions
 * (window size, when to summarize, context assembly) + graceful degradation.
 * The client persists to sessionStorage and can forget. Pure + tested.
 */

export interface ChatTurn {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

export const MEMORY = {
  /** Verbatim turns kept in the window sent to the model. */
  windowTurns: 8,
  /** Summarize older turns once the history exceeds this. */
  summarizeAfter: 12,
  /** Re-summarize every N additional turns. */
  resummarizeEvery: 4,
  maxStored: 100,
} as const;

/** The most recent N turns (the verbatim short-term window). */
export function shortTermWindow(
  turns: readonly ChatTurn[],
  n: number = MEMORY.windowTurns,
): ChatTurn[] {
  return turns.slice(Math.max(0, turns.length - n));
}

/** Whether the history is long enough to warrant a rolling summary. */
export function shouldSummarize(turns: readonly ChatTurn[]): boolean {
  return turns.length > MEMORY.summarizeAfter;
}

/** Whether to (re)generate the summary at this length. */
export function shouldResummarize(turns: readonly ChatTurn[]): boolean {
  if (!shouldSummarize(turns)) return false;
  return (turns.length - MEMORY.summarizeAfter) % MEMORY.resummarizeEvery === 0;
}

/**
 * Assemble the context to send: a "## Earlier in this session" summary note (if
 * any) followed by the verbatim window. Degrades to just the window when there's
 * no summary.
 */
export function assembleContext(
  turns: readonly ChatTurn[],
  summary: string | null,
): { summaryNote: string | null; window: ChatTurn[] } {
  const window = shortTermWindow(turns);
  const summaryNote =
    summary && summary.trim() !== ''
      ? `## Earlier in this session\n${summary.trim()}`
      : null;
  return { summaryNote, window };
}

/** Cap stored history (the client persists this). */
export function capHistory(turns: readonly ChatTurn[]): ChatTurn[] {
  return turns.slice(Math.max(0, turns.length - MEMORY.maxStored));
}
