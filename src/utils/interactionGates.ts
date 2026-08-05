/**
 * Interaction gates — whether Picking / hover / selected are allowed.
 *
 * Nodes WITHOUT a real GLTF animation timeline (single-model static nodes
 * AND every multi-model variant — they are rendered with `noAnimation`) are
 * ALWAYS interactable: the `animationProgress` gate only makes sense for
 * nodes that actually have an animation to finish before parts are revealed.
 *
 * This is what keeps a multi-model node interactive after R reset — R sets
 * `animationProgress` to 0, but the multi-model has no AnimationMixer to
 * drive that value back, so it must not be gated on it at all.
 */

/**
 * Pure gate used by SceneModel's hover / click / highlight paths.
 *
 * @param noAnimation        true when the model has no GLTF animation timeline
 *                           (multi-model variants + static single-model nodes).
 * @param animationProgress  current store progress in [0, 1].
 * @param threshold          required progress (0.99 for hover, 1 for click).
 * @returns true when the interaction should be allowed.
 */
export function isInteractionAllowed(
  noAnimation: boolean,
  animationProgress: number,
  threshold: number,
): boolean {
  return noAnimation || animationProgress >= threshold;
}
