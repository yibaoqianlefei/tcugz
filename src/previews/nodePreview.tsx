import { Component, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import StudioEnvironment from '../components/viewer/StudioEnvironment';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { isHitboxName } from '../utils/nameUtils';

const modelPath = `${import.meta.env.BASE_URL}models/roof/organized-drainage/organized-drainage.glb`;

function Model({ path, controls, onReady }: {
  path: string;
  controls: React.RefObject<OrbitControlsImpl | null>;
  onReady: () => void;
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

    // Preserve the current orbit direction when the sidebar or viewport resizes.
    const direction = fitted.current
      ? camera.position.clone().sub(controls.current?.target ?? center)
      : new THREE.Vector3(1, 0.72, 1.35);
    if (direction.lengthSq() < 1e-9) direction.set(1, 0.72, 1.35);
    camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
    camera.near = Math.max(0.01, distance - radius * 2.5);
    camera.far = distance + radius * 4;
    camera.updateProjectionMatrix();
    controls.current?.target.copy(center);
    controls.current?.update();
    fitted.current = true;
    invalidate();
    onReady();
  }, [camera, controls, invalidate, model, onReady, size.height, size.width]);
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
  const [slideActive, setSlideActive] = useState(true);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [spin, setSpin] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webgl] = useState(supportsWebGL);
  const controls = useRef<OrbitControlsImpl>(null);
  const markReady = useCallback(() => setReady(true), []);
  const pauseRotation = useCallback(() => {
    setSpin(false);
  }, []);
  const resumeRotation = useCallback(() => {
    setSpin(true);
  }, []);

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

  const available = webgl && !failed;
  const running = slideActive && inView;
  const rotating = spin && !reducedMotion;
  return (
    <>
      {available && <div className="node-model-stage">
        <ModelErrorBoundary onError={() => setFailed(true)}>
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
            <Suspense fallback={null}>
              <Model path={modelPath} controls={controls} onReady={markReady} />
            </Suspense>
            <OrbitControls ref={controls} enablePan={false} enableZoom={false} autoRotate={running && rotating} autoRotateSpeed={0.55} onStart={pauseRotation} onEnd={resumeRotation} />
          </Canvas>
        </ModelErrorBoundary>
      </div>}
      {(!ready || failed) && <span className="node-model-status" role="status">{failed || !webgl ? '模型暂不可用' : '模型加载中…'}</span>}
      {running && ready && <span className="node-model-hint">拖动查看模型</span>}
    </>
  );
}

export { NodePreview };
