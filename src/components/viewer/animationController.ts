/**
 * Animation controller — module-level singleton bridging NodeDetail UI
 * (play/pause/reverse/setTime) to the currently active THREE.AnimationAction[].
 *
 * Uses a registration token to prevent a stale SceneModel cleanup from
 * wiping actions that belong to a newly mounted SceneModel.
 */

import type { AnimationAction } from "three";
import { useNodeStore } from "../../store/nodeStore";

/* ── Active registration ─────────────────────────────────────── */

let _actions: AnimationAction[] = [];
let _token: symbol | null = null;

/**
 * Register the current set of animation actions.
 * Returns a cleanup function that only clears if the registration
 * is still the active one (prevents late cleanup from old SceneModel).
 */
export function registerAnimationActions(
  actions: AnimationAction[],
): () => void {
  const token = Symbol("anim-actions");
  _token = token;
  _actions = actions;

  return () => {
    if (_token === token) {
      _actions = [];
      _token = null;
    }
  };
}

/** Get current actions (for useFrame boundary auto-pause only). */
export function getAnimationActions(): AnimationAction[] {
  return _actions;
}

/* ── Pure reset helper ───────────────────────────────────────── */

/** Minimal action surface that {@link resetActionsToStart} manipulates.
 *  Defined structurally so the reset can be unit-tested with a light fake
 *  while production passes the real THREE.AnimationAction[]. */
export interface ResettableAnimationAction {
  paused: boolean;
  enabled: boolean;
  time: number;
  getMixer(): { setTime(time: number): unknown };
}

/**
 * Atomically return every action to its initial frame (t=0) and HOLD — no
 * playback is started.  For each unique mixer the pose is force-evaluated at
 * t=0 so the model visually snaps to the animation start and the next render
 * frame does not bounce back to a stale time.
 *
 * @param actions  the actions to rewind (all clips that participate in the
 *                 current model's pose).
 */
export function resetActionsToStart(
  actions: readonly ResettableAnimationAction[],
): void {
  const mixers = new Set<ReturnType<ResettableAnimationAction["getMixer"]>>();
  actions.forEach((a) => {
    a.paused = true;
    a.enabled = true;
    a.time = 0;
    mixers.add(a.getMixer());
  });
  // Jump every unique mixer to t=0 (zeroes all action times + re-evaluates
  // the pose), then it stays frozen because all actions are paused.
  mixers.forEach((m) => m.setTime(0));
}

/* ── Public controller API ────────────────────────────────────── */

export const animControls = {
  play() {
    _actions.forEach((a) => {
      a.timeScale = 1;
      a.paused = false;
    });
    if (_actions.length > 0) useNodeStore.getState().setIsPlaying(true);
  },

  playReverse() {
    _actions.forEach((a) => {
      a.timeScale = -1;
      a.paused = false;
    });
    if (_actions.length > 0) useNodeStore.getState().setIsPlaying(true);
  },

  pause() {
    _actions.forEach((a) => {
      a.paused = true;
    });
    useNodeStore.getState().setIsPlaying(false);
  },

  setTime(t: number) {
    _actions.forEach((a) => {
      a.time = t;
      a.paused = true;
      a.getMixer().update(0);
    });
  },

  /** Rewind to frame 0 and hold (R reset). Stops any ongoing playback. */
  rewindToStart() {
    resetActionsToStart(_actions);
    useNodeStore.getState().setIsPlaying(false);
  },
};
