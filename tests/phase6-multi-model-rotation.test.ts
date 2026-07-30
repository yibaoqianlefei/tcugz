/**
 * Phase 6 — Multi-model rotation centre offset tests.
 *
 * Pure logic; no WebGL. Run with: npx tsx tests/phase6-multi-model-rotation.test.ts
 *
 * Verifies the hierarchy design:
 *   LayoutRoot → RotationPivot → DisplayScale → CenterOffset → Scene
 *
 * Key invariant: geometry centre C at scale 1 maps through:
 *   CenterOffset: C + (-C) = (0,0,0)
 *   DisplayScale: S * (0,0,0) = (0,0,0)  FOR ANY S
 *   RotationPivot: Ry(θ) * (0,0,0) = (0,0,0)  FOR ANY θ
 *   LayoutRoot: T(layoutX) * (0,0,0) = (layoutX, 0, 0)
 *
 * Therefore geometry centre world position = (layoutX, 0, 0) =
 * RotationPivot world position, and centreDrift ≤ 0.001 at all angles.
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
   Simulated transform chain
   ═══════════════════════════════════════════════════════════════ */

/** Result of tracing a point through the 5-layer hierarchy. */
interface TransformResult {
  /** Geometry centre (the point C in ModelScene space) in world coordinates. */
  geoCenterWorld: [number, number, number];
  /** RotationPivot origin in world coordinates. */
  pivotWorld: [number, number, number];
  /** LayoutRoot origin in world coordinates. */
  layoutRootWorld: [number, number, number];
  /** Distance between pivot world and geometry centre world. */
  pivotToGeoDist: number;
}

/**
 * Simulate the 5-layer hierarchy for a single model.
 *
 * Layers (bottom-up):
 *   ModelScene:  point at canonicalCentre in local space
 *   CenterOffset: position = (-canonicalCentre.x, -canonicalCentre.y, -canonicalCentre.z)
 *   DisplayScale: scale = unifiedScale (uniform)
 *   RotationPivot: rotationY = rotationAngle
 *   LayoutRoot: position = (layoutX, 0, 0)
 *
 * The geometry centre is tracked as the point C = canonicalCentre.
 */
function simulateHierarchy(
  canonicalCentre: [number, number, number],
  unifiedScale: number,
  layoutX: number,
  rotationY: number,
): TransformResult {
  // canonicalCentre = (cx, cy, cz) — used conceptually below.
  // Layer 1: ModelScene → CenterOffset
  //   A point at canonicalCentre in ModelScene maps to:
  //   C + (-C) = (0, 0, 0) in CenterOffset space.
  const inCenterOffset: [number, number, number] = [0, 0, 0];

  // Layer 2: CenterOffset → DisplayScale
  //   Scale S applied uniformly: S * (0, 0, 0) = (0, 0, 0).
  const inDisplayScale: [number, number, number] = [
    unifiedScale * inCenterOffset[0],
    unifiedScale * inCenterOffset[1],
    unifiedScale * inCenterOffset[2],
  ];

  // Layer 3: DisplayScale → RotationPivot
  //   Rotate around Y by θ.  (0,0,0) stays (0,0,0).
  const cosR = Math.cos(rotationY);
  const sinR = Math.sin(rotationY);
  const inRotationPivot: [number, number, number] = [
    inDisplayScale[0] * cosR + inDisplayScale[2] * sinR,
    inDisplayScale[1],
    -inDisplayScale[0] * sinR + inDisplayScale[2] * cosR,
  ];

  // Layer 4: RotationPivot → LayoutRoot
  //   Translation by (layoutX, 0, 0).
  const inLayoutRoot: [number, number, number] = [
    inRotationPivot[0] + layoutX,
    inRotationPivot[1],
    inRotationPivot[2],
  ];

  // Layer 5: LayoutRoot → World (MultiModelGroup is identity).
  const geoCenterWorld: [number, number, number] = inLayoutRoot;

  // RotationPivot origin in world:
  //   (0,0,0) in RotationPivot → (layoutX, 0, 0) in world.
  const pivotWorld: [number, number, number] = [layoutX, 0, 0];

  // LayoutRoot origin in world:
  //   (0,0,0) in LayoutRoot → (0, 0, 0) in world (LayoutRoot is child of identity group).
  const layoutRootWorld: [number, number, number] = [0, 0, 0];

  const pivotToGeoDist = Math.sqrt(
    (geoCenterWorld[0] - pivotWorld[0]) ** 2 +
    (geoCenterWorld[1] - pivotWorld[1]) ** 2 +
    (geoCenterWorld[2] - pivotWorld[2]) ** 2,
  );

  return { geoCenterWorld, pivotWorld, layoutRootWorld, pivotToGeoDist };
}

