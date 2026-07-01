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

/** Component group mapping: sub-part names → canonical component name */
const COMPONENT_GROUPS: Record<string, string> = {
  // 构造柱 — 马牙槎由4个子构件组成，交互时视为一个整体
  "01": "马牙槎",
  "02": "马牙槎",
  "03": "马牙槎",
  "04": "马牙槎",
};

export function canonicalName(name: string): string {
  // 1. Check explicit component group mapping first
  if (COMPONENT_GROUPS[name]) return COMPONENT_GROUPS[name];

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
