import Link from 'next/link';
import { GRADE_BANDS } from '@/lib/core/grade';

/**
 * Landing page (Phase 0 foundation).
 *
 * The full teaser flow (paste tag → instant score reveal) lands in Phase 4
 * (Web Product). This page establishes the brand, the value proposition, and
 * the grade scale that the scoring engine (Phase 1) produces.
 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        CoachScore
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Stop guessing what to upgrade next. Get your Clash of Clans account
        scored and receive a prioritized, goal-aware upgrade roadmap —
        AI-drafted and verified by a real expert coach.
      </p>

      <section className="mt-10" aria-labelledby="grades-heading">
        <h2 id="grades-heading" className="text-sm font-semibold uppercase">
          The CoachScore grade scale
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {GRADE_BANDS.map((band) => (
            <li
              key={band.grade}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800"
            >
              <span className="font-bold">{band.grade}</span>
              <span className="ml-2 text-gray-500">
                {band.min}
                {band.max === 100 ? '+' : `–${band.max}`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <Link
          href="/intake"
          className="inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Score your account
        </Link>
        <p className="mt-3 text-sm text-gray-500">
          Enter your levels, upload screenshots, or paste your player tag for a
          free instant score.
        </p>
      </div>
    </div>
  );
}