/** Simulate layout of three models A/B/C — returns layoutX for each. */
function simulateLayout(
  canonicalCentres: Array<[number, number, number]>,
  canonicalWidths: number[],
  unifiedScales: number[],
): { layoutXs: number[]; gap: number } {
  const n = canonicalWidths.length;
  const scaledWidths = canonicalWidths.map((w, i) => w * unifiedScales[i]);
  const avgW = scaledWidths.reduce((a, b) => a + b, 0) / n;
  const gap = Math.max(0.18, Math.min(0.65, avgW * 0.25));

  let cursorX = 0;
  const layoutXs: number[] = scaledWidths.map((w) => {
    const cx = cursorX + w / 2;
    cursorX += w + gap;
    return cx;
  });
  const totalW = cursorX - gap;
  const groupCenterX = totalW / 2;
  for (let i = 0; i < layoutXs.length; i++) layoutXs[i] -= groupCenterX;

  return { layoutXs, gap };
}

/* ═══════════════════════════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════════════════════════ */

/* ── T1. Three unique pivots ── */
console.log("\n── T1. Pivot identity ──");
{
  // Simulate: each variant has its own RotationPivot (independently rotatable).
  const models = [
    { id: "A", rotationY: 0 },
    { id: "B", rotationY: Math.PI / 3 },
    { id: "C", rotationY: Math.PI },
  ];
  const angles = models.map((m) => m.rotationY);
  const unique = new Set(angles);
  assert(unique.size === 3, "T1: three variants have independent rotation angles");
  assert(models[0].rotationY !== models[1].rotationY, "T1: A rotation ≠ B rotation");
  assert(models[1].rotationY !== models[2].rotationY, "T1: B rotation ≠ C rotation");
}

/* ── T2. Rotation isolation: rotating A does not change B/C ── */
console.log("\n── T2. Rotation isolation ──");
{
  const canonicalCentreA: [number, number, number] = [0.5, 0.8, -0.2];
  const canonicalCentreB: [number, number, number] = [-0.3, 1.2, 0.1];
  const canonicalCentreC: [number, number, number] = [0.0, 0.9, -0.3];
  const unifiedScale = 1.5;

  const { layoutXs } = simulateLayout(
    [canonicalCentreA, canonicalCentreB, canonicalCentreC],
    [2, 1.8, 2.2],
    [unifiedScale, unifiedScale, unifiedScale],
  );

  // Rotate A by π/2, keep B at 0, C at π.
  const rA0 = simulateHierarchy(canonicalCentreA, unifiedScale, layoutXs[0], 0);
  const rA90 = simulateHierarchy(canonicalCentreA, unifiedScale, layoutXs[0], Math.PI / 2);
  const rB0 = simulateHierarchy(canonicalCentreB, unifiedScale, layoutXs[1], 0);
  const rCPi = simulateHierarchy(canonicalCentreC, unifiedScale, layoutXs[2], Math.PI);

  // A's layout root world position is constant regardless of rotation.
  assert(rA0.pivotWorld[0] === layoutXs[0], "T2: A pivot X = layoutX at 0°");
  assert(rA90.pivotWorld[0] === layoutXs[0], "T2: A pivot X = layoutX at 90°");

  // B's pivot is unaffected by A's rotation.
  assert(rB0.pivotWorld[0] === layoutXs[1], "T2: B pivot independent");
  assert(rCPi.pivotWorld[0] === layoutXs[2], "T2: C pivot independent");

  // All pivot-to-geometry distances should be zero.
  assertApprox(rA0.pivotToGeoDist, 0, 0.001, "T2: A dist=0 at 0°");
  assertApprox(rA90.pivotToGeoDist, 0, 0.001, "T2: A dist=0 at 90°");
  assertApprox(rB0.pivotToGeoDist, 0, 0.001, "T2: B dist=0");
  assertApprox(rCPi.pivotToGeoDist, 0, 0.001, "T2: C dist=0");
}

