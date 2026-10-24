import * as THREE from 'three';
import { isHitboxName } from './nameUtils';

/** Which components the node viewer should keep on screen. */
export type IsolationTarget =
  | { kind: 'all' }
  | { kind: 'none' }
  | { kind: 'only'; name: string };

/**
 * Original visibility of every object an isolation pass has touched.
 * Keeping the originals here means restoring never guesses: hitboxes, proxies
 * and any other visibility flag survive a round trip unchanged.
 */
export interface IsolationState {
  readonly remembered: Map<THREE.Object3D, boolean>;
}

export function createIsolationState(): IsolationState {
  return { remembered: new Map() };
}

function track(state: IsolationState, object: THREE.Object3D, visible: boolean) {
  if (!state.remembered.has(object)) state.remembered.set(object, object.visible);
  object.visible = visible;
}

/** Restore every visibility recorded by earlier isolation passes. */
export function clearComponentIsolation(state: IsolationState) {
  for (const [object, visible] of state.remembered) object.visible = visible;
  state.remembered.clear();
}

/**
 * Show one component in isolation: meshes of other components are hidden, and
 * feature outlines follow their owner so no floating wireframe is left behind.
 *
 * `all` restores the authored scene, `none` hides every selectable mesh (used by
 * sibling variants that do not hold the selected component).
 */
export function applyComponentIsolation(
  scene: THREE.Object3D,
  target: IsolationTarget,
  resolveName: (name: string) => string,
  state: IsolationState,
) {
  if (target.kind === 'all') {
    clearComponentIsolation(state);
    return;
  }

  const keep = target.kind === 'only' ? target.name : null;
  const outlines: THREE.Object3D[] = [];

  scene.traverse((object) => {
    if (object.userData._isProxy) return;
    if (object instanceof THREE.Mesh) {
      // Hitboxes stay on their authored (hidden) flag; they are debug pickers.
      if (isHitboxName(object.name)) return;
      track(state, object, keep !== null && resolveName(object.name) === keep);
      return;
    }
    if (object.userData._isOutline) outlines.push(object);
  });

  for (const outline of outlines) {
    let visible = false;
    outline.parent?.traverse((child) => {
      if (visible || !(child instanceof THREE.Mesh) || !child.visible || child.userData._isProxy) return;
      if (!isHitboxName(child.name) && keep !== null && resolveName(child.name) === keep) visible = true;
    });
    track(state, outline, visible);
  }
}
