import * as THREE from 'three';
import type { GLTF } from 'three-stdlib';
import type { NodeDefinition, NodeModelVariant } from '../../data/nodeDefinitions';
import { canonicalName, isHitboxName } from '../../utils/nameUtils';
import { computeExplodedPosition } from '../../utils/explodeLayout';
import { createModelTimelineClips } from '../viewer/animationController';
import { collectOutlineSources, createFeatureEdges, separateOpaqueSurfaceDepth } from '../../utils/modelOutlines';

export type LessonPart = { id: string; name: string; names: string[] };
export type LessonModel = {
  scene: THREE.Group;
  bounds: THREE.Box3;
  restBounds: THREE.Box3;
  parts: LessonPart[];
  meshes: Array<{ mesh: THREE.Mesh; partId?: string; visible: boolean }>;
  lines: Array<{ line: THREE.LineSegments; partId?: string }>;
  materials: Map<THREE.Material, { color?: THREE.Color; emissive?: THREE.Color; intensity?: number }>;
  canExplode: boolean;
  hasTimeline: boolean;
  duration: number;
  sample: (progress: number) => Set<string>;
  dispose: () => void;
};

// Matrix4.decompose cannot recover a singular transform reliably. Read column
// lengths directly, and omit collapsed construction stages from picking/fit.
function hasVolume(mesh: THREE.Mesh) {
  const scale = new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld);
  return Math.min(scale.x, scale.y, scale.z) > 1e-8;
}

/** The front visible surface owns the pick. Hidden proxies cannot occlude it,
 * and an unlabelled solid surface must not select a part through the model. */
export function pickLessonPart(intersections: ReadonlyArray<{ object: THREE.Object3D }>): string | undefined {
  const hit = intersections.find(({ object }) => {
    if (!(object instanceof THREE.Mesh) || !hasVolume(object)) return false;
    for (let current: THREE.Object3D | null = object; current; current = current.parent) {
      if (!current.visible || isHitboxName(current.name)) return false;
    }
    return true;
  });
  const id = hit?.object.userData.lessonPart;
  return typeof id === 'string' ? id : undefined;
}

export function disposeLessonScene(scene: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
    }
  });
  materials.forEach(material => Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }));
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}