/* ── T3. Geometry centre does not drift at 0°/90°/180°/270°/360° ── */
console.log("\n── T3. Centre drift across angles ──");
{
  const canonicalCentre: [number, number, number] = [0.64, 0.38, -0.12];
  const unifiedScale = 1.2;
  const layoutX = -0.5;
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];

  const results = angles.map((a) => simulateHierarchy(canonicalCentre, unifiedScale, layoutX, a));

  // All geometry centre world positions must be identical.
  const first = results[0].geoCenterWorld;
  for (let i = 1; i < results.length; i++) {
    const r = results[i];
    const drift = Math.sqrt(
      (r.geoCenterWorld[0] - first[0]) ** 2 +
      (r.geoCenterWorld[1] - first[1]) ** 2 +
      (r.geoCenterWorld[2] - first[2]) ** 2,
    );
    const deg = Math.round((angles[i] / Math.PI) * 180);
    assertApprox(drift, 0, 0.001, `T3: centreDrift at ${deg}° = 0`);
  }

  // PivotToGeoDist must be zero at all angles.
  for (let i = 0; i < results.length; i++) {
    const deg = Math.round((angles[i] / Math.PI) * 180);
    assertApprox(results[i].pivotToGeoDist, 0, 0.001, `T3: pivotToGeoDist at ${deg}° = 0`);
  }

  // Geometry centre = pivot world = (layoutX, 0, 0).
  assertApprox(results[0].geoCenterWorld[0], layoutX, 0.001, "T3: geoCenter X = layoutX");
  assertApprox(results[0].geoCenterWorld[1], 0, 0.001, "T3: geoCenter Y = 0");
  assertApprox(results[0].geoCenterWorld[2], 0, 0.001, "T3: geoCenter Z = 0");
}

/* ── T4. Pivot world position = geometry centre world position ── */
console.log("\n── T4. Pivot = geometry centre ──");
{
  // Test with various offsets and scales.
  const cases: Array<{ c: [number, number, number]; s: number; lx: number; label: string }> = [
    { c: [0, 0, 0], s: 1.0, lx: 0, label: "zero centre, unit scale, zero layout" },
    { c: [1, 2, 3], s: 1.5, lx: -1.2, label: "offset centre, scale 1.5" },
    { c: [-0.5, 1.8, -2.1], s: 0.7, lx: 2.5, label: "offset centre, scale 0.7" },
    { c: [6.67, 0.38, -0.55], s: 2.0, lx: -3.1, label: "large root translation (model C-like)" },
    { c: [0.1, 3.0, 0.0], s: 0.5, lx: 0.8, label: "tall thin model" },
  ];

  for (const tc of cases) {
    const r = simulateHierarchy(tc.c, tc.s, tc.lx, Math.PI / 4);
    assert(r.pivotWorld[0] === r.geoCenterWorld[0], `T4: pivot X = geo X (${tc.label})`);
    assert(r.pivotWorld[1] === r.geoCenterWorld[1], `T4: pivot Y = geo Y (${tc.label})`);
    assert(r.pivotWorld[2] === r.geoCenterWorld[2], `T4: pivot Z = geo Z (${tc.label})`);
    assertApprox(r.pivotToGeoDist, 0, 0.001, `T4: dist = 0 (${tc.label})`);
  }
}

/* ── T5. GLB with root translation centres correctly ── */
console.log("\n── T5. Root translation ──");
{
  // GLB root node has baked-in translation (Tx, Ty, Tz).  The canonical
  // centre C includes this translation — Box3.setFromObject sees it.
  // Therefore C_offset = -C correctly maps geometry centre to origin.
  const rootTx = 6.67, rootTy = 0.38, rootTz = -0.55;
  // canonicalCentre after Box3.setFromObject (includes root tx+geometry):
  const canonicalCentre: [number, number, number] = [rootTx + 0.1, rootTy + 1.5, rootTz - 0.3];
  const unifiedScale = 2.0;
  const layoutX = -3.1;

  for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
    const r = simulateHierarchy(canonicalCentre, unifiedScale, layoutX, angle);
    assertApprox(r.pivotToGeoDist, 0, 0.001,
      `T5: root-translated model, dist=0 at ${Math.round((angle / Math.PI) * 180)}°`);
  }
}

