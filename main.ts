// Leonida Trophy Guide — the hand-in program (Node 22, standard library only).
//
// The guide itself is this repository's app/ folder: plain static files a
// browser opens at app/index.html, with the trophy list, guides and roadmap
// in app/data/. This program hands the entry in: it copies app/ and
// screenshots/ into the output directory and writes dossier.json there with
// the vendored make.fun library (vendor/makefun-frontend.ts, left exactly as
// the kit ships it — the scorer rebuilds the dossier with its own copy and
// compares the two byte for byte).
//
// The output directory is a mounted volume in the grader, so this program
// never removes the directory itself: removing a mount point fails with
// EBUSY and killed a previous entry at startup. Instead it creates the
// directory if needed and deletes only the entries inside it, which keeps
// repeated runs byte-identical without stale files leaking between them.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create the output directory, then empty it entry by entry (see the header
// comment: the directory itself is a mount point and must survive).
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps: at most 4 screenshots of 256 KiB each, at most 993
// files and directories in app/ and 48 MiB of app files, dossier text capped
// at 160 KiB. Passing them here means buildDossier refuses anything the
// scorer would refuse, locally instead of at grading time.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Hand-in receipt: walk what was actually written and say so, one line per
// part. A copy that silently dropped a file (a renamed data file, a missing
// screenshot) is exactly the failure this exists to catch before grading
// does: the counts below must read app files, 4 screenshots and a dossier.
function receipt(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = receipt(path);
      files += inner.files;
      bytes += inner.bytes;
    } else {
      files += 1;
      bytes += statSync(path).size;
    }
  }
  return { files, bytes };
}

const appReceipt = receipt(join(out, 'app'));
const shotNames = readdirSync(join(out, 'screenshots')).sort();
console.log(
  `Leonida Trophy Guide handed in: app ${appReceipt.files} files ${appReceipt.bytes}B; ` +
    `screenshots ${shotNames.join(', ')}; dossier ${statSync(join(out, 'dossier.json')).size}B`,
);
