import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import StudioEnvironment from '../components/viewer/StudioEnvironment';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { isHitboxName } from '../utils/nameUtils';
import { getNodeDefinition } from '../data/nodeDefinitions';

const featuredNodes = [
  { id: 'organized-drainage-01', label: '有组织排水' },
  { id: 'vent-pipe-roof-01', label: '透气管出屋面' },
  { id: 'foam-insulation-01', label: '泡沫板外保温' },
  { id: 'rc-elevated-steps-01', label: '架空台阶' },
].map(feature => {
  const node = getNodeDefinition(feature.id);
  if (!node?.model) throw new Error(`Homepage model missing: ${feature.id}`);
  return { ...feature, title: node.title, category: node.category, path: node.model.path };
});

function Model({ path, controls, directions, onReady }: {
  path: string;
  controls: React.RefObject<OrbitControlsImpl | null>;
  directions: React.RefObject<Map<string, THREE.Vector3>>;
  onReady: (path: string) => void;
}) {
  const { scene } = useGLTF(path, true);
  const { model, outlines } = useMemo(() => {
    const model = scene.clone(true);
    const outlines: Array<{ geometry: THREE.EdgesGeometry; material: THREE.LineBasicMaterial }> = [];
    model.traverse(child => {
      if (!(child instanceof THREE.Mesh)) return;
      if (isHitboxName(child.name)) {
        child.visible = false;
        return;
      }
      // Match the edge treatment used in the full node interaction viewer.
      const geometry = new THREE.EdgesGeometry(child.geometry, 15);
      const material = new THREE.LineBasicMaterial({ color: '#1a1a1a', toneMapped: false, transparent: true, opacity: 0.85 });
      const line = new THREE.LineSegments(geometry, material);
      line.raycast = () => {};
      child.add(line);
      outlines.push({ geometry, material });
    });
    return { model, outlines };
  }, [scene]);
  const { camera, size, invalidate } = useThree();
  const fitted = useRef(false);

  useEffect(() => () => {
    outlines.forEach(({ geometry, material }) => {
      geometry.dispose();
      material.dispose();
    });
  }, [outlines]);

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
    const distance = radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.12;
    const orbit = controls.current;
    const savedDirections = directions.current;

    // Preserve the current orbit direction when the sidebar or viewport resizes.
    const direction = fitted.current
      ? camera.position.clone().sub(orbit?.target ?? center)
      : savedDirections.get(path)?.clone() ?? new THREE.Vector3(1, 0.72, 1.35);
    if (direction.lengthSq() < 1e-9) direction.set(1, 0.72, 1.35);
    if (orbit) {
      // Clear residual drag inertia before fitting a different model or size.
      const damping = orbit.enableDamping;
      orbit.enableDamping = false;
      orbit.update();
      orbit.enableDamping = damping;
    }
    camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
    camera.near = Math.max(0.01, distance - radius * 2.5);
    camera.far = distance + radius * 4;
    camera.updateProjectionMatrix();
    orbit?.target.copy(center);
    orbit?.update();
    fitted.current = true;
    invalidate();
    onReady(path);
    return () => {
      // Retain each model's latest orbit when switching models or resizing.
      savedDirections.set(path, camera.position.clone().sub(orbit?.target ?? center).normalize());
    };
  }, [camera, controls, directions, invalidate, model, onReady, path, size.height, size.width]);
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
  const [webgl] = useState(supportsWebGL);
  const controls = useRef<OrbitControlsImpl>(null);
  const directions = useRef(new Map<string, THREE.Vector3>());
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

  const ready = readyPath === selected.path;
  const failed = failedPath === selected.path;
  const running = slideActive && inView;
  const rotating = spin && !reducedMotion;
  return (
    <>
      <div className="showcase-top"><span><i className="showcase-mark" /> NODE LIBRARY</span><span>{selected.category} · 3D</span></div>
      {webgl && <div className="node-model-stage" data-model-ready={ready && !failed}>
          <Canvas
            camera={{ fov: 35, position: [4, 3, 6] }}
            dpr={[1, 1.5]}
            frameloop={running && rotating ? 'always' : 'demand'}
            gl={{ antialias: true, alpha: true }}
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
                <Model key={selected.path} path={selected.path} controls={controls} directions={directions} onReady={markReady} />
              </Suspense>
            </ModelErrorBoundary>
            <OrbitControls ref={registerControls} enablePan={false} enableZoom={false} autoRotate={running && rotating} autoRotateSpeed={0.55} onStart={pauseRotation} onEnd={resumeRotation} />
          </Canvas>
      </div>}
      {(!ready || failed || !webgl) && <span className="node-model-status" role="status">{failed || !webgl ? '模型暂不可用，可打开节点查看' : '模型加载中…'}</span>}
      <div className="node-model-footer">
        <div className="node-model-controls" role="group" aria-label="切换首页模型">
          <button type="button" aria-label="上一个模型" onClick={() => setSelectedIndex(index => (index + featuredNodes.length - 1) % featuredNodes.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button>
          <button type="button" aria-label="下一个模型" onClick={() => setSelectedIndex(index => (index + 1) % featuredNodes.length)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button>
        </div>
        <div className="node-model-caption">
          <div aria-live="polite"><span>{selected.category} · 构造节点</span><strong>{selectedIndex === 0 ? selected.label : selected.title}</strong></div>
          <a href={`${import.meta.env.BASE_URL}#/node/${selected.id}`}>打开节点</a>
        </div>
      </div>
    </>
  );
}

export { NodePreview };
