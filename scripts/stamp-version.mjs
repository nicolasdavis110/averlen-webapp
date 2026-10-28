// Cache-busting for GitHub Pages, which lets browsers keep any file for ten
// minutes. Every local script and stylesheet URL in the web app carries
// ?v=<hash of the app's code>, so a release is fetched as a whole new set of
// files and a browser never mixes old and new modules.
//
//   node scripts/stamp-version.mjs          rewrite the ?v= stamps
//   node scripts/stamp-version.mjs --check  exit 1 if a stamp is stale
//
// The check also runs in app/test/version.test.mjs.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('..', import.meta.url));
export const files = [
  'index.html', 'app/bootstrap.js', 'app/config.js', 'app/connection.js', 'app/data.js', 'app/firebase.js',
  'preview/index.html', 'preview/app.js', 'preview/model.js', 'preview/demo.js', 'preview/planning.js', 'preview/styles.css',
];
// Relative .js/.css references: JS import specifiers and HTML src/href.
const reference = /((?:from |import\()['"]|(?:src|href)=")(\.{1,2}\/[^'"?]+\.(?:js|css))(?:\?v=[\da-f]*)?(['"])/g;
const unstamped = text => text.replace(reference, '$1$2$3');

export function computeVersion(read = name => readFileSync(site + name, 'utf8')) {
  const hash = createHash('sha256');
  for (const name of files) hash.update(name).update('\0').update(unstamped(read(name))).update('\0');
  return hash.digest('hex').slice(0, 10);
}
export function stamp(text, version) { return text.replace(reference, `$1$2?v=${version}$3`); }
export function staleFiles(read = name => readFileSync(site + name, 'utf8')) {
  const version = computeVersion(read);
  return files.filter(name => stamp(read(name), version) !== read(name));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const stale = staleFiles();
    if (stale.length) { console.error(`Stale version stamps in: ${stale.join(', ')}. Run node scripts/stamp-version.mjs`); process.exit(1); }
    console.log(`Version stamps current (${computeVersion()}).`);
  } else {
    const version = computeVersion();
    for (const name of files) {
      const text = readFileSync(site + name, 'utf8'), next = stamp(text, version);
      if (next !== text) writeFileSync(site + name, next);
    }
    console.log(`Stamped ${version}.`);
  }
}
