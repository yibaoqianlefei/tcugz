import { useRef, useEffect, Suspense, useMemo, useCallback, useState, Component, type ReactNode } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { fitHomeSceneScale } from "../../utils/homeSceneFit";

/* ── Error Boundary (class component for GLB load failures) ── */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn("[MenuBackground] GLB load error:", error.message); }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

/* ── Placeholder when model fails ── */
function SceneModelPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      {/* 与 --color-surface-cream-strong 同步（原值为该 token 的旧值 #e6dfd8） */}
      <meshStandardMaterial color="#e8e0d2" wireframe />
    </mesh>
  );
}

/* ── Fallback cube during loading ── */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1.2, 1.2, 0.6]} />
      <meshStandardMaterial color="#cc785c" wireframe transparent opacity={0.3} depthWrite={false} />
    </mesh>
  );
}

/* ── Model Loader (auto-center + material fixes) ── */
function SceneModel({
  modelPath,
  onReady,
  onBounds,
}: {
  modelPath: string;
  onReady?: () => void;
  onBounds: (bounds: THREE.Box3) => void;
}) {
  const { scene } = useGLTF(modelPath, true); // Draco enabled

  const fixed = useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.renderOrder = 0;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          mat.depthWrite = true;
          mat.depthTest = true;
          mat.transparent = false;
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
          mat.needsUpdate = true;
        });
      }
    });

    cloned.position.set(-center.x, -center.y, -center.z);
    return { model: cloned, bounds: bbox.translate(center.negate()) };
  }, [scene]);

  useEffect(() => {
    if (!fixed) return;
    onBounds(fixed.bounds);
    onReady?.();
  }, [fixed, onBounds, onReady]);

  if (!fixed) return <LoadingFallback />;
  return <primitive object={fixed.model} />;
}

/* ── Shadow Light ── */
function ShadowLight({ showShadows }: { showShadows: boolean }) {
  return (
    <directionalLight
      position={[6, 10, 4]}
      intensity={2.4}
      color="#fffdf7"
      castShadow={showShadows}
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.5}
      shadow-camera-far={20}
      shadow-camera-left={-3}
      shadow-camera-right={3}
      shadow-camera-top={3}
      shadow-camera-bottom={-3}
      shadow-bias={-0.0002}
    />
  );
}

/* ── Renderer Setup ── */
function RendererSetup({ showShadows }: { showShadows: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    // Three.js WebGLRenderer is an imperative external object managed by R3F.
    // These assignments configure the renderer after Canvas creation — required by Three.js API.
    // eslint-disable-next-line react-hooks/immutability
    gl.shadowMap.enabled = showShadows;
    gl.shadowMap.type = THREE.PCFShadowMap;
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl, showShadows]);
  return null;
}

/* ── Shadow Plane ── */
function ShadowPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow renderOrder={1}>
      <planeGeometry args={[12, 12]} />
      <shadowMaterial opacity={0.2} transparent depthWrite={false} />
    </mesh>
  );
}

/* ── Pan-return constants ──────────────────────────────────── */

/** Home target — mirrors OrbitControls target prop. Only panning
 *  (which shifts both camera.position and controls.target equally)
 *  is restored; rotation and zoom are preserved. */
const HOME_TARGET = new THREE.Vector3(0, 0.5, 0);
const PAN_RETURN_SPEED = 10;
const PAN_EPSILON = 0.001;

/* ── Main Component ── */
interface MenuBackgroundProps {
  autoRotate?: boolean;
  modelPath?: string;
  position?: [number, number, number];
  onLoaded?: () => void;
  showShadows?: boolean;
}

