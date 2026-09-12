import * as fs from 'fs';
import * as path from 'path';

describe('Hexagonal Boundaries', () => {
  const srcDir = path.resolve(__dirname, '../../src');
  const quarantinePath = path.resolve(__dirname, '../fixtures/legacy-route-quarantine.json');
  
  function getFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        getFiles(filePath, fileList);
      } else if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }
  
  const allFiles = getFiles(srcDir);
  
  const forbidden = {
    controller: ['@prisma/client', '@prisma/client-admin', 'aws-sdk', '/infrastructure/'],
    useCase: ['@nestjs/common', '@nestjs/swagger', '@prisma/client', '@prisma/client-admin', 'express'],
    domain: ['@nestjs/', '@prisma/', 'express', 'pg'],
  };

  const getImports = (content: string): string[] => {
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    const imports: string[] = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  };

  const legacyQuarantine = JSON.parse(fs.readFileSync(quarantinePath, 'utf8')) as any[];
  const legacyControllers = legacyQuarantine.map(q => q.controller);

  it('should not allow forbidden imports in controllers', () => {
    const controllers = allFiles.filter(f => f.includes('.controller.ts'));
    for (const file of controllers) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = getImports(content);
      for (const imp of imports) {
        for (const rule of forbidden.controller) {
          expect(`${file} imports ${imp}`).not.toContain(rule);
        }
      }
    }
  });

  it('should not allow forbidden imports in use cases', () => {
    const useCases = allFiles.filter(f => f.includes('.use-case.ts'));
    for (const file of useCases) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = getImports(content);
      for (const imp of imports) {
        for (const rule of forbidden.useCase) {
          expect(`${file} imports ${imp}`).not.toContain(rule);
        }
      }
    }
  });

  it('should not allow forbidden imports in domain', () => {
    const domainFiles = allFiles.filter(f => f.includes('/domain/'));
    for (const file of domainFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = getImports(content);
      for (const imp of imports) {
        for (const rule of forbidden.domain) {
          expect(`${file} imports ${imp}`).not.toContain(rule);
        }
      }
    }
  });

  it('should fail if new controller does not import a use case', () => {
    const controllers = allFiles.filter(f => f.includes('.controller.ts'));
    for (const file of controllers) {
      const content = fs.readFileSync(file, 'utf8');
      const controllerNameMatch = content.match(/class\s+(\w+Controller)/);
      const controllerName = controllerNameMatch ? controllerNameMatch[1] : '';

      if (!legacyControllers.includes(controllerName)) {
        const imports = getImports(content);
        const hasUseCase = imports.some(imp => imp.includes('.use-case'));
        expect(hasUseCase).toBe(true);
      }
    }
  });

  it('should fail if a module accesses /infrastructure/ of another module', () => {
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const imports = getImports(content);
      
      const fileModuleMatch = file.match(/src[\\/](.*?)[\\/]/);
      const fileModule = fileModuleMatch ? fileModuleMatch[1] : '';

      for (const imp of imports) {
        if (imp.includes('/infrastructure/')) {
          const isSameModule = imp.includes(`../${fileModule}/`) || imp.includes(`./infrastructure/`) || imp.includes(`../../${fileModule}/`);
          expect(isSameModule).toBe(true);
        }
      }
    }
  });
});
