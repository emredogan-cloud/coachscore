import { SUPERCELL_DISCLAIMER } from '@/lib/env';

/**
 * Mandatory fan-content disclaimer.
 *
 * Per Supercell's Fan Content Policy, this notice must appear on every surface
 * that references the game. Rendered in the root layout footer and embedded in
 * every generated report and share card. See
 * docs/adr/0006-web-first-pwa-stripe-no-app-store.md and RISK_ANALYSIS.md (#2).
 */
export function Disclaimer() {
  return (
    <p
      role="contentinfo"
      className="mx-auto max-w-2xl px-4 py-6 text-center text-xs text-gray-500"
    >
      {SUPERCELL_DISCLAIMER}
    </p>
  );
}