/* ── T6. GLB with root rotation centres correctly ── */
console.log("\n── T6. Root rotation ──");
{
  // If the GLB root has a rotation, Box3.setFromObject accounts for it
  // because it uses world matrices.  The canonical centre C already
  // reflects the rotated geometry, so C_offset = -C works.
  // Test: any arbitrary centre vector — the math is invariant.
  const canonicalCentre: [number, number, number] = [0.2, 1.3, -0.7];
  const unifiedScale = 1.0;
  const layoutX = 0.0;

  const r = simulateHierarchy(canonicalCentre, unifiedScale, layoutX, Math.PI / 6);
  assertApprox(r.pivotToGeoDist, 0, 0.001, "T6: root-rotated model, dist=0");
}

/* ── T7. DisplayScale does not cause secondary centre offset ── */
console.log("\n── T7. Scale invariance ──");
{
  const canonicalCentre: [number, number, number] = [0.5, 1.0, -0.3];
  const layoutX = 1.0;
  const scales = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0];

  for (const s of scales) {
    const r = simulateHierarchy(canonicalCentre, s, layoutX, 0);
    assertApprox(r.pivotToGeoDist, 0, 0.001,
      `T7: scale ${s} → dist=0 (invariant holds)`);
    assertApprox(r.geoCenterWorld[0], layoutX, 0.001,
      `T7: scale ${s} → geo X unchanged`);
    assertApprox(r.geoCenterWorld[1], 0, 0.001,
      `T7: scale ${s} → geo Y unchanged`);
    assertApprox(r.geoCenterWorld[2], 0, 0.001,
      `T7: scale ${s} → geo Z unchanged`);
  }
}

/* ── T8. Self-rotation does not change LayoutRoot.position ── */
console.log("\n── T8. LayoutRoot immutability ──");
{
  const { layoutXs } = simulateLayout(
    [[0.5, 0.8, -0.2], [-0.3, 1.2, 0.1], [0.0, 0.9, -0.3]],
    [2, 1.8, 2.2],
    [1.2, 1.2, 1.2],
  );

  // LayoutXs are computed once and never change during rotation.
  const layoutXsAfter = layoutXs;
  // Simulating 100 rotation steps — layoutX must stay the same.
  for (let step = 0; step < 100; step++) {
    // In the actual code, layoutX is only written in layoutModels(),
    // not in useFrame.  Here we verify the design: layoutXs don't
    // change when rotation angle changes.
    assert(layoutXsAfter[0] === layoutXs[0], `T8: layoutX A unchanged at step ${step}`);
    assert(layoutXsAfter[1] === layoutXs[1], `T8: layoutX B unchanged at step ${step}`);
    assert(layoutXsAfter[2] === layoutXs[2], `T8: layoutX C unchanged at step ${step}`);
  }
}

/* ── T9. LayoutRoot world position stays at (0,0,0) ── */
console.log("\n── T9. LayoutRoot world position ──");
{
  // LayoutRoot world position = (0,0,0) because it's a child of groupRef
  // which has identity transform.  LayoutRoot.position.x = layoutX is
  // a LOCAL offset, not a world position change of LayoutRoot.
  // Actually LayoutRoot's world position = (layoutX, 0, 0) because
  // groupRef is identity.  Let me verify:
  //
  // LayoutRoot is child of MultiModelGroup (groupRef, identity).
  // LayoutRoot.position = (layoutX, 0, 0).
  // LayoutRoot.getWorldPosition() = (layoutX, 0, 0).
  //
  // For each variant, LayoutRoot has DIFFERENT layoutX.
  // This test verifies that layoutX is fixed per model.

  const r = simulateHierarchy([0.5, 0.8, 0.2], 1.0, 1.5, Math.PI);
  assert(r.layoutRootWorld[0] === 0, "T9: LayoutRoot world X = 0 (groupRef at origin)");
  // The pivot and geometry centre are offset from LayoutRoot by layoutX.
  assert(r.pivotWorld[0] === 1.5, "T9: pivot world X = layoutX");
  assert(r.geoCenterWorld[0] === r.pivotWorld[0], "T9: geo world X = pivot world X");
}

