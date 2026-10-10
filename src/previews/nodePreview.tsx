import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import StudioEnvironment from '../components/viewer/StudioEnvironment';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { canonicalName, isHitboxName } from '../utils/nameUtils';
import { getNodeDefinition } from '../data/nodeDefinitions';
import { useCompanionStore } from '../store/companionStore';
import { collectOutlineSources, createFeatureEdges, separateOpaqueSurfaceDepth } from '../utils/modelOutlines';

const featuredNodes = [
  { id: 'water-storage-eaves-drainage-01', label: '蓄水屋面（檐沟式排水）', initialZoomRatio: 0.9, summary: '通过溢水孔与泄水孔，将蓄水屋面的水引入檐沟和水落管。' },
  { id: 'organized-drainage-01', label: '有组织排水', initialZoomRatio: 0.9, summary: '通过天沟、雨水斗与落水管，将屋面雨水集中排出。' },
  { id: 'vent-pipe-roof-01', label: '透气管出屋面', summary: '观察透气管穿出屋面时，管根防水与金属罩的连接。' },
  { id: 'foam-insulation-01', label: '泡沫板外保温', summary: '保温板粘贴并锚固于外墙，外覆增强网与抹面饰层。' },
  { id: 'rc-elevated-steps-01', label: '架空台阶', summary: '由独立基础支撑踏步与平台，观察台阶下方的架空构造。' },
].map(feature => {
  const node = getNodeDefinition(feature.id);
  if (!node?.model) throw new Error(`Homepage model missing: ${feature.id}`);
  return { ...feature, initialZoomRatio: feature.initialZoomRatio ?? 1, title: node.title, category: node.category, path: node.model.path, outlineExcluded: node.model.outlineExcluded };
});

const MIN_ZOOM_DISTANCE_RATIO = 0.75;
const MAX_ZOOM_DISTANCE_RATIO = 1.3;
const MODEL_DISPLAY_SCALE = 1.25;
const AUTO_ROTATE_SPEED = 0.55;
type ModelView = { direction: THREE.Vector3; zoomRatio: number };

/* eslint-disable react-hooks/immutability -- OrbitControls is an imperative scene controller. */
function MotionTiming({ controls }: { controls: React.RefObject<OrbitControlsImpl | null> }) {
  useFrame((_, delta) => {
    const orbit = controls.current;
    if (!orbit) return;
    // three-stdlib OrbitControls assumes 60 updates/second. Account for
    // elapsed time before Drei updates it, without jumping after a hidden tab.
    const frameUnits = Math.min(delta, 1 / 15) * 60;
    orbit.autoRotateSpeed = AUTO_ROTATE_SPEED * frameUnits;
    orbit.dampingFactor = 1 - Math.pow(1 - 0.08, frameUnits);
  }, -2);
  return null;
}
/* eslint-enable react-hooks/immutability */

