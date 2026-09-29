const fs = require('fs');
const path = require('path');

function cleanRedundantFiles(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      cleanRedundantFiles(fullPath);
    } else if (entry.isFile()) {
      // Target compiled artifacts sitting next to source files
      if (
        fullPath.endsWith('.js') ||
        fullPath.endsWith('.js.map') ||
        fullPath.endsWith('.d.ts')
      ) {
        let baseName = fullPath;
        if (fullPath.endsWith('.js.map')) {
          baseName = fullPath.slice(0, -7);
        } else if (fullPath.endsWith('.d.ts')) {
          baseName = fullPath.slice(0, -5);
        } else if (fullPath.endsWith('.js')) {
          baseName = fullPath.slice(0, -3);
        }

        const tsPath = baseName + '.ts';
        const tsxPath = baseName + '.tsx';

        // Delete only if the TypeScript source file exists
        if (fs.existsSync(tsPath) || fs.existsSync(tsxPath)) {
          console.log(`🗑️ Deleting redundant file: ${fullPath}`);
          fs.unlinkSync(fullPath);
        }
      }
    }
  }
}

const frontendAppDir = path.join(__dirname, 'frontend', 'app');
const frontendComponentsDir = path.join(__dirname, 'frontend', 'components');

console.log('🧹 Starting cleanup of redundant frontend compilation files...\n');
cleanRedundantFiles(frontendAppDir);
cleanRedundantFiles(frontendComponentsDir);
console.log('\n✨ Cleanup completed successfully!');