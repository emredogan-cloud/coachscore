import type { JsonLd } from '@/lib/seo';

/**
 * Renders one or more JSON-LD structured-data blobs into a script tag. The input
 * is built server-side from our own data (never user input), so the serialized
 * JSON is trusted static markup.
 */
export function JsonLdScript({ data }: { data: JsonLd | readonly JsonLd[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      // nosemgrep: javascript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