function Model({ path, initialZoomRatio, controls, views, onReady, outlineExcluded }: {
  path: string;
  initialZoomRatio: number;
  controls: React.RefObject<OrbitControlsImpl | null>;
  views: React.RefObject<Map<string, ModelView>>;
  onReady: (path: string) => void;
  outlineExcluded?: readonly string[];
}) {
  const { scene } = useGLTF(path, true);
  const { model, outlines, materials } = useMemo(() => {
    const model = scene.clone(true);
    const outlines: Array<{ geometry: THREE.BufferGeometry; material: THREE.LineBasicMaterial }> = [];
    const materials = new Map<THREE.Material, THREE.Material>();
    const edges: THREE.BufferGeometry[] = [];
    model.updateMatrixWorld(true);
    const toModelSpace = model.matrixWorld.clone().invert();
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      if (isHitboxName(child.name)) {
        child.visible = false;
        return;
      }
      const prepareMaterial = (source: THREE.Material) => {
        let owned = materials.get(source);
        if (!owned) {
          owned = source.clone();
          // Separate surface depth from its coplanar outline. Cached GLTF
          // materials remain untouched for the interactive node workbench.
          separateOpaqueSurfaceDepth(owned);
          materials.set(source, owned);
        }
        return owned;
      };
      child.material = Array.isArray(child.material) ? child.material.map(prepareMaterial) : prepareMaterial(child.material);
    });
    for (const { owner, meshes } of collectOutlineSources(model, outlineExcluded, canonicalName)) {
      const geometry = createFeatureEdges(meshes.map(mesh => mesh.geometry));
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toModelSpace, owner.matrixWorld));
      edges.push(geometry);
    }
    // The homepage model is static; all authored edges can share one draw.
    // Opaque, non-writing lines avoid transparent sorting and depth artifacts.
    if (edges.length) {
      const geometry = mergeGeometries(edges);
      if (!geometry) throw new Error('Homepage outlines could not be merged');
      const material = new THREE.LineBasicMaterial({ color: '#383c44', toneMapped: false, depthWrite: false });
      const line = new THREE.LineSegments(geometry, material);
      line.renderOrder = 1;
      line.raycast = () => {};
      model.add(line);
      outlines.push({ geometry, material });
    }
    edges.forEach(geometry => geometry.dispose());
    return { model, outlines, materials };
  }, [scene, outlineExcluded]);
  const { camera, size, invalidate } = useThree();
  const fitted = useRef(false);
  const fitDistance = useRef(0);

  useEffect(() => () => {
    outlines.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
    materials.forEach(material => material.dispose());
  }, [outlines, materials]);

  /* eslint-disable react-hooks/immutability -- Three.js camera and OrbitControls are imperative scene objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || size.width < 1 || size.height < 1) return;

    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    if (bounds.isEmpty()) return;

    const center = bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(bounds.getBoundingSphere(new THREE.Sphere()).radius, 0.01);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * (size.width / size.height));
    const distance = radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.12 / MODEL_DISPLAY_SCALE;
    const orbit = controls.current;
    const savedViews = views.current;
    const savedView = savedViews.get(path);

    // Preserve orbit and relative zoom when the sidebar or viewport resizes.
    const direction = fitted.current
      ? camera.position.clone().sub(orbit?.target ?? center)
      : savedView?.direction.clone() ?? new THREE.Vector3(0, 0, 1);
    const zoomRatio = THREE.MathUtils.clamp(
      fitted.current && fitDistance.current > 0 ? direction.length() / fitDistance.current : savedView?.zoomRatio ?? initialZoomRatio,
      MIN_ZOOM_DISTANCE_RATIO,
      MAX_ZOOM_DISTANCE_RATIO,
    );
    if (direction.lengthSq() < 1e-9) direction.set(0, 0, 1);
    if (orbit) {
      // Clear residual drag inertia before fitting a different model or size.
      const damping = orbit.enableDamping;
      orbit.enableDamping = false;
      orbit.update();
      orbit.enableDamping = damping;
      orbit.minDistance = distance * MIN_ZOOM_DISTANCE_RATIO;
      orbit.maxDistance = distance * MAX_ZOOM_DISTANCE_RATIO;
    }
    camera.position.copy(center).add(direction.normalize().multiplyScalar(distance * zoomRatio));
    // Bound the clipping range to every allowed zoom, improving precision
    // between thin, adjacent roof layers without clipping the full model.
    camera.near = Math.max(radius * 0.01, distance * MIN_ZOOM_DISTANCE_RATIO - radius * 1.15);
    camera.far = distance * MAX_ZOOM_DISTANCE_RATIO + radius * 1.15;
    camera.updateProjectionMatrix();
    orbit?.target.copy(center);
    orbit?.update();
    fitted.current = true;
    fitDistance.current = distance;
    invalidate();
    onReady(path);
    return () => {
      // Retain each model's latest view when switching models or resizing.
      const offset = camera.position.clone().sub(orbit?.target ?? center);
      savedViews.set(path, { direction: offset.clone().normalize(), zoomRatio: offset.length() / distance });
    };
  }, [camera, controls, views, initialZoomRatio, invalidate, model, onReady, path, size.height, size.width]);
  /* eslint-enable react-hooks/immutability */

  return <primitive object={model} dispose={null} />;
}

class ModelErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const supported = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return supported;
  } catch {
    return false;
  }
}

