import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import * as THREE from 'three';
import { ErrorBoundary } from '../ErrorBoundary';
import { type CaseStudy, type CaseTopicId } from '../../data/caseStudies';
import { createVillaSavoyeScene, highlightSavoyePart } from '../../utils/villaSavoyeScene';
import { createFarnsworthScene, highlightFarnsworthPart } from '../../utils/farnsworthScene';
import StudioEnvironment from '../viewer/StudioEnvironment';
import './cases.css';

interface Props { study: CaseStudy; selected: CaseTopicId | null; onSelect: (id: CaseTopicId) => void; showcase?: boolean; }
interface SceneProps extends Props { fitToken: number; interior: boolean; }

function supportsWebGL2() {
  try {
    const context = document.createElement('canvas').getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function CaseBackdrop() {
  // The CSS sky stays independent of tone mapping and joins the card header.
  return <fog attach="fog" args={['#eef0e9', 40, 95]} />;
}

function Building({ study, selected, fitToken, interior, showcase }: SceneProps) {
  const model = useMemo<ReturnType<typeof createVillaSavoyeScene> & { roofShell?: THREE.Group; coreCeiling?: THREE.Mesh }>(() => study.id === 'farnsworth-house' ? createFarnsworthScene() : createVillaSavoyeScene(), [study.id]);
  const { camera, size, invalidate } = useThree();
  const controls = useThree(state => state.controls) as Controls | null;
  const previousFit = useRef({ distance: 0, token: -1 });
  // Only resize / explicit fit moves the camera; selecting a part preserves the orbit.
  /* eslint-disable react-hooks/immutability -- The camera and locally owned scene are imperative Three.js objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || !size.width || !size.height) return;
    // Homepage opens on the entrance and glazed facade. Explicit fit returns
    // to the complete building; viewport changes retain the current orbit/zoom.
    const closeUp = showcase && study.id === 'farnsworth-house' && fitToken === 0;
    const center = closeUp ? new THREE.Vector3(-4.275, 1.863, 2.5) : model.bounds.getCenter(new THREE.Vector3());
    const radius = model.bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * size.width / size.height);
    const reset = previousFit.current.token !== fitToken;
    const direction = (reset ? (closeUp ? new THREE.Vector3(22.211, .641, 12.526) : new THREE.Vector3(study.id === 'farnsworth-house' ? -1.1 : 1.25, .72, 1.7)) : camera.position.clone().sub(controls.target)).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    let fittedDistance = 0;
    for (const x of [model.bounds.min.x,model.bounds.max.x]) for (const y of [model.bounds.min.y,model.bounds.max.y]) for (const z of [model.bounds.min.z,model.bounds.max.z]) {
      const point = new THREE.Vector3(x,y,z).sub(center);
      fittedDistance = Math.max(fittedDistance, Math.abs(point.dot(right))/Math.tan(horizontal/2)+point.dot(direction), Math.abs(point.dot(up))/Math.tan(vertical/2)+point.dot(direction));
    }
    fittedDistance *= 1.12;
    // Reference framing is a saved close architectural view, rather than a
    // fraction of the full-building fit (which varies with the panel size).
    const zoom = reset || !previousFit.current.distance ? (closeUp ? 25.51 / fittedDistance : 1) : camera.position.distanceTo(controls.target) / previousFit.current.distance;
    camera.position.copy(center).add(direction.normalize().multiplyScalar(fittedDistance * zoom));
    camera.near = 0.1; camera.far = 200; camera.updateProjectionMatrix();
    controls.target.copy(center); controls.minDistance = radius * 0.6; controls.maxDistance = fittedDistance * 2;
    controls.update(); previousFit.current = { distance: fittedDistance, token: fitToken }; invalidate();
  }, [camera, controls, fitToken, invalidate, model, size.width, size.height, study.id, showcase]);
  useLayoutEffect(() => {
    if (model.roofShell) {
      highlightFarnsworthPart(model, selected); model.roofShell.visible = !interior;
      if(model.coreCeiling) model.coreCeiling.visible = !interior;
    } else highlightSavoyePart(model, selected);
    invalidate();
  }, [model, selected, interior, invalidate]);
  /* eslint-enable react-hooks/immutability */
  useEffect(() => () => model.dispose(), [model]);
  return <primitive object={model.scene} dispose={null} />;
}

export default function BuildingModel(props: Props) {
  const [fitToken, setFitToken] = useState(0);
  const [retry, setRetry] = useState(0);
  const [interior, setInterior] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(supportsWebGL2);
  const fallback = <div className="case-model-fallback" role="alert"><strong>三维视图暂不可用</strong><p>{props.showcase ? '可进入案例分析查看图纸与内容。' : '仍可选择下方构造主题，查看分析内容。'}</p><button onClick={() => { setWebGLAvailable(supportsWebGL2()); setRetry(value => value + 1); }}>重试三维视图</button></div>;
  return <div className={`savoye-model case-building-model${props.study.id === 'farnsworth-house' ? ' case-farnsworth-model' : ''}`} aria-label={`${props.study.title}三维建筑模型`}>
    {webGLAvailable ? <ErrorBoundary resetKey={String(retry)} fallback={fallback}>
      <Canvas key={retry} shadows frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 38, position: [15, 12, 18] }} gl={{ antialias: true, toneMappingExposure:.9 }}>
        {props.study.id === 'farnsworth-house' ? <CaseBackdrop /> : <color attach="background" args={['#edf0f4']} />}
        <StudioEnvironment />
        <ambientLight intensity={.35} />
        <directionalLight position={[-10, 18, 12]} intensity={1.55} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-bias={-0.0001} shadow-normalBias={.02} />
        <directionalLight position={[10, 7, -5]} intensity={.35} color="#d3dffa" />
        <Building {...props} fitToken={fitToken} interior={interior} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.1} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
      <div className="case-view-tools">{props.study.id === 'farnsworth-house' && <button aria-pressed={interior} onClick={() => setInterior(value=>!value)}>{interior ? '恢复屋盖' : '观察内部'}</button>}<button onClick={() => setFitToken(value => value + 1)}>适配视图</button></div>
    </ErrorBoundary> : fallback}
    {webGLAvailable && !props.showcase && <span className="case-model-gesture">拖动旋转 · 滚轮缩放</span>}
  </div>;
}
