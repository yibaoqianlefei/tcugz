import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useNodeStore } from "../../store/nodeStore";

/* ── Module-level refs for external animation control ──────── */
let _actions: THREE.AnimationAction[] = [];
let _clip: THREE.AnimationClip | null = null;

export const animControls = {
  play() {
    _actions.forEach((a) => { a.paused = false; });
    if (_actions.length > 0) useNodeStore.getState().setIsPlaying(true);
  },

  pause() {
    _actions.forEach((a) => { a.paused = true; });
    useNodeStore.getState().setIsPlaying(false);
  },

  reset() {
    _actions.forEach((a) => {
      a.time = 0;
      a.paused = true;
      a.getMixer().update(0);
    });
    useNodeStore.getState().setIsPlaying(false);
  },

  expand() {
    _actions.forEach((a) => {
      a.time = _clip?.duration ?? a.time;
      a.paused = true;
      a.getMixer().update(0);
    });
    useNodeStore.getState().setIsPlaying(false);
  },

  setTime(t: number) {
    _actions.forEach((a) => {
      a.time = t;
      a.getMixer().update(0);
    });
  },
};

/* ── Renderer setup ───────────────────────────────────────── */
function RendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

/* ── Model component (auto-center + highlight + animation) ──── */
function SceneModel() {
  const { scene, animations } = useGLTF("/models/roof-drainage/roof-drainage.glb", true);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionRef = useRef<THREE.AnimationAction | null>(null);
  const clipRef = useRef<THREE.AnimationClip | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const prevHovered = useRef<string | null>(null);
  const prevSelected = useRef<string | null>(null);

  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const setHoveredObject = useNodeStore((s) => s.setHoveredObject);
  const setIsPlaying = useNodeStore((s) => s.setIsPlaying);
  const setAnimationProgress = useNodeStore((s) => s.setAnimationProgress);

  // ── Standard initialization (V1.1.1) ──────────────────────
  useEffect(() => {
    if (!scene) return;

    // Debug: log animation info
    console.log("[GLB] animations:", animations);
    console.log("[GLB] animations.length:", animations.length);
    if (animations.length > 0) {
      console.log("[GLB] clip:", animations[0]);
      console.log("[GLB] clip.name:", animations[0]?.name);
      console.log("[GLB] clip.duration:", animations[0]?.duration);
      console.log("[GLB] tracks:", animations[0]?.tracks);
      console.log("[GLB] tracks.length:", animations[0]?.tracks?.length);
    }

    // Auto-center via Box3
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.set(-center.x, -center.y, -center.z);

    // Build mesh map + apply shadow flags (one-time)
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.name) meshMapRef.current.set(child.name, child);
      }
    });

    // AnimationMixer — play ALL clips simultaneously
    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      const actions: THREE.AnimationAction[] = [];

      animations.forEach((clip, i) => {
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.paused = false;
        action.play();
        actions.push(action);
        console.log(`[GLB] clip[${i}] "${clip.name}" playing, duration=${clip.duration}`);
      });

      mixerRef.current = mixer;
      actionRef.current = actions[0];
      clipRef.current = animations.reduce((a, b) => a.duration > b.duration ? a : b);
      _actions = actions;
      _clip = clipRef.current;

      setIsPlaying(true);
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(scene);
      }
      _actions = [];
      _clip = null;
    };
  }, [scene, animations, setIsPlaying]);

  // ── Per-frame: mixer update (clamped delta) ─────────────────
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(Math.min(delta, 0.033));
      if (clipRef.current && actionRef.current) {
        setAnimationProgress(
          Math.min(actionRef.current.time / clipRef.current.duration, 1)
        );
      }
    }
  });

  // Subscribe to store changes for highlight updates
  const hoveredObject = useNodeStore((s) => s.hoveredObject);
  const selectedObject = useNodeStore((s) => s.selectedObject);

  // ── Apply highlights whenever hover/selected changes ──
  useEffect(() => {
    // Restore previous hover
    if (prevHovered.current && prevHovered.current !== selectedObject) {
      const mesh = meshMapRef.current.get(prevHovered.current);
      if (mesh) {
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
        mats.forEach((m) => { m.emissive?.set("#000000"); m.emissiveIntensity = 0; });
      }
    }
    // Restore previous selected
    if (prevSelected.current && prevSelected.current !== selectedObject) {
      const mesh = meshMapRef.current.get(prevSelected.current);
      if (mesh && prevSelected.current !== hoveredObject) {
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
        mats.forEach((m) => { m.emissive?.set("#000000"); m.emissiveIntensity = 0; });
      }
    }

    // Apply selected (highest priority)
    if (selectedObject) {
      const mesh = meshMapRef.current.get(selectedObject);
      if (mesh) {
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
        mats.forEach((m) => { m.emissive?.set("#cc785c"); m.emissiveIntensity = 0.4; });
      }
    }

    // Apply hover (lower priority, only if not selected)
    if (hoveredObject && hoveredObject !== selectedObject) {
      const mesh = meshMapRef.current.get(hoveredObject);
      if (mesh) {
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshStandardMaterial[];
        mats.forEach((m) => { m.emissive?.set("#ffffff"); m.emissiveIntensity = 0.15; });
      }
    }

    prevHovered.current = hoveredObject;
    prevSelected.current = selectedObject;
  }, [hoveredObject, selectedObject]);

  // ── R3F native pointer events (NO window listeners) ──
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (e.object instanceof THREE.Mesh && e.object.name) {
      setHoveredObject(e.object.name);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredObject(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.object instanceof THREE.Mesh && e.object.name) {
      const current = useNodeStore.getState().selectedObject;
      setSelectedObject(current === e.object.name ? null : e.object.name);
    }
  };

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <primitive object={scene} />
    </group>
  );
}

/* ── Lighting ─────────────────────────────────────────────── */
function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight
        position={[8, 12, 6]} intensity={2.5} color="#fffdf7"
        castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={0.5} shadow-camera-far={30}
        shadow-camera-left={-6} shadow-camera-right={6}
        shadow-camera-top={6} shadow-camera-bottom={-6}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#d4e3f0" />
    </>
  );
}

/* ── Ground shadow ────────────────────────────────────────── */
function ShadowPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <shadowMaterial opacity={0.25} transparent depthWrite={false} />
    </mesh>
  );
}

/* ── Loading fallback ─────────────────────────────────────── */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#bfb9ae" roughness={0.6} wireframe />
    </mesh>
  );
}

/* ── Public component ─────────────────────────────────────── */
export default function ModelViewer({ autoRotate = true }: { autoRotate?: boolean }) {
  return (
    <div className="flex-1 h-full relative bg-[#f5f5f7]">
      <Canvas
        camera={{ near: 0.5, far: 50, position: [4, 3, 5], fov: 40 }}
        dpr={[1, 1.5]} shadows
        gl={{ antialias: true, alpha: false }}
      >
        <RendererSetup />
        <color attach="background" args={["#f5f5f7"]} />
        <SceneLights />
        <ShadowPlane />
        <Suspense fallback={<LoadingFallback />}>
          <SceneModel />
        </Suspense>
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping dampingFactor={0.08}
          minDistance={1} maxDistance={15}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  );
}
