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

export function canonicalName(name: string, modelGroups?: Record<string, string>): string {
  // 1. Check model-specific component group mapping first (e.g. 马牙槎 sub-parts)
  if (modelGroups && modelGroups[name]) return modelGroups[name];

  // 2. Strip _hitbox suffix (Blender hitbox meshes → parent component)
  const noHitbox = name.replace(/_hitbox$/, "");

  // 3. Standard Blender→Three.js name normalization
  return noHitbox
    .replace(/\s/g, "_")     // Three.js: spaces → underscores
    .replace(/\./g, "")      // Three.js: dots → deleted
    .replace(/[_.]\d+$/, "") // Multi-material suffix: _1, .004
    .replace(/_\d+$/, "");   // Double-pass for nested suffixes
}

export function isHitboxName(name: string): boolean {
  return /_hitbox$/.test(name);
}
