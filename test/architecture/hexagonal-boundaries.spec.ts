import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

interface LegacyRouteQuarantineEntry {
  readonly controller: string;
  readonly removalWave: string;
  readonly reason: string;
}

const srcDirectory = resolve(process.cwd(), 'src');
const quarantinePath = resolve(
  process.cwd(),
  'test/fixtures/legacy-route-quarantine.json',
);

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const entryPath = resolve(directory, entry);
    if (statSync(entryPath).isDirectory()) return sourceFiles(entryPath);
    return entryPath.endsWith('.ts') && !entryPath.endsWith('.spec.ts')
      ? [entryPath]
      : [];
  });

const importsOf = (source: string): string[] => {
  const imports: string[] = [];
  const importPattern =
    /(?:import|export)\s+(?:type\s+)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    if (match[1]) imports.push(match[1]);
  }
  return imports;
};

const controllerNamesOf = (source: string): string[] =>
  [...source.matchAll(/export\s+class\s+(\w+Controller)\b/g)].flatMap(
    (match) => (match[1] ? [match[1]] : []),
  );

const normalizedRelativePath = (file: string): string =>
  relative(srcDirectory, file).replaceAll('\\', '/');

const moduleOf = (file: string): string =>
  normalizedRelativePath(file).split('/')[0] ?? '';

const matchesForbiddenImport = (
  moduleName: string,
  forbiddenImport: string,
): boolean => {
  if (forbiddenImport.endsWith('/')) {
    return moduleName.startsWith(forbiddenImport);
  }
  return (
    moduleName === forbiddenImport ||
    moduleName.startsWith(`${forbiddenImport}/`)
  );
};

const parsedQuarantine = JSON.parse(
  readFileSync(quarantinePath, 'utf8'),
) as unknown;
if (!Array.isArray(parsedQuarantine)) {
  throw new Error('legacyRouteQuarantineMustBeAnArray');
}
const quarantine = parsedQuarantine as LegacyRouteQuarantineEntry[];
const quarantinedControllers = new Set(
  quarantine.map(({ controller }) => controller),
);
const files = sourceFiles(srcDirectory);

describe('hexagonal architecture boundaries', () => {
  it('keeps the legacy controller quarantine explicit, complete and unique', () => {
    const discoveredControllers = new Set(
      files.flatMap((file) => controllerNamesOf(readFileSync(file, 'utf8'))),
    );
    const invalidEntries = quarantine.filter(
      ({ controller, removalWave, reason }) =>
        !controller.endsWith('Controller') ||
        !/^\d{2}$/.test(removalWave) ||
        reason.trim().length === 0 ||
        !discoveredControllers.has(controller),
    );

    expect(invalidEntries).toEqual([]);
    expect(quarantinedControllers.size).toBe(quarantine.length);
  });

  it('forbids persistence, external SDKs and infrastructure in controllers', () => {
    const forbidden = [
      '@prisma/client',
      '@prisma/client-admin',
      'aws-sdk',
      '@aws-sdk/',
      '/infrastructure/',
    ];
    const violations = files
      .filter((file) => file.endsWith('.controller.ts'))
      .flatMap((file) =>
        importsOf(readFileSync(file, 'utf8')).flatMap((moduleName) =>
          forbidden.some((rule) => moduleName.includes(rule))
            ? [`${normalizedRelativePath(file)} -> ${moduleName}`]
            : [],
        ),
      );

    expect(violations).toEqual([]);
  });

  it('keeps use cases independent from Nest, transport and persistence frameworks', () => {
    const forbidden = [
      '@nestjs/',
      '@prisma/',
      'express',
      'pg',
      '@aws-sdk/',
      'aws-sdk',
    ];
    const violations = files
      .filter((file) =>
        normalizedRelativePath(file).includes('/application/use-cases/'),
      )
      .flatMap((file) =>
        importsOf(readFileSync(file, 'utf8')).flatMap((moduleName) =>
          forbidden.some((rule) => matchesForbiddenImport(moduleName, rule))
            ? [`${normalizedRelativePath(file)} -> ${moduleName}`]
            : [],
        ),
      );

    expect(violations).toEqual([]);
  });

  it('requires application ports to use the validated tenant schema value object', () => {
    const violations = files
      .filter((file) =>
        normalizedRelativePath(file).includes('/application/ports/'),
      )
      .flatMap((file) =>
        /readonly\s+schemaName\s*:\s*string\b/.test(
          readFileSync(file, 'utf8'),
        )
          ? [normalizedRelativePath(file)]
          : [],
      );

    expect(violations).toEqual([]);
  });

  it('keeps domain code free from frameworks and infrastructure', () => {
    const forbidden = ['@nestjs/', '@prisma/', 'express', 'pg'];
    const violations = files
      .filter((file) => normalizedRelativePath(file).includes('/domain/'))
      .flatMap((file) =>
        importsOf(readFileSync(file, 'utf8')).flatMap((moduleName) =>
          forbidden.some((rule) => matchesForbiddenImport(moduleName, rule))
            ? [`${normalizedRelativePath(file)} -> ${moduleName}`]
            : [],
        ),
      );

    expect(violations).toEqual([]);
  });

  it('requires every non-quarantined controller to depend on a use case', () => {
    const violations = files
      .filter((file) => file.endsWith('.controller.ts'))
      .flatMap((file) => {
        const source = readFileSync(file, 'utf8');
        const newControllers = controllerNamesOf(source).filter(
          (controller) => !quarantinedControllers.has(controller),
        );
        if (newControllers.length === 0) return [];

        const importsUseCase = importsOf(source).some(
          (moduleName) =>
            moduleName.includes('/application/use-cases/') &&
            moduleName.endsWith('.use-case'),
        );
        return importsUseCase
          ? []
          : newControllers.map(
              (controller) => `${normalizedRelativePath(file)}:${controller}`,
            );
      });

    expect(violations).toEqual([]);
  });

  it('forbids direct access to another module infrastructure layer', () => {
    const violations = files.flatMap((file) => {
      const sourceModule = moduleOf(file);
      return importsOf(readFileSync(file, 'utf8')).flatMap((moduleName) => {
        if (
          !moduleName.startsWith('.') ||
          !moduleName.includes('/infrastructure/')
        ) {
          return [];
        }
        const target = resolve(dirname(file), moduleName);
        return moduleOf(target) === sourceModule
          ? []
          : [`${normalizedRelativePath(file)} -> ${moduleName}`];
      });
    });

    expect(violations).toEqual([]);
  });
});
