'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/core';

type MediaType = 'image/png' | 'image/jpeg' | 'image/webp';

async function fileToImage(
  file: File,
): Promise<{ mediaType: MediaType; dataBase64: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  const mediaType: MediaType =
    file.type === 'image/jpeg'
      ? 'image/jpeg'
      : file.type === 'image/webp'
        ? 'image/webp'
        : 'image/png';
  return { mediaType, dataBase64: btoa(binary) };
}

const inputClass =
  'w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900';

export function ScreenshotUpload({
  goal,
  onSubmit,
  submitting,
  activated,
}: {
  goal: Goal;
  onSubmit: (body: unknown) => void;
  submitting: boolean;
  activated: boolean;
}) {
  const [townHall, setTownHall] = useState(14);
  const [files, setFiles] = useState<File[]>([]);
  const [context, setContext] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const images = await Promise.all(files.map(fileToImage));
    onSubmit({ goal, townHall, context, images });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!activated ? (
        <p className="rounded bg-amber-50 p-2 text-sm text-amber-700 dark:bg-amber-950/40">
          Screenshot OCR is not activated yet (needs an AI key). You can still
          submit; the server will report it as not activated.
        </p>
      ) : null}
      <label className="block text-sm">
        Town Hall
        <input
          className={inputClass}
          type="number"
          min={11}
          max={18}
          value={townHall}
          onChange={(e) => setTownHall(Number(e.target.value) || 14)}
        />
      </label>
      <label className="block text-sm">
        Screenshots
        <input
          className={inputClass}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
      </label>
      <label className="block text-sm">
        Context (optional)
        <input
          className={inputClass}
          type="text"
          value={context}
          placeholder="e.g. TH14 war account"
          onChange={(e) => setContext(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={submitting || files.length === 0}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {submitting ? 'Reading…' : 'Extract & score'}
      </button>
    </form>
  );
}
