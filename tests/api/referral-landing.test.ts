import { describe, expect, it } from 'vitest';
import { GET } from '@/app/r/[code]/route';

function call(code: string) {
  return GET(new Request(`https://coachscore.app/r/${code}`), {
    params: Promise.resolve({ code }),
  });
}

describe('GET /r/[code] — referral landing', () => {
  it('attributes a valid code (cookie) and lands on the score flow', async () => {
    const res = await call('CSABCDEF');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/report?invited=1');
    expect(res.cookies.get('cs_ref')?.value).toBe('CSABCDEF');
  });

  it('normalizes a lowercase code', async () => {
    const res = await call('csabcdef');
    expect(res.cookies.get('cs_ref')?.value).toBe('CSABCDEF');
  });

  it('routes an invalid code to the score page with no attribution', async () => {
    const res = await call('not-a-code');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/report');
    expect(res.headers.get('location')).not.toContain('invited=1');
    expect(res.cookies.get('cs_ref')).toBeUndefined();
  });
});
