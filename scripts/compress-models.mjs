/**
 * 自动压缩 public/models/ 下超过 1MB 的 .glb 文件
 * 纹理 → WebP + 几何 → Draco
 *
 * 用法: npm run compress-models
 */
import { execSync } from "child_process";
import { readdirSync, statSync, renameSync, existsSync, unlinkSync } from "fs";
import { join, extname, resolve } from "path";

const MODELS_DIR = join(process.cwd(), "public", "models");
const SIZE_LIMIT = 1 * 1024 * 1024; // 1 MB
const BIN_DIR = join(process.cwd(), "node_modules", ".bin");

function collectGLBs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectGLBs(full));
    else if (extname(entry.name).toLowerCase() === ".glb") results.push(full);
  }
  return results;
}

const files = collectGLBs(MODELS_DIR).filter(
  (f) => !f.includes("-orig.") && !f.includes("-tmp."),
);

console.log(`Found ${files.length} .glb files\n`);

let compressed = 0;
let skipped = 0;

for (const file of files) {
  const size = statSync(file).size;
  const mb = (size / 1024 / 1024).toFixed(1);
  const rel = file.replace(process.cwd() + "\\", "").replace(/\\/g, "/");

  if (size <= SIZE_LIMIT) {
    console.log(`SKIP  ${rel} (${mb} MB < 1MB)`);
    skipped++;
    continue;
  }

  console.log(`COMPRESS  ${rel} (${mb} MB) ...`);

  const tmpWebP = file.replace(".glb", "-tmp-webp.glb");
  const tmpDraco = file.replace(".glb", "-tmp-draco.glb");
  const backup = file.replace(".glb", "-orig.glb");

  try {
    // Step 1: WebP textures
    const webpBin = join(BIN_DIR, "gltf-transform.cmd");
    execSync(`"${webpBin}" webp "${file}" "${tmpWebP}"`, { stdio: "pipe", timeout: 120000 });
    const webpMB = (statSync(tmpWebP).size / 1024 / 1024).toFixed(1);
    console.log(`  WebP:   ${mb} → ${webpMB} MB`);

    // Step 2: Draco geometry
    execSync(`"${webpBin}" draco "${tmpWebP}" "${tmpDraco}"`, { stdio: "pipe", timeout: 120000 });
    const finalMB = (statSync(tmpDraco).size / 1024 / 1024).toFixed(1);
    const pct = ((statSync(tmpDraco).size / size) * 100).toFixed(0);
    console.log(`  Draco:  → ${finalMB} MB (${pct}% of original)`);

    // Backup original, replace with compressed
    if (!existsSync(backup)) renameSync(file, backup);
    renameSync(tmpDraco, file);

    // Clean up intermediate
    if (existsSync(tmpWebP)) unlinkSync(tmpWebP);

    compressed++;
    console.log(`  DONE\n`);
  } catch (err) {
    console.error(`  ERROR: ${err.message}\n`);
    try { if (existsSync(tmpWebP)) unlinkSync(tmpWebP); } catch {}
    try { if (existsSync(tmpDraco)) unlinkSync(tmpDraco); } catch {}
  }
}

console.log(`Done: ${compressed} compressed, ${skipped} skipped, ${files.length} total`);
