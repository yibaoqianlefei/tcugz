import * as THREE from 'three';
import { canonicalName, isHitboxName } from './nameUtils';

const POSITION_PRECISION = 1e4;
const COPLANAR_DOT = 1 - 1e-6;
type FeatureEdge = { a: THREE.Vector3; b: THREE.Vector3; normals: THREE.Vector3[] };

/** Boolean-cut caps can have a long triangle edge opposite two shorter edges.
 * Reconcile their overlapping intervals before deciding whether they are open.
 * Only unmatched edges are examined; closed rims/creases are left unchanged.
 */
function reconcileOpenEdges(edges: Iterable<FeatureEdge>): FeatureEdge[] {
  const closed: FeatureEdge[] = [];
  const lines = new Map<string, { direction: THREE.Vector3; origin: THREE.Vector3; edges: FeatureEdge[] }>();
  const quantize = (point: THREE.Vector3) => point.toArray().map(value => Math.round(value * POSITION_PRECISION)).join(',');
  for (const edge of edges) {
    if (edge.normals.length !== 1) { closed.push(edge); continue; }
    const direction = edge.b.clone().sub(edge.a).normalize();
    const first = direction.toArray().find(value => Math.abs(value) > 1e-6) ?? 0;
    if (first < 0) direction.negate();
    const origin = edge.a.clone().addScaledVector(direction, -edge.a.dot(direction));
    const key = `${quantize(direction)}|${quantize(origin)}`;
    if (!lines.has(key)) lines.set(key, { direction, origin, edges: [] });
    lines.get(key)!.edges.push(edge);
  }
  for (const { direction, origin, edges: candidates } of lines.values()) {
    if (candidates.length === 1) { closed.push(candidates[0]); continue; }
    const spans = candidates.map(edge => {
      const values = [edge.a.dot(direction), edge.b.dot(direction)].sort((a, b) => a - b);
      return { edge, start: values[0], end: values[1] };
    });
    const points = spans.flatMap(span => [span.start, span.end]).sort((a, b) => a - b);
    const unique = points.filter((point, i) => i === 0 || point - points[i - 1] > 1e-5);
    for (let i = 0; i + 1 < unique.length; i++) {
      const midpoint = (unique[i] + unique[i + 1]) / 2;
      const covering = spans.filter(span => midpoint > span.start - 1e-6 && midpoint < span.end + 1e-6);
      if (!covering.length) continue;
      closed.push({
        a: origin.clone().addScaledVector(direction, unique[i]),
        b: origin.clone().addScaledVector(direction, unique[i + 1]),
        normals: covering.flatMap(span => span.edge.normals),
      });
    }
  }
  return closed;
}

/** Feature edges only: winding-independent coplanarity, unique triangles/segments.
 * Sources must share a coordinate frame (e.g. GLTF material primitives).
 * Source buffers, normals and indices remain untouched.
 */
export function createFeatureEdges(sources: readonly THREE.BufferGeometry[], thresholdAngle = 15): THREE.BufferGeometry {
  const edges = new Map<string, FeatureEdge>();
  const triangles = new Set<string>();
  const points = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const triangle = new THREE.Triangle();
  const normal = new THREE.Vector3();
  const key = (p: THREE.Vector3) => `${Math.round(p.x * POSITION_PRECISION)},${Math.round(p.y * POSITION_PRECISION)},${Math.round(p.z * POSITION_PRECISION)}`;
  let duplicateTriangles = 0;

  for (const source of sources) {
    const position = source.getAttribute('position');
    if (!position) continue;
    const index = source.getIndex();
    const count = index?.count ?? position.count;
    for (let i = 0; i + 2 < count; i += 3) {
      for (let j = 0; j < 3; j++) points[j].fromBufferAttribute(position, index ? index.getX(i + j) : i + j);
      const hashes = points.map(key);
      if (new Set(hashes).size < 3) continue;
      triangle.set(points[0], points[1], points[2]).getNormal(normal);
      if (normal.lengthSq() === 0) continue;
      const triangleKey = [...hashes].sort().join('|');
      if (triangles.has(triangleKey)) { duplicateTriangles++; continue; }
      triangles.add(triangleKey);
      for (let j = 0; j < 3; j++) {
        const next = (j + 1) % 3;
        const edgeKey = hashes[j] < hashes[next] ? `${hashes[j]}|${hashes[next]}` : `${hashes[next]}|${hashes[j]}`;
        let edge = edges.get(edgeKey);
        if (!edge) {
          edge = { a: points[j].clone(), b: points[next].clone(), normals: [] };
          edges.set(edgeKey, edge);
        }
        edge.normals.push(normal.clone());
      }
    }
  }

  const vertices: number[] = [];
  const emitted = new Set<string>();
  const thresholdDot = Math.cos(THREE.MathUtils.degToRad(thresholdAngle));
  let removedCoplanarEdges = 0;
  for (const { a, b, normals } of reconcileOpenEdges(edges.values())) {
    let keep = normals.length === 1; // Open perimeters and hole boundaries.
    let coplanar = true;
    for (let i = 0; i < normals.length; i++) {
      for (let j = i + 1; j < normals.length; j++) {
        const dot = normals[i].dot(normals[j]);
        // Reversed winding on the same plane is not a physical fold.
        if (Math.abs(dot) >= COPLANAR_DOT) continue;
        coplanar = false;
        if (dot <= thresholdDot) keep = true;
      }
    }
    if (normals.length > 1 && coplanar) removedCoplanarEdges++;
    if (keep) {
      const endpoints = [key(a), key(b)].sort().join('|');
      if (emitted.has(endpoints)) continue;
      emitted.add(endpoints);
      vertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.userData.outlineStats = { sourceCount: sources.length, duplicateTriangles, removedCoplanarEdges, outputEdges: vertices.length / 6 };
  return geometry;
}

export interface OutlineSource {
  owner: THREE.Object3D;
  meshes: THREE.Mesh[];
}

/** Only combine identity-transformed, unanimated material primitives belonging
 * to one GLTF object. Independent construction/animation objects stay separate.
 */
export function collectOutlineSources(
  root: THREE.Object3D,
  excluded: readonly string[] = [],
  resolveName: (name: string) => string = canonicalName,
  animatedObjects: ReadonlySet<string> = new Set(),
): OutlineSource[] {
  const buckets = new Map<THREE.Object3D, THREE.Mesh[]>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !object.visible || object.userData._isProxy || isHitboxName(object.name)) return;
    if (excluded.includes(resolveName(object.name))) return;
    const parent = object.parent;
    const component = resolveName(object.name);
    const sharedFrame = parent && parent !== root && parent.type === 'Group' && parent.children.every(child =>
      child instanceof THREE.Mesh && child.visible && !child.userData._isProxy && !isHitboxName(child.name) &&
      !excluded.includes(resolveName(child.name)) && !animatedObjects.has(child.name) &&
      resolveName(child.name) === component &&
      child.position.lengthSq() === 0 && child.quaternion.equals(new THREE.Quaternion()) &&
      child.scale.equals(new THREE.Vector3(1, 1, 1)),
    );
    const owner = sharedFrame ? parent : object;
    if (!buckets.has(owner)) buckets.set(owner, []);
    buckets.get(owner)!.push(object);
  });
  return [...buckets].map(([owner, meshes]) => ({ owner, meshes }));
}

/** Apply only to owned material clones, preserving cached GLTF materials. */
export function separateOpaqueSurfaceDepth(material: THREE.Material): void {
  if (material.transparent) return;
  material.polygonOffset = true;
  material.polygonOffsetFactor = 1;
  material.polygonOffsetUnits = 1;
}
