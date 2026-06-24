import { describe, expect, it } from 'vitest';
import {
  createLogger,
  healthReport,
  LoggingAlerter,
  LoggingErrorReporter,
  MemoryLogSink,
  NoopErrorReporter,
} from '@/lib/observability';

const fixedNow = () => new Date('2026-06-24T00:00:00.000Z');

describe('StructuredLogger', () => {
  it('filters below the minimum level', () => {
    const sink = new MemoryLogSink();
    const log = createLogger('test', { minLevel: 'warn', sink, now: fixedNow });
    log.info('skipped');
    log.warn('kept');
    log.error('kept2');
    expect(sink.records.map((r) => r.msg)).toEqual(['kept', 'kept2']);
    expect(sink.records[0]?.logger).toBe('test');
    expect(sink.records[0]?.ts).toBe('2026-06-24T00:00:00.000Z');
  });

  it('redacts PII property keys', () => {
    const sink = new MemoryLogSink();
    const log = createLogger('t', { minLevel: 'info', sink, now: fixedNow });
    log.info('login', { email: 'a@b.com', townHall: 14 });
    expect(sink.records[0]?.context).toEqual({
      email: '[redacted]',
      townHall: 14,
    });
  });

  it('child loggers namespace under the parent', () => {
    const sink = new MemoryLogSink();
    createLogger('parent', { sink, now: fixedNow }).child('child').info('hi');
    expect(sink.records[0]?.logger).toBe('parent.child');
  });
});

describe('monitoring', () => {
  it('LoggingErrorReporter logs exceptions with stack', () => {
    const sink = new MemoryLogSink();
    const reporter = new LoggingErrorReporter(
      createLogger('e', { sink, now: fixedNow }),
    );
    reporter.captureException(new Error('boom'), { route: '/x' });
    expect(sink.records[0]?.level).toBe('error');
    expect(sink.records[0]?.msg).toBe('boom');
    expect(sink.records[0]?.context?.route).toBe('/x');
  });

  it('NoopErrorReporter does nothing', () => {
    expect(() =>
      new NoopErrorReporter().captureException(new Error('x')),
    ).not.toThrow();
  });

  it('LoggingAlerter escalates critical to error level', async () => {
    const sink = new MemoryLogSink();
    const alerter = new LoggingAlerter(
      createLogger('a', { sink, now: fixedNow }),
    );
    await alerter.alert('critical', 'db down');
    await alerter.alert('warning', 'slow');
    expect(sink.records[0]?.level).toBe('error');
    expect(sink.records[1]?.level).toBe('warn');
  });
});

describe('healthReport', () => {
  it('reports the activation matrix + observability wiring', () => {
    const report = healthReport();
    expect(report.status).toBe('ok');
    expect(report.subsystems.map((s) => s.name)).toEqual(
      expect.arrayContaining(['database', 'payments', 'analytics']),
    );
    expect(report.observability).toHaveProperty('errorMonitoring');
    expect(typeof report.activatedCount).toBe('number');
  });
});
