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
import { fitHomepageModelOrbit } from '../utils/homepageModelFit';

const featuredNodeId = 'water-storage-eaves-drainage-01';
const featuredNodeDefinition = getNodeDefinition(featuredNodeId);
if (!featuredNodeDefinition?.model) throw new Error(`Homepage model missing: ${featuredNodeId}`);
const featuredNode = {
  id: featuredNodeId,
  label: '蓄水屋面（檐沟式排水）',
  summary: '通过溢水孔与泄水孔，将蓄水屋面的水引入檐沟和水落管。',
  category: featuredNodeDefinition.category,
  path: featuredNodeDefinition.model.path,
  outlineExcluded: featuredNodeDefinition.model.outlineExcluded,
};

const AUTO_ROTATE_SPEED = 0.55;
// Start above the open gutter so its outlet and the roof basin are visible together.
const INITIAL_VIEW_DIRECTION: [number, number, number] = [-0.55, 0.33, 1];

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

function Model({ path, onReady, outlineExcluded }: {
  path: string;
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
  const orbit = useThree(state => state.controls) as OrbitControlsImpl | null;
  const fitted = useRef(false);

  useEffect(() => () => {
    outlines.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
    materials.forEach(material => material.dispose());
  }, [outlines, materials]);

  /* eslint-disable react-hooks/immutability -- Three.js camera and OrbitControls are imperative scene objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !orbit) return;
    const fit = fitHomepageModelOrbit(model, size.width, size.height, camera.fov);
    if (!fit) return;

    // Settle drag inertia before measuring the retained viewing direction.
    const damping = orbit.enableDamping;
    orbit.enableDamping = false;
    orbit.update();
    orbit.enableDamping = damping;
    const direction = fitted.current
      ? camera.position.clone().sub(orbit.target)
      : new THREE.Vector3(...INITIAL_VIEW_DIRECTION);
    if (direction.lengthSq() < 1e-9) direction.set(...INITIAL_VIEW_DIRECTION);
    camera.position.copy(fit.center).add(direction.normalize().multiplyScalar(fit.distance));
    camera.near = fit.near;
    camera.far = fit.far;
    camera.updateProjectionMatrix();
    orbit.target.copy(fit.center);
    orbit.minDistance = fit.distance;
    orbit.maxDistance = fit.distance;
    orbit.update();
    fitted.current = true;
    invalidate();
    onReady(path);
  }, [camera, orbit, invalidate, model, onReady, path, size.height, size.width]);
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
  const selected = featuredNode;
  const [slideActive, setSlideActive] = useState(true);
  const [inView, setInView] = useState(true);
  const [readyPath, setReadyPath] = useState('');
  const [failedPath, setFailedPath] = useState('');
  const [spin, setSpin] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const [webgl] = useState(supportsWebGL);
  const controls = useRef<OrbitControlsImpl>(null);
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
      <div className="node-model-heading-space" aria-hidden="true" />
      {webgl && <div className="node-model-stage" data-model-ready={ready && !failed}>
          <Canvas
            camera={{ fov: 35, position: INITIAL_VIEW_DIRECTION }}
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
                <Model key={selected.path} path={selected.path} onReady={markReady} outlineExcluded={selected.outlineExcluded} />
              </Suspense>
            </ModelErrorBoundary>
            <MotionTiming controls={controls} />
            <OrbitControls ref={registerControls} makeDefault enablePan={false} enableZoom={false} autoRotate={running && rotating} autoRotateSpeed={AUTO_ROTATE_SPEED} onStart={pauseRotation} onEnd={resumeRotation} />
          </Canvas>
      </div>}
      {(!ready || failed || !webgl) && <span className="node-model-status" role="status">{failed || !webgl ? '模型暂不可用，可打开节点查看' : '模型加载中…'}</span>}
      <div className="node-model-footer">
        {/* Preserve the original caption footprint so text changes cannot resize the artwork or viewer. */}
        <div className="node-model-size" aria-hidden="true" inert>
          <div className="node-model-size-caption"><div><span>{selected.category} · 构造节点</span><strong>{selected.label}</strong></div><i /></div>
          <span className="node-model-size-summary">{selected.summary}</span>
        </div>
        <div className="node-model-copy">
          <h3 className="node-model-title" aria-label={selected.label}>蓄水屋面<span className="node-model-name-detail">（檐沟式排水）</span></h3>
        </div>
      </div>
    </>
  );
}

export { NodePreview };
