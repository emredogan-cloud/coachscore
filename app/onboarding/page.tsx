import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Get started — CoachScore',
  description:
    'How CoachScore works: submit your Clash of Clans account, get a scored ' +
    'grade, and receive a prioritized, goal-aware upgrade roadmap.',
};

const STEPS: readonly { title: string; detail: string }[] = [
  {
    title: '1. Submit your account',
    detail: 'Enter your levels, upload screenshots, or paste your player tag.',
  },
  {
    title: '2. Get scored',
    detail:
      'A deterministic engine grades seven dimensions for the goal you pick.',
  },
  {
    title: '3. Get your roadmap',
    detail:
      'A prioritized, goal-aware upgrade plan — AI-drafted, human-verified.',
  },
];

const GOALS: readonly string[] = [
  'Rate my account',
  'Win wars / CWL',
  'Push trophies',
  'De-rush',
  'Get recruited',
  'Steady progress',
];

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome to CoachScore
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        Stop guessing what to upgrade next. Here is how it works.
      </p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((step) => (
          <li
            key={step.title}
            className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
          >
            <h2 className="font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-gray-500">{step.detail}</p>
          </li>
        ))}
      </ol>

      <section className="mt-8" aria-labelledby="goals-heading">
        <h2
          id="goals-heading"
          className="text-sm font-semibold uppercase text-gray-500"
        >
          Pick a goal when you start
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {GOALS.map((goal) => (
            <li
              key={goal}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm dark:border-gray-800"
            >
              {goal}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/report"
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Start — score my account
        </Link>
        <Link
          href="/pricing"
          className="rounded-md border border-gray-300 px-5 py-2.5 text-sm dark:border-gray-700"
        >
          See pricing
        </Link>
      </div>
    </div>
  );
}
