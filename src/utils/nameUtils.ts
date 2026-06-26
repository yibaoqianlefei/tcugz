/**
 * 🔒 SINGLE SOURCE OF TRUTH — mesh name canonicalization.
 *
 * Three.js GLTFLoader transforms Blender object names at runtime:
 *   spaces → underscores (_)
 *   dots    → deleted
 *
 * Multi-material objects also get suffixes (_1, .004, etc.).
 *
 * EVERY meshMapRef key, proxy name, store value, and 3D→Panel lookup
 * MUST use this function. Do NOT inline `.replace()` calls for names.
 */

export function canonicalName(name: string): string {
  return name
    .replace(/\s/g, "_")     // Three.js: spaces → underscores
    .replace(/\./g, "")      // Three.js: dots → deleted
    .replace(/[_.]\d+$/, "") // Multi-material suffix: _1, .004
    .replace(/_\d+$/, "");   // Double-pass for nested suffixes
}
