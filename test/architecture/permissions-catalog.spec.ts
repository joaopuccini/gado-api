import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { PERMISSIONS_CATALOG } from '../../src/common/rbac/permissions-catalog';

const srcDirectory = resolve(process.cwd(), 'src');

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = resolve(directory, entry);
    if (statSync(entryPath).isDirectory()) return sourceFiles(entryPath);
    return entryPath.endsWith('.controller.ts') ? [entryPath] : [];
  });

const files = sourceFiles(srcDirectory);

describe('permissions catalog architecture', () => {
  it('does not have duplicate IDs in the catalog', () => {
    const ids = PERMISSIONS_CATALOG.map((p) => p.id);
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    
    expect(duplicates).toEqual([]);
  });

  it('does not have duplicate codes in the catalog', () => {
    const codes = PERMISSIONS_CATALOG.map((p) => p.code);
    const duplicates = codes.filter((item, index) => codes.indexOf(item) !== index);
    
    expect(duplicates).toEqual([]);
  });

  it('requires all @RequirePermissions usages to match an existing catalog code', () => {
    const catalogCodes = new Set(PERMISSIONS_CATALOG.map((p) => p.code));
    const violations: string[] = [];

    files.forEach((file) => {
      const source = readFileSync(file, 'utf8');
      const matches = source.matchAll(/@RequirePermissions\(([^)]+)\)/g);
      
      for (const match of matches) {
        const argsStr = match[1];
        const stringLiterals = [...argsStr.matchAll(/['"]([^'"]+)['"]/g)];
        for (const literalMatch of stringLiterals) {
           const code = literalMatch[1];
           if (!catalogCodes.has(code)) {
             violations.push(`File ${file} requires unknown permission: ${code}`);
           }
        }
      }
    });

    expect(violations).toEqual([]);
  });
});
