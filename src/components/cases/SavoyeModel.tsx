import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as Controls } from 'three-stdlib';
import * as THREE from 'three';
import { ErrorBoundary } from '../ErrorBoundary';
import { savoyeTopics, type CaseTopicId } from '../../data/caseStudies';
import { createVillaSavoyeScene, highlightSavoyePart } from '../../utils/villaSavoyeScene';
import './cases.css';

interface Props { selected: CaseTopicId | null; onSelect: (id: CaseTopicId) => void; }
interface SceneProps extends Props { fitToken: number; markers: Map<CaseTopicId, HTMLButtonElement>; }

function Building({ selected, onSelect, fitToken, markers }: SceneProps) {
  const model = useMemo(() => createVillaSavoyeScene(), []);
  const { camera, size, invalidate } = useThree();
  const controls = useThree(state => state.controls) as Controls | null;
  const previousFit = useRef({ distance: 0, token: -1 });
  // Only resize / explicit fit moves the camera; selecting a part preserves the orbit.
  /* eslint-disable react-hooks/immutability -- The camera and locally owned scene are imperative Three.js objects. */
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || !size.width || !size.height) return;
    const center = model.bounds.getCenter(new THREE.Vector3());
    const radius = model.bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * size.width / size.height);
    const fittedDistance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.02;
    const reset = previousFit.current.token !== fitToken;
    const direction = reset ? new THREE.Vector3(1.25, 0.85, 1.7) : camera.position.clone().sub(controls.target).normalize();
    const zoom = reset || !previousFit.current.distance ? 1 : camera.position.distanceTo(controls.target) / previousFit.current.distance;
    camera.position.copy(center).add(direction.normalize().multiplyScalar(fittedDistance * zoom));
    camera.near = 0.1; camera.far = 200; camera.updateProjectionMatrix();
    controls.target.copy(center); controls.minDistance = radius * 0.75; controls.maxDistance = fittedDistance * 2;
    controls.update(); previousFit.current = { distance: fittedDistance, token: fitToken }; invalidate();
  }, [camera, controls, fitToken, invalidate, model, size.width, size.height]);
  useLayoutEffect(() => { highlightSavoyePart(model, selected); invalidate(); }, [model, selected, invalidate]);
  /* eslint-enable react-hooks/immutability */
  useEffect(() => () => model.dispose(), [model]);
  useFrame(() => {
    const placed: { x: number; y: number }[] = [];
    savoyeTopics.forEach(topic => {
      const marker = markers.get(topic.id);
      if (!marker) return;
      const point = model.anchors[topic.id].clone().project(camera);
      marker.style.display = point.z < -1 || point.z > 1 ? 'none' : '';
      const label = { x: Math.max(25, Math.min(size.width - 25, (point.x + 1) * size.width / 2)), y: Math.max(25, Math.min(size.height - 25, (1 - point.y) * size.height / 2)) };
      for (const other of placed) if (Math.abs(other.x - label.x) < 42 && Math.abs(other.y - label.y) < 42) label.y = Math.max(25, Math.min(size.height - 25, other.y + 46));
      placed.push(label); marker.style.left = `${label.x}px`; marker.style.top = `${label.y}px`;
    });
  });
  const select = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return;
    const id = event.object.userData.caseTopic as CaseTopicId | undefined;
    if (id) { event.stopPropagation(); onSelect(id); }
  };
  return <primitive object={model.scene} dispose={null} onClick={select} />;
}

export default function SavoyeModel(props: Props) {
  const [fitToken, setFitToken] = useState(0);
  const [retry, setRetry] = useState(0);
  const [markers] = useState(() => new Map<CaseTopicId, HTMLButtonElement>());
  return <div className="savoye-model" aria-label="萨伏伊别墅三维教学模型">
    <ErrorBoundary resetKey={String(retry)} fallback={<div className="case-model-fallback" role="alert"><strong>三维视图暂不可用</strong><p>仍可选择下方构造主题，查看分析内容。</p><button onClick={() => setRetry(value => value + 1)}>重试三维视图</button></div>}>
      <Canvas key={retry} shadows frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 38, position: [15, 12, 18] }} gl={{ antialias: true }}>
        <color attach="background" args={['#edf0f4']} />
        <ambientLight intensity={1.15} />
        <directionalLight position={[4, 14, 9]} intensity={2.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.001} />
        <directionalLight position={[-8, 7, -5]} intensity={0.8} color="#d3dffa" />
        <Building {...props} fitToken={fitToken} markers={markers} />
        <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.1} maxPolarAngle={Math.PI / 2.02} />
      </Canvas>
      <div className="case-model-markers">{savoyeTopics.map(topic => <button key={topic.id} ref={element => { if (element) markers.set(topic.id, element); else markers.delete(topic.id); }} className={props.selected === topic.id ? 'is-selected' : ''} aria-label={`观察${topic.title}`} aria-pressed={props.selected === topic.id} onClick={() => props.onSelect(topic.id)}>{topic.number}</button>)}</div>
      <button className="case-fit-button" onClick={() => setFitToken(value => value + 1)}>适配视图</button>
    </ErrorBoundary>
    <span className="case-model-gesture">拖动旋转 · 滚轮缩放</span>
  </div>;
}
