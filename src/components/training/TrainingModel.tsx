import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Canvas, type ThreeEvent, useThree, useFrame } from '@react-three/fiber';
import { Html, Line, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { TrainingPart } from '../../data/training';
import { createTrainingScene, applyTrainingPresentation } from '../../utils/trainingScene';
import { ErrorBoundary } from '../ErrorBoundary';
import './training-model.css';

interface ModelProps {
  path: string;
  parts: TrainingPart[];
  groups?: Record<string, string>;
  selected: string[];
  hidden: string[];
  placements?: Record<string, string>;
  separated: boolean;
  anonymous: boolean;
  disabled: boolean;
  trace?: string[];
  fitToken?: number;
  fitPadding?: number;
  onSelect: (id: string) => void;
  onReady: () => void;
}
interface SceneModelProps extends ModelProps {
  markers: Map<string, HTMLButtonElement>;
  leaders: Map<string, SVGLineElement>;
}
function SceneModel(props: SceneModelProps) {
  const { path, onReady, selected, hidden, placements, separated, fitToken, fitPadding = 1.45 } = props;
  const { scene } = useGLTF(props.path, true);
  const model = useMemo(() => createTrainingScene(scene, props.parts, props.groups), [scene, props.parts, props.groups]);
  const camera = useThree(state => state.camera);
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null;
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const [fit] = useState(() => ({ path: '', direction: new THREE.Vector3(1, 0.75, 1.3) }));

  // Keep markers readable when nested components project onto the same point.
  // DOM positions update with the demand-rendered camera without React updates.
  useFrame(() => {
    const placed: Array<{ x: number; y: number }> = [];
    props.parts.forEach(part => {
      const marker = props.markers.get(part.id);
      const leader = props.leaders.get(part.id);
      const center = model.centers.get(part.id);
      if (!marker || !leader || !center) return;
      const position = center.clone();
      if (separated && !placements) {
        const offset = center.clone().sub(model.bounds.getCenter(new THREE.Vector3()));
        if (offset.lengthSq() < 1e-8) offset.set(0, model.bounds.getSize(new THREE.Vector3()).length() * 0.12, 0);
        position.add(offset.multiplyScalar(0.45));
      }
      const projected = position.project(camera);
      const visible = !props.hidden.includes(part.id) && projected.z >= -1 && projected.z <= 1;
      marker.style.display = visible ? '' : 'none';
      leader.style.display = visible ? '' : 'none';
      if (!visible) return;
      const x = (projected.x + 1) * size.width / 2;
      const y = (1 - projected.y) * size.height / 2;
      let label = { x: Math.max(20, Math.min(size.width - 20, x)), y: Math.max(20, Math.min(size.height - 20, y)) };
      const candidates = [{ x: 0, y: 0 }, ...Array.from({ length: 12 }, (_, i) => ({ x: (i % 2 ? -1 : 1) * Math.ceil((i + 1) / 4) * 42, y: (i % 4 < 2 ? -1 : 1) * Math.ceil((i + 1) / 4) * 42 }))];
      for (const offset of candidates) {
        const candidate = { x: Math.max(20, Math.min(size.width - 20, x + offset.x)), y: Math.max(20, Math.min(size.height - 20, y + offset.y)) };
        if (placed.every(other => Math.abs(candidate.x - other.x) >= 38 || Math.abs(candidate.y - other.y) >= 38)) { label = candidate; break; }
      }
      placed.push(label);
      marker.style.left = `${label.x}px`;
      marker.style.top = `${label.y}px`;
      leader.setAttribute('x1', String(x)); leader.setAttribute('y1', String(y));
      leader.setAttribute('x2', String(label.x)); leader.setAttribute('y2', String(label.y));
    });
  });

  /* eslint-disable react-hooks/immutability -- Camera, controls and cloned model are private imperative Three.js objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || size.width < 1 || size.height < 1) return;
    const center = model.bounds.getCenter(new THREE.Vector3());
    const radius = Math.max(model.bounds.getBoundingSphere(new THREE.Sphere()).radius, 0.01);
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * size.width / size.height);
    const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * fitPadding;
    const direction = fit.path === path ? camera.position.clone().sub(controls.target).normalize() : fit.direction.clone().normalize();
    camera.position.copy(center).add(direction.multiplyScalar(distance));
    camera.near = Math.max(0.001, distance - radius * 3);
    camera.far = distance + radius * 5;
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = radius * 0.2;
    controls.maxDistance = distance * 2.5;
    controls.update();
    fit.path = path;
    invalidate();
    onReady();
  }, [camera, controls, fit, invalidate, model, path, onReady, fitToken, fitPadding, size.width, size.height]);

  useLayoutEffect(() => {
    applyTrainingPresentation(model, { selected, hidden, placements, separated });
    invalidate();
  }, [model, selected, hidden, placements, separated, invalidate]);
  /* eslint-enable react-hooks/immutability */

  useEffect(() => () => {
    model.materials.forEach(material => material.dispose());
    model.edges.forEach(geometry => geometry.dispose());
  }, [model]);
  const select = (event: ThreeEvent<MouseEvent>) => {
    if (props.disabled || event.delta > 4) return;
    const id = event.object.userData.trainingSlot ?? event.object.userData.trainingPart;
    if (typeof id === 'string') { event.stopPropagation(); props.onSelect(id); }
  };
  return <>
    <primitive object={model.scene} onClick={select} />
    {[...model.ghosts.values()].flat().map(ghost => <primitive key={ghost.uuid} object={ghost} onClick={select} />)}
    {props.trace && props.trace.length > 1 && <Line points={props.trace.map(id => model.centers.get(id)).filter((point): point is THREE.Vector3 => Boolean(point))} color="#5770b5" lineWidth={3} />}
  </>;
}

export default function TrainingModel(props: Omit<ModelProps, 'onReady'> & { onStatus: (path: string, status: 'ready' | 'error') => void }) {
  const [retry, setRetry] = useState(0);
  const [fitVersion, setFitVersion] = useState(0);
  const [markers] = useState(() => new Map<string, HTMLButtonElement>());
  const [leaders] = useState(() => new Map<string, SVGLineElement>());
  const { onStatus, path } = props;
  const markReady = useCallback(() => onStatus(path, 'ready'), [onStatus, path]);
  const reportError = useCallback(() => onStatus(path, 'error'), [onStatus, path]);
  return <div className="training-model-stage" aria-label="训练三维模型">
    <ErrorBoundary resetKey={`${props.path}:${retry}`} onError={reportError} fallback={<div className="training-model-error" role="alert"><strong>训练模型暂不可用</strong><p>请检查网络后重试，已作答内容会保留。</p><button className="training-button" onClick={() => { useGLTF.clear(path); setRetry(value => value + 1); }}>重新加载模型</button></div>}>
      <Canvas key={retry} frameloop="demand" camera={{ fov: 35, position: [4, 3, 6] }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={['#eef1f8']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[8, 12, 6]} intensity={2.2} color="#fffdf7" />
        <directionalLight position={[-5, 4, -3]} intensity={0.7} color="#d9e4ff" />
        <Suspense fallback={<Html center><span className="training-loading" role="status">模型加载中…</span></Html>}>
          <SceneModel {...props} markers={markers} leaders={leaders} onReady={markReady} fitToken={fitVersion} />
        </Suspense>
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} minDistance={0.01} />
      </Canvas>
    </ErrorBoundary>
    <div className="training-model-markers">
      <svg aria-hidden="true">{props.parts.map(part => <line key={part.id} ref={element => { if (element) leaders.set(part.id, element); else leaders.delete(part.id); }} />)}</svg>
      {props.parts.map((part, index) => <button key={part.id} ref={element => { if (element) markers.set(part.id, element); else markers.delete(part.id); }} className={`training-model-label${props.selected.includes(part.id) ? ' selected' : ''}`} disabled={props.disabled} aria-label={`选取${props.anonymous ? `构件 ${String.fromCharCode(65 + index)}` : part.name}`} onClick={() => props.onSelect(part.id)}>{String.fromCharCode(65 + index)}</button>)}
    </div>
    <button className="training-fit-button" onClick={() => setFitVersion(value => value + 1)} aria-label="适配模型视图">适配视图</button>
  </div>;
}
