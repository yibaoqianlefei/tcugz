// Local, UI-driven workbench: npm run render:node-previews, then open the printed URL.
// Renders the actual registered GLBs; no generative geometry or diagram replacement.
import { createServer } from 'vite';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { nodeDefinitions } from '../src/data/nodeDefinitions.ts';

// Keep repeated image exports bounded on machines already hosting live 3D tabs.
sharp.cache(false);
sharp.concurrency(1);

const root = process.cwd();
const directory = resolve(root, 'public/images/node-renders');
const version = 'glb-studio-v2';
const nodes = nodeDefinitions.filter(node => node.status === 'available' && node.category !== '案例');
const catalog = nodes.map(node => {
  const variant = node.presentationMode === 'variants' ? node.variants?.[0] : undefined;
  const model = variant?.model ?? node.model;
  if (!model?.path) throw new Error(`No model for ${node.id}`);
  return { id: node.id, title: node.title, category: node.category, source: model.path,
    variant: variant?.id ?? null, initialView: node.model?.initialView ?? null,
    groups: node.model?.groups ?? {}, outlineExcluded: node.model?.outlineExcluded ?? [] };
});
const byId = new Map(catalog.map(node => [node.id, node]));
const records = {};
await mkdir(directory, { recursive: true });
try { Object.assign(records, JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8')).renders); } catch { /* first run */ }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceHash = async node => hash(await readFile(resolve(root, 'public', node.source.replace(/^\//, ''))));
const reply = (res, status, body) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
const save = async (path, data) => { await writeFile(path + '.tmp', data); await rename(path + '.tmp', path); };

const server = await createServer({
  configFile: false, root, publicDir: resolve(root, 'public'),
  server: { host: '127.0.0.1', port: 5186, strictPort: true },
  plugins: [{ name: 'node-preview-export', configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url, 'http://127.0.0.1:5186').pathname;
      if (!pathname.startsWith('/__node-preview/')) return next();
      try {
        if (req.method === 'GET' && pathname === '/__node-preview/catalog') return reply(res, 200, { version, nodes: catalog });
        const id = pathname.slice('/__node-preview/save/'.length);
        if (req.method === 'POST' && pathname.startsWith('/__node-preview/save/') && byId.has(id)) {
          const chunks = []; let length = 0;
          for await (const chunk of req) { length += chunk.length; if (length > 16_000_000) throw new Error('Image too large'); chunks.push(chunk); }
          const png = Buffer.concat(chunks);
          const metadata = JSON.parse(decodeURIComponent(req.headers['x-render-metadata'] ?? '{}'));
          const image = sharp(png).ensureAlpha();
          const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
          if (info.width !== 960 || info.height !== 540) throw new Error('Expected 960 × 540 render');
          let left = info.width, right = -1, top = info.height, bottom = -1, pixels = 0;
          for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
            if (data[(y * info.width + x) * 4 + 3] < 80) continue;
            pixels++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
          if (pixels < 250 || right < left) throw new Error('Empty or invisible model');
          if (Math.min(left, top, info.width - 1 - right, info.height - 1 - bottom) < 6) throw new Error('Model touches image edge');
          const path = `images/node-renders/${id}.webp`;
          const webp = await sharp(png).webp({ quality: 88, alphaQuality: 100, effort: 5 }).toBuffer();
          await save(resolve(root, 'public', path), webp);
          records[id] = { ...byId.get(id), path, width: 960, height: 540, renderer: version,
            sourceSha256: await sourceHash(byId.get(id)), bytes: webp.length,
            foreground: { left, top, right, bottom, pixels }, ...metadata };
          await save(resolve(directory, 'manifest.json'), JSON.stringify({ version, renders: records }, null, 2) + '\n');
          return reply(res, 200, { id, path, bytes: webp.length });
        }
        if (req.method === 'POST' && pathname === '/__node-preview/finalize') {
          const map = {};
          for (const node of catalog) {
            const record = records[node.id];
            if (!record || record.renderer !== version || record.sourceSha256 !== await sourceHash(node)) throw new Error(`Missing or outdated render: ${node.id}`);
            await readFile(resolve(root, 'public', record.path));
            map[node.id] = record.path;
          }
          await save(resolve(root, 'src/data/nodeRenderPreviews.json'), JSON.stringify(map, null, 2) + '\n');
          return reply(res, 200, { count: Object.keys(map).length, bytes: Object.values(records).reduce((sum, record) => sum + record.bytes, 0) });
        }
        reply(res, 404, { error: 'Unknown export operation' });
      } catch (error) { reply(res, 400, { error: error.message }); }
    });
  } }],
});
await server.listen();
console.log(`Model render workbench (${catalog.length} nodes): http://127.0.0.1:5186/scripts/node-preview-renderer/index.html`);
