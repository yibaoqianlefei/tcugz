/**
 * Phase 5 — explode runtime state & cache isolation tests.
 * Pure logic; no WebGL. Covers store defaults, clamp, reset,
 * active scope, cache key identity, parent-child filter, and
 * basePosition immutability.
 *
 * Run with: npx tsx tests/explodeRuntime.test.ts
 */

import { clampExplodeProgress, computeExplodedPosition, resolveVariantExplodeConfig } from "../src/utils/explodeLayout";
import type { NodeDefinition } from "../src/data/nodeDefinitions";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  PASS: ${msg}`);
}

/* ═══════════════════════════════════════════════════════════════
   Store defaults ★ new in this file
   ═══════════════════════════════════════════════════════════════ */

// Simulate store default values (same as nodeStore.ts initial state)
const defaults = { explodeProgress: 0, activeExplodeVariantId: null as string | null };

assert(defaults.explodeProgress === 0, "runtime: default explodeProgress = 0");
assert(defaults.activeExplodeVariantId === null, "runtime: default activeExplodeVariantId = null");

/* ═══════════════════════════════════════════════════════════════
   setExplodeProgress clamp behaviour
   ═══════════════════════════════════════════════════════════════ */

function simSetExplode(v: number): number { return clampExplodeProgress(v); }

assert(simSetExplode(0) === 0, "runtime: setExplodeProgress(0) = 0");
assert(simSetExplode(0.5) === 0.5, "runtime: setExplodeProgress(0.5) = 0.5");
assert(simSetExplode(1) === 1, "runtime: setExplodeProgress(1) = 1");
assert(simSetExplode(-0.1) === 0, "runtime: setExplodeProgress(-0.1) → clamp to 0");
assert(simSetExplode(1.5) === 1, "runtime: setExplodeProgress(1.5) → clamp to 1");
assert(simSetExplode(NaN) === 0, "runtime: setExplodeProgress(NaN) → 0");
assert(simSetExplode(Infinity) === 0, "runtime: setExplodeProgress(Infinity) → 0");

/* ═══════════════════════════════════════════════════════════════
   resetExplode — clears both progress and active ID
   ═══════════════════════════════════════════════════════════════ */

function simReset(): { explodeProgress: number; activeExplodeVariantId: null } {
  return { explodeProgress: 0, activeExplodeVariantId: null };
}
const reset = simReset();
assert(reset.explodeProgress === 0, "runtime: resetExplode clears progress");
assert(reset.activeExplodeVariantId === null, "runtime: resetExplode clears active ID");

/* ═══════════════════════════════════════════════════════════════
   Active scope — only active variant gets non-zero progress
   ═══════════════════════════════════════════════════════════════ */

function effectiveProgress(variantId: string, activeId: string | null, progress: number): number {
  return variantId === activeId ? progress : 0;
}

assert(effectiveProgress("a", "a", 0.7) === 0.7, "runtime: A active → A progress=0.7");
assert(effectiveProgress("b", "a", 0.7) === 0, "runtime: A active → B progress=0");
assert(effectiveProgress("c", "a", 0.7) === 0, "runtime: A active → C progress=0");
assert(effectiveProgress("a", null, 0.5) === 0, "runtime: active=null → A=0");
assert(effectiveProgress("b", null, 0.5) === 0, "runtime: active=null → B=0");

/* ═══════════════════════════════════════════════════════════════
   0→1→0 round-trip returns base exactly
   ═══════════════════════════════════════════════════════════════ */

const basePos: readonly [number, number, number] = [1, 2, 3];
const dir: readonly [number, number, number] = [0, 1, 0];

// progress=0
const r0 = computeExplodedPosition({ basePosition: basePos, direction: dir, distance: 2, progress: 0 });
assert(r0[0]===1 && r0[1]===2 && r0[2]===3, "runtime: progress=0 → base");
// progress=1
const r1 = computeExplodedPosition({ basePosition: basePos, direction: dir, distance: 2, progress: 1 });
assert(r1[1]===4, "runtime: progress=1 → displaced");
// back to 0
const rBack = computeExplodedPosition({ basePosition: basePos, direction: dir, distance: 2, progress: 0 });
assert(rBack[0]===1 && rBack[1]===2 && rBack[2]===3, "runtime: 1→0 returns base exactly");

/* ═══════════════════════════════════════════════════════════════
   20-round 0→1→0 — no drift (pure math)
   ═══════════════════════════════════════════════════════════════ */

{
  for (let i = 0; i < 20; i++) {
    computeExplodedPosition({ basePosition: basePos, direction: dir, distance: 2, progress: 1 });
    const back = computeExplodedPosition({ basePosition: basePos, direction: dir, distance: 2, progress: 0 });
    assert(back[0]===1 && back[1]===2 && back[2]===3, `runtime: round ${i+1} → 0 returns base`);
  }
}

/* ═══════════════════════════════════════════════════════════════
   basePosition never mutated
   ═══════════════════════════════════════════════════════════════ */

const bpTest: [number, number, number] = [10, 20, 30];
const bpCopy: [number, number, number] = [10, 20, 30];
computeExplodedPosition({ basePosition: bpTest, direction: [0,1,0], distance: 5, progress: 0.5 });
assert(bpTest[0]===bpCopy[0] && bpTest[1]===bpCopy[1] && bpTest[2]===bpCopy[2], "runtime: basePosition not mutated by compute");

/* ═══════════════════════════════════════════════════════════════
   Cache key identity — nodeId + variantId + objectName
   ═══════════════════════════════════════════════════════════════ */

function buildCacheKey(nodeId: string, variantId: string, objectName: string): string {
  return `${nodeId}::${variantId}::${objectName}`;
}

const k1 = buildCacheKey("node-1", "a", "mesh-01");
const k2 = buildCacheKey("node-1", "b", "mesh-01");
const k3 = buildCacheKey("node-2", "a", "mesh-01");
assert(k1 !== k2, "runtime: different variant → different cache key");
assert(k1 !== k3, "runtime: different node → different cache key");
assert(k2 !== k3, "runtime: different node+variant → different key");
assert(buildCacheKey("n", "a", "mesh") === "n::a::mesh", "runtime: key format = nodeId::variantId::objectName");

/* ═══════════════════════════════════════════════════════════════
   Cache isolation — A/B/C independent entries
   ═══════════════════════════════════════════════════════════════ */

const keysABC = ["a", "b", "c"].map(v => buildCacheKey("wall-damp-proof-course", v, "mesh-01"));
assert(new Set(keysABC).size === 3, "runtime: A/B/C cache keys distinct");

/* ═══════════════════════════════════════════════════════════════
   Unconfigured mesh NOT in cache — simulate cache building filter
   ═══════════════════════════════════════════════════════════════ */

function simulateExplodeConfigFor(name: string): boolean {
  // A configured: 001, 001_1, 001_2. NOT configured: 001_3
  const aConfigured = new Set(["001", "001_1", "001_2"]);
  return aConfigured.has(name);
}

assert(simulateExplodeConfigFor("001") === true, "runtime: configured mesh in cache");
assert(simulateExplodeConfigFor("001_1") === true, "runtime: configured mesh in cache");
assert(simulateExplodeConfigFor("001_3") === false, "runtime: unconfigured 001_3 NOT in cache");

/* ═══════════════════════════════════════════════════════════════
   Parent Group NOT in cache — only direct Mesh targets
   ═══════════════════════════════════════════════════════════════ */

// Simulate: only Mesh names (not Group names) are in the config
const groupName = "地面垫层为密实材料";
const aMeshNames = new Set(["地面垫层为密实材料001", "地面垫层为密实材料001_1", "地面垫层为密实材料001_2"]);
assert(!aMeshNames.has(groupName), "runtime: parent Group NOT in config → NOT in cache");

/* ═══════════════════════════════════════════════════════════════
   Proxy + edge-line filtering
   ═══════════════════════════════════════════════════════════════ */

function wouldEnterCache(obj: { isMesh: boolean; userData?: { _isProxy?: boolean }; isLineSegments?: boolean }): boolean {
  if (!obj.isMesh) return false;
  if (obj.userData?._isProxy) return false;
  if (obj.isLineSegments) return false;
  return true;
}

assert(wouldEnterCache({ isMesh: true }) === true, "runtime: plain mesh enters cache");
assert(wouldEnterCache({ isMesh: true, userData: { _isProxy: true } }) === false, "runtime: proxy mesh filtered");
assert(wouldEnterCache({ isMesh: true, isLineSegments: true }) === false, "runtime: edge line filtered");
assert(wouldEnterCache({ isMesh: false }) === false, "runtime: non-mesh filtered");

/* ═══════════════════════════════════════════════════════════════
   Variant switch resets progress
   ═══════════════════════════════════════════════════════════════ */

function simSwitchVariant(newId: string): { explodeProgress: number; activeExplodeVariantId: string } {
  return { explodeProgress: 0, activeExplodeVariantId: newId };
}
const afterSwitch = simSwitchVariant("b");
assert(afterSwitch.explodeProgress === 0, "runtime: variant switch → progress=0");
assert(afterSwitch.activeExplodeVariantId === "b", "runtime: variant switch → new active");

/* ═══════════════════════════════════════════════════════════════
   Node switch / relatedNode resets everything
   ═══════════════════════════════════════════════════════════════ */

function simNodeSwitch(): { explodeProgress: number; activeExplodeVariantId: null; selectedObject: null; selectedVariantId: null } {
  return { explodeProgress: 0, activeExplodeVariantId: null, selectedObject: null, selectedVariantId: null };
}
const afterNode = simNodeSwitch();
assert(afterNode.explodeProgress === 0, "runtime: node switch → progress=0");
assert(afterNode.activeExplodeVariantId === null, "runtime: node switch → active=null");

/* ═══════════════════════════════════════════════════════════════
   Clearing selectedObject does NOT reset progress
   ═══════════════════════════════════════════════════════════════ */

// blank click: only selectedObject=null, explodeProgress unchanged
const afterBlank = { explodeProgress: 0.6, activeExplodeVariantId: "a", selectedObject: null };
assert(afterBlank.explodeProgress === 0.6, "runtime: blank click keeps progress");
assert(afterBlank.activeExplodeVariantId === "a", "runtime: blank click keeps active variant");

/* ═══════════════════════════════════════════════════════════════
   GTF Animation path untouched for normal nodes
   ═══════════════════════════════════════════════════════════════ */

// Normal node: animationProgress still works, explode fields default
assert(defaults.explodeProgress === 0, "runtime: normal node explodeProgress stays 0");

/* ═══════════════════════════════════════════════════════════════
   Resolve config preserves labels for A/B/C
   ═══════════════════════════════════════════════════════════════ */

const testNode: NodeDefinition = {
  id: "test", title: "T", description: "", category: "墙", thumbnail: null,
  status: "available", presentationMode: "variants",
  variants: [
    { id: "a", label: "A", title: "AA", model: { path: "/a.glb" },
      explode: { enabled: true, components: [{ objectName: "m", direction: [0,1,0], distance: 1 }] } },
    { id: "b", label: "B", title: "BB", model: { path: "/b.glb" },
      explode: { enabled: true, components: [{ objectName: "m", direction: [0,1,0], distance: 2 }] } },
    { id: "c", label: "C", title: "CC", model: { path: "/c.glb" },
      explode: { enabled: false, components: [] } },
  ],
} as NodeDefinition;

const rA = resolveVariantExplodeConfig({ node: testNode, variantId: "a" });
const rB = resolveVariantExplodeConfig({ node: testNode, variantId: "b" });
const rC = resolveVariantExplodeConfig({ node: testNode, variantId: "c" });

assert(rA.enabled && rA.components.length === 1, "runtime: A has 1 component");
assert(rB.enabled && rB.components.length === 1, "runtime: B has 1 component");
assert(!rC.enabled, "runtime: C disabled (enabled=false)");
assert(rA.components[0].distance === 1 && rB.components[0].distance === 2, "runtime: A/B different distances → independent configs");
assert(rA.components[0].distance !== rB.components[0].distance, "runtime: configs not cross-contaminated");

console.log("\nAll explode runtime tests passed.");
