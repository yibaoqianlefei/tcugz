import * as THREE from 'three';
import type { CaseTopicId } from '../data/caseStudies';

// Original teaching geometry. Units and detail positions are schematic, not survey data.
// Features are based on CMN descriptions: pilotis, ribbon windows, two terraces,
// an open courtyard, access ramp and the curved solarium wind screen.
export function createVillaSavoyeScene() {
  const scene = new THREE.Group();
  scene.name = 'villa-savoye-teaching-model';
  const parts = new Map<CaseTopicId, THREE.Group>();
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const white = new THREE.MeshStandardMaterial({ color: '#eeeae1', roughness: 0.86 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#d1d0c7', roughness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: '#667d85', metalness: 0.25, roughness: 0.22, transparent: true, opacity: 0.68 });
  const frame = new THREE.MeshStandardMaterial({ color: '#343f47', roughness: 0.5 });
  const groundWall = new THREE.MeshStandardMaterial({ color: '#8a9991', roughness: 0.95 });
  const paving = new THREE.MeshStandardMaterial({ color: '#b5b1a5', roughness: 1 });
  [white, concrete, glass, frame, groundWall, paving].forEach(material => materials.add(material));
  const base = new THREE.Group(); base.name = 'enclosure'; scene.add(base);
  (['pilotis', 'windows', 'roof'] as const).forEach(id => {
    const part = new THREE.Group(); part.name = id; parts.set(id, part); scene.add(part);
  });
  const pilotis = parts.get('pilotis')!;
  const windows = parts.get('windows')!;
  const roof = parts.get('roof')!;
  function mesh(parent: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, position: [number, number, number]) {
    geometries.add(geometry);
    materials.add(material);
    const ownMaterial = material.clone(); materials.add(ownMaterial);
    const object = new THREE.Mesh(geometry, ownMaterial);
    object.userData.caseOriginalColor = ownMaterial.color.clone();
    object.position.set(...position); object.castShadow = true; object.receiveShadow = true;
    object.userData.caseTopic = parts.has(parent.name as CaseTopicId) ? parent.name : undefined;
    parent.add(object);
    const edges = new THREE.EdgesGeometry(geometry, 26); geometries.add(edges);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: '#52616b', transparent: true, opacity: 0.3 }); materials.add(edgeMaterial);
    const lines = new THREE.LineSegments(edges, edgeMaterial); lines.raycast = () => {}; object.add(lines);
    return object;
  }
  const box = (parent: THREE.Group, size: [number, number, number], position: [number, number, number], material = white) => mesh(parent, new THREE.BoxGeometry(...size), material, position);
  // Raised living floor and inset support grid. Not all original columns are shown.
  box(base, [10.2, 0.24, 9], [0, 2.7, 0]);
  for (const x of [-4, -2, 0, 2, 4]) for (const z of [-3.35, 0, 3.35]) {
    mesh(pilotis, new THREE.CylinderGeometry(0.105, 0.105, 2.58, 16), white, [x, 1.33, z]);
  }
  // Ground floor enclosure with a curved glazed entrance toward the approach.
  box(base, [5.4, 2.55, 3.65], [0, 1.3, -1.2], groundWall);
  const entrance = new THREE.Shape();
  entrance.absarc(0, 0, 2.5, 0.12, Math.PI - 0.12, false);
  entrance.absarc(0, 0, 2.44, Math.PI - 0.12, 0.12, true);
  entrance.closePath();
  const entry = mesh(base, new THREE.ExtrudeGeometry(entrance, { depth: 2.42, bevelEnabled: false, curveSegments: 30 }), glass, [0, 2.5, 0.5]);
  entry.rotation.x = Math.PI / 2;
  for (let i = 1; i < 10; i++) {
    const a = Math.PI * i / 10;
    box(base, [0.045, 2.42, 0.045], [2.49 * Math.cos(a), 1.29, 0.5 + 2.49 * Math.sin(a)], frame);
  }
  // Continuous white parapet / lintel bands, glazing and thin mullions.
  for (const z of [-4.4, 4.4]) {
    box(base, [10.2, 1.04, 0.18], [0, 3.34, z]);
    box(base, [10.2, 0.5, 0.18], [0, 4.76, z]);
    box(windows, [9.72, 0.65, 0.06], [0, 4.19, z], glass);
    for (const y of [3.86, 4.52]) box(windows, [9.85, 0.045, 0.09], [0, y, z], frame);
    for (let x = -4.8; x <= 4.8; x += 0.8) box(windows, [0.04, 0.65, 0.09], [x, 4.19, z], frame);
  }
  for (const x of [-5.01, 5.01]) {
    box(base, [0.18, 1.04, 8.8], [x, 3.34, 0]);
    box(base, [0.18, 0.5, 8.8], [x, 4.76, 0]);
    box(windows, [0.06, 0.65, 8.35], [x, 4.19, 0], glass);
    for (const y of [3.86, 4.52]) box(windows, [0.09, 0.045, 8.5], [x, y, 0], frame);
    for (let z = -4.05; z <= 4.05; z += 0.81) box(windows, [0.09, 0.65, 0.04], [x, 4.19, z], frame);
  }
  // L-shaped upper roof leaves a substantial first-floor open terrace.
  box(roof, [10.2, 0.18, 4.25], [0, 5.07, -2.37]);
  box(roof, [3.45, 0.18, 4.5], [-3.38, 5.07, 2]);
  box(roof, [6.7, 0.055, 4.3], [1.65, 2.855, 2], paving);
  // Full-height courtyard glazing distinguishes the open terrace from the rooms.
  box(base, [0.09, 2.03, 4.2], [-1.64, 3.9, 2], glass);
  box(base, [6.65, 2.03, 0.09], [1.7, 3.9, -0.15], glass);
  for (let x = -1.4; x < 5; x += 1.05) box(base, [0.045, 2.1, 0.12], [x, 3.9, -0.15], frame);
  // Two flights of the external ramp and their continuous guard walls.
  const rise = 1.12, run = 4.05, angle = Math.atan(rise / run), length = Math.hypot(rise, run);
  for (const [x, y, rotation] of [[-0.78, 3.43, -angle], [0.56, 4.55, angle]]) {
    const ramp = box(roof, [1.2, 0.12, length], [x, y, 1.83], concrete); ramp.rotation.x = rotation;
    for (const side of [-0.62, 0.62]) {
      const guard = box(roof, [0.08, 0.65, length], [x + side, y + 0.39, 1.83]); guard.rotation.x = rotation;
    }
  }
  box(roof, [2.65, 0.12, 0.75], [-0.1, 4.02, 3.95], concrete);
  // Curved solarium wall, with a framed open view rather than a solid cylinder.
  const wind = new THREE.Shape();
  wind.absarc(0, 0, 2.35, 0.08, Math.PI * 1.15, false);
  wind.absarc(0, 0, 2.22, Math.PI * 1.15, 0.08, true); wind.closePath();
  const screen = mesh(roof, new THREE.ExtrudeGeometry(wind, { depth: 1.4, bevelEnabled: false, curveSegments: 40 }), white, [1.3, 6.6, -2.1]);
  screen.rotation.x = Math.PI / 2;
  box(roof, [2.8, 0.22, 0.16], [-1.65, 5.31, -3.35]);
  box(roof, [2.8, 0.4, 0.16], [-1.65, 6.35, -3.35]);
  for (const x of [-3, -0.3]) box(roof, [0.16, 1.4, 0.16], [x, 5.9, -3.35]);
  // Small terrace planters and paving seams, without heavy texture downloads.
  box(roof, [2.45, 0.25, 0.55], [3.4, 3.02, 3.55], concrete);
  box(roof, [2.28, 0.025, 0.38], [3.4, 3.16, 3.55], groundWall);
  for (let z = 0.2; z < 4; z += 0.65) box(roof, [3.45, 0.006, 0.013], [3.2, 2.89, z], groundWall);
  box(base, [14.4, 0.09, 12.8], [0, -0.045, 0], new THREE.MeshStandardMaterial({ color: '#d9dfd5', roughness: 1 }));
  // Track the additional ground material as well as per-mesh clones.
  const bounds = new THREE.Box3(new THREE.Vector3(-5.15, 0, -4.55), new THREE.Vector3(5.15, 6.65, 4.55));
  const anchors: Record<CaseTopicId, THREE.Vector3> = {
    pilotis: new THREE.Vector3(4, 1.45, 3.35),
    windows: new THREE.Vector3(2.4, 4.2, 4.45),
    roof: new THREE.Vector3(1.7, 5.4, -1.6),
  };
  return { scene, parts, bounds, anchors, dispose: () => { geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); } };
}

export function highlightSavoyePart(model: ReturnType<typeof createVillaSavoyeScene>, selected: CaseTopicId | null) {
  model.parts.forEach((group, id) => group.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial)) return;
    object.material.color.copy(object.userData.caseOriginalColor as THREE.Color);
    if (id === selected) object.material.color.lerp(new THREE.Color('#7892ce'), 0.5);
    object.material.emissive.set(id === selected ? '#526bb7' : '#000000');
    object.material.emissiveIntensity = id === selected ? 0.18 : 0;
  }));
}
