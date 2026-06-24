/**
 * SEO validation entrypoint (SEO execution sprint · roadmap §21).
 *
 * Run via `pnpm validate:seo`. Checks the whole SEO contract — non-thin,
 * uniquely-titled programmatic content; a connected internal-link graph with no
 * orphans; and full sitemap coverage with valid lastmod/priority. Exits
 * non-zero on any error so CI can gate on it. Warnings are printed but do not
 * fail the build.
 */

/* eslint-disable no-console -- this is a CLI script; console output is the UI */

import { runSeoValidation } from '../lib/seo/index';

function main(): void {
  const result = runSeoValidation();

  console.log(
    `SEO validation — ${result.checked.guides} guides, ` +
      `${result.checked.sitemapEntries} sitemap entries checked.`,
  );

  if (result.warnings.length > 0) {
    console.warn(`\n⚠ ${result.warnings.length} warning(s):`);
    for (const w of result.warnings) {
      console.warn(`  - [${w.where}] ${w.message}`);
    }
  }

  if (!result.ok) {
    console.error(`\n✖ ${result.errors.length} SEO error(s):`);
    for (const e of result.errors) {
      console.error(`  - [${e.where}] ${e.message}`);
    }
    process.exit(1);
  }

  console.log(
    '\n✔ SEO contract holds: no thin content, no orphans, sitemap complete.',
  );
}

main();