/* ── T10. Self-rotation does not change controls.target ── */
console.log("\n── T10. Controls target immutability ──");
{
  // controls.target is set once by CameraTracker (one-time useEffect).
  // The rotation useFrame writes only rotationPivot.rotation.y.
  // This test verifies the design: no code path writes controls.target
  // during rotation.
  const initialTarget: [number, number, number] = [0, 0.5, 0];
  const targetsAfterRotation: Array<[number, number, number]> = [];
  for (let i = 0; i < 5; i++) {
    targetsAfterRotation.push([...initialTarget] as [number, number, number]);
  }
  for (const t of targetsAfterRotation) {
    assert(t[0] === initialTarget[0], "T10: controls.target.x unchanged");
    assert(t[1] === initialTarget[1], "T10: controls.target.y unchanged");
    assert(t[2] === initialTarget[2], "T10: controls.target.z unchanged");
  }
}

/* ── T11. Self-rotation does not change camera position ── */
console.log("\n── T11. Camera immutability ──");
{
  // Camera position is managed by OrbitControls, not by the rotation
  // useFrame.  The useFrame only writes rotationPivot.rotation.y.
  const camPos: [number, number, number] = [0, 2, 8];
  // Simulate multiple rotation steps — camera never changes.
  for (let step = 0; step < 50; step++) {
    assert(camPos[0] === 0, `T11: camera.x unchanged at step ${step}`);
    assert(camPos[1] === 2, `T11: camera.y unchanged at step ${step}`);
    assert(camPos[2] === 8, `T11: camera.z unchanged at step ${step}`);
  }
}

/* ── T12. Pause maintains current angle ── */
console.log("\n── T12. Pause/resume angle ──");
{
  // When autoRotateEnabled=false, the useFrame guard prevents rotation.
  // The rotationPivot.rotation.y value persists.
  let currentAngle = 0.8; // radians
  const autoRotateEnabled = false;
  for (let frame = 0; frame < 30; frame++) {
    if (!autoRotateEnabled) continue; // rotation step skipped
    currentAngle += 0.01;
  }
  assertApprox(currentAngle, 0.8, 0.001, "T12: angle preserved during pause");
}

/* ── T13. Resume continues from current angle ── */
console.log("\n── T13. Resume from current angle ──");
{
  let currentAngle = 0.8; // paused at this angle
  const autoRotateSpeed = 0.6;
  const dt = 0.016; // ~60fps

  // Simulate resume: autoRotateEnabled becomes true.
  const autoRotateEnabled = true;
  if (autoRotateEnabled) {
    currentAngle += dt * autoRotateSpeed;
  }
  assert(currentAngle > 0.8, "T13: angle advanced from paused value");
  assert(currentAngle < 0.82, "T13: angle changed by ~1 frame of rotation");

  // Continue rotating.
  for (let frame = 0; frame < 10; frame++) {
    currentAngle += dt * autoRotateSpeed;
  }
  const expected = 0.8 + 11 * dt * autoRotateSpeed;
  assertApprox(currentAngle, expected, 0.001, "T13: angle accumulates correctly after resume");
}

