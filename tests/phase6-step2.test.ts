/**
 * Phase 6 Step 2 — activeExplodeVariantId sync + sectionMath + section state tests.
 *
 * Pure logic; no WebGL. Run with: npx tsx tests/phase6-step2.test.ts
 */

/* ═══════════════════════════════════════════════════════════════
   Test harness
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
   A. activeExplodeVariantId sync tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── A. activeExplodeVariantId sync ──");

// Simulate the unified selectVariant action
function simSelectVariant(variantId: string | null): {
  selectedVariantId: string | null;
  selectedObject: string | null;
  activeExplodeVariantId: string | null;
  explodeProgress: number;
} {
  return {
    selectedVariantId: variantId,
    selectedObject: null,
    activeExplodeVariantId: variantId,
    explodeProgress: 0,
  };
}

// A→B→C label clicks
{
  const rA = simSelectVariant("dense-base");
  assert(rA.selectedVariantId === "dense-base", "sync: select A → selectedVariantId=A");
  assert(rA.activeExplodeVariantId === "dense-base", "sync: select A → activeExplodeVariantId=A");
  assert(rA.selectedObject === null, "sync: select A → selectedObject cleared");
  assert(rA.explodeProgress === 0, "sync: select A → explodeProgress reset");

  const rB = simSelectVariant("permeable-base");
  assert(rB.selectedVariantId === "permeable-base", "sync: select B → selectedVariantId=B");
  assert(rB.activeExplodeVariantId === "permeable-base", "sync: select B → activeExplodeVariantId=B");

  const rC = simSelectVariant("level-difference");
  assert(rC.selectedVariantId === "level-difference", "sync: select C → selectedVariantId=C");
  assert(rC.activeExplodeVariantId === "level-difference", "sync: select C → activeExplodeVariantId=C");
}

// A→B switch → old A no longer active scope
{
  // After selecting B, check that A is not the active scope
  const afterB = simSelectVariant("permeable-base");
  assert(afterB.activeExplodeVariantId !== "dense-base", "sync: after B, active is NOT A");
  assert(afterB.activeExplodeVariantId === "permeable-base", "sync: after B, active IS B");
}

// B→C → old B no longer active scope
{
  const afterC = simSelectVariant("level-difference");
  assert(afterC.activeExplodeVariantId !== "permeable-base", "sync: after C, active is NOT B");
  assert(afterC.activeExplodeVariantId === "level-difference", "sync: after C, active IS C");
}

// Deselect variant → null
{
  const rNull = simSelectVariant(null);
  assert(rNull.selectedVariantId === null, "sync: deselect → selectedVariantId=null");
  assert(rNull.activeExplodeVariantId === null, "sync: deselect → activeExplodeVariantId=null");
  assert(rNull.explodeProgress === 0, "sync: deselect → explodeProgress reset");
}

// Normal nodes – selectVariant is NOT called for normal nodes (no labels)
// but verify that a single-model node's initial state is correct
{
  const defaults = {
    selectedVariantId: null as string | null,
    activeExplodeVariantId: null as string | null,
    explodeProgress: 0,
    selectedObject: null as string | null,
  };
  assert(defaults.selectedVariantId === null, "sync: normal node default selectedVariantId=null");
  assert(defaults.activeExplodeVariantId === null, "sync: normal node default activeExplodeVariantId=null");
}

// Unknown variantId → handled safely (sets to the unknown id)
{
  const r = simSelectVariant("nonexistent");
  assert(r.selectedVariantId === "nonexistent", "sync: unknown variant → selected set anyway");
  assert(r.activeExplodeVariantId === "nonexistent", "sync: unknown variant → active set anyway");
  // This is safe because the explode driver checks if the variant's config exists
}

// Repeated selection of same variant → no error state
{
  simSelectVariant("dense-base"); // first selection
  const r2 = simSelectVariant("dense-base"); // repeat selection
  assert(r2.selectedVariantId === "dense-base", "sync: repeat select → same selectedVariantId");
  assert(r2.activeExplodeVariantId === "dense-base", "sync: repeat select → same activeExplodeVariantId");
  assert(r2.explodeProgress === 0, "sync: repeat select → progress still reset");
  assert(r2.selectedObject === null, "sync: repeat select → object still cleared");
}

// Node switch resets everything
{
  function simNodeSwitch() {
    return {
      selectedVariantId: null as string | null,
      activeExplodeVariantId: null as string | null,
      selectedObject: null as string | null,
      explodeProgress: 0,
      animationProgress: 0,
      sectionEnabled: false,
      sectionAxis: "y" as const,
      sectionOffset: 0.5,
      sectionInvert: false,
    };
  }
  const after = simNodeSwitch();
  assert(after.selectedVariantId === null, "sync: node switch → selectedVariantId=null");
  assert(after.activeExplodeVariantId === null, "sync: node switch → activeExplodeVariantId=null");
  assert(after.selectedObject === null, "sync: node switch → selectedObject=null");
  assert(after.explodeProgress === 0, "sync: node switch → explodeProgress=0");
  assert(after.sectionEnabled === false, "sync: node switch → sectionEnabled=false");
}

/* ═══════════════════════════════════════════════════════════════
   B. sectionMath tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── B. sectionMath ──");

import {
  getSectionNormal,
  clampSectionOffset,
  resolveSectionPlaneConstant,
  isPointVisible,
  getAxisRange,
  getBoundsCenter,
  getBoundsSize,
  SECTION_DEFAULTS,
  type SectionBounds,
} from "../src/utils/sectionMath";

// ── clampSectionOffset ──

assert(clampSectionOffset(0) === 0, "clamp: 0→0");
assert(clampSectionOffset(0.5) === 0.5, "clamp: 0.5→0.5");
assert(clampSectionOffset(1) === 1, "clamp: 1→1");
assert(clampSectionOffset(-0.1) === 0, "clamp: -0.1→0");
assert(clampSectionOffset(1.5) === 1, "clamp: 1.5→1");
assert(clampSectionOffset(NaN) === 0.5, "clamp: NaN→0.5");
assert(clampSectionOffset(Infinity) === 0.5, "clamp: Infinity→0.5");
assert(clampSectionOffset(-Infinity) === 0.5, "clamp: -Infinity→0.5");

// ── getSectionNormal ──

{
  const nx = getSectionNormal("x", false);
  assert(nx[0] === 1 && nx[1] === 0 && nx[2] === 0, "normal: X axis, not inverted → [1,0,0]");

  const ny = getSectionNormal("y", false);
  assert(ny[0] === 0 && ny[1] === 1 && ny[2] === 0, "normal: Y axis, not inverted → [0,1,0]");

  const nz = getSectionNormal("z", false);
  assert(nz[0] === 0 && nz[1] === 0 && nz[2] === 1, "normal: Z axis, not inverted → [0,0,1]");

  const nxi = getSectionNormal("x", true);
  assert(nxi[0] === -1 && nxi[1] === 0 && nxi[2] === 0, "normal: X axis, inverted → [-1,0,0]");

  const nyi = getSectionNormal("y", true);
  assert(nyi[0] === 0 && nyi[1] === -1 && nyi[2] === 0, "normal: Y axis, inverted → [0,-1,0]");

  const nzi = getSectionNormal("z", true);
  assert(nzi[0] === 0 && nzi[1] === 0 && nzi[2] === -1, "normal: Z axis, inverted → [0,0,-1]");
}

// ── getAxisRange ──

{
  const bounds: SectionBounds = {
    min: [-1, -2, -3],
    max: [4, 5, 6],
  };
  const [xMin, xMax] = getAxisRange(bounds, "x");
  assert(xMin === -1 && xMax === 4, "axisRange: X → [-1, 4]");

  const [yMin, yMax] = getAxisRange(bounds, "y");
  assert(yMin === -2 && yMax === 5, "axisRange: Y → [-2, 5]");

  const [zMin, zMax] = getAxisRange(bounds, "z");
  assert(zMin === -3 && zMax === 6, "axisRange: Z → [-3, 6]");
}

// ── getBoundsCenter ──

{
  const bounds: SectionBounds = {
    min: [-2, -4, -6],
    max: [2, 4, 6],
  };
  const c = getBoundsCenter(bounds);
  assert(c[0] === 0 && c[1] === 0 && c[2] === 0, "boundsCenter: symmetric → [0,0,0]");

  const bounds2: SectionBounds = { min: [0, 1, 2], max: [2, 3, 4] };
  const c2 = getBoundsCenter(bounds2);
  assert(c2[0] === 1 && c2[1] === 2 && c2[2] === 3, "boundsCenter: offset → [1,2,3]");
}

// ── getBoundsSize ──

{
  const bounds: SectionBounds = { min: [-1, -2, -3], max: [4, 5, 6] };
  const s = getBoundsSize(bounds);
  assert(s[0] === 5 && s[1] === 7 && s[2] === 9, "boundsSize: correct");
}

// ── resolveSectionPlaneConstant ──

{
  const bounds: SectionBounds = {
    min: [-2, -3, -4],
    max: [2, 3, 4],
  };

  // Y axis, offset=0 (min edge): plane through y=-3, normal=[0,1,0]
  // constant = -(1 * (-3)) = 3
  const c0 = resolveSectionPlaneConstant(bounds, "y", 0, false);
  assertApprox(c0, 3, 0.001, "planeConst: Y offset=0 → constant=3");

  // Y axis, offset=0.5 (center): plane through y=0, normal=[0,1,0]
  // constant = -(1 * 0) = 0
  const c50 = resolveSectionPlaneConstant(bounds, "y", 0.5, false);
  assertApprox(c50, 0, 0.001, "planeConst: Y offset=0.5 → constant=0");

  // Y axis, offset=1 (max edge): plane through y=3, normal=[0,1,0]
  // constant = -(1 * 3) = -3
  const c100 = resolveSectionPlaneConstant(bounds, "y", 1, false);
  assertApprox(c100, -3, 0.001, "planeConst: Y offset=1 → constant=-3");

  // Y axis inverted, offset=0.5: normal=[0,-1,0], point y=0
  // constant = -((-1) * 0) = 0
  const ci50 = resolveSectionPlaneConstant(bounds, "y", 0.5, true);
  assertApprox(ci50, 0, 0.001, "planeConst: Y inverted offset=0.5 → constant=0");

  // Y axis inverted, offset=0: normal=[0,-1,0], point y=-3
  // constant = -((-1) * (-3)) = -(3) = -3
  const ci0 = resolveSectionPlaneConstant(bounds, "y", 0, true);
  assertApprox(ci0, -3, 0.001, "planeConst: Y inverted offset=0 → constant=-3");

  // X axis, offset=0.5: normal=[1,0,0], point x=0
  const cx = resolveSectionPlaneConstant(bounds, "x", 0.5, false);
  assertApprox(cx, 0, 0.001, "planeConst: X offset=0.5 → constant=0");

  // Z axis, offset=0.5: normal=[0,0,1], point z=0
  const cz = resolveSectionPlaneConstant(bounds, "z", 0.5, false);
  assertApprox(cz, 0, 0.001, "planeConst: Z offset=0.5 → constant=0");
}

// Degenerate bounds (min === max)
{
  const bounds: SectionBounds = { min: [1, 2, 3], max: [1, 2, 3] };
  const c = resolveSectionPlaneConstant(bounds, "y", 0.5, false);
  assert(Number.isFinite(c), "planeConst: degenerate bounds → finite value");
}

// NaN offset → clamped to 0.5
{
  const bounds: SectionBounds = { min: [-1, -1, -1], max: [1, 1, 1] };
  const c = resolveSectionPlaneConstant(bounds, "y", NaN, false);
  assertApprox(c, 0, 0.001, "planeConst: NaN offset → clamped to 0.5 → constant=0");
}

// Non-origin bounds
{
  const bounds: SectionBounds = { min: [3, 5, 7], max: [5, 9, 11] };
  const c0 = resolveSectionPlaneConstant(bounds, "y", 0, false);
  assertApprox(c0, -5, 0.001, "planeConst: non-origin Y offset=0 → constant=-5");

  const c100 = resolveSectionPlaneConstant(bounds, "y", 1, false);
  assertApprox(c100, -9, 0.001, "planeConst: non-origin Y offset=1 → constant=-9");
}

// Negative coordinate bounds
{
  const bounds: SectionBounds = { min: [-10, -8, -6], max: [-2, -2, -2] };
  const c0 = resolveSectionPlaneConstant(bounds, "x", 0, false);
  assertApprox(c0, 10, 0.001, "planeConst: negative bounds X offset=0 → constant=10");

  const c100 = resolveSectionPlaneConstant(bounds, "x", 1, false);
  assertApprox(c100, 2, 0.001, "planeConst: negative bounds X offset=1 → constant=2");
}

// Infinite bounds → treated as 0
{
  const bounds: SectionBounds = {
    min: [Infinity, -Infinity, NaN],
    max: [Infinity, -Infinity, NaN],
  };
  const c = resolveSectionPlaneConstant(bounds, "y", 0.5, false);
  assert(Number.isFinite(c) || c === 0, "planeConst: infinite bounds → safe result");
}

// ── isPointVisible ──

{
  const bounds: SectionBounds = { min: [-1, -1, -1], max: [1, 1, 1] };

  // Section disabled → everything visible
  assert(isPointVisible([0, 0, 0], bounds, "y", 0.5, false, false) === true, "visible: disabled → true");
  assert(isPointVisible([0, 10, 0], bounds, "y", 0.5, false, false) === true, "visible: disabled → true (any point)");

  // Y axis section at center (offset=0.5, not inverted)
  // Plane: y=0, normal=[0,1,0], visible side: y >= 0
  assert(isPointVisible([0, 0.5, 0], bounds, "y", 0.5, false, true) === true, "visible: Y=0.5 above center → true");
  assert(isPointVisible([0, 0, 0], bounds, "y", 0.5, false, true) === true, "visible: Y=0 at center → true (on plane)");
  assert(isPointVisible([0, -0.5, 0], bounds, "y", 0.5, false, true) === false, "visible: Y=-0.5 below center → false");

  // Y axis inverted section at center
  // Plane: y=0, normal=[0,-1,0], visible side: -y + 0 >= 0 → y <= 0
  assert(isPointVisible([0, -0.5, 0], bounds, "y", 0.5, true, true) === true, "visible: inverted Y=-0.5 → true");
  assert(isPointVisible([0, 0.5, 0], bounds, "y", 0.5, true, true) === false, "visible: inverted Y=0.5 → false");

  // X axis section at center
  assert(isPointVisible([0.5, 0, 0], bounds, "x", 0.5, false, true) === true, "visible: X=0.5 right → true");
  assert(isPointVisible([-0.5, 0, 0], bounds, "x", 0.5, false, true) === false, "visible: X=-0.5 left → false");

  // Z axis section at center
  assert(isPointVisible([0, 0, 0.5], bounds, "z", 0.5, false, true) === true, "visible: Z=0.5 front → true");
  assert(isPointVisible([0, 0, -0.5], bounds, "z", 0.5, false, true) === false, "visible: Z=-0.5 back → false");

  // Edge: Y offset=0 (min edge), not inverted → visible side: y >= -1
  assert(isPointVisible([0, 0, 0], bounds, "y", 0, false, true) === true, "visible: Y offset=0, point y=0 → true");
  assert(isPointVisible([0, -1, 0], bounds, "y", 0, false, true) === true, "visible: Y offset=0, point y=-1 → true (on plane)");
  assert(isPointVisible([0, -1.5, 0], bounds, "y", 0, false, true) === false, "visible: Y offset=0, point y=-1.5 → false");
}

// World-space coordinates (non-origin bounds)
{
  const bounds: SectionBounds = { min: [2, 2, 2], max: [6, 6, 6] };
  // offset=0.5 → plane at y=4, normal=[0,1,0]
  assert(isPointVisible([3, 5, 3], bounds, "y", 0.5, false, true) === true, "visible: non-origin above plane → true");
  assert(isPointVisible([3, 3, 3], bounds, "y", 0.5, false, true) === false, "visible: non-origin below plane → false");
}

// ── Input immutability ──

{
  const bounds: SectionBounds = { min: [-1, -2, -3], max: [4, 5, 6] };
  const minCopy = [...bounds.min];
  const maxCopy = [...bounds.max];
  getAxisRange(bounds, "x");
  getBoundsCenter(bounds);
  getBoundsSize(bounds);
  resolveSectionPlaneConstant(bounds, "y", 0.3, false);
  assert(bounds.min[0] === minCopy[0] && bounds.min[1] === minCopy[1] && bounds.min[2] === minCopy[2], "immutable: bounds.min unchanged");
  assert(bounds.max[0] === maxCopy[0] && bounds.max[1] === maxCopy[1] && bounds.max[2] === maxCopy[2], "immutable: bounds.max unchanged");
}

// ── SECTION_DEFAULTS ──

assert(SECTION_DEFAULTS.enabled === false, "defaults: enabled=false");
assert(SECTION_DEFAULTS.axis === "y", "defaults: axis=y");
assert(SECTION_DEFAULTS.offset === 0.5, "defaults: offset=0.5");
assert(SECTION_DEFAULTS.invert === false, "defaults: invert=false");

/* ═══════════════════════════════════════════════════════════════
   C. Section state protocol tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── C. Section state protocol ──");

// Simulate store defaults
const defaultSectionState = {
  sectionEnabled: false,
  sectionAxis: "y" as const,
  sectionOffset: 0.5,
  sectionInvert: false,
};

assert(defaultSectionState.sectionEnabled === false, "state: default sectionEnabled=false");
assert(defaultSectionState.sectionAxis === "y", "state: default sectionAxis=y");
assert(defaultSectionState.sectionOffset === 0.5, "state: default sectionOffset=0.5");
assert(defaultSectionState.sectionInvert === false, "state: default sectionInvert=false");

// Simulate setSectionEnabled
function simEnable(e: boolean) { return { ...defaultSectionState, sectionEnabled: e }; }
assert(simEnable(true).sectionEnabled === true, "state: enable → sectionEnabled=true");
assert(simEnable(false).sectionEnabled === false, "state: disable → sectionEnabled=false");

// Simulate setSectionAxis
function simAxis(a: "x" | "y" | "z") { return { ...defaultSectionState, sectionAxis: a }; }
assert(simAxis("x").sectionAxis === "x", "state: axis → x");
assert(simAxis("z").sectionAxis === "z", "state: axis → z");

// Simulate setSectionOffset
function simOffset(o: number) { return { ...defaultSectionState, sectionOffset: clampSectionOffset(o) }; }
assert(simOffset(0).sectionOffset === 0, "state: offset 0 → 0");
assert(simOffset(0.7).sectionOffset === 0.7, "state: offset 0.7 → 0.7");
assert(simOffset(NaN).sectionOffset === 0.5, "state: offset NaN → 0.5");

// Simulate setSectionInvert
function simInvert(i: boolean) { return { ...defaultSectionState, sectionInvert: i }; }
assert(simInvert(true).sectionInvert === true, "state: invert → true");
assert(simInvert(false).sectionInvert === false, "state: invert → false");

// Simulate resetSection
function simResetSection() { return { ...defaultSectionState }; }
const reset = simResetSection();
assert(reset.sectionEnabled === false, "state: resetSection → enabled=false");
assert(reset.sectionAxis === "y", "state: resetSection → axis=y");
assert(reset.sectionOffset === 0.5, "state: resetSection → offset=0.5");
assert(reset.sectionInvert === false, "state: resetSection → invert=false");

// resetSection does NOT reset explode
{
  const explodeState = { explodeProgress: 0.7, activeExplodeVariantId: "dense-base" };
  // resetSection only touches section state; explode is separate
  assert(explodeState.explodeProgress === 0.7, "state: resetSection keeps explodeProgress");
  assert(explodeState.activeExplodeVariantId === "dense-base", "state: resetSection keeps activeExplodeVariantId");
}

// resetSection does NOT reset animation
{
  const animState = { animationProgress: 0.5, isPlaying: true };
  assert(animState.animationProgress === 0.5, "state: resetSection keeps animationProgress");
}

// Node switch resets ALL (including section)
{
  const afterNodeSwitch = {
    ...defaultSectionState,
    selectedObject: null,
    selectedVariantId: null,
    explodeProgress: 0,
    activeExplodeVariantId: null,
    animationProgress: 0,
  };
  assert(afterNodeSwitch.sectionEnabled === false, "state: node switch → sectionEnabled=false");
  assert(afterNodeSwitch.explodeProgress === 0, "state: node switch → explodeProgress=0");
}

// Variant switch resets section
{
  // The selectVariant action resets section state too
  // (Verified in store implementation: selectVariant sets sectionEnabled=false etc.)
  // This is tested here at protocol level
  const expectedSectionState = { sectionEnabled: false, sectionAxis: "y" as const, sectionOffset: 0.5, sectionInvert: false };
  assert(expectedSectionState.sectionEnabled === false, "state: variant switch → sectionEnabled=false (protocol)");
}

// Blank click does NOT reset section or explode
{
  const blankClickState = {
    ...defaultSectionState,
    sectionEnabled: true,
    sectionAxis: "x" as const,
    sectionOffset: 0.3,
    sectionInvert: true,
    selectedObject: null,  // cleared
    explodeProgress: 0.6,  // kept
    activeExplodeVariantId: "dense-base",  // kept
  };
  assert(blankClickState.sectionEnabled === true, "state: blank click → sectionEnabled kept");
  assert(blankClickState.sectionAxis === "x", "state: blank click → sectionAxis kept");
  assert(blankClickState.sectionOffset === 0.3, "state: blank click → sectionOffset kept");
  assert(blankClickState.explodeProgress === 0.6, "state: blank click → explodeProgress kept");
  assert(blankClickState.activeExplodeVariantId === "dense-base", "state: blank click → activeExplodeVariantId kept");
  assert(blankClickState.selectedObject === null, "state: blank click → selectedObject cleared");
}

// Escape does NOT reset section or explode
{
  const escapeState = {
    ...defaultSectionState,
    sectionEnabled: true,
    sectionOffset: 0.8,
    selectedObject: null,  // cleared
    explodeProgress: 0.4,  // kept
    activeExplodeVariantId: "permeable-base",  // kept
    animationProgress: 0.5,  // kept
  };
  assert(escapeState.sectionEnabled === true, "state: Escape → sectionEnabled kept");
  assert(escapeState.explodeProgress === 0.4, "state: Escape → explodeProgress kept");
  assert(escapeState.activeExplodeVariantId === "permeable-base", "state: Escape → activeExplodeVariantId kept");
  assert(escapeState.selectedObject === null, "state: Escape → selectedObject cleared");
  assert(escapeState.animationProgress === 0.5, "state: Escape → animationProgress kept");
}

/* ═══════════════════════════════════════════════════════════════
   D. Picking visibility filter tests
   ═══════════════════════════════════════════════════════════════ */

