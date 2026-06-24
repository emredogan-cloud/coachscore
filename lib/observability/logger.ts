/**
 * Structured logging (Phase 9). Level-filtered JSON log records to a pluggable
 * sink, with shallow PII redaction (GDPR/KVKK). The sink + clock are injectable,
 * so the level/redaction logic is unit-tested with an in-memory sink; production
 * uses the console sink (one JSON line per record, friendly to log aggregators).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogRecord {
  readonly ts: string;
  readonly level: LogLevel;
  readonly logger: string;
  readonly msg: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface LogSink {
  write(record: LogRecord): void;
}

export class MemoryLogSink implements LogSink {
  readonly records: LogRecord[] = [];
  write(record: LogRecord): void {
    this.records.push(record);
  }
}

export class ConsoleLogSink implements LogSink {
  write(record: LogRecord): void {
    const line = JSON.stringify(record);
    if (record.level === 'error') console.error(line);
    else if (record.level === 'warn') console.warn(line);
    // info/debug → stdout (structured-log convention; avoids console.log).
    else process.stdout.write(`${line}\n`);
  }
}

const DEFAULT_REDACT = [
  'email',
  'token',
  'secret',
  'password',
  'authorization',
  'apikey',
  'api_key',
  'playertag',
  'player_tag',
];

function redact(
  context: Readonly<Record<string, unknown>> | undefined,
  keys: readonly string[],
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = keys.some((bad) => k.toLowerCase().includes(bad))
      ? '[redacted]'
      : v;
  }
  return out;
}

export interface LoggerOptions {
  readonly minLevel?: LogLevel;
  readonly sink?: LogSink;
  readonly now?: () => Date;
  readonly redactKeys?: readonly string[];
}

export class StructuredLogger {
  private readonly minLevel: LogLevel;
  private readonly sink: LogSink;
  private readonly now: () => Date;
  private readonly redactKeys: readonly string[];

  constructor(
    private readonly name: string,
    options: LoggerOptions = {},
  ) {
    this.minLevel = options.minLevel ?? 'info';
    this.sink = options.sink ?? new ConsoleLogSink();
    this.now = options.now ?? (() => new Date());
    this.redactKeys = options.redactKeys ?? DEFAULT_REDACT;
  }

  private emit(
    level: LogLevel,
    msg: string,
    context?: Record<string, unknown>,
  ): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;
    this.sink.write({
      ts: this.now().toISOString(),
      level,
      logger: this.name,
      msg,
      context: redact(context, this.redactKeys),
    });
  }

  debug(msg: string, context?: Record<string, unknown>): void {
    this.emit('debug', msg, context);
  }
  info(msg: string, context?: Record<string, unknown>): void {
    this.emit('info', msg, context);
  }
  warn(msg: string, context?: Record<string, unknown>): void {
    this.emit('warn', msg, context);
  }
  error(msg: string, context?: Record<string, unknown>): void {
    this.emit('error', msg, context);
  }

  child(suffix: string): StructuredLogger {
    return new StructuredLogger(`${this.name}.${suffix}`, {
      minLevel: this.minLevel,
      sink: this.sink,
      now: this.now,
      redactKeys: this.redactKeys,
    });
  }
}

export function createLogger(
  name: string,
  options?: LoggerOptions,
): StructuredLogger {
  return new StructuredLogger(name, options);
}
