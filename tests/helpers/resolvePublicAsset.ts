/**
 * Test-only helper: map a public URL (as stored in node config, e.g.
 * "/models/floor/foo.glb" or "/tcugz/models/floor/foo.glb") to the local
 * filesystem path under <projectRoot>/public/.
 *
 * The node config paths are produced by assetPath() and already carry the
 * Vite base prefix.  This helper strips any leading base segment and resolves
 * against the real public/ directory so `fs.existsSync` works on Windows and
 * Linux without depending on a drive letter or a deployment prefix.
 *
 * This is NOT a second node configuration — it only converts paths that are
 * already present in the production config.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/** The public/ directories that node config assets may live under. */
const PUBLIC_ROOTS = ["models", "images"];

/**
 * Convert a browser asset URL to a public/ filesystem path.
 * Throws if the URL has no public root segment or tries path traversal.
 */
export function publicUrlToFsPath(url: string): string {
  const segments = url.split("/").filter((s) => s.length > 0 && s !== ".");
  const rootIdx = segments.findIndex((s) => PUBLIC_ROOTS.includes(s));
  if (rootIdx === -1) {
    throw new Error(`asset URL has no public/models|images root: ${url}`);
  }
  const rel = segments.slice(rootIdx);
  if (rel.includes("..")) {
    throw new Error(`path traversal not allowed in asset URL: ${url}`);
  }
  return path.join(projectRoot, "public", ...rel);
}
