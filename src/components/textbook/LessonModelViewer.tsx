import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DRACOLoader, GLTFLoader, MeshoptDecoder, type GLTF, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { getNodeDefinition, type NodeDefinition, type NodeModelVariant } from '../../data/nodeDefinitions';
import { canonicalName, isHitboxName } from '../../utils/nameUtils';
import { collectOutlineSources, createFeatureEdges, separateOpaqueSurfaceDepth } from '../../utils/modelOutlines';
import { ErrorBoundary } from '../ErrorBoundary';
import StudioEnvironment from '../viewer/StudioEnvironment';
import './lesson-model-viewer.css';

type Part = { id: string; name: string; names: string[] };
type PreparedModel = {
  scene: THREE.Group;
  bounds: THREE.Box3;
  parts: Part[];
  meshes: Array<{ mesh: THREE.Mesh; partId?: string; visible: boolean }>;
  lines: Array<{ line: THREE.LineSegments; partId?: string }>;
  materials: Map<THREE.Material, { color?: THREE.Color; emissive?: THREE.Color; intensity?: number }>;
  dispose: () => void;
};
type ViewCommand = { id: number; action: 'fit' | 'left' | 'right' | 'up' | 'down' | 'near' | 'far' };

function teachingParts(node: NodeDefinition, variant?: NodeModelVariant): Part[] {
  // Variant-specific entries take precedence; a node's common layer config can
  // describe a different variant and must not supply guessed component names.
  if (variant) return (variant.componentKnowledge ?? []).map(entry => ({
    id: entry.objectName, name: entry.title, names: [entry.objectName, ...entry.aliases ?? []],
  }));
  return (node.layerConfig?.layers ?? []).map(entry => ({
    id: entry.objectName, name: entry.name, names: [entry.objectName, ...entry.aliases ?? []],
  }));
}

function disposeLoadedScene(scene: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
    }
  });
  materials.forEach(material => Object.values(material).forEach(value => {
    if (value instanceof THREE.Texture) textures.add(value);
  }));
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}

function prepareModel(gltf: GLTF, node: NodeDefinition, variant?: NodeModelVariant): PreparedModel {
  const scene = gltf.scene;
  const entries = teachingParts(node, variant);
  const groups = node.model?.groups;
  const excluded = new Set((node.model?.nonInteractive ?? []).map(name => canonicalName(name, groups)));
  const resolvePart = (object: THREE.Object3D): Part | undefined => {
    for (let current: THREE.Object3D | null = object; current && current !== scene; current = current.parent) {
      if (excluded.has(canonicalName(current.name, groups))) return undefined;
      const exact = entries.filter(entry => entry.names.includes(current!.name));
      if (exact.length === 1) return exact[0];
      const normalized = canonicalName(current.name, groups);
      const matches = entries.filter(entry => entry.names.some(name => canonicalName(name, groups) === normalized));
      // Canonical suffix stripping may merge genuinely distinct material parts.
      // Only an unambiguous registered teaching entry can become a control.
      if (matches.length === 1) return matches[0];
    }
    return undefined;
  };
  const meshes: PreparedModel['meshes'] = [];
  const lines: PreparedModel['lines'] = [];
  const materials: PreparedModel['materials'] = new Map();
  const originalMaterials = new Set<THREE.Material>();
  const matched = new Set<string>();
  scene.traverse(object => {
    if (isHitboxName(object.name)) object.visible = false;
    if (!(object instanceof THREE.Mesh)) return;
    // GLTF objects can share a material even when they are different teaching
    // components. Isolate it per mesh so a selection never colors another part.
    const owned = (Array.isArray(object.material) ? object.material : [object.material]).map(material => {
      originalMaterials.add(material);
      return material.clone();
    });
    object.material = Array.isArray(object.material) ? owned : owned[0];
    let visible = object.visible;
    for (let parent = object.parent; parent; parent = parent.parent) visible &&= parent.visible;
    if (!visible) return;
    const part = resolvePart(object);
    if (part) matched.add(part.id);
    object.userData.lessonPart = part?.id;
    meshes.push({ mesh: object, partId: part?.id, visible });
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
      if (!materials.has(material)) materials.set(material, {
        color: 'color' in material && material.color instanceof THREE.Color ? material.color.clone() : undefined,
        emissive: 'emissive' in material && material.emissive instanceof THREE.Color ? material.emissive.clone() : undefined,
        intensity: 'emissiveIntensity' in material ? Number(material.emissiveIntensity) : undefined,
      });
      separateOpaqueSurfaceDepth(material);
    });
  });
  originalMaterials.forEach(material => material.dispose());
  // Keep the authored geometry in place. Only the display transform is fitted;
  // exploding components requires the dedicated node's authored animation.
  scene.updateMatrixWorld(true);
  const originalBounds = new THREE.Box3();
  meshes.forEach(({ mesh }) => {
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) originalBounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });
  if (originalBounds.isEmpty()) throw new Error('模型没有可显示的构件');
  const maximum = Math.max(...originalBounds.getSize(new THREE.Vector3()).toArray(), 0.001);
  const displayScale = variant?.model.scale ?? node.model?.scale ?? 2.5;
  const wrapper = new THREE.Group();
  wrapper.add(scene);
  wrapper.scale.setScalar(displayScale / maximum);
  if (variant?.model.rotation) wrapper.rotation.set(...variant.model.rotation);
  wrapper.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  meshes.forEach(({ mesh }) => {
    if (mesh.geometry.boundingBox) bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });
  const center = bounds.getCenter(new THREE.Vector3());
  wrapper.position.sub(center);
  if (variant?.model.position) wrapper.position.add(new THREE.Vector3(...variant.model.position));
  wrapper.updateMatrixWorld(true);
  bounds.translate(wrapper.position);
  for (const { owner, meshes: sources } of collectOutlineSources(scene, node.model?.outlineExcluded, name => canonicalName(name, groups))) {
    const geometry = createFeatureEdges(sources.map(mesh => mesh.geometry), 20);
    const material = new THREE.LineBasicMaterial({ color: '#24314a', transparent: true, opacity: 0.45, toneMapped: false });
    const line = new THREE.LineSegments(geometry, material);
    line.raycast = () => {};
    owner.add(line);
    lines.push({ line, partId: resolvePart(sources[0])?.id });
  }
  return {
    scene: wrapper, bounds, meshes, lines, materials,
    parts: entries.filter(entry => matched.has(entry.id)),
    dispose: () => disposeLoadedScene(wrapper),
  };
}

