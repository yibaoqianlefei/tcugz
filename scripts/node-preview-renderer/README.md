# Node-card renders

Run `npm run render:node-previews` and open the printed localhost workbench.
Choose **生成模型渲染图** (leave the ID filter empty for every available node),
then **验收并写入封面索引** after the render batch succeeds. Failed IDs can be
retried separately. `npm run test:node-previews` checks complete coverage,
actual GLB source hashes, transparent WebP dimensions and edge clearance.

The workbench uses the registered GLB and its existing textures, shared feature
edges, local Draco decoder, neutral studio lights, an orthographic camera and
actual projected vertex bounds. It hides interaction hitboxes. Animation
endpoints are compared to select a complete, compact pose; source files and
the live viewer's camera/animation settings are never rewritten. Multi-variant
nodes use their first registered variant as a representative card cover.

Outputs:

- `public/images/node-renders/<node-id>.webp`: 960 × 540 transparent images.
- `public/images/node-renders/manifest.json`: source, hash, pose, direction,
  geometry counts and foreground bounds for review.
- `src/data/nodeRenderPreviews.json`: lightweight UI cover index.

The directory uses these renders independently of `node.thumbnail` and
`node.diagram`; original textbook/section drawings remain available inside
each node. No canvas or GLB is loaded by a directory card.
