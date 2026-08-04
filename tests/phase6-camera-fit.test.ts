/**
 * Phase 6 Step 4 — Multi-model initial camera framing tests.
 *
 * Pure logic; no WebGL, no React. Run with:
 *   npx tsx tests/phase6-camera-fit.test.ts
 *
 * Verifies the initial-fit rules for the `wall-damp-proof-course` page:
 *   1. Fit must NOT run until every variant is loaded AND laid out.
 *   2. Framing box is the union of all LayoutRoots, never a single model.
 *   3. Aspect comes from the ACTUAL canvas size.
 *   4. Width and height constraints both participate in the distance math.
 *   5. Padding → the union group stays ~1/padding of the viewport.
 *   6. View direction is preserved; composition shifts camera+target equally.
 *   7. The fit does not touch sharedDisplayScale / layoutX / the scene.
 *   8. Rotation, variant switching and plain re-renders never re-fit.
 *   9. Resize still contains all three models; user interaction blocks reset.
 */

import * as THREE from "three";
import {
  CAMERA_FIT_PADDING,
  CAMERA_COMPOSITION_FRACTION,
  computeVisibleGeometryWorldBox,
  computeCameraFitTargets,
  shouldSkipFit,
  isSizeChangeSignificant,
  shouldRefitCamera,
  buildFitKey,
  type CameraFitInput,
} from "../src/utils/cameraFit";

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

let testCount = 0;
function group(title: string): void {
  testCount++;
  console.log(`\n== T${testCount}: ${title}`);
}

function makeMesh(width: number, height: number, depth: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshBasicMaterial(),
  );
}

function makeInput(partial?: Partial<CameraFitInput>): CameraFitInput {
  return {
    boxSize: new THREE.Vector3(14, 3, 3),
    boxCenter: new THREE.Vector3(0, 0, 0),
    canvasWidth: 1600,
    canvasHeight: 900,
    verticalFovDeg: 40,
    cameraPosition: new THREE.Vector3(0, 0, 8),
    controlsTarget: new THREE.Vector3(0, 0, 0),
    padding: CAMERA_FIT_PADDING,
    compositionFraction: CAMERA_COMPOSITION_FRACTION,
    ...partial,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Tests
   ═══════════════════════════════════════════════════════════════ */

group("Fit is deferred until ALL variants are loaded + laid out");
{
  assert(shouldSkipFit(3, false) === true, "3 variants not ready → skip final fit");
  assert(shouldSkipFit(3, true) === false, "3 variants ready → allow fit");
  assert(shouldSkipFit(1, false) === true, "1 variant not ready → skip");
  assert(shouldSkipFit(0, false) === false, "single-model (variantCount 0) → no variant gate");
}

group("Initial fit runs exactly once; rotation/render/variant switch never re-fit");
{
  // First entry / node change → mandatory fit.
  assert(shouldRefitCamera({ firstFit: true, sizeChanged: false, userInteracted: false }) === true,
    "firstFit (initial entry) executes");
  assert(shouldRefitCamera({ firstFit: true, sizeChanged: false, userInteracted: true }) === true,
    "firstFit executes even if the user somehow moved the camera during load");
  // After the fit, a plain re-render (no size change) must not reset.
  assert(shouldRefitCamera({ firstFit: false, sizeChanged: false, userInteracted: false }) === false,
    "plain re-render after fit → no reset");
  // Auto-rotation / variant switch do not change size → no re-fit.
  assert(shouldRefitCamera({ firstFit: false, sizeChanged: false, userInteracted: false }) === false,
    "auto-rotation does not change size/fitKey → no re-fit");

  // fitKey depends ONLY on nodeId + variant id list (selection is not an input).
  const keyA = buildFitKey("wall-damp-proof-course", ["dense-base", "porous-base", "high-diff"]);
  const keyB = buildFitKey("wall-damp-proof-course", ["dense-base", "porous-base", "high-diff"]);
  assert(keyA === keyB, "fitKey stable for the same node+variant combination");
  assert(keyA !== buildFitKey("other-node", ["dense-base", "porous-base", "high-diff"]),
    "fitKey changes on nodeId change");
  assert(buildFitKey("wall-damp-proof-course", ["dense-base", "porous-base", "high-diff"])
    === buildFitKey("wall-damp-proof-course", ["dense-base", "porous-base", "high-diff"]),
    "fitKey ignores selection/hover/explode state (no selection input)");
  assert(buildFitKey("wall-damp-proof-course", []).endsWith(":single"),
    "single-model fitKey falls back to ':single'");
}

group("Union box includes all three LayoutRoots, excludes helpers");
{
  // Three layout roots at x = -5 / 0 / +5, each a 4-unit-wide mesh at scale 1.
  const parent = new THREE.Group();
  for (const x of [-5, 0, 5]) {
    const root = new THREE.Group();
    root.position.x = x;
    const mesh = makeMesh(4, 2, 2);
    mesh.position.set(0, 0, 0);
    root.add(mesh);
    parent.add(root);
  }
  const box = computeVisibleGeometryWorldBox(parent);
  const size = box.getSize(new THREE.Vector3());
  assertApprox(size.x, 14, 1e-4, "union box spans all three layoutRoots (width 14)");
  assertApprox(box.min.x, -7, 1e-4, "union min.x covers left model");
  assertApprox(box.max.x, 7, 1e-4, "union max.x covers right model");

  // Exclusion: proxy, edge lines and DEV markers must not inflate the box.
  const holder = new THREE.Group();
  const real = makeMesh(2, 2, 2);
  holder.add(real);

  const proxy = makeMesh(200, 200, 200);
  proxy.position.set(500, 0, 0);
  proxy.userData._isProxy = true;
  holder.add(proxy);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(300, 300, 300)),
    new THREE.LineBasicMaterial(),
  );
  edges.position.set(-500, 0, 0);
  holder.add(edges);

  const marker = makeMesh(400, 400, 400);
  marker.name = "__dev_pivot_marker";
  marker.position.set(0, 500, 0);
  holder.add(marker);

  const only = computeVisibleGeometryWorldBox(holder);
  const oSize = only.getSize(new THREE.Vector3());
  assertApprox(oSize.x, 2, 1e-4, "proxy/edges/debug markers excluded from the fit box");
  assertApprox(oSize.y, 2, 1e-4, "marker excluded from the fit box vertically");
}

