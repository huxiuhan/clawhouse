import axios from 'axios';
import dotenv from 'dotenv-flow';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: __dirname });

const NETA_TOKEN = process.env.NETA_TOKEN;
const NETA_API_BASE_URL = process.env.NETA_API_BASE_URL || 'https://api.talesofai.cn';

const client = axios.create({
  baseURL: NETA_API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${NETA_TOKEN}`,
  },
});

async function searchCharacter(name) {
  try {
    const res = await client.get('/v2/travel/parent-search', {
      params: {
        keywords: name,
        page_index: 0,
        page_size: 5,
        parent_type: 'oc',
        sort_scheme: 'best',
      },
    });
    return res.data.list[0];
  } catch (e) {
    console.error(`Search failed for ${name}:`, e.message);
    return null;
  }
}

async function main() {
  const characters = ['敖丙', '悟空', '关羽#36d0'];
  
  for (const name of characters) {
    console.log(`\nSearching for ${name}...`);
    const char = await searchCharacter(name);
    if (char) {
      console.log(`Found: ${char.name} (${char.uuid})`);
    } else {
      console.log(`Not found: ${name}`);
    }
  }
}

main().catch(console.error);
