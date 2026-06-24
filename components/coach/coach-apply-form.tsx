'use client';

import { useState } from 'react';
import { SPECIALTIES } from '@/lib/coach';
import { submitCoachApplication } from '@/app/coach/actions';

const inputClass =
  'w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900';

export function CoachApplyForm() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');
  const [experience, setExperience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(s: string) {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await submitCoachApplication({
        displayName,
        bio,
        specialties,
        motivation,
        experience,
      });
      if (res.status === 200) {
        setMessage('Application submitted — we will review it shortly.');
      } else {
        const body = res.body as { error?: { message?: string } };
        setMessage(body.error?.message ?? `Could not submit (${res.status}).`);
      }
    } catch {
      setMessage('Submission failed — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message !== null ? (
        <p className="rounded bg-gray-100 p-2 text-sm dark:bg-gray-800">
          {message}
        </p>
      ) : null}
      <label className="block text-sm">
        Display name
        <input
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Bio
        <textarea
          className={inputClass}
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">Specialties</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <label key={s} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={specialties.includes(s)}
                onChange={() => toggle(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        Why do you want to coach?
        <textarea
          className={inputClass}
          rows={2}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Relevant experience
        <textarea
          className={inputClass}
          rows={2}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {submitting ? 'Submitting…' : 'Apply to coach'}
      </button>
    </form>
  );
}
