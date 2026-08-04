/**
 * Phase 6 Step 4 — Multi-model initial camera framing.
 *
 * Pure helpers (no React, no R3F — only three.js) so the initial-fit math
 * and gating rules can be unit-tested without a WebGL context.
 *
 * Design rules (see project_overview.md):
 *   1. The fit must NOT run until EVERY variant is loaded AND laid out.
 *   2. The framing box is the union of all three LayoutRoots' visible-geometry
 *      world AABBs at the standard pose — never a single model's box.
 *   3. Distance is derived from the perspective camera FOV + the ACTUAL
 *      canvas size, then multiplied by a safety padding.
 *   4. The current view direction is preserved (only distance changes).
 *   5. A composition offset shifts camera + target equally so the model band
 *      sits slightly below the vertical centre (upper region keeps teaching
 *      space) without changing the view angle.
 *   6. After the initial fit, re-fits are limited to significant container
 *      resizes and are blocked once the user has manually moved the camera.
 */

import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   Fit constants
   ═══════════════════════════════════════════════════════════════ */

/** Safety padding → the union group occupies ~1/padding of the viewport
 *  on the constraining axis, PLUS the near-face depth inflation of the 3D
 *  union box under the tilted view (~7.7%).  Measured on a 1040×977 canvas:
 *    1.35 → ~79.8% width   (above the 65–72% target)
 *    1.50 → ~72% width     (on target; user approved exceeding the 1.22–1.35 band) */
export const CAMERA_FIT_PADDING = 1.5;

/** Composition offset as a fraction of the union-box height.  Applied to
 *  BOTH camera.position.y and controls.target.y so the view angle is
 *  preserved while the model band is pushed below centre. */
export const CAMERA_COMPOSITION_FRACTION = 0.12;

/* ═══════════════════════════════════════════════════════════════
   Visible-geometry world AABB
   ═══════════════════════════════════════════════════════════════ */

const _fitV1 = new THREE.Vector3();
const _fitV2 = new THREE.Vector3();

/**
 * Union world AABB of the VISIBLE geometry under `root`.
 *
 * Excludes:
 *   - proxy meshes (`userData._isProxy`)
 *   - edge LineSegments (not Meshes, skipped by the Mesh guard)
 *   - DEV debug markers (`__dev_pivot_marker`, `__dev_geo_marker`)
 *
 * Uses each mesh's OWN geometry (not `Box3.expandByObject`, which recurses
 * into children and would pull in proxies/edge helpers attached to meshes).
 *
 * @param root  object whose visible geometry defines the bounds.
 * @returns a non-empty Box3 (fallback: `setFromObject` when no Mesh found).
 */
export function computeVisibleGeometryWorldBox(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (child.userData._isProxy) return;
    if (child.name === "__dev_pivot_marker" || child.name === "__dev_geo_marker") return;
    child.updateWorldMatrix(true, false);
    const geo = child.geometry;
    if (!geo) return;
    if (geo.boundingBox === null) geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (!bb) return;
    _fitV1.copy(bb.min).applyMatrix4(child.matrixWorld);
    _fitV2.copy(bb.max).applyMatrix4(child.matrixWorld);
    box.expandByPoint(_fitV1);
    box.expandByPoint(_fitV2);
  });
  if (box.isEmpty()) box.setFromObject(root);
  return box;
}

/* ═══════════════════════════════════════════════════════════════
   Fit targets
   ═══════════════════════════════════════════════════════════════ */

export interface CameraFitInput {
  /** Union box size (world units). */
  boxSize: THREE.Vector3;
  /** Union box centre (world units). */
  boxCenter: THREE.Vector3;
  /** Actual canvas pixel width. */
  canvasWidth: number;
  /** Actual canvas pixel height. */
  canvasHeight: number;
  /** Perspective vertical FOV in degrees. */
  verticalFovDeg: number;
  /** Current camera position (view direction is preserved from this). */
  cameraPosition: THREE.Vector3;
  /** Current orbit target. */
  controlsTarget: THREE.Vector3;
  /** Safety padding (default CAMERA_FIT_PADDING). */
  padding: number;
  /** Composition fraction of box height (default CAMERA_COMPOSITION_FRACTION). */
  compositionFraction: number;
}

