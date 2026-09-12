import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const roots = ['src', 'test'];
const skippedPattern = /\b(?:describe|it|test)\.skip\b|\b(?:xdescribe|xit|xtest)\b/;
const violations = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }
    if (extname(entry.name) !== '.ts' || !entry.name.includes('spec')) continue;
    const source = await readFile(path, 'utf8');
    if (skippedPattern.test(source)) violations.push(path);
  }
}

for (const root of roots) await scan(root);

if (violations.length > 0) {
  process.stderr.write(`Skipped tests are forbidden:\n${violations.join('\n')}\n`);
  process.exitCode = 1;
}
