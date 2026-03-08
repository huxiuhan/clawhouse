import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const characters = [
  { uuid: 'fe27a0b6-4d90-4b87-ae3d-de83db55fce4', name: '敖丙' },
  { uuid: '25ec3477-7d56-4200-8761-9b53ab409fe5', name: '悟空' },
  { uuid: '303773df-17ec-41b9-8067-9d9c200507de', name: '关羽#36d0' },
];

async function runCommand(uuid, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n[${new Date().toISOString()}] Starting generation for ${name}...`);
    
    const proc = spawn('node', [
      'bin/cli.js',
      'generate_lobster',
      '--character_uuid', uuid,
      '--character_name', name,
      '--mode', 'original',
      '--aesthetic', '梦幻',
    ], {
      cwd: __dirname,
      stdio: 'pipe',
    });

    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    proc.on('close', (code) => {
      console.log(`[${new Date().toISOString()}] Generation for ${name} completed with code ${code}`);
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve({ name, result });
        } catch (e) {
          resolve({ name, output });
        }
      } else {
        reject(new Error(`Generation failed for ${name}: ${errorOutput}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  const results = [];
  
  for (const char of characters) {
    try {
      const result = await runCommand(char.uuid, char.name);
      results.push(result);
      console.log(`\n✓ ${char.name} completed`);
    } catch (e) {
      console.error(`✗ ${char.name} failed:`, e.message);
    }
  }

  console.log('\n\n=== RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
