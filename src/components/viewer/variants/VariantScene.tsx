import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { NodeModelVariant } from "./variantTypes";
import VariantModel from "./VariantModel";
import type { VariantModelInfo } from "./VariantModel";
import { useVariantLayout } from "./useVariantLayout";

/* ═══════════════════════════════════════════════════════════════
   VariantScene — single Canvas containing N variant models with
   shared camera, lights, and OrbitControls.
   ═══════════════════════════════════════════════════════════════ */

let _controls: OrbitControlsImpl | null = null;

interface Props {
  variants: NodeModelVariant[];
  resetToken: number;
  onLoadProgress?: (count: number) => void;
}

export default function VariantScene({ variants, resetToken, onLoadProgress }: Props) {
  /** Force fresh VariantModel clones on StrictMode remount.
   *  r3f's forceContextLoss() during cleanup permanently destroys
   *  the WebGL context. Textures in cached useGLTF results become
   *  invalid. A changing key forces React to create new VariantModel
   *  instances with fresh clones (and fresh texture references). */
  const mountStamp = useRef(0);
  // eslint-disable-next-line react-hooks/refs
  mountStamp.current += 1;
  // eslint-disable-next-line react-hooks/refs
  const stamp = mountStamp.current;

  return (
    <div className="flex-1 relative bg-[#f5f5f7]">
      <Canvas
        camera={{ near: 0.5, far: 50, position: [0, 0, 8], fov: 40 }}
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <SceneContent
          variants={variants}
          resetToken={resetToken}
          onLoadProgress={onLoadProgress}
          mountStamp={stamp}
        />
        <OrbitControls
          ref={(ctrl) => { _controls = ctrl; }}
          enableDamping dampingFactor={0.08}
          enableRotate enableZoom enablePan
          minDistance={0.5} maxDistance={50}
          maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
}

function RenderSetup() {
  const { gl } = useThree();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

function SceneContent({
  variants, resetToken, onLoadProgress, mountStamp,
}: {
  variants: NodeModelVariant[];
  resetToken: number;
  onLoadProgress?: (count: number) => void;
  mountStamp: number;
}) {
  const [modelReports, setModelReports] = useState<Map<string, VariantModelInfo>>(() => new Map());

  const handleModelReady = useCallback((info: VariantModelInfo) => {
    setModelReports((prev) => {
      const next = new Map(prev);
      next.set(info.variantId, info);
      if (onLoadProgress) onLoadProgress(next.size);
      return next;
    });
  }, [onLoadProgress]);

  const variantOrder = variants.map((v) => v.id);
  const layout = useVariantLayout(modelReports, variantOrder);

  const cameraAdapted = useRef(false);
  const prevResetToken = useRef(resetToken);
  const prevLayout = useRef(layout);
  const lastControlsRef = useRef<OrbitControlsImpl | null>(null);

  useLayoutEffect(() => {
    if (resetToken !== prevResetToken.current) { prevResetToken.current = resetToken; cameraAdapted.current = false; }
    if (layout !== prevLayout.current) { prevLayout.current = layout; cameraAdapted.current = false; }
    if (_controls !== lastControlsRef.current) { lastControlsRef.current = _controls; if (_controls) cameraAdapted.current = false; }
  });

  useFrame(() => {
    if (cameraAdapted.current || !layout) return;
    const ctrl = _controls;
    if (!ctrl) return;
    const { combinedCentre, combinedSphere } = layout;
    const vals = [combinedCentre.x, combinedCentre.y, combinedCentre.z, combinedSphere.radius];
    if (!vals.every((v) => Number.isFinite(v)) || combinedSphere.radius <= 0) return;
    const camera = ctrl.object as THREE.PerspectiveCamera;
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const distance = combinedSphere.radius / Math.sin(fovRad / 2);
    const safeDistance = Math.max(distance * 1.4, 2);
    const dir = new THREE.Vector3(0.4, 0.35, 1).normalize();
    camera.position.copy(combinedCentre.clone().add(dir.multiplyScalar(safeDistance)));
    camera.near = Math.max(safeDistance / 1000, 0.01);
    camera.far = Math.max(safeDistance * 20, 100);
    camera.updateProjectionMatrix();
    ctrl.target.copy(combinedCentre);
    ctrl.minDistance = Math.max(combinedSphere.radius * 0.5, 0.5);
    ctrl.maxDistance = Math.max(safeDistance * 4, 20);
    ctrl.update();
    cameraAdapted.current = true;
  });

  return (
    <>
      <RenderSetup />
      <color attach="background" args={["#f5f5f7"]} />
      <ambientLight intensity={0.8} color="#ffffff" />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fffdf7" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={8} shadow-camera-bottom={-6} shadow-bias={-0.0002} />
      <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#d4e3f0" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]} receiveShadow>
        <planeGeometry args={[24, 12]} />
        <shadowMaterial opacity={0.25} transparent depthWrite={false} />
      </mesh>
      {variants.map((v) => {
        const slot = layout?.slots.find((s) => s.variantId === v.id);
        return (
          <VariantModel
            key={`${v.id}-${mountStamp}`}
            variant={v}
            layoutX={slot?.x ?? 0}
            onReady={handleModelReady}
          />
        );
      })}
    </>
  );
}