function ModelScene({ model, selected, hidden, command, onSelect, onReady, onRenderError }: {
  model: PreparedModel; selected: string; hidden: string[]; command: ViewCommand;
  onSelect: (id: string) => void; onReady: () => void; onRenderError: () => void;
}) {
  const camera = useThree(state => state.camera);
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null;
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const rendering = useRef({ fitted: false, frames: 0, reported: false });

  useFrame(({ gl }) => {
    const state = rendering.current;
    if (!state.fitted || state.reported) return;
    state.frames += 1;
    // useFrame runs before drawing. Require a previous frame after camera fit,
    // rather than treating a decoded GLTF or the environment bake as visible.
    if (state.frames >= 2 && gl.info.render.triangles > 0) {
      state.reported = true;
      onReady();
      return;
    }
    if (state.frames < 6) invalidate();
    else {
      state.reported = true;
      onRenderError();
    }
  });

  /* eslint-disable react-hooks/immutability -- This viewer exclusively owns these Three.js objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || size.width < 1 || size.height < 1) return;
    const center = model.bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(model.bounds.getBoundingSphere(new THREE.Sphere()).radius, 0.001);
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * size.width / Math.max(1, size.height));
    const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.2;
    camera.position.copy(center).add(new THREE.Vector3(1.2, 0.8, 1.4).normalize().multiplyScalar(distance));
    camera.near = Math.max(0.001, radius / 100);
    camera.far = distance * 8;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = radius * 0.3;
    controls.maxDistance = distance * 3;
    controls.update();
    rendering.current.fitted = true;
    rendering.current.frames = 0;
    invalidate();
  }, [model, camera, controls, size.width, size.height, invalidate]);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || size.width < 1 || size.height < 1) return;
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (command.action === 'fit') {
      const radius = Math.max(model.bounds.getBoundingSphere(new THREE.Sphere()).radius, 0.001);
      const vertical = THREE.MathUtils.degToRad(camera.fov);
      const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * size.width / Math.max(1, size.height));
      spherical.setFromVector3(new THREE.Vector3(1.2, 0.8, 1.4).normalize().multiplyScalar(radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.2));
      controls.target.copy(model.bounds.getCenter(new THREE.Vector3()));
    }
    if (command.action === 'left') spherical.theta -= Math.PI / 8;
    if (command.action === 'right') spherical.theta += Math.PI / 8;
    if (command.action === 'up') spherical.phi -= Math.PI / 12;
    if (command.action === 'down') spherical.phi += Math.PI / 12;
    if (command.action === 'near') spherical.radius *= 0.8;
    if (command.action === 'far') spherical.radius *= 1.25;
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    spherical.makeSafe();
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
    invalidate();
  }, [command, model, camera, controls, size.width, size.height, invalidate]);

  useLayoutEffect(() => {
    model.meshes.forEach(({ mesh, partId, visible }) => {
      mesh.visible = visible && !hidden.includes(partId ?? '');
      const active = partId === selected && Boolean(selected);
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
        const original = model.materials.get(material);
        if ('emissive' in material && material.emissive instanceof THREE.Color && original?.emissive) {
          material.emissive.copy(active ? new THREE.Color('#4761b2') : original.emissive);
          if ('emissiveIntensity' in material) material.emissiveIntensity = active ? 0.45 : original.intensity ?? 0;
        } else if ('color' in material && material.color instanceof THREE.Color && original?.color) {
          material.color.copy(original.color);
          if (active) material.color.lerp(new THREE.Color('#6d83bb'), 0.45);
        }
      });
    });
    model.lines.forEach(({ line, partId }) => { line.visible = !hidden.includes(partId ?? ''); });
    invalidate();
  }, [model, selected, hidden, invalidate]);
  /* eslint-enable react-hooks/immutability */

  const select = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return;
    event.stopPropagation();
    const partId = event.object.userData.lessonPart;
    if (typeof partId === 'string') onSelect(partId);
  };
  return <primitive object={model.scene} dispose={null} onClick={select} />;
}

function browserHasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch { return false; }
}

function ViewerSession({ node, variant }: { node: NodeDefinition; variant?: NodeModelVariant }) {
  const path = variant?.model.path ?? node.model?.path;
  const [supported] = useState(browserHasWebGL);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; model: PreparedModel }>();
  const [error, setError] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [renderedKey, setRenderedKey] = useState('');
  const [command, setCommand] = useState<ViewCommand>({ id: 0, action: 'fit' });
  const requestKey = `${path}:${retry}`;
  const model = loaded?.key === requestKey ? loaded.model : undefined;
  const rendered = renderedKey === requestKey;
  const reportError = useCallback(() => setError('三维模型暂时无法显示，请重试或查看本节构造图。'), []);
  const markRendered = useCallback(() => setRenderedKey(requestKey), [requestKey]);

  useEffect(() => {
    if (!path || !supported) return;
    let cancelled = false;
    let timedOut = false;
    let ownedModel: PreparedModel | undefined;
    const draco = new DRACOLoader();
    // Same decoder version as the existing node viewer; this loader and all
    // decoded assets remain private, so retry never clears its shared cache.
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      timedOut = true;
      setError('模型加载时间较长，请检查网络后重试，或先查看本节构造图。');
    }, 20_000);
    loader.loadAsync(path).then(gltf => {
      window.clearTimeout(timeout);
      // GLTFLoader cannot abort every decode path. Late results from an expired
      // request are released without replacing the retry's current view.
      if (cancelled || timedOut) { disposeLoadedScene(gltf.scene); return; }
      try {
        ownedModel = prepareModel(gltf, node, variant);
        setLoaded({ key: requestKey, model: ownedModel });
      } catch {
        disposeLoadedScene(gltf.scene);
        reportError();
      }
    }).catch(() => {
      window.clearTimeout(timeout);
      if (!cancelled && !timedOut) reportError();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      ownedModel?.dispose();
      draco.dispose();
    };
  }, [path, node, variant, requestKey, supported, reportError]);

  const act = (action: ViewCommand['action']) => setCommand(previous => ({ id: previous.id + 1, action }));
  const restart = () => { setError(''); setHidden([]); setSelected(''); setRetry(value => value + 1); };
  if (!path) return <div className="lesson-model-fallback" role="status">此节点暂未提供三维模型，可继续阅读正文和构造图。</div>;
  if (!supported) return <div className="lesson-model-fallback" role="status"><strong>当前设备无法开启三维视图</strong><p>可继续对照本节构造图与教材正文学习。</p></div>;
  const fallback = <div className="lesson-model-fallback" role="alert"><strong>模型暂时无法显示</strong><p>{error || '请检查网络后重试，也可先查看构造图。'}</p><button type="button" onClick={restart}>重新加载</button></div>;
  return <div className="lesson-model-viewer" aria-label={`${node.title}三维研读`}>
    <div className="lesson-model-stage" aria-label="三维模型观察区域" data-rendered={rendered ? 'true' : 'false'}>
      {error ? fallback : model ? <ErrorBoundary resetKey={requestKey} onError={reportError} fallback={fallback}>
        <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 35, position: [4, 3, 6] }} gl={{ antialias: true }} fallback={fallback}
          onCreated={({ gl }) => {
            gl.domElement.setAttribute('aria-label', `${node.title}，可拖动旋转，滚轮或双指缩放，也可使用下方视角按钮`);
            gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); reportError(); }, { once: true });
          }}>
          <color attach="background" args={['#eef1f8']} />
          <ambientLight intensity={0.8} />
          <StudioEnvironment />
          <directionalLight position={[8, 12, 6]} intensity={2} color="#fffdf7" />
          <directionalLight position={[-5, 4, -3]} intensity={0.65} color="#dce8ee" />
          <ModelScene model={model} selected={selected} hidden={hidden} command={command} onSelect={setSelected} onReady={markRendered} onRenderError={reportError} />
          <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} />
        </Canvas>
      </ErrorBoundary> : <div className="lesson-model-loading" role="status"><span aria-hidden="true" />正在准备三维构造…</div>}
      {!error && model && !rendered && <div className="lesson-model-presenting" role="status">正在呈现模型…</div>}
      {!error && rendered && <div className="lesson-model-gesture" aria-hidden="true">拖动旋转 · 双指或滚轮缩放</div>}
    </div>
    {!error && <div className="lesson-model-controls" aria-label="模型视角控制">
      <button type="button" disabled={!rendered} onClick={() => act('fit')}>复位视角</button>
      <button type="button" disabled={!rendered} onClick={() => act('left')} aria-label="向左旋转模型">← 左转</button>
      <button type="button" disabled={!rendered} onClick={() => act('right')} aria-label="向右旋转模型">右转 →</button>
      <button type="button" disabled={!rendered} onClick={() => act('up')} aria-label="升高观察视角">俯看</button>
      <button type="button" disabled={!rendered} onClick={() => act('down')} aria-label="降低观察视角">仰看</button>
      <button type="button" disabled={!rendered} onClick={() => act('near')} aria-label="放大模型">＋ 放大</button>
      <button type="button" disabled={!rendered} onClick={() => act('far')} aria-label="缩小模型">－ 缩小</button>
    </div>}
    {model && !error && <div className="lesson-model-parts">
      {model.parts.length > 0 ? <>
        <div className="lesson-model-parts-heading"><strong>构件观察</strong><span aria-live="polite">{hidden.length ? `已隐藏 ${hidden.length} 项` : '点选构件，观察连接关系'}</span><button type="button" disabled={!rendered || (!hidden.length && !selected)} onClick={() => { setHidden([]); setSelected(''); }}>显示全部</button></div>
        <ul aria-label="可识别构件列表">{model.parts.map(part => <li key={part.id}>
          <button type="button" disabled={!rendered} className={`lesson-model-part${selected === part.id ? ' is-selected' : ''}`} aria-pressed={selected === part.id} onClick={() => { setSelected(selected === part.id ? '' : part.id); setHidden(previous => previous.filter(id => id !== part.id)); }}>{part.name}</button>
          <label><input type="checkbox" disabled={!rendered} checked={!hidden.includes(part.id)} onChange={event => { setHidden(previous => event.target.checked ? previous.filter(id => id !== part.id) : [...previous, part.id]); if (!event.target.checked && selected === part.id) setSelected(''); }} /><span>显示<span className="lesson-model-sr-only">{part.name}</span></span></label>
        </li>)}</ul>
      </> : <p className="lesson-model-parts-empty">此模型支持整体旋转观察；构件识读可对照本节构造图。</p>}
    </div>}
    <p className="lesson-model-note">模型用于观察构造关系，尺寸与做法以正文及设计条件为准。</p>
  </div>;
}

export default function LessonModelViewer({ nodeId }: { nodeId: string }) {
  const node = getNodeDefinition(nodeId);
  const [variantId, setVariantId] = useState('');
  if (!node) return <div className="lesson-model-fallback" role="status">此构造节点暂不可用，请继续阅读正文。</div>;
  const variants = node.variants ?? [];
  const variant = variants.find(item => item.id === variantId) ?? variants[0];
  return <div className="lesson-model-shell">
    {variants.length > 0 && <div className="lesson-model-variants" aria-label="构造方案选择">
      <label>观察方案 <select value={variant?.id} onChange={event => setVariantId(event.target.value)}>{variants.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {variant?.description && <p>{variant.description}</p>}
    </div>}
    <ViewerSession key={`${nodeId}:${variant?.id ?? 'single'}`} node={node} variant={variant} />
  </div>;
}