function NodePreview({ visual }: { visual: HTMLElement }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = featuredNodes[selectedIndex];
  const [slideActive, setSlideActive] = useState(true);
  const [inView, setInView] = useState(true);
  const [readyPath, setReadyPath] = useState('');
  const [failedPath, setFailedPath] = useState('');
  const [spin, setSpin] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [webgl] = useState(supportsWebGL);
  const controls = useRef<OrbitControlsImpl>(null);
  const views = useRef(new Map<string, ModelView>());
  const markReady = useCallback((path: string) => setReadyPath(path), []);
  const registerControls = useCallback((value: OrbitControlsImpl | null) => {
    controls.current = value;
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__homepageModelControls = value;
  }, []);
  const pauseRotation = useCallback(() => {
    setSpin(false);
  }, []);
  const resumeRotation = useCallback(() => {
    setSpin(true);
  }, []);

  useLayoutEffect(() => {
    const link = visual.closest('.hero-slide')?.querySelector<HTMLAnchorElement>('[data-home-node-link]');
    if (link) link.href = `${import.meta.env.BASE_URL}#/node/${selected.id}`;
    useCompanionStore.getState().setHomeNodeId(selected.id);
  }, [selected.id, visual]);

  useEffect(() => {
    const onHeroChange = (event: Event) => setSlideActive((event as CustomEvent<number>).detail === 0);
    window.addEventListener('preview-hero-change', onHeroChange);
    return () => {
      window.removeEventListener('preview-hero-change', onHeroChange);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(visual);
    return () => observer.disconnect();
  }, [visual]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  const ready = readyPath === selected.path;
  const failed = failedPath === selected.path;
  const running = slideActive && inView && pageVisible;
  const rotating = spin && !reducedMotion;
  return (
    <>
      <div className="showcase-top"><span><i className="showcase-mark" /> NODE LIBRARY</span><span>{selected.category} · 3D</span></div>
      {webgl && <div className="node-model-stage" data-model-ready={ready && !failed}>
          <Canvas
            camera={{ fov: 35, position: [4, 3, 6] }}
            dpr={[1, 1.25]}
            frameloop={running && rotating ? 'always' : 'demand'}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1;
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.setClearColor('#e2e9f4', 0);
            }}
          >
            <ambientLight intensity={0.6} />
            <StudioEnvironment />
            <directionalLight position={[8, 12, 6]} intensity={2.5} color="#fffdf7" />
            <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d4e3f0" />
            {/* Keep GLTF suspension inside the scene so Canvas stays mounted while loading. */}
            <ModelErrorBoundary key={selected.path} onError={() => setFailedPath(selected.path)}>
              <Suspense fallback={null}>
                <Model key={selected.path} path={selected.path} initialZoomRatio={selected.initialZoomRatio} controls={controls} views={views} onReady={markReady} outlineExcluded={selected.outlineExcluded} />
              </Suspense>
            </ModelErrorBoundary>
            <MotionTiming controls={controls} />
            <OrbitControls ref={registerControls} enablePan={false} enableZoom={ready && !failed} zoomSpeed={0.6} autoRotate={running && rotating} autoRotateSpeed={AUTO_ROTATE_SPEED} onStart={pauseRotation} onEnd={resumeRotation} />
          </Canvas>
      </div>}
      {(!ready || failed || !webgl) && <span className="node-model-status" role="status">{failed || !webgl ? '模型暂不可用，可打开节点查看' : '模型加载中…'}</span>}
      <div className="node-model-footer">
        <div className="node-model-controls" role="group" aria-label="切换首页模型">
          <button type="button" aria-label="上一个模型" onClick={() => setSelectedIndex(index => (index + featuredNodes.length - 1) % featuredNodes.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
          <div className="node-model-index" aria-live="polite" aria-label={`第 ${selectedIndex + 1} 个模型，共 ${featuredNodes.length} 个`}>
            <span className="node-model-index-current">{String(selectedIndex + 1).padStart(2, '0')}</span>
            <span className="node-model-index-divider" aria-hidden="true" />
            <span className="node-model-index-total">{String(featuredNodes.length).padStart(2, '0')}</span>
          </div>
          <button type="button" aria-label="下一个模型" onClick={() => setSelectedIndex(index => (index + 1) % featuredNodes.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button>
        </div>
        <div className="node-model-caption">
          <div aria-live="polite"><span>{selected.category} · 构造节点</span><strong>{selectedIndex === 0 ? selected.label : selected.title}</strong></div>
          <a href={`${import.meta.env.BASE_URL}#/node/${selected.id}`}>打开节点</a>
        </div>
        <p className="node-model-summary">{selected.summary}</p>
      </div>
    </>
  );
}

export { NodePreview };
