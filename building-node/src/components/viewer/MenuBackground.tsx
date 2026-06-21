import { useRef, useEffect, Suspense, useMemo, useCallback, Component } from "react";
import { useThree } from "@react-three/fiber";
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
function ShadowLight() {
  return (
    <directionalLight
      position={[6, 10, 4]}
      intensity={2.4}
      color="#fffdf7"
      castShadow
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
function RendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl]);
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

/* ── Main Component ── */
interface MenuBackgroundProps {
  autoRotate?: boolean;
  modelPath?: string;
  position?: [number, number, number];
  onLoaded?: () => void;
}

function MenuBackground({
  autoRotate = true,
  modelPath = "/models/Exhibition model.glb",
  position = [0, 0, 0],
  onLoaded,
}: MenuBackgroundProps) {
  const groupRef = useRef<THREE.Group>(null);
  const handleSceneReady = useCallback(() => onLoaded?.(), [onLoaded]);

  // Preload model
  useEffect(() => {
    useGLTF.preload(modelPath, true);
  }, [modelPath]);

  return (
    <>
      <RendererSetup />
      <color attach="background" args={["#faf9f5"]} />

      <ambientLight intensity={1.2} color="#ffffff" />
      <ShadowLight />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d4e3f0" />

      <ShadowPlane />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        minDistance={0.5}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
      />

      <group ref={groupRef} position={position} scale={1.5}>
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
