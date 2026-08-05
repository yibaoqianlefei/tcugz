/**
 * Phase 2 — Test group 2: asset existence and reference consistency.
 *
 * Collects EVERY local asset referenced by the REAL node configuration
 * (model path, per-variant model path, diagram, thumbnail, component
 * knowledge images) and verifies:
 *   - the URL is not remote and has no path traversal
 *   - the mapped public/ filesystem path exists and is a file
 *   - the extension matches the field's purpose (.glb for models, image
 *     formats for images)
 *
 * The data source is the node configuration only — no guessing which files
 * in public/ "should" belong to a node.  A missing asset fails the test with
 * a node/field/configured/resolved breakdown (never auto-fixed, never
 * skipped).  No fixed asset count is asserted.
 *
 * Run with: npx tsx tests/node-assets.test.ts
 */

import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { nodeDefinitions } from "../src/data/nodeDefinitions";
import { resolveNodeModelSources } from "../src/utils/resolveNodeModelSources";
import { publicUrlToFsPath } from "./helpers/resolvePublicAsset";

/* ═══════════════════════════════════════════════════════════════
   Harness
   ═══════════════════════════════════════════════════════════════ */

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

let testCount = 0;
function group(title: string): void {
  testCount++;
  console.log(`\n== T${testCount}: ${title}`);
}

/* ═══════════════════════════════════════════════════════════════
   Collect referenced assets from real config
   ═══════════════════════════════════════════════════════════════ */

interface AssetRef {
  nodeId: string;
  field: string;
  url: string;
}

const MODEL_EXT = new Set([".glb"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function collectAssetRefs(): AssetRef[] {
  const refs: AssetRef[] = [];
  for (const node of nodeDefinitions) {
    if (node.model?.path) {
      refs.push({ nodeId: node.id, field: "model.path", url: node.model.path });
    }
    if (node.diagram?.path) {
      refs.push({ nodeId: node.id, field: "diagram.path", url: node.diagram.path });
    }
    if (node.thumbnail) {
      refs.push({ nodeId: node.id, field: "thumbnail", url: node.thumbnail });
    }
    for (const v of node.variants ?? []) {
      if (v.model?.path) {
        refs.push({ nodeId: node.id, field: `variants.${v.id}.model.path`, url: v.model.path });
      }
      for (const k of v.componentKnowledge ?? []) {
        for (const img of k.images ?? []) {
          if (img.src) {
            refs.push({ nodeId: node.id, field: `variants.${v.id}.knowledge.${k.objectName}.img`, url: img.src });
          }
        }
      }
    }
  }
  // resolveNodeModelSources must resolve to the SAME model paths (consistency
  // between the raw config and the viewer read entry).
  for (const node of nodeDefinitions) {
    for (const src of resolveNodeModelSources(node)) {
      refs.push({ nodeId: node.id, field: `resolveNodeModelSources.${src.id}.src`, url: src.src });
    }
  }
  return refs;
}

const refs = collectAssetRefs();

/* ═══════════════════════════════════════════════════════════════
   URL hygiene
   ═══════════════════════════════════════════════════════════════ */

group(`Asset URL hygiene (${refs.length} references collected from config)`);
{
  assert(refs.length > 0, "config references at least one asset");
  for (const ref of refs) {
    assert(!!ref.url && ref.url.trim().length > 0,
      `[${ref.nodeId}] [${ref.field}] path non-empty`);
    assert(!/^https?:\/\//i.test(ref.url),
      `[${ref.nodeId}] [${ref.field}] path is NOT a remote URL (${ref.url})`);
    assert(!ref.url.includes(".."),
      `[${ref.nodeId}] [${ref.field}] no path traversal in ${ref.url}`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   File existence per field type
   ═══════════════════════════════════════════════════════════════ */

group(`Referenced assets exist on disk (${refs.length} files)`);
{
  const missing: string[] = [];
  for (const ref of refs) {
    let fsPath: string;
    try {
      fsPath = publicUrlToFsPath(ref.url);
    } catch (e) {
      missing.push(`[node=${ref.nodeId}][field=${ref.field}][configured=${ref.url}][error=${(e as Error).message}]`);
      continue;
    }
    if (!existsSync(fsPath)) {
      missing.push(
        `[node=${ref.nodeId}][field=${ref.field}][configured=${ref.url}][resolved=${fsPath}]\nAsset does not exist`,
      );
      continue;
    }
    if (!statSync(fsPath).isFile()) {
      missing.push(
        `[node=${ref.nodeId}][field=${ref.field}][configured=${ref.url}][resolved=${fsPath}]\nExpected a file, found a directory`,
      );
      continue;
    }
  }
  if (missing.length > 0) {
    throw new Error(`Missing/invalid referenced assets (${missing.length}):\n${missing.join("\n")}`);
  }
}

group("Model fields reference .glb; image fields reference image formats");
{
  const problems: string[] = [];
  for (const ref of refs) {
    const isModel = ref.field.includes("model.path") || ref.field.includes(".src");
    const ext = path.extname(ref.url.split("?")[0]).toLowerCase();
    if (isModel) {
      if (!MODEL_EXT.has(ext)) {
        problems.push(`[node=${ref.nodeId}][field=${ref.field}] expected .glb, got "${ext}" (${ref.url})`);
      }
    } else if (!IMAGE_EXT.has(ext)) {
      problems.push(`[node=${ref.nodeId}][field=${ref.field}] expected image format, got "${ext}" (${ref.url})`);
    }
  }
  if (problems.length > 0) throw new Error(`Extension mismatch:\n${problems.join("\n")}`);
}

/* ═══════════════════════════════════════════════════════════════
   Summary
   ═══════════════════════════════════════════════════════════════ */

const modelCount = refs.filter((r) => r.field.includes("model.path") || r.field.includes(".src")).length;
const imageCount = refs.length - modelCount;
console.log(`\n  summary: ${refs.length} referenced assets (${modelCount} model, ${imageCount} image) all exist.`);
console.log(`All node-assets tests passed (${testCount} groups).`);
