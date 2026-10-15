import * as THREE from 'three';
import { isHitboxName } from './nameUtils';

export type HomepageModelOrbitFit = {
  center: THREE.Vector3;
  radius: number;
  distance: number;
  near: number;
  far: number;
};

/** Fit a fixed orbit distance that keeps every visible vertex inside every view. */
export function fitHomepageModelOrbit(
  model: THREE.Object3D,
  width: number,
  height: number,
  fovDegrees: number,
): HomepageModelOrbitFit | null {
  if (![width, height, fovDegrees].every(Number.isFinite)
    || width <= 0 || height <= 0 || fovDegrees <= 0 || fovDegrees >= 180) return null;

  // Compose fresh matrices without changing the source scene or its cached matrices.
  const worldMatrices = new Map<THREE.Object3D, THREE.Matrix4>();
  const worldMatrix = (object: THREE.Object3D): THREE.Matrix4 => {
    const cached = worldMatrices.get(object);
    if (cached) return cached;
    const matrix = object.matrixWorldAutoUpdate === false
      ? object.matrixWorld.clone()
      : object.matrixAutoUpdate
        ? new THREE.Matrix4().compose(object.position, object.quaternion, object.scale)
        : object.matrix.clone();
    if (object.matrixWorldAutoUpdate !== false && object.parent) matrix.premultiply(worldMatrix(object.parent));
    worldMatrices.set(object, matrix);
    return matrix;
  };

  const meshes: Array<{ mesh: THREE.Mesh; matrix: THREE.Matrix4 }> = [];
  model.traverseVisible(object => {
    if (!(object instanceof THREE.Mesh) || isHitboxName(object.name)) return;
    if (!object.geometry.getAttribute('position')?.count) return;
    meshes.push({ mesh: object, matrix: worldMatrix(object) });
  });
  const point = new THREE.Vector3();
  const instanceMatrix = new THREE.Matrix4();
  const instanceWorld = new THREE.Matrix4();
  const forEachVertex = (visit: (vertex: THREE.Vector3) => void) => {
    for (const { mesh, matrix } of meshes) {
      const position = mesh.geometry.getAttribute('position');
      const instances = mesh instanceof THREE.InstancedMesh ? mesh.count : 1;
      for (let instance = 0; instance < instances; instance++) {
        let transform = matrix;
        if (mesh instanceof THREE.InstancedMesh) {
          mesh.getMatrixAt(instance, instanceMatrix);
          transform = instanceWorld.multiplyMatrices(matrix, instanceMatrix);
        }
        for (let index = 0; index < position.count; index++) {
          mesh.getVertexPosition(index, point).applyMatrix4(transform);
          if ([point.x, point.y, point.z].every(Number.isFinite)) visit(point);
        }
      }
    }
  };

  const bounds = new THREE.Box3();
  forEachVertex(vertex => bounds.expandByPoint(vertex));
  if (bounds.isEmpty()) return null;
  const center = bounds.getCenter(new THREE.Vector3());
  let radiusSquared = 0;
  forEachVertex(vertex => { radiusSquared = Math.max(radiusSquared, vertex.distanceToSquared(center)); });
  const radius = Math.max(Math.sqrt(radiusSquared), 1e-6);

  const verticalHalfFov = THREE.MathUtils.degToRad(fovDegrees) / 2;
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * width / height);
  // A sphere's silhouette half-angle is asin(radius / distance). Reserving
  // 4% at each viewport edge gives an orientation-independent projection fit.
  const paddedHalfFov = Math.atan(Math.tan(Math.min(verticalHalfFov, horizontalHalfFov)) * 0.96);
  const distance = Math.max(radius / Math.sin(paddedHalfFov), radius * 1.001);
  return {
    center,
    radius,
    distance,
    near: (distance - radius) * 0.5,
    far: distance + radius * 1.05,
  };
}
