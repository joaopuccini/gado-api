import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import pg from 'pg';

const command = process.argv.slice(2);
if (command.length === 0) throw new Error('disposableCommandRequired');

if (!process.env.DATABASE_URL) {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '..', '.env'),
  ];
  const envFile = await Promise.any(
    candidates.map(async (candidate) => {
      await access(candidate);
      return candidate;
    }),
  );
  dotenv.config({ path: envFile, quiet: true });
}

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) throw new Error('DATABASE_URL is required');
const databaseName = `gado_wave00_test_${randomBytes(6).toString('hex')}`;
const childUrl = new URL(baseUrl);
childUrl.pathname = `/${databaseName}`;
const pool = new pg.Pool({ connectionString: baseUrl, max: 1 });
let created = false;

try {
  await pool.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  process.stdout.write(`Disposable database created: ${databaseName}\n`);
  const isNpm = command[0] === 'npm';
  const executable = isNpm ? process.execPath : command[0];
  const args = isNpm
    ? [
        resolve(
          dirname(process.execPath),
          'node_modules',
          'npm',
          'bin',
          'npm-cli.js',
        ),
        ...command.slice(1),
      ]
    : command.slice(1);
  const child = spawn(executable, args, {
    cwd: process.cwd(),
    env: { ...process.env, TEST_DATABASE_URL: childUrl.toString() },
    stdio: 'inherit',
    shell: false,
  });
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolveExit(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  if (created) {
    await pool.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [databaseName],
    );
    await pool.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    process.stdout.write(`Disposable database removed: ${databaseName}\n`);
  }
  await pool.end();
}