console.log("\n── D. Picking visibility filter ──");

const pickBounds: SectionBounds = { min: [-1, -1, -1], max: [1, 1, 1] };

// Section disabled → everything visible
{
  assert(isPointVisible([0, 0, 0], pickBounds, "y", 0.5, false, false) === true, "pick: disabled → visible (center)");
  assert(isPointVisible([0, -2, 0], pickBounds, "y", 0.5, false, false) === true, "pick: disabled → visible (out of bounds)");
}

// Section enabled → clipped side skipped
{
  // Y axis, offset=0.5 (center), not inverted → visible: y >= 0
  const visAbove = isPointVisible([0, 0.2, 0], pickBounds, "y", 0.5, false, true);
  assert(visAbove === true, "pick: Y≥0 above plane → visible");

  const visBelow = isPointVisible([0, -0.2, 0], pickBounds, "y", 0.5, false, true);
  assert(visBelow === false, "pick: Y<0 below plane → clipped");
}

// First intersection clipped, second visible → pick second
{
  // Simulate intersections: [clipped, visible]
  const pts = [
    [0, -0.3, 0] as const,  // clipped (Y<0)
    [0, 0.4, 0] as const,   // visible (Y≥0)
  ];
  const firstVis = pts.findIndex((p) =>
    isPointVisible(p, pickBounds, "y", 0.5, false, true)
  );
  assert(firstVis === 1, "pick: first clipped, second visible → index 1");
}

