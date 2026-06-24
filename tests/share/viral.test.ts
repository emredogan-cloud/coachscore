import { describe, expect, it } from 'vitest';
import {
  buildReferralShare,
  buildShareTargets,
  parseShareAttribution,
  withShareAttribution,
} from '@/lib/share';

describe('social share targets', () => {
  it('builds intent URLs for every network with encoded url + text', () => {
    const targets = buildShareTargets({
      url: 'https://coachscore.app/r/CSAB23CD',
      text: 'Rate your account',
    });
    const networks = targets.map((t) => t.network);
    expect(networks).toEqual([
      'x',
      'whatsapp',
      'reddit',
      'telegram',
      'facebook',
      'copy',
    ]);
    const x = targets.find((t) => t.network === 'x');
    expect(x?.href).toContain('twitter.com/intent/tweet');
    expect(x?.href).toContain(
      encodeURIComponent('https://coachscore.app/r/CSAB23CD'),
    );
    expect(targets.find((t) => t.network === 'copy')?.href).toBe(
      'https://coachscore.app/r/CSAB23CD',
    );
  });
});

describe('share attribution (UTM + ref)', () => {
  it('tags and round-trips attribution', () => {
    const url = withShareAttribution('https://coachscore.app/r/CSAB23CD', {
      source: 'referral',
      campaign: 'flex',
      ref: 'CSAB23CD',
    });
    expect(url).toContain('utm_source=referral');
    expect(url).toContain('utm_medium=share');
    expect(url).toContain('utm_campaign=flex');
    expect(url).toContain('ref=CSAB23CD');

    const parsed = parseShareAttribution(url);
    expect(parsed).toEqual({
      source: 'referral',
      medium: 'share',
      campaign: 'flex',
      ref: 'CSAB23CD',
    });
    expect(parseShareAttribution('https://coachscore.app/')).toBeNull();
  });
});

describe('buildReferralShare', () => {
  it('produces a status-flex message when a grade + percentile are present', () => {
    const share = buildReferralShare({
      appUrl: 'https://coachscore.app',
      code: 'CSAB23CD',
      grade: 'A',
      townHall: 15,
      percentile: 12,
    });
    expect(share.url).toContain('/r/CSAB23CD');
    expect(share.url).toContain('ref=CSAB23CD');
    expect(share.text).toContain('Grade A');
    expect(share.text).toContain('Top 12% of TH15');
    expect(share.targets.length).toBeGreaterThan(0);
  });

  it('falls back to a generic invite without a grade', () => {
    const share = buildReferralShare({
      appUrl: 'https://coachscore.app',
      code: 'CSAB23CD',
    });
    expect(share.text).toContain('Rate your Clash of Clans account');
  });
});
