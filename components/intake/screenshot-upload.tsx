'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/core';
import { MagicButton } from '@/components/ui';
import { ScreenshotDropzone } from './screenshot-dropzone';

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
  'mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-brand-violet/50 focus:outline-none';

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
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-200/90">
          Screenshot reading is not activated yet (needs an AI key). You can
          still submit; the server will report it as not activated.
        </p>
      ) : null}
      <label className="block text-sm">
        <span className="font-medium text-white">Town Hall</span>
        <input
          className={inputClass}
          type="number"
          min={11}
          max={18}
          value={townHall}
          onChange={(e) => setTownHall(Number(e.target.value) || 14)}
        />
      </label>
      <ScreenshotDropzone onFiles={setFiles} disabled={submitting} />
      <label className="block text-sm">
        <span className="font-medium text-white">Context (optional)</span>
        <input
          className={inputClass}
          type="text"
          value={context}
          placeholder="e.g. TH16 war account"
          onChange={(e) => setContext(e.target.value)}
        />
      </label>
      <MagicButton
        variant="violet"
        size="lg"
        type="submit"
        disabled={submitting || files.length === 0}
      >
        {submitting ? 'Reading…' : 'Complete my defense score'}
      </MagicButton>
    </form>
  );
}