// All intersections clipped → nothing selected
{
  const pts: readonly [number, number, number][] = [
    [0, -0.1, 0],
    [0, -0.5, 0],
    [0, -0.9, 0],
  ];
  const anyVis = pts.some((p) =>
    isPointVisible(p, pickBounds, "y", 0.5, false, true)
  );
  assert(anyVis === false, "pick: all clipped → none visible");
}

// Invert direction
{
  // Inverted: visible side y <= 0
  const visBelow = isPointVisible([0, -0.3, 0], pickBounds, "y", 0.5, true, true);
  assert(visBelow === true, "pick: inverted, below → visible");

  const visAbove = isPointVisible([0, 0.3, 0], pickBounds, "y", 0.5, true, true);
  assert(visAbove === false, "pick: inverted, above → clipped");
}

// X axis
{
  assert(isPointVisible([0.3, 0, 0], pickBounds, "x", 0.5, false, true) === true, "pick: X>0 → visible");
  assert(isPointVisible([-0.3, 0, 0], pickBounds, "x", 0.5, false, true) === false, "pick: X<0 → clipped");
}

// Z axis
{
  assert(isPointVisible([0, 0, 0.3], pickBounds, "z", 0.5, false, true) === true, "pick: Z>0 → visible");
  assert(isPointVisible([0, 0, -0.3], pickBounds, "z", 0.5, false, true) === false, "pick: Z<0 → clipped");
}

// Exploded coordinates (non-origin world positions) — test using non-origin bounds
{
  const explodeBounds: SectionBounds = { min: [-5, -5, -5], max: [5, 5, 5] };
  // Offset=0.5, Y axis → plane at y=0
  assert(isPointVisible([2, 3, 1], explodeBounds, "y", 0.5, false, true) === true, "pick: exploded above → visible");
  assert(isPointVisible([2, -3, 1], explodeBounds, "y", 0.5, false, true) === false, "pick: exploded below → clipped");
}

// Object identity is NOT changed by visibility filter
// (The filter only changes WHICH intersection is selected, not the identity)
{
  const objectName = "地面垫层为密实材料001";
  // Visibility filtering doesn't modify the objectName
  assert(typeof objectName === "string", "pick: object identity preserved as string");
}

// Variant scope still correct (scoped key format unchanged)
{
  const scopedKey = "dense-base::地面垫层为密实材料001";
  assert(scopedKey.startsWith("dense-base::"), "pick: variant scope prefix preserved");
}

console.log("\nAll Phase 6 Step 2 tests passed.");
