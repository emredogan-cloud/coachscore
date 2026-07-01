import type { ReactNode } from 'react';

/**
 * Per-dimension icons (Visual Immersion sprint) — a crisp, IP-safe SVG per
 * CoachScore dimension so the report/sample rows read at a glance instead of
 * repeating one generic shield. Original abstract glyphs (no game art). Mapped
 * by a keyword in the dimension label so it works for both the live report
 * (`subScore.label`) and the sample page.
 */

const ICONS: Record<string, ReactNode> = {
  // Heroes — a knight helm.
  heroes: (
    <path d="M12 2c4 0 7 3 7 7v3l-3 1v3a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-3l-3-1V9c0-4 3-7 7-7zm-2 9h4M9 8h6" />
  ),
  // Offense — crossed swords.
  offense: (
    <path d="M4 4l9 9m0 0l2 2m-2-2l-2 2m9-11l-9 9m0 0l-2 2m2-2l2 2M3 17l2 2m14-2l-2 2" />
  ),
  // Defense — a fortified turret.
  defense: (
    <path d="M6 21V8H4V4h3v2h3V4h4v2h3V4h3v4h-2v13M6 21h12M9 21v-5h6v5" />
  ),
  // Progression / rush — rising bars + arrow.
  progression: <path d="M4 20h16M7 20v-6M12 20V9M17 20V5M14 6l3-3 3 3" />,
  // Walls — brick courses.
  walls: (
    <path d="M3 6h18M3 12h18M3 18h18M9 6v6M15 6v6M6 12v6M12 12v6M18 12v6M6 6V4m12 2V4" />
  ),
  // Clan value — stacked coins.
  clan: (
    <path d="M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  ),
  // Hero equipment — a potion / flask.
  equipment: (
    <path d="M9 2h6M10 2v5L6 15a4 4 0 0 0 3.6 6h4.8A4 4 0 0 0 18 15l-4-8V2M7.5 13h9" />
  ),
  // Fallback — a shield.
  shield: <path d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5l8-3z" />,
};

function keyFor(label: string): keyof typeof ICONS {
  const l = label.toLowerCase();
  if (l.includes('hero') && l.includes('equip')) return 'equipment';
  if (l.includes('equip')) return 'equipment';
  if (l.includes('hero')) return 'heroes';
  if (l.includes('offen') || l.includes('attack') || l.includes('army'))
    return 'offense';
  if (l.includes('defen')) return 'defense';
  if (l.includes('progress') || l.includes('rush')) return 'progression';
  if (l.includes('wall')) return 'walls';
  if (l.includes('clan')) return 'clan';
  return 'shield';
}

/** The icon for a dimension label, as an inline currentColor SVG. */
export function dimensionIcon(label: string): ReactNode {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[keyFor(label)]}
    </svg>
  );
}