/** Private timeline and materials: reading a lesson cannot seek the node page. */
export function prepareLessonModel(gltf: GLTF, node: NodeDefinition, variant?: NodeModelVariant): LessonModel {
  const source = gltf.scene;
  const entries: LessonPart[] = variant
    ? (variant.componentKnowledge ?? []).map(entry => ({ id: entry.objectName, name: entry.title, names: [entry.objectName, ...entry.aliases ?? []] }))
    : (node.layerConfig?.layers ?? []).map(entry => ({ id: entry.objectName, name: entry.name, names: [entry.objectName, ...entry.aliases ?? []] }));
  const groups = node.model?.groups;
  const excluded = new Set((node.model?.nonInteractive ?? []).map(name => canonicalName(name, groups)));
  const resolvePart = (object: THREE.Object3D): LessonPart | undefined => {
    for (let current: THREE.Object3D | null = object; current && current !== source; current = current.parent) {
      if (excluded.has(canonicalName(current.name, groups))) return;
      const exact = entries.filter(entry => entry.names.some(name => name === current!.name || THREE.PropertyBinding.sanitizeNodeName(name) === current!.name));
      if (exact.length === 1) return exact[0];
      const normalized = canonicalName(current.name, groups);
      const matches = entries.filter(entry => entry.names.some(name => canonicalName(name, groups) === normalized));
      if (matches.length === 1) return matches[0];
    }
  };
  const meshes: LessonModel['meshes'] = [];
  const lines: LessonModel['lines'] = [];
  const materials: LessonModel['materials'] = new Map();
  const originals = new Set<THREE.Material>();
  source.traverse(object => {
    if (isHitboxName(object.name)) object.visible = false;
    if (!(object instanceof THREE.Mesh)) return;
    const owned = (Array.isArray(object.material) ? object.material : [object.material]).map(material => { originals.add(material); return material.clone(); });
    object.material = Array.isArray(object.material) ? owned : owned[0];
    let visible = object.visible;
    for (let parent = object.parent; parent; parent = parent.parent) visible &&= parent.visible;
    if (!visible) return;
    const part = resolvePart(object);
    object.userData.lessonPart = part?.id;
    meshes.push({ mesh: object, partId: part?.id, visible });
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    owned.forEach(material => {
      materials.set(material, {
        color: 'color' in material && material.color instanceof THREE.Color ? material.color.clone() : undefined,
        emissive: 'emissive' in material && material.emissive instanceof THREE.Color ? material.emissive.clone() : undefined,
        intensity: 'emissiveIntensity' in material ? Number(material.emissiveIntensity) : undefined,
      });
      separateOpaqueSurfaceDepth(material);
    });
  });
  originals.forEach(material => material.dispose());

  const clips = !variant && !node.model?.noAnimation ? createModelTimelineClips(gltf.animations) : [];
  const duration = Math.max(0, ...clips.map(clip => clip.duration));
  const mixer = clips.length && duration > 0 ? new THREE.AnimationMixer(source) : undefined;
  const actions = mixer ? clips.map(clip => {
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true;
    action.play(); action.paused = true;
    return action;
  }) : [];
  const configured = variant?.explode?.enabled ? variant.explode.components : [];
  const targets: Array<{ object: THREE.Object3D; base: [number, number, number]; config: typeof configured[number] }> = [];
  const targetConfig = (object: THREE.Object3D) => configured.find(config => [config.objectName, ...config.aliases ?? []].some(name => name === object.name || THREE.PropertyBinding.sanitizeNodeName(name) === object.name));
  source.traverse(object => {
    const config = targetConfig(object);
    if (!config || !(object instanceof THREE.Mesh) || isHitboxName(object.name)) return;
    for (let parent = object.parent; parent && parent !== source; parent = parent.parent) if (targetConfig(parent)) return;
    targets.push({ object, base: object.position.toArray(), config });
  });
  const pose = (progress: number) => {
    const value = THREE.MathUtils.clamp(progress, 0, 1);
    actions.forEach(action => { action.enabled = true; action.paused = true; action.time = value * duration; });
    mixer?.update(0);
    targets.forEach(({ object, base, config }) => object.position.fromArray(computeExplodedPosition({ basePosition: base, direction: config.direction, distance: config.distance, progress: value, start: config.start ?? 0, end: config.end ?? 1 })));
    source.updateMatrixWorld(true);
  };
  const boundsOfPose = () => {
    const bounds = new THREE.Box3();
    meshes.forEach(({ mesh }) => {
      if (hasVolume(mesh) && mesh.geometry.boundingBox) bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    });
    return bounds;
  };
  // Fit a stable envelope spanning the same authored timeline as the node page.
  // It keeps separated components visible without chasing them with the camera.
  const samples = new Set([0, 1]);
  if (mixer || targets.length) for (let i = 1; i < 32; i++) samples.add(i / 32);
  clips.forEach(clip => clip.tracks.forEach(track => { for (const time of track.times) samples.add(duration ? time / duration : 0); }));
  const rawBounds = new THREE.Box3();
  const available = new Set<string>();
  for (const value of samples) {
    pose(value); rawBounds.union(boundsOfPose());
    meshes.forEach(({ mesh, partId }) => { if (partId && hasVolume(mesh)) available.add(partId); });
  }
  // Some source GLBs are a single undivided teaching object. Link one honest
  // whole-model card rather than inventing six separately selectable parts.
  if (!available.size) {
    const whole = { id: '__whole_model__', name: node.title, names: [] };
    entries.push(whole); available.add(whole.id);
    meshes.forEach(entry => { entry.partId = whole.id; entry.mesh.userData.lessonPart = whole.id; });
  }
  if (rawBounds.isEmpty()) throw new Error('模型没有可显示的构件');
  const wrapper = new THREE.Group();
  wrapper.add(source);
  wrapper.scale.setScalar((variant?.model.scale ?? node.model?.scale ?? 2.5) / Math.max(...rawBounds.getSize(new THREE.Vector3()).toArray(), .001));
  if (variant?.model.rotation) wrapper.rotation.set(...variant.model.rotation);
  const envelope = new THREE.Box3();
  for (const value of samples) { pose(value); wrapper.updateMatrixWorld(true); envelope.union(boundsOfPose()); }
  wrapper.position.sub(envelope.getCenter(new THREE.Vector3()));
  if (variant?.model.position) wrapper.position.add(new THREE.Vector3(...variant.model.position));
  envelope.translate(wrapper.position);
  pose(0); wrapper.updateMatrixWorld(true);
  const restBounds = boundsOfPose();
  const animatedNames = new Set(clips.flatMap(clip => clip.tracks.map(track => THREE.PropertyBinding.parseTrackName(track.name).nodeName)));
  targets.forEach(({ object }) => animatedNames.add(object.name));
  for (const { owner, meshes: sources } of collectOutlineSources(source, node.model?.outlineExcluded, name => canonicalName(name, groups), animatedNames)) {
    const line = new THREE.LineSegments(createFeatureEdges(sources.map(mesh => mesh.geometry), 20), new THREE.LineBasicMaterial({ color: '#24314a', transparent: true, opacity: .45, toneMapped: false }));
    line.raycast = () => {}; owner.add(line);
    lines.push({ line, partId: resolvePart(sources[0])?.id });
  }
  return {
    scene: wrapper, bounds: envelope, restBounds, parts: entries.filter(entry => available.has(entry.id)), meshes, lines, materials,
    canExplode: Boolean(mixer || targets.length), hasTimeline: Boolean(mixer), duration: mixer ? duration : 1.2,
    sample(progress) {
      pose(progress); wrapper.updateMatrixWorld(true);
      return new Set(meshes.filter(({ mesh }) => hasVolume(mesh)).flatMap(({ partId }) => partId ? [partId] : []));
    },
    dispose() { mixer?.stopAllAction(); mixer?.uncacheRoot(source); disposeLessonScene(wrapper); },
  };
}
