import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ESLint } from 'eslint';

const legacyBaselineCommit = '2423aa98a3098b1f084af1a559f24016147d6cce';
const graduatedLegacyFiles = new Set([
  'src/app.module.ts',
  'src/main.ts',
  'src/auth/strategies/jwt.strategy.ts',
  'src/common/context/index.ts',
  'src/common/filters/global-exception.filter.ts',
  'src/common/filters/index.ts',
  'src/common/interceptors/index.ts',
  'src/common/interceptors/logging.interceptor.ts',
  'src/common/interceptors/transform.interceptor.ts',
  'src/common/logger/index.ts',
  'src/tenant/tenant-prisma.service.ts',
  'src/tenant/tenant.module.ts',
]);

const normalize = (file) => file.replaceAll('\\', '/');

const filesUnder = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path);
    return path.endsWith('.ts') ? [normalize(path)] : [];
  });

const repositoryRoot = normalize(process.cwd());
const legacyFiles = new Set(
  execFileSync(
    'git',
    [
      'ls-tree',
      '-r',
      '--name-only',
      legacyBaselineCommit,
      '--',
      'src',
      'test',
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalize),
);

const relativeToRepository = (file) =>
  file.slice(repositoryRoot.length + 1);
const candidates = [
  ...filesUnder(resolve(repositoryRoot, 'src')),
  ...filesUnder(resolve(repositoryRoot, 'test')),
];
const lintTargets = candidates.filter((file) => {
  const relativeFile = relativeToRepository(file);
  return (
    !legacyFiles.has(relativeFile) || graduatedLegacyFiles.has(relativeFile)
  );
});

if (lintTargets.length === 0) {
  throw new Error('lintNewCodeTargetSetIsEmpty');
}

const fix = process.argv.includes('--fix');
const eslint = new ESLint({ fix });
const results = await eslint.lintFiles(lintTargets);
if (fix) await ESLint.outputFixes(results);

const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);
if (output) process.stdout.write(output);

const errorCount = results.reduce((total, result) => total + result.errorCount, 0);
const warningCount = results.reduce(
  (total, result) => total + result.warningCount,
  0,
);
if (errorCount > 0 || warningCount > 0) process.exitCode = 1;