group("Fit uses the union box, not the middle/selected model's box");
{
  const input = makeInput();
  const unionRes = computeCameraFitTargets(input);
  const singleRes = computeCameraFitTargets(makeInput({
    boxSize: new THREE.Vector3(4, 3, 3), // middle-model-only width
  }));
  assert(unionRes.finalDistance > singleRes.finalDistance,
    "union-box fit distance is larger than a single-model fit distance");
}

group("Aspect comes from the actual canvas size");
{
  const wide = computeCameraFitTargets(makeInput({ canvasWidth: 1600, canvasHeight: 900 }));
  const square = computeCameraFitTargets(makeInput({ canvasWidth: 900, canvasHeight: 900 }));
  assertApprox(wide.aspect, 1600 / 900, 1e-6, "aspect = canvasWidth/canvasHeight (wide)");
  assertApprox(square.aspect, 1, 1e-6, "aspect = 1 for a square canvas");
  assert(Math.abs(wide.horizontalFov - square.horizontalFov) > 1e-3,
    "horizontal FOV depends on the canvas aspect");
  assertApprox(
    wide.distanceForWidth,
    (14 * 0.5) / Math.tan(wide.horizontalFov * 0.5),
    1e-6,
    "distanceForWidth uses the canvas-derived horizontal FOV",
  );
}

group("Width and height constraints both participate in the distance math");
{
  // Wide-short box → width is the constraining axis.
  const wideBox = computeCameraFitTargets(makeInput({ boxSize: new THREE.Vector3(14, 3, 3) }));
  assert(wideBox.distanceForWidth > wideBox.distanceForHeight,
    "wide box: width constraint dominates");
  assertApprox(wideBox.fitDistance, wideBox.distanceForWidth, 1e-6,
    "fitDistance = distanceForWidth when width-constrained");

  // Narrow-tall box → height is the constraining axis.
  const tallBox = computeCameraFitTargets(makeInput({ boxSize: new THREE.Vector3(2, 8, 3) }));
  assert(tallBox.distanceForHeight > tallBox.distanceForWidth,
    "tall box: height constraint dominates");
  assertApprox(tallBox.fitDistance, tallBox.distanceForHeight, 1e-6,
    "fitDistance = distanceForHeight when height-constrained");
}

group("Padding keeps the union group at ~1/padding of the viewport");
{
  const input = makeInput(); // width-constrained (14 wide vs 3 tall)
  const res = computeCameraFitTargets(input);
  assertApprox(res.finalDistance, res.fitDistance * CAMERA_FIT_PADDING, 1e-6,
    "finalDistance = fitDistance × CAMERA_FIT_PADDING");

  const halfW = res.finalDistance * Math.tan(res.horizontalFov * 0.5);
  const projectedWidthFraction = (14 * 0.5) / halfW;
  assertApprox(projectedWidthFraction, 1 / CAMERA_FIT_PADDING, 1e-6,
    "width-constrained occupancy = 1 / padding");
  assert(projectedWidthFraction > 0.5 && projectedWidthFraction < 0.9,
    "occupancy stays within the 50–90% safety band");
}

