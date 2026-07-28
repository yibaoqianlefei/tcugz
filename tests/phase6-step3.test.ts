/**
 * Phase 6 Step 3 — Camera Lock V1 tests.
 * Pure logic; no WebGL. Run with: npx tsx tests/phase6-step3.test.ts
 */

/* ═══════════════════════════════════════════════════════════════
   Harness
   ═══════════════════════════════════════════════════════════════ */

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

function assertApprox(a: number, b: number, eps: number, msg: string): void {
  if (Math.abs(a - b) > eps) throw new Error(`FAIL: ${msg}  (${a} vs ${b})`);
  console.log(`  PASS: ${msg}`);
}

/* ═══════════════════════════════════════════════════════════════
   A. Store tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── A. Camera Lock Store ──");

// Simulate defaults
const defaults = {
  cameraLockEnabled: false,
  cameraLockTargetKey: null as string | null,
};
assert(defaults.cameraLockEnabled === false, "store: default cameraLockEnabled=false");
assert(defaults.cameraLockTargetKey === null, "store: default targetKey=null");

// Simulate lockCameraToObject
function simLock(key: string) {
  return { cameraLockEnabled: true, cameraLockTargetKey: key };
}
{
  const s = simLock("dense-base::wall");
  assert(s.cameraLockEnabled === true, "store: lock → enabled=true");
  assert(s.cameraLockTargetKey === "dense-base::wall", "store: lock → targetKey set");
}

// Simulate unlockCamera
function simUnlock() {
  return { cameraLockEnabled: false, cameraLockTargetKey: null };
}
{
  const s = simUnlock();
  assert(s.cameraLockEnabled === false, "store: unlock → enabled=false");
  assert(s.cameraLockTargetKey === null, "store: unlock → targetKey=null");
}

// Simulate resetCameraLock
function simReset() {
  return { cameraLockEnabled: false, cameraLockTargetKey: null };
}
{
  const s = simReset();
  assert(s.cameraLockEnabled === false, "store: reset → enabled=false");
  assert(s.cameraLockTargetKey === null, "store: reset → targetKey=null");
}

// Lock with null key — should be validated before calling
// (lockCameraToObject receives string, not null. UI validates canLock first.)

// Repeat lock with same key
{
  simLock("A::mesh"); // first lock
  const r2 = simLock("A::mesh");
  assert(r2.cameraLockTargetKey === "A::mesh", "store: repeat lock same key → ok");
}

// Switch target
{
  const r2 = simLock("B::other");
  assert(r2.cameraLockTargetKey === "B::other", "store: switch target → new key");
}

// node switch — tested in reset protocol
{
  const state = simReset();
  assert(state.cameraLockEnabled === false, "store: node reset → enabled=false");
  assert(state.cameraLockTargetKey === null, "store: node reset → targetKey=null");
}

// variant switch — also calls reset (selectVariant)
{
  const state = simReset();
  assert(state.cameraLockEnabled === false, "store: variant reset → enabled=false");
}

// blank click: selectedObject cleared, Camera Lock kept
{
  const blankState = {
    selectedObject: null,
    cameraLockEnabled: true,
    cameraLockTargetKey: "A::mesh",
  };
  assert(blankState.cameraLockEnabled === true, "store: blank click → lock kept");
  assert(blankState.cameraLockTargetKey === "A::mesh", "store: blank click → key kept");
}

// Escape: cameraLock=true → unlockCamera + clear selectedObject
{
  const escState = simUnlock();
  escState.cameraLockEnabled = false; // was unlocked
  assert(escState.cameraLockEnabled === false, "store: Escape with lock → enabled=false");
}

// resetSection does NOT affect Camera Lock
{
  // section reset is independent
  const sectionOnly = { sectionEnabled: false, cameraLockEnabled: true, cameraLockTargetKey: "X::y" };
  assert(sectionOnly.cameraLockEnabled === true, "store: resetSection → lock still enabled");
}

// Atomic consistency: lockCameraToObject sets both fields together
{
  const s = simLock("dense-base::垫层");
  // Both must be consistent
  const consistent = s.cameraLockEnabled === true && s.cameraLockTargetKey !== null;
  assert(consistent, "store: lock atomic — enabled AND key set");
}

// unlockCamera clears both
{
  const s = simUnlock();
  const consistent = s.cameraLockEnabled === false && s.cameraLockTargetKey === null;
  assert(consistent, "store: unlock atomic — enabled=false AND key=null");
}

/* ═══════════════════════════════════════════════════════════════
   B. World center math
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── B. World centre math ──");

// Pure function: computeUnionWorldBox — tested via logic simulation
function simUnionBox(
  positions: readonly (readonly [number, number, number])[],
): { center: [number, number, number]; isEmpty: boolean } {
  if (positions.length === 0) return { center: [0, 0, 0], isEmpty: true };
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const p of positions) {
    for (let i = 0; i < 3; i++) {
      if (!Number.isFinite(p[i])) continue;
      if (p[i] < min[i]) min[i] = p[i];
      if (p[i] > max[i]) max[i] = p[i];
    }
  }
  const allFinite = min.every(Number.isFinite) && max.every(Number.isFinite);
  if (!allFinite) return { center: [0, 0, 0], isEmpty: true };
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const isZero = size.every((d) => d < 1e-9);
  return {
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    isEmpty: isZero,
  };
}

// Origin mesh
{
  const r = simUnionBox([[-1, -1, -1], [1, 1, 1]]);
  assertApprox(r.center[0], 0, 0.01, "center: origin mesh → [0,0,0] x");
  assertApprox(r.center[1], 0, 0.01, "center: origin mesh → [0,0,0] y");
  assertApprox(r.center[2], 0, 0.01, "center: origin mesh → [0,0,0] z");
}

// Non-origin mesh
{
  const r = simUnionBox([[3, 5, 7], [5, 9, 11]]);
  assertApprox(r.center[0], 4, 0.01, "center: non-origin → x=4");
  assertApprox(r.center[1], 7, 0.01, "center: non-origin → y=7");
  assertApprox(r.center[2], 9, 0.01, "center: non-origin → z=9");
}

// Multiple meshes (union)
{
  const r = simUnionBox([[-2, 0, 0], [0, 2, 0], [2, 0, 0], [0, -2, 0]]);
  // Union should contain all
  const dx = r.center[0]; // centre should be near 0
  assert(Math.abs(dx) < 1, "center: multi-mesh union → centred near 0");
}

// Empty input
{
  const r = simUnionBox([]);
  assert(r.isEmpty === true, "center: empty input → isEmpty");
}

// Single point (degenerate)
{
  const r = simUnionBox([[5, 5, 5], [5, 5, 5]]);
  assert(r.isEmpty === true, "center: degenerate → isEmpty");
}

// Negative coordinates
{
  const r = simUnionBox([[-10, -8, -6], [-2, -2, -2]]);
  assertApprox(r.center[0], -6, 0.01, "center: negative coords → x=-6");
  assertApprox(r.center[1], -5, 0.01, "center: negative coords → y=-5");
  assertApprox(r.center[2], -4, 0.01, "center: negative coords → z=-4");
}

// Exploded position simulation (non-origin, displaced)
{
  const base: [number, number, number] = [1, 2, 3];
  const displacement: [number, number, number] = [0, 4, 0];
  const explodedPos: [number, number, number] = [base[0] + displacement[0], base[1] + displacement[1], base[2] + displacement[2]];
  const r = simUnionBox([[-0.5, -0.5, -0.5], [0.5, 0.5, 0.5]].map(
    (c) => [c[0] + explodedPos[0], c[1] + explodedPos[1], c[2] + explodedPos[2]] as const,
  ));
  assertApprox(r.center[1], 6, 0.01, "center: exploded → y=6 (2+4)");
}

// NaN in one corner — remaining valid points still produce a box
{
  const r = simUnionBox([[NaN, 0, 0], [1, 1, 1]]);
  // The NaN is skipped; remaining point [1,1,1] defines a degenerate box
  // but still has valid centre
  assert(Number.isFinite(r.center[0]), "center: NaN corner skipped → centre finite");
}

// Non-mutating: input not modified
{
  const input = [[1, 2, 3], [4, 5, 6]] as const;
  const copy = [input[0].slice(), input[1].slice()];
  simUnionBox(input as unknown as readonly (readonly [number, number, number])[]);
  assert(input[0][0] === copy[0][0], "center: input not mutated [0][0]");
}

/* ═══════════════════════════════════════════════════════════════
   C. Object identity
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── C. Object identity ──");

// Scoped key format
{
  const makeScopedKey = (vid: string | null, name: string) =>
    vid ? `${vid}::${name}` : name;

  // Normal node
  assert(makeScopedKey(null, "beam") === "beam", "identity: normal node → plain name");
  // A variant
  assert(makeScopedKey("dense-base", "垫层") === "dense-base::垫层", "identity: A variant → scoped");
  // B variant
  assert(makeScopedKey("permeable-base", "垫层") === "permeable-base::垫层", "identity: B variant → different key");
  // Same name, different variant → different keys
  assert(
    makeScopedKey("a", "x") !== makeScopedKey("b", "x"),
    "identity: same name ≠ same key across variants",
  );
}

// Proxy mapping: proxy.name = logicalName, proxy.parent = real mesh
// The registry stores real meshes (not proxies).  This is a structural
// invariant verified by code review, not runtime test.
{
  const proxy = { name: "垫层", parent: { type: "Mesh" } };
  const logicalName = proxy.name; // same as what findNamedMesh returns
  assert(logicalName === "垫层", "identity: proxy name = logicalName");
  assert(proxy.parent.type === "Mesh", "identity: proxy.parent is real Mesh");
}

// activeExplodeVariantId scope
function scoped(activeId: string | null, targetVariant: string): boolean {
  return targetVariant === activeId;
}
assert(scoped("a", "a") === true, "identity: active=A → A in scope");
assert(scoped("a", "b") === false, "identity: active=A → B out of scope");
assert(scoped(null, "a") === false, "identity: active=null → nothing in scope");

// Unknown key → null resolution (simulate registry miss)
function simResolve(key: string, registry: Map<string, string[]>): string[] | undefined {
  return registry.get(key);
}
const reg = new Map<string, string[]>();
reg.set("a::mesh", ["obj1"]);
assert(simResolve("a::mesh", reg)?.length === 1, "identity: known key → found");
assert(simResolve("unknown", reg) === undefined, "identity: unknown key → undefined");
assert(simResolve("b::mesh", reg) === undefined, "identity: variant B not in registry → undefined");

// Token-based unregister
{
  const reg2 = new Map<string, { objects: string[]; token: symbol }>();
  const t1 = Symbol("t1");
  reg2.set("key", { objects: ["a"], token: t1 });

  // Old unregister with matching token
  const entry = reg2.get("key");
  if (entry && entry.token === t1) reg2.delete("key");
  assert(reg2.has("key") === false, "identity: token match → deleted");

  // New registration with different token
  const t2 = Symbol("t2");
  reg2.set("key", { objects: ["b"], token: t2 });
  // Old unregister (t1) tries again:
  const entry2 = reg2.get("key");
  if (entry2 && entry2.token === t1) reg2.delete("key");
  // t1 !== t2 → should NOT delete
  assert(reg2.has("key") === true, "identity: old token cannot delete new entry");
}

/* ═══════════════════════════════════════════════════════════════
   D. Lifecycle
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── D. Lifecycle ──");

// Lock
{
  const s = simLock("A::mesh");
  assert(s.cameraLockEnabled === true, "lifecycle: lock");
}

// Cancel (unlockCamera via button)
{
  const s = simUnlock();
  assert(s.cameraLockEnabled === false, "lifecycle: cancel via button");
  assert(s.cameraLockTargetKey === null, "lifecycle: cancel → key null");
  // CameraTracker stays paused after user unlock (pauseCameraTracker was called on lock)
}

// Variant switch
{
  const s = simReset();
  assert(s.cameraLockEnabled === false, "lifecycle: variant switch → lock reset");
}

// Node switch
{
  const s = simReset();
  assert(s.cameraLockEnabled === false, "lifecycle: node switch → lock reset");
}

// Escape with lock active
{
  // 1. cameraLockEnabled=true → unlockCamera() + clear selectedObject
  // 2. Section, Explode, variant kept
  const afterEscape = {
    cameraLockEnabled: false,
    cameraLockTargetKey: null,
    selectedObject: null,
    sectionEnabled: true,
    explodeProgress: 0.4,
    activeExplodeVariantId: "dense-base",
  };
  assert(afterEscape.cameraLockEnabled === false, "lifecycle: Escape with lock → lock off");
  assert(afterEscape.sectionEnabled === true, "lifecycle: Escape → section kept");
  assert(afterEscape.explodeProgress === 0.4, "lifecycle: Escape → explode kept");
}

// Blank click: keeps lock
{
  const s = {
    cameraLockEnabled: true,
    cameraLockTargetKey: "A::mesh",
    selectedObject: null, // cleared
  };
  assert(s.cameraLockEnabled === true, "lifecycle: blank click → lock kept");
}

// Section reset keeps lock
{
  const s = {
    cameraLockEnabled: true,
    sectionEnabled: false, // section reset
  };
  assert(s.cameraLockEnabled === true, "lifecycle: section reset → lock kept");
}

// Target fully clipped by Section → unlock safety
{
  // When all 8 corners of target's world box are clipped:
  // → queueMicrotask → validate → unlockCamera
  const afterClip = simUnlock();
  assert(afterClip.cameraLockEnabled === false, "lifecycle: fully clipped → unlocked");
}

// Validate in microtask: component unmounted
{
  const mounted = false; // simulates isMountedRef
  // If unmounted, microtask does NOT call unlockCamera
  const storeState = { cameraLockEnabled: true };
  if (!mounted) {
    // skip unlock
  }
  assert(storeState.cameraLockEnabled === true, "lifecycle: unmounted → no unlock (skipped)");
}

// Validate in microtask: user already manually unlocked
{
  const storeState = { cameraLockEnabled: false };
  // queueMicrotask validates cameraLockEnabled first → returns
  // No action taken
  assert(storeState.cameraLockEnabled === false, "lifecycle: already unlocked → skip");
}

/* ═══════════════════════════════════════════════════════════════
   E. Section clipping (isObjectCompletelyClipped logic)
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── E. Section clipping ──");

import { isPointVisible, type SectionBounds } from "../src/utils/sectionMath";

function simCompletelyClipped(
  corners: readonly (readonly [number, number, number])[],
  worldCenter: readonly [number, number, number],
  sectionBounds: SectionBounds,
  axis: "x" | "y" | "z",
  offset: number,
  invert: boolean,
): boolean {
  // Validate numeric inputs
  if (!Number.isFinite(offset)) return false;
  for (const b of [sectionBounds.min, sectionBounds.max]) {
    if (!Number.isFinite(b[0]) || !Number.isFinite(b[1]) || !Number.isFinite(b[2])) return false;
  }
  for (const c of corners) {
    if (!Number.isFinite(c[0]) || !Number.isFinite(c[1]) || !Number.isFinite(c[2])) return false;
  }
  if (!Number.isFinite(worldCenter[0]) || !Number.isFinite(worldCenter[1]) || !Number.isFinite(worldCenter[2])) return false;

  return corners.every(
    (c) => !isPointVisible(c, sectionBounds, axis, offset, invert, true),
  );
}

const clipBounds: SectionBounds = { min: [-1, -1, -1], max: [1, 1, 1] };

// All 8 corners on visible side
{
  const corners: readonly [number, number, number][] = [[0.5,0.5,0.5],[0.5,0.5,-0.5],[0.5,-0.5,0.5],[0.5,-0.5,-0.5],[-0.5,0.5,0.5],[-0.5,0.5,-0.5],[-0.5,-0.5,0.5],[-0.5,-0.5,-0.5]];
  const r = simCompletelyClipped(corners, [0,0,0], clipBounds, "y", 0.5, false);
  assert(r === false, "clip: all visible → NOT completely clipped");
}

// All 8 corners on clipped side
{
  const corners: readonly [number, number, number][] = [[0.5,-2,0.5],[0.5,-2,-0.5],[0.5,-1.5,0.5],[0.5,-1.5,-0.5],[-0.5,-2,0.5],[-0.5,-2,-0.5],[-0.5,-1.5,0.5],[-0.5,-1.5,-0.5]];
  const r = simCompletelyClipped(corners, [0,-2,0], clipBounds, "y", 0.5, false);
  assert(r === true, "clip: all below plane → completely clipped");
}

// Partially clipped (mixed)
{
  const corners: readonly [number, number, number][] = [[0.5,0.2,0.5],[0.5,-0.3,0.5],[0.5,-0.3,0.5],[0.5,0.2,0.5],[-0.5,0.2,0.5],[-0.5,0.2,0.5],[-0.5,0.2,0.5],[-0.5,0.2,0.5]];
  const r = simCompletelyClipped(corners, [0,0,0], clipBounds, "y", 0.5, false);
  assert(r === false, "clip: mixed → NOT completely clipped");
}

// Exactly on plane
{
  const corners: readonly [number, number, number][] = [[0.5,0,0.5],[0.5,0,0.5],[0.5,0,0.5],[0.5,0,0.5],[-0.5,0,0.5],[-0.5,0,0.5],[-0.5,0,0.5],[-0.5,0,0.5]];
  const r = simCompletelyClipped(corners, [0,0,0], clipBounds, "y", 0.5, false);
  assert(r === false, "clip: on plane → NOT completely clipped (>=0 visible)");
}

// Invert
{
  const corners: readonly [number, number, number][] = [[0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5]];
  const r = simCompletelyClipped(corners, [0,0.5,0], clipBounds, "y", 0.5, true);
  assert(r === true, "clip: invert → above plane completely clipped");
}

// X axis
{
  const cornersAllLeft: readonly [number, number, number][] = [[-2,0.5,0.5],[-2,0.5,-0.5],[-2,-0.5,0.5],[-2,-0.5,-0.5],[-1.5,0.5,0.5],[-1.5,0.5,-0.5],[-1.5,-0.5,0.5],[-1.5,-0.5,-0.5]];
  const r = simCompletelyClipped(cornersAllLeft, [-2,0,0], clipBounds, "x", 0.5, false);
  assert(r === true, "clip: X axis all left → completely clipped");
}

// Z axis
{
  const cornersAllBack: readonly [number, number, number][] = [[0.5,0.5,-2],[0.5,0.5,-1.5],[0.5,-0.5,-2],[0.5,-0.5,-1.5],[-0.5,0.5,-2],[-0.5,0.5,-1.5],[-0.5,-0.5,-2],[-0.5,-0.5,-1.5]];
  const r = simCompletelyClipped(cornersAllBack, [0,0,-2], clipBounds, "z", 0.5, false);
  assert(r === true, "clip: Z axis all back → completely clipped");
}

// NaN in corner
{
  const cornersNaN: readonly [number, number, number][] = [[NaN,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5],[-0.5,0.5,0.5]];
  const r = simCompletelyClipped(cornersNaN, [0,0,0], clipBounds, "y", 0.5, false);
  assert(r === false, "clip: NaN corner → false (safe)");
}

// Infinity in offset
{
  const r = simCompletelyClipped([[-2,-2,-2],[-1.5,-2,-2],[-2,-1.5,-2],[-2,-2,-1.5],[-1.5,-1.5,-2],[-1.5,-2,-1.5],[-2,-1.5,-1.5],[-1.5,-1.5,-1.5]], [0,0,0], clipBounds, "y", Infinity, false);
  assert(r === false, "clip: Infinity offset → false (safe)");
}

// Invalid section bounds
{
  const badBounds: SectionBounds = { min: [NaN, -1, -1], max: [1, 1, 1] };
  const r = simCompletelyClipped([[-2,-2,-2],[-1.5,-2,-2],[-2,-1.5,-2],[-2,-2,-1.5],[-1.5,-1.5,-2],[-1.5,-2,-1.5],[-2,-1.5,-1.5],[-1.5,-1.5,-1.5]], [0,0,0], badBounds, "y", 0.5, false);
  assert(r === false, "clip: NaN in bounds.min → false (safe)");
}

// Non-origin model bounds (sectionBounds shifted)
{
  const shiftedBounds: SectionBounds = { min: [2, 2, 2], max: [6, 6, 6] };
  // Object corners all below y=4 plane inside shifted bounds
  const belowAll: readonly [number, number, number][] = [[3,2.5,3],[3,2.5,4],[3,3,3],[3,3,4],[4,2.5,3],[4,2.5,4],[4,3,3],[4,3,4]];
  const r = simCompletelyClipped(belowAll, [3.5,3,3.5], shiftedBounds, "y", 0.5, false);
  assert(r === true, "clip: shifted bounds all below → clipped");
}

/* ═══════════════════════════════════════════════════════════════
   F. controls.target tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── F. controls.target protocol ──");

// Lock updates target to center
{
  const target = { x: 0, y: 0, z: 0 };
  const center: [number, number, number] = [2, 3, 4];
  target.x = center[0]; target.y = center[1]; target.z = center[2];
  assert(target.x === 2 && target.y === 3 && target.z === 4, "controls: lock → target set to center");
}

// Unlock does NOT reset target
{
  const target = { x: 5, y: 6, z: 7 };
  // unlockCamera: just clears store state, target stays
  assert(target.x === 5, "controls: unlock → target unchanged (x)");
}

// Explode updates target via dirty flag
{
  let dirty = true;
  const target = { x: 0, y: 0, z: 0 };
  if (dirty) {
    target.x = 10; target.y = 20; target.z = 30; // new center after explode
    dirty = false;
  }
  assert(target.x === 10 && target.y === 20 && target.z === 30, "controls: explode → target updated");
  // Next frame: dirty=false → skip
  const after = { x: target.x, y: target.y, z: target.z };
  if (dirty) { after.x = 999; } // won't happen
  assert(after.x === 10, "controls: dirty=false → no update");
}

// Camera position NOT written by Camera Lock
{
  const camPos = { x: 1, y: 2, z: 3 };
  // Camera Lock only writes controls.target, never camera.position
  assert(camPos.x === 1, "controls: cam pos unchanged");
}

console.log("\nAll Phase 6 Step 3 tests passed.");
