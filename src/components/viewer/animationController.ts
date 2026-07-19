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
};