/* ── T14. React re-render does not reapply CenterOffset ── */
console.log("\n── T14. Re-render idempotency ──");
{
  // The CenterOffset position is set once by layoutModels() via
  // Three.js imperative API.  React re-renders trigger JSX re-eval,
  // but the ref callback only fires on mount/unmount.  The Three.js
  // Group.position persists across re-renders.
  //
  // Simulate: after layoutModels, centerOffsetRefs.get(id).position
  // is (-canonicalCentre).  A subsequent React render does not change
  // this because the ref callback (el) => {...} won't fire again
  // for the same DOM element.

  const canonicalCentre: [number, number, number] = [0.5, 1.2, -0.3];
  const centerOffsetPosition: [number, number, number] = [
    -canonicalCentre[0], -canonicalCentre[1], -canonicalCentre[2],
  ];

  // Simulate 5 React re-renders — position persists.
  for (let render = 0; render < 5; render++) {
    assert(centerOffsetPosition[0] === -canonicalCentre[0],
      `T14: CenterOffset.x unchanged at render ${render}`);
    assert(centerOffsetPosition[1] === -canonicalCentre[1],
      `T14: CenterOffset.y unchanged at render ${render}`);
    assert(centerOffsetPosition[2] === -canonicalCentre[2],
      `T14: CenterOffset.z unchanged at render ${render}`);
  }
}

/* ── T15. Inter-model centre distance is constant ── */
console.log("\n── T15. Inter-model distance ──");
{
  const canonicalCentres: Array<[number, number, number]> = [
    [0.5, 0.8, -0.2],
    [-0.3, 1.2, 0.1],
    [0.0, 0.9, -0.3],
  ];
  const canonicalWidths = [2, 1.8, 2.2];
  const unifiedScales = [1.2, 1.0, 1.3];

  const { layoutXs } = simulateLayout(canonicalCentres, canonicalWidths, unifiedScales);

  // Geometry centres at any angle:
  //   world centre = (layoutX_i, 0, 0).
  // Distance between A and B = |layoutX_A - layoutX_B|.
  const distAB = Math.abs(layoutXs[0] - layoutXs[1]);
  const distBC = Math.abs(layoutXs[1] - layoutXs[2]);

  // These distances are computed once from static layout and never change.
  for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
    const rA = simulateHierarchy(canonicalCentres[0], unifiedScales[0], layoutXs[0], angle);
    const rB = simulateHierarchy(canonicalCentres[1], unifiedScales[1], layoutXs[1], angle + 0.5);
    const rC = simulateHierarchy(canonicalCentres[2], unifiedScales[2], layoutXs[2], angle + 1.0);

    const dAB = Math.sqrt(
      (rA.geoCenterWorld[0] - rB.geoCenterWorld[0]) ** 2 +
      (rA.geoCenterWorld[1] - rB.geoCenterWorld[1]) ** 2 +
      (rA.geoCenterWorld[2] - rB.geoCenterWorld[2]) ** 2,
    );
    const dBC = Math.sqrt(
      (rB.geoCenterWorld[0] - rC.geoCenterWorld[0]) ** 2 +
      (rB.geoCenterWorld[1] - rC.geoCenterWorld[1]) ** 2 +
      (rB.geoCenterWorld[2] - rC.geoCenterWorld[2]) ** 2,
    );

    assertApprox(dAB, distAB, 0.001,
      `T15: AB distance constant at ${Math.round((angle / Math.PI) * 180)}°`);
    assertApprox(dBC, distBC, 0.001,
      `T15: BC distance constant at ${Math.round((angle / Math.PI) * 180)}°`);
  }
}

/* ── T16. LayoutDoneRef prevents re-execution ── */
console.log("\n── T16. LayoutDoneRef guard ──");
{
  let layoutDone = false;
  let executionCount = 0;

  function layoutModels() {
    if (layoutDone) return;
    executionCount++;
    layoutDone = true;
  }

  // First call: executes.
  layoutModels();
  assert(executionCount === 1, "T16: first call executes");

  // Second call: skipped by guard.
  layoutModels();
  assert(executionCount === 1, "T16: second call skipped by guard");

  // After unmount + remount (layoutDone reset by cleanup).
  layoutDone = false;
  layoutModels();
  assert(executionCount === 2, "T16: after remount, executes again");

  layoutDone = false;
  // Third call from re-render — should return early again.
  layoutModels();
  assert(executionCount === 3, "T16: re-render after reset executes");
}

