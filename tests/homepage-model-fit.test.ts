import assert from 'node:assert/strict';
import * as THREE from 'three';
import { fitHomepageModelOrbit } from '../src/utils/homepageModelFit';

const root = new THREE.Group();
root.position.set(2, -3, 1);
root.rotation.set(0.2, 0.3, -0.1);
const group = new THREE.Group();
group.position.set(-1, 2, 0.5);
group.scale.set(1.2, 0.8, 1.4);
group.rotation.set(-0.1, 0.25, 0.4);
root.add(group);
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute([
  -4, 0, 0, 4, 0, 0, 0, 3, 0,
  0, -3, 0, 0, 0, 1, 0, 0, -1,
], 3));
const mesh = new THREE.Mesh(geometry);
mesh.position.set(0.5, 0.3, -0.5);
group.add(mesh);

const hidden = new THREE.Group();
hidden.visible = false;
const distant = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100));
distant.position.set(1000, 1000, 1000);
hidden.add(distant);
root.add(hidden);
const hitbox = distant.clone();
hitbox.name = 'roof_hitbox';
root.add(hitbox);

function sceneSnapshot() {
  const objects: unknown[] = [];
  root.traverse(object => objects.push({
    position: object.position.toArray(),
    quaternion: object.quaternion.toArray(),
    scale: object.scale.toArray(),
    matrix: object.matrix.toArray(),
    matrixWorld: object.matrixWorld.toArray(),
    visible: object.visible,
    vertices: object instanceof THREE.Mesh ? Array.from(object.geometry.getAttribute('position').array) : null,
  }));
  return JSON.stringify(objects);
}

const before = sceneSnapshot();
const initialFit = fitHomepageModelOrbit(root, 900, 500, 35);
assert(initialFit);
assert.equal(sceneSnapshot(), before, 'fitting leaves transforms, cached matrices, geometry and visibility unchanged');

// Use an independent cloned scene to obtain the actual transformed vertices.
const reference = root.clone(true);
reference.updateMatrixWorld(true);
const referenceMesh = reference.children[0].children[0] as THREE.Mesh;
const vertices: THREE.Vector3[] = [];
for (let index = 0; index < geometry.getAttribute('position').count; index++) {
  vertices.push(new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), index).applyMatrix4(referenceMesh.matrixWorld));
}
const bounds = new THREE.Box3().setFromPoints(vertices);
const expectedCenter = bounds.getCenter(new THREE.Vector3());
assert(initialFit.center.distanceTo(expectedCenter) < 1e-10, 'invisible descendants and hitboxes do not affect the fit');
assert(Math.abs(initialFit.radius - Math.max(...vertices.map(vertex => vertex.distanceTo(expectedCenter)))) < 1e-10);
assert(initialFit.radius < bounds.getBoundingSphere(new THREE.Sphere()).radius * 0.99, 'actual vertices give a tighter sphere than empty AABB corners');

let viewsChecked = 0;
for (const [width, height] of [[1600, 500], [900, 500], [600, 600], [360, 800], [124, 900]]) {
  const fit = fitHomepageModelOrbit(root, width, height, 35);
  assert(fit);
  const camera = new THREE.PerspectiveCamera(35, width / height, fit.near, fit.far);
  for (let polarStep = 0; polarStep <= 24; polarStep++) {
    const phi = THREE.MathUtils.lerp(1e-5, Math.PI - 1e-5, polarStep / 24);
    for (let azimuthStep = 0; azimuthStep < 72; azimuthStep++) {
      const theta = azimuthStep / 72 * Math.PI * 2;
      camera.position.copy(fit.center).add(new THREE.Vector3().setFromSphericalCoords(fit.distance, phi, theta));
      camera.lookAt(fit.center);
      camera.updateMatrixWorld();
      for (const vertex of vertices) {
        const projected = vertex.clone().project(camera);
        assert(Math.abs(projected.x) <= 0.960001, `horizontal fit at ${width}×${height}, phi=${phi}, theta=${theta}`);
        assert(Math.abs(projected.y) <= 0.960001, `vertical fit at ${width}×${height}, phi=${phi}, theta=${theta}`);
        assert(projected.z > -1 && projected.z < 1, 'near and far planes contain the full model');
      }
      viewsChecked++;
    }
  }
}

const instances = new THREE.InstancedMesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial(), 2);
instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-8, 0, 0));
instances.setMatrixAt(1, new THREE.Matrix4().makeTranslation(8, 0, 0));
const instanceFit = fitHomepageModelOrbit(instances, 800, 600, 35);
assert(instanceFit && Math.abs(instanceFit.radius - Math.sqrt(83)) < 1e-10, 'instanced mesh positions contribute to the sphere');
assert.equal(fitHomepageModelOrbit(new THREE.Group(), 800, 600, 35), null);
assert.equal(fitHomepageModelOrbit(root, 0, 600, 35), null);
assert.equal(fitHomepageModelOrbit(root, 800, 600, 180), null);
assert.equal(fitHomepageModelOrbit(root, Number.NaN, 600, 35), null);
console.log(`Homepage fixed-orbit fit passed (${viewsChecked} full-rotation camera views)`);
