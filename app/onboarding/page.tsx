import { permanentRedirect } from 'next/navigation';

/**
 * `/onboarding` retired (PMF-correction sprint). The static interstitial added a
 * pointless step between the homepage and the actual tool — the homepage CTA now
 * goes straight to `/report` (paste tag → instant score). This route 308-redirects
 * so any old inbound links / bookmarks land on the real flow instead of a 404.
 */
export default function OnboardingPage(): never {
  permanentRedirect('/report');
}
