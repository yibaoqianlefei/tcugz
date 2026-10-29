import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { nodeDefinitions } from '../src/data/nodeDefinitions.ts';
import { getNodeRenderPreview } from '../src/utils/nodeRenderPreview.ts';

const index = JSON.parse(await readFile('src/data/nodeRenderPreviews.json', 'utf8'));
const manifest = JSON.parse(await readFile('public/images/node-renders/manifest.json', 'utf8'));
const available = nodeDefinitions.filter(node => node.status === 'available' && node.category !== '案例');
assert.deepEqual(Object.keys(index).sort(), available.map(node => node.id).sort(), 'Every usable library node has its own real model render');
let bytes = 0;
for (const node of available) {
  const render = manifest.renders[node.id];
  assert.equal(render.renderer, manifest.version, 'No stale render from an earlier batch');
  const model = node.presentationMode === 'variants' ? node.variants[0].model : node.model;
  assert.equal(render.source, model.path);
  assert.equal(render.sourceSha256, createHash('sha256').update(await readFile('public' + model.path)).digest('hex'), 'Render derives from current registered model');
  assert.equal(render.path, index[node.id]);
  assert.match(render.path, /^images\/node-renders\/[a-z0-9-]+\.webp$/);
  assert.equal(getNodeRenderPreview(node.id), '/' + render.path);
  const image = await readFile('public/' + render.path), metadata = await sharp(image).metadata();
  assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, 960); assert.equal(metadata.height, 540);
  assert(metadata.hasAlpha, 'Transparent studio background matches the existing UI');
  assert(render.meshes > 0 && render.foreground.pixels > 250, 'Nonempty geometry');
  if (render.poseCandidates?.length) assert.equal(render.meshes, Math.max(...render.poseCandidates.map(pose => pose.meshes)), 'The selected pose retains every visible assembly component');
  const box = render.foreground;
  assert(Math.min(box.left, box.top, 959 - box.right, 539 - box.bottom) >= 6, 'No model edge clipping');
  bytes += image.length;
}
assert.equal(getNodeRenderPreview('missing-node'), undefined);
for (const node of nodeDefinitions.filter(node => node.status === 'development')) assert.equal(index[node.id], undefined, 'No invented rendering for unavailable models');
console.log(`Model preview checks passed: ${available.length} real GLB renders, 960 × 540 transparent WebP, ${(bytes / 1024 / 1024).toFixed(2)} MB; source hashes, coverage and framing verified.`);
