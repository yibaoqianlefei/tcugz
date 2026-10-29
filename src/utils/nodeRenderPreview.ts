import previews from '../data/nodeRenderPreviews.json';

/** Static renders are separate from the original teaching diagrams. */
export function getNodeRenderPreview(nodeId: string): string | undefined {
  const path = (previews as Record<string, string>)[nodeId];
  return path ? `${import.meta.env?.BASE_URL ?? '/'}${path}` : undefined;
}
