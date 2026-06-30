'use client';

import { useRef, useState } from 'react';
// Import from the leaf module (not the @/lib/intake barrel) so this client
// component doesn't pull server-only code (node:crypto/fs via snapshot) into the bundle.
import { validateUpload, UPLOAD_LIMITS } from '@/lib/intake/upload-limits';

/**
 * Premium screenshot dropzone (Feature 2 · P1-C). Drag-drop or browse, with live
 * preview thumbnails, client-side validation (type/size/count via the tested
 * upload-limits), and clear errors — the front of the "complete your defense
 * score" flow. Calls `onFiles` with the accepted files; the parent submits them
 * to the vision OCR.
 */
export function ScreenshotDropzone({
  onFiles,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    const v = validateUpload(
      files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    );
    setErrors([...v.errors]);
    const acceptedNames = new Set(v.accepted.map((a) => a.name));
    const accepted = files.filter((f) => acceptedNames.has(f.name));
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews(
      accepted.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    );
    onFiles(accepted);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled)
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handle(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging
            ? 'border-brand-violet bg-brand-violet/10'
            : 'border-white/15 bg-white/5 hover:border-brand-violet/40'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-brand-violet-light"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
        </svg>
        <p className="mt-2 text-sm font-medium text-white">
          Drag a base screenshot here, or tap to choose
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          PNG, JPEG or WEBP · up to {UPLOAD_LIMITS.maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
      </div>

      {previews.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {previews.map((p) => (
            <li key={p.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.name}
                className="h-16 w-16 rounded-lg object-cover ring-1 ring-white/10"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {errors.length > 0 ? (
        <ul className="mt-2 space-y-0.5 text-xs text-red-300">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
