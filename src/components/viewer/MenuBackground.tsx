import { useRef, useEffect, Suspense, useMemo, useCallback, Component } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/* ── Error Boundary (class component for GLB load failures) ── */
class ErrorBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
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
      <meshStandardMaterial color="#e6dfd8" wireframe />
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
function SceneModel({ modelPath, onReady }: { modelPath: string; onReady?: () => void }) {
  const { scene } = useGLTF(modelPath, true); // Draco enabled

  useEffect(() => { if (scene) onReady?.(); }, [scene, onReady]);

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
          (mat as any).transparent = false;
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
          mat.needsUpdate = true;
        });
      }
    });

    cloned.position.set(-center.x, -center.y, -center.z);
    return cloned;
  }, [scene]);

  if (!fixed) return <LoadingFallback />;
  return <primitive object={fixed} />;
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
    gl.shadowMap.enabled = showShadows;
    gl.shadowMap.type = THREE.PCFShadowMap;
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

/* ── Canvas resize handler ─────────────────────────────────── */
function ResizeWatcher({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { size } = useThree();
  useEffect(() => {
    if (controlsRef.current) {
      const t = setTimeout(() => controlsRef.current.update(), 60);
      return () => clearTimeout(t);
    }
  }, [size.width, size.height, controlsRef]);
  return null;
}

/* ── Main Component ── */
interface MenuBackgroundProps {
  autoRotate?: boolean;
  modelPath?: string;
  position?: [number, number, number];
  onLoaded?: () => void;
  showShadows?: boolean;
  layoutKey?: number;
  containerWidth?: number;
}

function MenuBackground({
  autoRotate = true,
  modelPath = `${import.meta.env.BASE_URL}models/background/Exhibition model.glb`,
  position = [0, 0, 0],
  onLoaded,
  showShadows = true,
  layoutKey = 0,
  containerWidth = 0,
}: MenuBackgroundProps) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const handleSceneReady = useCallback(() => onLoaded?.(), [onLoaded]);

  // Viewport-responsive scale: capture initial width as baseline, adjust ratio on resize
  const baseScale = 1.5;
  const initialWidthRef = useRef(0);
  if (containerWidth > 0 && initialWidthRef.current === 0) {
    initialWidthRef.current = containerWidth;
  }
  const refWidth = initialWidthRef.current || containerWidth || 1200;
  const ratio = containerWidth > 0 ? Math.min(1, Math.max(0.4, containerWidth / refWidth)) : 1;
  const targetScale = baseScale * ratio;

  // Smooth lerp scale on each frame (avoids jank)
  useFrame((_, delta) => {
    if (groupRef.current) {
      const current = groupRef.current.scale.x;
      const next = current + (targetScale - current) * Math.min(delta * 6, 1);
      if (Math.abs(next - current) > 0.0005) {
        groupRef.current.scale.setScalar(next);
      }
    }
  });

  // Preload model
  useEffect(() => {
    useGLTF.preload(modelPath, true);
  }, [modelPath]);

  // Force camera re-center on layout change (sidebar expand/collapse)
  useEffect(() => {
    if (controlsRef.current) {
      // Small delay to let the canvas resize complete
      const t = setTimeout(() => {
        controlsRef.current?.update();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [layoutKey]);

  return (
    <>
      <RendererSetup showShadows={showShadows} />
      <ResizeWatcher controlsRef={controlsRef} />
      <color attach="background" args={["#faf9f5"]} />

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
        minDistance={0.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
      />

      <group ref={groupRef} position={position} scale={baseScale}>
        <Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary fallback={<SceneModelPlaceholder />}>
            <SceneModel modelPath={modelPath} onReady={handleSceneReady} />
          </ErrorBoundary>
        </Suspense>
      </group>
    </>
  );
}

export default MenuBackground;