export interface CameraFitResult {
  /** New camera position (box centre + preserved direction × finalDistance). */
  finalCameraPosition: THREE.Vector3;
  /** New orbit target (box centre + composition offset on Y). */
  controlsTarget: THREE.Vector3;
  near: number;
  far: number;
  /** max(width-dist, height-dist) before padding. */
  fitDistance: number;
  /** fitDistance × padding. */
  finalDistance: number;
  distanceForWidth: number;
  distanceForHeight: number;
  /** canvasWidth / canvasHeight. */
  aspect: number;
  /** 2·atan(tan(vFov/2)·aspect). */
  horizontalFov: number;
}

/**
 * Compute the camera position / target / clip planes that frame `boxSize`
 * inside a perspective camera at the given canvas size.
 *
 * Does NOT mutate any input; returns fresh vectors.  Does not touch the
 * scene or the shared display scale — it is purely a framing computation.
 */
export function computeCameraFitTargets(input: CameraFitInput): CameraFitResult {
  const {
    boxSize,
    boxCenter,
    canvasWidth,
    canvasHeight,
    verticalFovDeg,
    padding,
    compositionFraction,
  } = input;

  const verticalFov = THREE.MathUtils.degToRad(verticalFovDeg);
  const aspect = canvasWidth / Math.max(canvasHeight, 1);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);

  // Both constraints participate — the larger required distance wins so the
  // box is fully visible on both axes.
  const distanceForWidth = (boxSize.x * 0.5) / Math.tan(horizontalFov * 0.5);
  const distanceForHeight = (boxSize.y * 0.5) / Math.tan(verticalFov * 0.5);
  const fitDistance = Math.max(distanceForWidth, distanceForHeight, 0.01);
  const finalDistance = fitDistance * padding;

  // Preserve the current view direction (camera → target).  Fall back to a
  // straight-on +Z→−Z view when camera and target coincide.
  const direction = input.cameraPosition.clone().sub(input.controlsTarget);
  if (direction.lengthSq() < 1e-9) direction.set(0, 0, 1);
  direction.normalize();

  const finalCameraPosition = boxCenter.clone().addScaledVector(direction, finalDistance);
  const controlsTarget = boxCenter.clone();

  // Composition offset: shift BOTH by the same amount → view angle unchanged,
  // model band moves below the vertical centre (top keeps teaching space).
  const compositionOffsetY = boxSize.y * compositionFraction;
  controlsTarget.y += compositionOffsetY;
  finalCameraPosition.y += compositionOffsetY;

  // Clip planes sized to the fit distance.
  const near = Math.max(finalDistance / 100, 0.01);
  const far = Math.max(finalDistance * 20, 100);

  return {
    finalCameraPosition,
    controlsTarget,
    near,
    far,
    fitDistance,
    finalDistance,
    distanceForWidth,
    distanceForHeight,
    aspect,
    horizontalFov,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Gating rules
   ═══════════════════════════════════════════════════════════════ */

/**
 * True when the fit must be deferred because not every variant is loaded
 * AND laid out.  A multi-model node must NEVER fit on 1 or 2 models.
 */
export function shouldSkipFit(variantCount: number, sceneReady: boolean): boolean {
  return variantCount > 0 && !sceneReady;
}

/**
 * True when the container size change is large enough to warrant a
 * responsive re-fit.  Small jitter (e.g. a scrollbar toggling) is ignored.
 */
export function isSizeChangeSignificant(
  prev: { w: number; h: number } | null,
  width: number,
  height: number,
): boolean {
  if (!prev) return false;
  return (
    Math.abs(width - prev.w) > Math.max(40, width * 0.05) ||
    Math.abs(height - prev.h) > Math.max(40, height * 0.05)
  );
}

/**
 * Decide whether a fit should execute:
 *   - firstFit (initial entry / node change) is MANDATORY.
 *   - otherwise only on a significant resize, and NEVER once the user has
 *     manually orbited/zoomed/panned (a plain re-render must not reset the
 *     view, and auto-rotation / variant switching do not change size/fitKey).
 */
export function shouldRefitCamera(opts: {
  firstFit: boolean;
  sizeChanged: boolean;
  userInteracted: boolean;
}): boolean {
  if (opts.firstFit) return true;
  if (opts.userInteracted) return false;
  return opts.sizeChanged;
}

/**
 * Identity of the current initial fit.  Depends ONLY on the node id + the
 * variant id list — NOT on selection / hover / explode / section state, so
 * switching variants or highlighting never invalidates the fit.
 */
export function buildFitKey(
  nodeId: string | undefined,
  variantIds: readonly string[],
): string {
  return `${nodeId ?? "node"}:${
    variantIds.length > 0 ? variantIds.join(",") : "single"
  }`;
}