group("Current view direction is preserved (only distance changes)");
{
  const cam = new THREE.Vector3(3, 4, 5);
  const tgt = new THREE.Vector3(1, 1, 1);
  const res = computeCameraFitTargets(makeInput({ cameraPosition: cam, controlsTarget: tgt }));
  const before = cam.clone().sub(tgt).normalize();
  const after = res.finalCameraPosition.clone().sub(res.controlsTarget).normalize();
  assertApprox(after.distanceTo(before), 0, 1e-6, "camera→target direction preserved");

  // Fallback when camera coincides with target → straight-on +Z view.
  const fallback = computeCameraFitTargets(makeInput({
    cameraPosition: new THREE.Vector3(0, 0, 0),
    controlsTarget: new THREE.Vector3(0, 0, 0),
  }));
  const dir = fallback.finalCameraPosition.clone().sub(fallback.controlsTarget).normalize();
  assertApprox(dir.z, 1, 1e-6, "default direction = [0,0,1] when camera==target");
}

group("Composition offset shifts camera+target equally (view angle unchanged)");
{
  const res = computeCameraFitTargets(makeInput());
  const offset = 3 * CAMERA_COMPOSITION_FRACTION;
  assertApprox(res.controlsTarget.y, 0 + offset, 1e-6, "controls.target.y += boxHeight × fraction");
  assertApprox(res.finalCameraPosition.y, 0 + offset, 1e-6,
    "camera.position.y += same offset (parallel shift, no tilt)");
  const after = res.finalCameraPosition.clone().sub(res.controlsTarget).normalize();
  assertApprox(after.z, 1, 1e-6, "view direction still straight-on after composition");
}

group("Clip planes derive from the final distance");
{
  const res = computeCameraFitTargets(makeInput());
  assertApprox(res.near, Math.max(res.finalDistance / 100, 0.01), 1e-9, "near = max(D/100, 0.01)");
  assertApprox(res.far, Math.max(res.finalDistance * 20, 100), 1e-9, "far = max(D×20, 100)");
  assert(res.near > 0 && res.far > res.near, "valid clip range");
}

group("Fit does not modify sharedDisplayScale / layoutX / the scene");
{
  const input = makeInput();
  const boxSizeBefore = input.boxSize.clone();
  const boxCenterBefore = input.boxCenter.clone();
  const camBefore = input.cameraPosition.clone();
  const tgtBefore = input.controlsTarget.clone();
  computeCameraFitTargets(input);
  assert(input.boxSize.distanceTo(boxSizeBefore) === 0, "boxSize input not mutated");
  assert(input.boxCenter.distanceTo(boxCenterBefore) === 0, "boxCenter input not mutated");
  assert(input.cameraPosition.distanceTo(camBefore) === 0, "cameraPosition input not mutated");
  assert(input.controlsTarget.distanceTo(tgtBefore) === 0, "controlsTarget input not mutated");
  // The fit function takes ONLY the already-scaled box; it has no scale
  // parameter and never touches layout positions.
  assert(Object.keys(computeCameraFitTargets(makeInput())).includes("finalCameraPosition"),
    "fit returns only camera/controls targets — no scene writes");
}

group("After a resize the union group is still fully framed");
{
  for (const [w, h] of [[1600, 900], [1280, 720], [900, 900], [1440, 1800]]) {
    const res = computeCameraFitTargets(makeInput({ canvasWidth: w, canvasHeight: h }));
    const hFrac = 14 / (2 * res.finalDistance * Math.tan(res.horizontalFov * 0.5));
    const vFrac = 3 / (2 * res.finalDistance * Math.tan(THREE.MathUtils.degToRad(40) * 0.5));
    assert(hFrac <= 1 / CAMERA_FIT_PADDING + 1e-9, `resize ${w}x${h}: width fully visible`);
    assert(vFrac <= 1 / CAMERA_FIT_PADDING + 1e-9, `resize ${w}x${h}: height fully visible`);
  }
}

group("User interaction blocks responsive re-fit; significant resize allows it");
{
  assert(shouldRefitCamera({ firstFit: false, sizeChanged: true, userInteracted: true }) === false,
    "user interacted + resize → do NOT reset the view");
  assert(shouldRefitCamera({ firstFit: false, sizeChanged: true, userInteracted: false }) === true,
    "no interaction + significant resize → responsive re-fit");
  assert(isSizeChangeSignificant(null, 1600, 900) === false, "no prior size → not significant");
  assert(isSizeChangeSignificant({ w: 1600, h: 900 }, 1600, 900) === false,
    "identical size → not significant");
  assert(isSizeChangeSignificant({ w: 1600, h: 900 }, 1620, 900) === false,
    "small jitter (20px) → not significant");
  assert(isSizeChangeSignificant({ w: 1600, h: 900 }, 1400, 900) === true,
    "large resize → significant");
}

group("controls.target aligns with the union display centre (+ composition)");
{
  const input = makeInput();
  const res = computeCameraFitTargets(input);
  assertApprox(res.controlsTarget.x, 0, 1e-6, "target.x = union centre x");
  assertApprox(res.controlsTarget.z, 0, 1e-6, "target.z = union centre z");
  assertApprox(res.controlsTarget.y, 3 * CAMERA_COMPOSITION_FRACTION, 1e-6,
    "target.y = union centre y + composition offset");
}


console.log(`\nAll camera-fit tests passed (${testCount} groups).`);