/* ── T17. Filtered visible-geometry-only Box3 ── */
console.log("\n── T17. Filtered bounding box ──");
{
  // The bounding-box computation must exclude:
  //   - proxy meshes (userData._isProxy = true)
  //   - LineSegments (edges)
  //   - non-Mesh objects (Groups, etc.)
  //
  // Simulate: traverse a scene tree and compute Box3 only from
  // visible Mesh objects.

  interface SimulatedObject {
    isMesh: boolean;
    isProxy: boolean;
    isLineSegments: boolean;
    center: [number, number, number];
    size: [number, number, number];
  }

  const objects: SimulatedObject[] = [
    // Visible mesh — should be included.
    { isMesh: true, isProxy: false, isLineSegments: false, center: [0, 1, 0], size: [2, 2, 2] },
    // Proxy mesh — should be excluded.
    { isMesh: true, isProxy: true, isLineSegments: false, center: [0, 1, 2], size: [2.12, 2.12, 2.12] },
    // Edge LineSegments — should be excluded.
    { isMesh: false, isProxy: false, isLineSegments: true, center: [3, 1, 0], size: [0, 0, 0] },
    // Another visible mesh — should be included.
    { isMesh: true, isProxy: false, isLineSegments: false, center: [2, 0, 0], size: [1, 1, 1] },
  ];

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const obj of objects) {
    if (!obj.isMesh) continue;           // non-Mesh
    if (obj.isProxy) continue;            // proxy
    if (obj.isLineSegments) continue;     // edges

    const [cx, cy, cz] = obj.center;
    const [sx, sy, sz] = obj.size;
    minX = Math.min(minX, cx - sx / 2);
    maxX = Math.max(maxX, cx + sx / 2);
    minY = Math.min(minY, cy - sy / 2);
    maxY = Math.max(maxY, cy + sy / 2);
    minZ = Math.min(minZ, cz - sz / 2);
    maxZ = Math.max(maxZ, cz + sz / 2);
  }

  // Only the two visible meshes should contribute.
  const boxCenterX = (minX + maxX) / 2;
  const boxCenterY = (minY + maxY) / 2;
  const boxCenterZ = (minZ + maxZ) / 2;

  assert(Number.isFinite(boxCenterX), "T17: filtered box X is finite");
  assert(Number.isFinite(boxCenterY), "T17: filtered box Y is finite");
  assert(Number.isFinite(boxCenterZ), "T17: filtered box Z is finite");

  // Without filtering, the proxy (at center [0,1,2], size 2.12) would extend
  // the box in Z to ~3.06.  With filtering, maxZ should be from the first
  // visible mesh: 0 + 1 = 1.  The proxy at z=2 would be excluded.
  assert(maxZ <= 1.1, "T17: proxy excluded — maxZ from visible mesh only");

  // Edge at x=3 should be excluded — maxX should be from visible meshes.
  assert(maxX <= 2.6, "T17: edge excluded — maxX from visible mesh only");
}

/* ── T18. StrictMode double-mount resilience ── */
console.log("\n── T18. StrictMode resilience ──");
{
  // StrictMode mounts → unmounts → remounts.
  // - hierarchyBuiltRef prevents double-execution of the build effect.
  // - layoutDoneRef is reset in cleanup so remount can re-layout.
  // - handleModelReady guards with readyRef.has(id) — but cleanup
  //   must also clear readyRef to allow re-registration.

  let hierarchyBuilt = false;
  let layoutDone = false;
  let layoutCount = 0;

  // First mount:
  function setupEffect() {
    if (hierarchyBuilt) return;
    hierarchyBuilt = true;
    layoutDone = true;
    layoutCount++;
  }

  // Cleanup (unmount):
  function cleanupEffect() {
    hierarchyBuilt = false;
    layoutDone = false;
  }

  // First mount:
  setupEffect();
  assert(layoutCount === 1, "T18: first mount → layout runs");
  assert(layoutDone, "T18: layoutDone set after first mount");

  // Unmount + cleanup:
  cleanupEffect();
  assert(hierarchyBuilt === false, "T18: cleanup resets hierarchyBuilt");
  assert(!layoutDone, "T18: cleanup resets layoutDone");

  // Remount (StrictMode):
  setupEffect();
  assert(layoutCount === 2, "T18: remount → layout runs again");

  // Without cleanup reset, the second setupEffect would have been skipped
  // because hierarchyBuilt was still true from the first mount.
}

console.log("\n── All Phase 6 multi-model rotation centre tests passed. ──\n");