function MenuBackground({
  autoRotate = true,
  modelPath = `${import.meta.env.BASE_URL}models/background/Exhibition model.glb`,
  position = [0, 0, 0],
  onLoaded,
  showShadows = true,
}: MenuBackgroundProps) {
  const { camera, gl, size } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [centeredBounds, setCenteredBounds] = useState<THREE.Box3 | null>(null);
  const lastFitRef = useRef({ width: 0, height: 0, bounds: null as THREE.Box3 | null });
  const groupPosition = useMemo(() => new THREE.Vector3(...position), [position]);
  const handleSceneReady = useCallback(() => onLoaded?.(), [onLoaded]);

  // ── Pan-return: restore target to centre while keeping rotation & zoom ──
  const isInteractingRef = useRef(false);
  const isPanReturningRef = useRef(false);
  const panOffsetRef = useRef(new THREE.Vector3());

  const handleStart = useCallback(() => {
    isInteractingRef.current = true;
    isPanReturningRef.current = false;
  }, []);

  const handleEnd = useCallback(() => {
    isInteractingRef.current = false;
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    if (ctrl.target.distanceTo(HOME_TARGET) > PAN_EPSILON) {
      isPanReturningRef.current = true;
    }
  }, []);

  // Pan-return useFrame: translate camera.position += step, controls.target += step
  useFrame((_, delta) => {
    if (isInteractingRef.current || !isPanReturningRef.current) return;
    const ctrl = controlsRef.current;
    const cam = ctrl?.object as THREE.PerspectiveCamera | undefined;
    if (!ctrl || !cam) return;

    const offset = panOffsetRef.current.copy(HOME_TARGET).sub(ctrl.target);
    const dist = offset.length();

    if (dist < PAN_EPSILON) {
      cam.position.add(offset); // apply final tiny residual
      ctrl.target.copy(HOME_TARGET);
      ctrl.update();
      isPanReturningRef.current = false;
      return;
    }

    const alpha = 1 - Math.exp(-PAN_RETURN_SPEED * Math.min(delta, 0.1));
    const step = offset.multiplyScalar(alpha);

    cam.position.add(step);
    ctrl.target.add(step);
    ctrl.update();
  });

  // Follow the *visible* canvas container on the same frame as the sidebar.
  // A React ResizeObserver update plus a second scale lerp used to lag behind
  // the 280 ms sidebar transition, temporarily clipping the model.
  useFrame(() => {
    const group = groupRef.current;
    if (!group || !centeredBounds) return;
    const container = gl.domElement.parentElement;
    const width = container?.clientWidth || size.width;
    const height = container?.clientHeight || size.height;
    const last = lastFitRef.current;
    if (width <= 0 || height <= 0 ||
      (Math.abs(width - last.width) < 0.5 && Math.abs(height - last.height) < 0.5 && last.bounds === centeredBounds)) return;

    group.scale.setScalar(fitHomeSceneScale(
      centeredBounds, groupPosition, camera as THREE.PerspectiveCamera, width, height,
    ));
    lastFitRef.current = { width, height, bounds: centeredBounds };
  });

  // Preload model
  useEffect(() => {
    useGLTF.preload(modelPath, true);
  }, [modelPath]);

  return (
    <>
      <RendererSetup showShadows={showShadows} />
      {/* 与 index.css 的 --color-canvas 保持一致（Three.js 无法直接消费 CSS 变量，
          此值需与 token 手工同步；原值 #faf9f5 是 token 改动前的旧值）。 */}
      <color attach="background" args={["#faf9f6"]} />

      <ambientLight intensity={1.2} color="#ffffff" />
      <ShadowLight showShadows={showShadows} />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d4e3f0" />

      {showShadows && <ShadowPlane />}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enablePan
        enableRotate
        enableZoom
        minDistance={0.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
        onStart={handleStart}
        onEnd={handleEnd}
      />

      <group ref={groupRef} position={position} scale={1.5}>
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={<SceneModelPlaceholder />}>
            <SceneModel modelPath={modelPath} onReady={handleSceneReady} onBounds={setCenteredBounds} />
          </ErrorBoundary>
        </Suspense>
      </group>
    </>
  );
}

export default MenuBackground;
