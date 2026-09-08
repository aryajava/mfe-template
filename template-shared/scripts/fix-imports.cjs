const fs = require('fs');
const path = require('path');

function resolveSpecifier(fileFullPath, importPath) {
  if (importPath.endsWith('.js')) return importPath;
  const baseDir = path.dirname(fileFullPath);
  const asFile = path.resolve(baseDir, importPath + '.js');
  if (fs.existsSync(asFile)) return importPath + '.js';
  const asDir = path.resolve(baseDir, importPath, 'index.js');
  if (fs.existsSync(asDir)) return importPath + '/index.js';
  return importPath + '.js';
}

function fixImports(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      content = content.replace(
        /from\s+['"](\.\.?\/[^'"]+)['"];/g,
        (match, importPath) =>
          `from '${resolveSpecifier(fullPath, importPath)}';`,
      );

      content = content.replace(
        /export\s+\*\s+from\s+['"](\.\.?\/[^'"]+)['"];/g,
        (match, importPath) =>
          `export * from '${resolveSpecifier(fullPath, importPath)}';`,
      );

      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(
        `Fixed imports in ${path.relative(path.join(__dirname, '..'), fullPath)}`,
      );
    }
  });
}

const distDir = path.join(__dirname, '../dist');
fixImports(distDir);
console.log('All imports fixed');
