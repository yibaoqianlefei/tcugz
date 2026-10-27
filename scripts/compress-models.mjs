/**
 * 压缩 public/models/ 下的 .glb（Draco + 保留场景结构）
 *
 * 为什么是 Draco，而不是别的方案（都是实测结论，改动前请先读）：
 *   - WebP 纹理：本项目的纹理本身已高度压缩，重新编码反而变大
 *     （flat-roof 2.11 → 2.48 MB，Exhibition 4.58 → 49.4 MB），因此不用。
 *   - Meshopt + 量化：体积最小（约 30%），但 gltf-transform 会把每个网格
 *     包进一个新的匿名节点并加一组缩放/位移，节点层级与网格命名全部改变；
 *     在本项目的查看器里实测渲染错乱，故不用。
 *   - Draco：只压缩图元属性，节点层级、网格名、动画通道完全不变，
 *     是唯一在不改动查看器语义的前提下能用的方案。
 *
 * 运行期解码器随 three 一起发布，已复制到 public/draco/，
 * 由 src/utils/modelDecoders.ts 统一给出路径（不依赖 gstatic CDN）。
 *
 * 规则：
 *   - 默认处理 > 64 KB 的 .glb；
 *   - 压缩结果必须小于原文件的 90% 才替换，绝不接受变大；
 *   - 原件备份到 tmp/model-backups/（tmp/ 已被 .gitignore 忽略，
 *     不会随站点发布，也不会被 git 跟踪）。
 *
 * 用法:
 *   npm run compress-models                 # 全部模型
 *   npm run compress-models -- handrail     # 只处理路径含 handrail 的模型
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const MODELS_DIR = join(process.cwd(), 'public', 'models');
const BACKUP_DIR = join(process.cwd(), 'tmp', 'model-backups');
const TMP_DIR = join(process.cwd(), 'tmp', 'compress-work');
const BIN = join(process.cwd(), 'node_modules', '.bin', 'gltf-transform.cmd');
const MIN_BYTES = 64 * 1024;
const KEEP_RATIO = 0.9;
const FILTER = process.argv[2] ?? '';

/** 这些模型的几何数据被测试直接逐字节校验（顶点坐标、包围尺寸），
 *  Draco 会把这些 accessor 改成归一化整数，语义变了测试就失真。
 *  体积代价仅约 0.4 MB，因此保留原始文件，不做压缩。 */
const SKIP = new Set([
  'stairs/stair-flight-platform/stair-flight-offset-multiple-01.glb', // tests/model-outlines.test.ts 读取顶点数组
  'stairs/stair-flight-platform/stair-flight-flush-unburied-01.glb',  // tests/model-outlines.test.ts 读取顶点数组
  'roof/coating-parapet-flashing/coating-parapet-flashing.glb',       // tests/coating-parapet-flashing.test.ts 断言包围盒尺寸
]);

for (const dir of [BACKUP_DIR, TMP_DIR]) mkdirSync(dir, { recursive: true });

function collectGLBs(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectGLBs(full));
    else if (extname(entry.name).toLowerCase() === '.glb') results.push(full);
  }
  return results;
}

/** Already-compressed files must not be decoded and re-encoded: repeated
 *  quantization degrades geometry and makes the report meaningless. */
function isDracoCompressed(file) {
  const buf = readFileSync(file);
  const jsonLength = buf.readUInt32LE(12);
  return buf.toString('utf8', 20, 20 + jsonLength).includes('KHR_draco_mesh_compression');
}

const files = collectGLBs(MODELS_DIR)
  .filter((f) => !f.includes('-orig.') && !f.includes('-tmp.'))
  .filter((f) => !FILTER || relative(MODELS_DIR, f).includes(FILTER))
  .filter((f) => !isDracoCompressed(f))
  .filter((f) => !SKIP.has(relative(MODELS_DIR, f).replace(/\\/g, '/')))
  .sort((a, b) => statSync(b).size - statSync(a).size);

const rows = [];
let saved = 0;

for (const file of files) {
  const rel = relative(MODELS_DIR, file).replace(/\\/g, '/');
  const size = statSync(file).size;
  if (size < MIN_BYTES) {
    rows.push([rel, size, size, 'skip (<64KB)']);
    continue;
  }

  const work = join(TMP_DIR, rel.replace(/\//g, '__'));
  try {
    execSync(`"${BIN}" draco "${file}" "${work}"`, { stdio: 'pipe', timeout: 300000 });
    const after = statSync(work).size;
    if (after >= size * KEEP_RATIO) {
      rows.push([rel, size, size, `keep (draco ${(after / 1024).toFixed(0)}KB, 不足10%收益)`]);
      rmSync(work, { force: true });
      continue;
    }
    const backup = join(BACKUP_DIR, rel.replace(/\//g, '__'));
    if (!existsSync(backup)) copyFileSync(file, backup);
    renameSync(work, file);
    saved += size - after;
    rows.push([rel, size, after, `${((after / size) * 100).toFixed(0)}%`]);
  } catch (err) {
    rmSync(work, { force: true });
    rows.push([rel, size, size, `ERROR ${String(err.message).split('\n')[0].slice(0, 60)}`]);
  }
}

console.log('\n' + 'file'.padEnd(56) + 'before'.padStart(9) + 'after'.padStart(9) + '   ratio  note');
for (const [rel, before, after, note] of rows) {
  const ratio = before ? `${((after / before) * 100).toFixed(0)}%` : '—';
  console.log(
    rel.slice(0, 55).padEnd(56)
    + (before / 1024 / 1024).toFixed(2).padStart(8) + 'M'
    + (after / 1024 / 1024).toFixed(2).padStart(8) + 'M'
    + ratio.padStart(7) + '  ' + note,
  );
}
console.log(`\n共 ${files.length} 个模型，回收 ${(saved / 1024 / 1024).toFixed(1)} MB；原件备份在 tmp/model-backups/`);
