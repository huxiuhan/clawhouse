import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const binDir = path.join(projectRoot, 'bin');

// 添加shebang到cli.js
const cliFile = path.join(binDir, 'cli.js');
if (fs.existsSync(cliFile)) {
  let content = fs.readFileSync(cliFile, 'utf-8');
  if (!content.startsWith('#!/usr/bin/env node')) {
    content = '#!/usr/bin/env node\n' + content;
    fs.writeFileSync(cliFile, content);
    fs.chmodSync(cliFile, 0o755);
    console.log('✓ Added shebang to bin/cli.js');
  }
}

// 复制YAML文件
function copyYamlFiles(srcPath, binPath) {
  if (!fs.existsSync(srcPath)) return;
  
  const files = fs.readdirSync(srcPath);
  for (const file of files) {
    const srcFile = path.join(srcPath, file);
    const binFile = path.join(binPath, file);
    
    if (fs.statSync(srcFile).isDirectory()) {
      if (!fs.existsSync(binFile)) {
        fs.mkdirSync(binFile, { recursive: true });
      }
      copyYamlFiles(srcFile, binFile);
    } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
      fs.copyFileSync(srcFile, binFile);
      console.log(`✓ Copied ${path.relative(projectRoot, binFile)}`);
    }
  }
}

copyYamlFiles(path.join(srcDir, 'commands'), path.join(binDir, 'commands'));
console.log('✓ Build complete');
