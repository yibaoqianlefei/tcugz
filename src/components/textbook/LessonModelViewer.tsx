import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { DRACOLoader, GLTFLoader, MeshoptDecoder, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Boxes, Minus, MoreHorizontal, Pause, Play, Plus, RotateCcw, ScanEye } from 'lucide-react';
import { getNodeDefinition, type NodeDefinition, type NodeModelVariant } from '../../data/nodeDefinitions';
import { ErrorBoundary } from '../ErrorBoundary';
import StudioEnvironment from '../viewer/StudioEnvironment';
import ControlBar from '../viewer/ControlBar';
import { getNodeOrbitRotationSpeed } from '../../utils/nodeRotation';
import { isInteractionAllowed } from '../../utils/interactionGates';
import { applyComponentHighlight } from '../../utils/componentHighlight';
import { createModelXRay } from '../../utils/modelXRay';
import { isSizeChangeSignificant } from '../../utils/cameraFit';
import { CAMERA_RESIZE_SETTLE_MS, NODE_CAMERA_FOV, NODE_MAX_POLAR_ANGLE } from '../../utils/viewerCamera';
import { DRACO_DECODER_PATH } from '../../utils/modelDecoders';
import { advanceLessonCameraTransition, computeLessonCameraFit, LESSON_DEFAULT_VIEW_DIRECTION, type LessonCameraTransition } from './lessonCamera';
import { prepareLessonModel, disposeLessonScene, pickLessonPart, type LessonModel } from './lessonModelRuntime';
import './lesson-model-viewer.css';

type ViewCommand = { id: number; action: 'fit' | 'near' | 'far' };
const lessonControls = ['explode', 'rotate', 'xray'] as const;
const ignoreControl = () => undefined;

/** A camera fit must not inherit residual automatic/drag rotation. */
function clearViewInertia(controls: OrbitControlsImpl) {
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  controls.enableDamping = damping;
}

function ModelScene({ initialZoom, model, selected, hovered, hoverEnabled, pickEnabled, progress, direction, command, xrayEnabled, onSelect, onHover, onPose, onProgress, onReady, onRenderError }: {
  initialZoom: number; model: LessonModel; selected: string; hovered: string; progress: number; direction: number; command: ViewCommand;
  hoverEnabled: boolean; pickEnabled: boolean;
  xrayEnabled: boolean;
  onSelect: (id: string) => void; onHover: (id: string) => void; onPose: (ids: Set<string>) => void;
  onProgress: (value: number) => void; onReady: () => void; onRenderError: () => void;
}) {
  const camera = useThree(state => state.camera);
  const controls = useThree(state => state.controls) as OrbitControlsImpl | null;
  const size = useThree(state => state.size);
  const invalidate = useThree(state => state.invalidate);
  const xray = useMemo(() => createModelXRay(model.scene), [model]);
  const rendering = useRef({ fitted: false, frames: 0, reported: false });
  const appliedCommand = useRef(-1);
  const playback = useRef<{ from: number; started: number } | null>(null);
  const viewBounds = progress > 0 ? model.bounds : model.restBounds;
  const framing = useRef<{ bounds: THREE.Box3; fitDistance: number; width: number; height: number } | null>(null);
  const transition = useRef<LessonCameraTransition | null>(null);
  const [settledSize, setSettledSize] = useState({ width: size.width, height: size.height });

  useEffect(() => {
    const timer = window.setTimeout(() => setSettledSize({ width: size.width, height: size.height }), CAMERA_RESIZE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [size.width, size.height]);

  useEffect(() => {
    if (!controls) return;
    const cancelFraming = () => { transition.current = null; };
    controls.addEventListener('start', cancelFraming);
    return () => controls.removeEventListener('start', cancelFraming);
  }, [controls]);

  useLayoutEffect(() => { playback.current = null; }, [direction]);

  useFrame((_, delta) => {
    // Match the node viewer's elapsed-time correction before Drei updates at -1.
    // eslint-disable-next-line react-hooks/immutability
    if (controls) controls.autoRotateSpeed = getNodeOrbitRotationSpeed(delta);
  }, -2);

  useFrame((_, delta) => {
    if (!transition.current || !(camera instanceof THREE.PerspectiveCamera) || !controls || !framing.current) return;
    const next = advanceLessonCameraTransition(transition.current, camera, controls.target, delta);
    framing.current.fitDistance = next.fitDistance;
    if (next.done) transition.current = null;
    else invalidate();
  }, -.5);

  useFrame(() => {
    if (!direction || !model.canExplode) return;
    // Use one playback clock rather than adding to React's last committed
    // progress: slow rendering must not drop elapsed time or slow the clip.
    const now = performance.now();
    const timeline = playback.current ?? (playback.current = { from: progress, started: now });
    onProgress(THREE.MathUtils.clamp(timeline.from + direction * (now - timeline.started) / 1000 / model.duration, 0, 1));
    invalidate();
  });

  useFrame(({ gl }) => {
    const state = rendering.current;
    if (!state.fitted || state.reported) return;
    state.frames += 1;
    // useFrame runs before drawing. Require a previous frame after camera fit,
    // rather than treating a decoded GLTF or the environment bake as visible.
    if (state.frames >= 2 && gl.info.render.triangles > 0) {
      state.reported = true;
      onReady();
      return;
    }
    if (state.frames < 6) invalidate();
    else {
      state.reported = true;
      onRenderError();
    }
  });

  /* eslint-disable react-hooks/immutability -- This viewer exclusively owns these Three.js objects. */
  useLayoutEffect(() => {
    onPose(model.sample(progress));
    invalidate();
  }, [model, progress, onPose, invalidate]);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || size.width < 1 || size.height < 1) return;
    const previous = framing.current;
    // Like the node viewer, wait for the final container dimensions. Changes
    // in animation progress never invoke the canonical initial-view reset.
    if (previous && (Math.abs(settledSize.width - size.width) > 1 || Math.abs(settledSize.height - size.height) > 1)) return;
    const width = previous ? settledSize.width : size.width;
    const height = previous ? settledSize.height : size.height;
    const resized = previous && isSizeChangeSignificant({ w: previous.width, h: previous.height }, width, height);
    if (previous && previous.bounds === viewBounds && !resized) return;
    const fit = computeLessonCameraFit(viewBounds, camera, width, height);
    const envelope = computeLessonCameraFit(model.bounds, camera, width, height);
    const rest = computeLessonCameraFit(model.restBounds, camera, width, height);
    // Clip and orbit limits span the full timeline even while assembled. They
    // must not clamp the camera abruptly when an animation leaves progress 0.
    camera.near = Math.max(.001, Math.min(rest.radius, envelope.radius) / 100);
    camera.far = Math.max(100, envelope.distance * 24);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    controls.minDistance = Math.min(rest.radius, envelope.radius) * .3;
    controls.maxDistance = Math.max(envelope.distance * 3, camera.position.distanceTo(controls.target));
    if (!previous) {
      clearViewInertia(controls);
      controls.target.copy(fit.center);
      camera.position.copy(fit.center).addScaledVector(LESSON_DEFAULT_VIEW_DIRECTION, fit.distance / initialZoom);
      controls.update();
      framing.current = { bounds: viewBounds, fitDistance: fit.distance, width, height };
      rendering.current.fitted = true;
      rendering.current.frames = 0;
    } else {
      const distance = camera.position.distanceTo(controls.target);
      // Keep the user's relative zoom when switching assembly/explosion fit.
      // A narrower resized viewport may pull back to the safe default distance.
      const nextDistance = resized ? Math.max(distance, fit.distance / initialZoom) : fit.distance * distance / previous.fitDistance;
      transition.current = { fromTarget: controls.target.clone(), toTarget: fit.center, fromDistance: distance, toDistance: nextDistance, fromFitDistance: previous.fitDistance, toFitDistance: fit.distance, elapsed: 0 };
      framing.current = { ...previous, bounds: viewBounds, width, height };
    }
    invalidate();
  }, [model, viewBounds, camera, controls, size.width, size.height, settledSize, invalidate, initialZoom]);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls || size.width < 1 || size.height < 1) return;
    // Resizing already refits the camera above; do not repeat a previous zoom
    // or rotation command when the window or an optional panel changes size.
    if (appliedCommand.current === command.id) return;
    appliedCommand.current = command.id;
    transition.current = null;
    if (command.action === 'fit') clearViewInertia(controls);
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    if (command.action === 'fit') {
      const fit = computeLessonCameraFit(viewBounds, camera, size.width, size.height);
      spherical.setFromVector3(LESSON_DEFAULT_VIEW_DIRECTION.clone().multiplyScalar(fit.distance / initialZoom));
      controls.target.copy(fit.center);
      framing.current = { bounds: viewBounds, fitDistance: fit.distance, width: size.width, height: size.height };
    }
    if (command.action === 'near') spherical.radius *= 0.8;
    if (command.action === 'far') spherical.radius *= 1.25;
    spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
    spherical.makeSafe();
    camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    controls.update();
    invalidate();
  }, [command, model, viewBounds, camera, controls, size.width, size.height, invalidate, initialZoom]);

  useLayoutEffect(() => {
    model.meshes.forEach(({ mesh, partId, visible }) => {
      mesh.visible = visible;
      const active = hoverEnabled && partId === selected && Boolean(selected);
      const over = hoverEnabled && !active && partId === hovered && Boolean(hovered);
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(material => {
        const original = model.materials.get(material);
        if ('color' in material && material.color instanceof THREE.Color && original?.color) material.color.copy(original.color);
        if ('emissive' in material && material.emissive instanceof THREE.Color && original?.emissive) material.emissive.copy(original.emissive);
        if ('emissiveIntensity' in material && original?.intensity !== undefined) material.emissiveIntensity = original.intensity;
        applyComponentHighlight(material, active ? 'selected' : over ? 'hover' : 'clear');
      });
    });
    invalidate();
  }, [model, selected, hovered, hoverEnabled, invalidate]);

  useLayoutEffect(() => {
    xray.update(xrayEnabled, mesh => hoverEnabled && mesh.userData.lessonPart === selected && selected ? 'selected' : hoverEnabled && mesh.userData.lessonPart === hovered && hovered ? 'hover' : 'clear');
    invalidate();
    return () => xray.restore();
  }, [xray, xrayEnabled, selected, hovered, hoverEnabled, invalidate]);
  /* eslint-enable react-hooks/immutability */

  const select = (event: ThreeEvent<MouseEvent>) => {
    if (!pickEnabled || event.delta > 5) return;
    event.stopPropagation();
    onSelect(pickLessonPart(event.intersections) ?? '');
  };
  const hover = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(pickLessonPart(event.intersections) ?? '');
  };
  return <primitive object={model.scene} dispose={null} onClick={pickEnabled ? select : undefined}
    onPointerOver={hoverEnabled ? hover : undefined} onPointerMove={hoverEnabled ? hover : undefined}
    onPointerOut={(event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onHover(''); }} />;
}

function browserHasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch { return false; }
}

function ViewerSession({ initialZoom, node, variant, inline = false, autoRotate, onToggleAutoRotate, xrayEnabled, onToggleXray }: { initialZoom: number; node: NodeDefinition; variant?: NodeModelVariant; inline?: boolean; autoRotate: boolean; onToggleAutoRotate: () => void; xrayEnabled: boolean; onToggleXray: () => void }) {
  const path = variant?.model.path ?? node.model?.path;
  const [supported] = useState(browserHasWebGL);
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; model: LessonModel }>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  const [partsOpen, setPartsOpen] = useState(false);
  const partsId = useId();
  const [hovered, setHovered] = useState('');
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(0);
  const [visibleParts, setVisibleParts] = useState<Set<string>>(new Set());
  const [renderedKey, setRenderedKey] = useState('');
  const [command, setCommand] = useState<ViewCommand>({ id: 0, action: 'fit' });
  const pointer = useRef({ id: -1, x: 0, y: 0, distance: 0 });
  const knowledgePanel = useRef<HTMLElement>(null);
  const requestKey = `${path}:${retry}`;
  const model = loaded?.key === requestKey ? loaded.model : undefined;
  const rendered = renderedKey === requestKey;
  const reportError = useCallback(() => setError('三维模型暂时无法显示，请重新加载，或继续阅读本节正文。'), []);
  const markRendered = useCallback(() => setRenderedKey(requestKey), [requestKey]);
  const hoverEnabled = Boolean(rendered && model && isInteractionAllowed(!model.hasTimeline, progress, .99));
  const pickEnabled = Boolean(rendered && model && isInteractionAllowed(!model.hasTimeline, progress, 1));
  const selectPart = useCallback((id: string) => {
    if (pickEnabled && (!id || visibleParts.has(id))) setSelected(value => value === id ? '' : id);
  }, [pickEnabled, visibleParts]);
  const pickPart = useCallback((id: string) => { if (pointer.current.distance <= 5) selectPart(id); }, [selectPart]);
  const hoverPart = useCallback((id: string) => {
    if (!id || (hoverEnabled && visibleParts.has(id))) setHovered(id);
  }, [hoverEnabled, visibleParts]);
  const updatePose = useCallback((ids: Set<string>) => setVisibleParts(previous => previous.size === ids.size && [...ids].every(id => previous.has(id)) ? previous : ids), []);
  const updateProgress = useCallback((value: number) => {
    setProgress(value);
    if (model?.hasTimeline) {
      if (!isInteractionAllowed(false, value, 1)) setSelected('');
      if (!isInteractionAllowed(false, value, .99)) setHovered('');
    }
    if ((direction > 0 && value === 1) || (direction < 0 && value === 0)) setDirection(0);
  }, [direction, model?.hasTimeline]);

  useEffect(() => {
    const panel = knowledgePanel.current;
    const card = panel && [...panel.querySelectorAll<HTMLElement>('[data-part-id]')].find(element => element.dataset.partId === selected);
    if (!panel || !card) return;
    const outer = panel.getBoundingClientRect();
    const inner = card.getBoundingClientRect();
    if (inner.top < outer.top) panel.scrollTop += inner.top - outer.top;
    else if (inner.bottom > outer.bottom) panel.scrollTop += inner.bottom - outer.bottom;
    if (inner.left < outer.left) panel.scrollLeft += inner.left - outer.left;
    else if (inner.right > outer.right) panel.scrollLeft += inner.right - outer.right;
  }, [selected, partsOpen]);

  useEffect(() => {
    if (!path || !supported) return;
    let cancelled = false;
    let timedOut = false;
    let ownedModel: LessonModel | undefined;
    const draco = new DRACOLoader();
    // Same decoder version as the existing node viewer; this loader and all
    // decoded assets remain private, so retry never clears its shared cache.
    draco.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader().setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder);
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      timedOut = true;
      setError('模型加载时间较长，请检查网络后重试，或先阅读本节正文。');
    }, 20_000);
    loader.loadAsync(path).then(gltf => {
      window.clearTimeout(timeout);
      // GLTFLoader cannot abort every decode path. Late results from an expired
      // request are released without replacing the retry's current view.
      if (cancelled || timedOut) { disposeLessonScene(gltf.scene); return; }
      try {
        ownedModel = prepareLessonModel(gltf, node, variant);
        setLoaded({ key: requestKey, model: ownedModel });
      } catch {
        disposeLessonScene(gltf.scene);
        reportError();
      }
    }).catch(() => {
      window.clearTimeout(timeout);
      if (!cancelled && !timedOut) reportError();
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      ownedModel?.dispose();
      draco.dispose();
    };
  }, [path, node, variant, requestKey, supported, reportError]);

  const act = (action: ViewCommand['action']) => setCommand(previous => ({ id: previous.id + 1, action }));
  const play = (value: number) => { if (model?.hasTimeline) { setSelected(''); setHovered(''); } setDirection(value); };
  const restart = () => { setError(''); setSelected(''); setHovered(''); setProgress(0); setDirection(0); setRetry(value => value + 1); };
  if (!path) return <div className="lesson-model-fallback" role="status">此节点暂未提供三维模型，可继续阅读本节正文。</div>;
  if (!supported) return <div className="lesson-model-fallback" role="status"><strong>当前设备无法开启三维视图</strong><p>可继续阅读正文与观察提示，或使用支持三维显示的浏览器打开本节。</p></div>;
  const fallback = <div className="lesson-model-fallback" role="alert"><strong>模型暂时无法显示</strong><p>{error || '请检查网络后重试，也可先阅读正文。'}</p><button type="button" onClick={restart}>重新加载</button></div>;
  return <div className="lesson-model-viewer" aria-label={`${node.title}三维研读`} data-explode-progress={progress.toFixed(3)} data-can-explode={model?.canExplode ? 'true' : 'false'} data-auto-rotate={autoRotate} data-xray={xrayEnabled} data-can-hover={hoverEnabled} data-can-select={pickEnabled}>
    <div className="lesson-model-visual">
    <div className="lesson-model-stage" aria-label="三维模型观察区域" data-rendered={rendered ? 'true' : 'false'} style={{ cursor: hoverEnabled && hovered ? 'pointer' : undefined }} onPointerLeave={() => setHovered('')}
      onPointerDownCapture={event => { pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 }; }}
      onPointerMoveCapture={event => {
        const start = pointer.current;
        if (start.id === event.pointerId) start.distance = Math.max(start.distance, Math.hypot(event.clientX - start.x, event.clientY - start.y));
      }}
      onPointerUpCapture={() => { pointer.current.id = -1; }} onPointerCancelCapture={() => { pointer.current.id = -1; pointer.current.distance = Infinity; }}>
      {error ? fallback : model ? <ErrorBoundary resetKey={requestKey} onError={reportError} fallback={fallback}>
        <Canvas className="lesson-model-canvas" frameloop={direction || (autoRotate && rendered) ? 'always' : 'demand'} dpr={[1, 1.5]} camera={{ fov: NODE_CAMERA_FOV, position: [4, 3, 6] }} gl={{ antialias: true, alpha: inline }} onPointerMissed={pickEnabled ? () => pickPart('') : undefined} fallback={<span>需要支持三维显示的浏览器；可继续阅读本节正文。</span>}
          onCreated={({ gl }) => {
            gl.domElement.setAttribute('aria-label', `${node.title}，可拖动旋转，使用下方按钮缩放、复位或暂停自动旋转`);
            gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); reportError(); }, { once: true });
          }}>
          {!inline && <color attach="background" args={['#eef1f8']} />}
          <ambientLight intensity={0.8} />
          <StudioEnvironment />
          <directionalLight position={[8, 12, 6]} intensity={2} color="#fffdf7" />
          <directionalLight position={[-5, 4, -3]} intensity={0.65} color="#dce8ee" />
          <ModelScene initialZoom={initialZoom} model={model} selected={selected} hovered={hovered} hoverEnabled={hoverEnabled} pickEnabled={pickEnabled} progress={progress} direction={direction} command={command} xrayEnabled={xrayEnabled} onSelect={pickPart} onHover={hoverPart} onPose={updatePose} onProgress={updateProgress} onReady={markRendered} onRenderError={reportError} />
          <OrbitControls makeDefault enablePan={false} enableZoom={!inline} enableDamping dampingFactor={0.08} maxPolarAngle={NODE_MAX_POLAR_ANGLE} autoRotate={autoRotate && rendered} autoRotateSpeed={getNodeOrbitRotationSpeed(1 / 60)} />
        </Canvas>
      </ErrorBoundary> : <div className="lesson-model-loading" role="status"><span aria-hidden="true" />正在准备三维构造…</div>}
      {!error && model && !rendered && <div className="lesson-model-presenting" role="status">正在呈现模型…</div>}
      {!error && rendered && !inline && <div className="lesson-model-gesture" aria-hidden="true">拖动旋转</div>}
      {inline && selected && <output className="lesson-inline-selected" aria-live="polite">{model?.parts.find(part => part.id === selected)?.name}</output>}
    </div>
    {!error && <div className="lesson-model-toolbar lesson-explode-controls">
      {inline ? <div className="lesson-inline-controls" role="toolbar" aria-label="模型控制栏">
        <button type="button" className="model-control-button" disabled={!rendered} onClick={onToggleAutoRotate} aria-pressed={autoRotate} aria-label={autoRotate ? '暂停旋转' : '开启旋转'} title={autoRotate ? '暂停旋转' : '开启旋转'}>{autoRotate ? <Pause size={18} /> : <Play size={18} />}</button>
        {model?.canExplode && <input type="range" className="model-explode-slider lesson-inline-slider" min={0} max={1} step={0.001} value={progress} disabled={!rendered} aria-label="爆炸程度" aria-valuetext={`已展开 ${Math.round(progress * 100)}%`} title="爆炸程度" onChange={event => { setDirection(0); updateProgress(Number(event.target.value)); }} />}
        <details className="lesson-inline-tools" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
          <summary className="model-control-button" aria-label="更多模型操作" title="更多模型操作"><MoreHorizontal size={18} /></summary>
          <div className="lesson-inline-tools-panel" role="group" aria-label="模型辅助操作">
            <button type="button" className="site-tool-button" disabled={!rendered} onClick={() => act('fit')} aria-label="复位视角"><RotateCcw size={16} />复位</button>
            <button type="button" className="site-tool-button" disabled={!rendered} onClick={onToggleXray} aria-pressed={xrayEnabled} aria-label={xrayEnabled ? '关闭透视' : '开启透视'}><ScanEye size={16} />透视</button>
            <button type="button" className="site-tool-button" disabled={!rendered} onClick={() => act('far')} aria-label="缩小模型"><Minus size={16} />缩小</button>
            <button type="button" className="site-tool-button" disabled={!rendered} onClick={() => act('near')} aria-label="放大模型"><Plus size={16} />放大</button>
            {model?.canExplode && <><button type="button" className="site-tool-button" disabled={!rendered} onClick={() => play(-1)} aria-label="收起爆炸">收起爆炸</button><button type="button" className="site-tool-button" disabled={!rendered} onClick={() => play(1)} aria-label="播放爆炸">播放爆炸</button></>}
            <button type="button" className="site-tool-button lesson-inline-parts-toggle" disabled={!rendered} aria-controls={partsId} aria-expanded={partsOpen} onClick={event => { setPartsOpen(value => !value); const tools = event.currentTarget.closest('details'); tools?.removeAttribute('open'); tools?.querySelector('summary')?.focus(); }}><Boxes size={16} />{partsOpen ? '收起构件名称' : '构件名称'}</button>
          </div>
        </details>
      </div> : <ControlBar placement="flow" leadingControls={<div className="lesson-model-controls model-leading-controls" role="group" aria-label="模型视图控制">
      <button type="button" className="model-control-button" disabled={!rendered} onClick={() => act('fit')} aria-label="复位视角" title="复位视角"><RotateCcw size={17} /></button>
      <button type="button" className="model-control-button" disabled={!rendered} onClick={() => act('far')} aria-label="缩小模型" title="缩小模型"><Minus size={17} /></button>
      <button type="button" className="model-control-button" disabled={!rendered} onClick={() => act('near')} aria-label="放大模型" title="放大模型"><Plus size={17} /></button>
    </div>} visible={lessonControls} explodeDisabled={!rendered || !model?.canExplode} sliderValue={progress}
        onSliderChange={value => { setDirection(0); updateProgress(value); }} onCollapse={() => play(-1)} onExpand={() => play(1)}
        autoRotate={autoRotate} onToggleAutoRotate={onToggleAutoRotate} rotationDisabled={!rendered}
        xrayEnabled={xrayEnabled} onToggleXray={onToggleXray} xrayDisabled={!rendered}
        linkageEnabled={false} onToggleLinkage={ignoreControl} showShadows={false} onToggleLighting={ignoreControl} />}
    </div>}
    </div>
    <aside id={partsId} ref={knowledgePanel} hidden={inline && !partsOpen} className="lesson-knowledge-panel" aria-label="构件知识卡片" aria-busy={!model}>
      {model ? <ul>{model.parts.map(part => <li key={part.id}><button type="button" data-part-id={part.id} data-visible={visibleParts.has(part.id)}
        className={`model-knowledge-header model-component-name lesson-model-part lesson-knowledge-card${pickEnabled && selected === part.id ? ' is-selected is-active' : ''}${hoverEnabled && hovered === part.id ? ' is-hovered' : ''}`}
        aria-pressed={pickEnabled && selected === part.id} disabled={!pickEnabled || !visibleParts.has(part.id)}
        title={model.hasTimeline && !pickEnabled ? '展开模型后点击构件名称' : part.name}
        onPointerEnter={hoverEnabled ? () => hoverPart(part.id) : undefined} onPointerLeave={() => hoverPart('')}
        onFocus={hoverEnabled ? () => hoverPart(part.id) : undefined} onBlur={() => hoverPart('')} onClick={() => selectPart(part.id)}>{part.name}</button></li>)}</ul> : <div className="lesson-knowledge-skeleton" aria-hidden="true" />}
    </aside>
  </div>;
}

export default function LessonModelViewer({ nodeId, inline = false, initialZoom = 1 }: { nodeId: string; inline?: boolean; initialZoom?: number }) {
  const node = getNodeDefinition(nodeId);
  const [variantId, setVariantId] = useState('');
  const [autoRotate, setAutoRotate] = useState(true);
  const [xrayEnabled, setXrayEnabled] = useState(false);
  if (!node) return <div className="lesson-model-fallback" role="status">此构造节点暂不可用，请继续阅读正文。</div>;
  const variants = node.variants ?? [];
  const variant = variants.find(item => item.id === variantId) ?? variants[0];
  return <div className={`lesson-model-shell${inline ? ' lesson-model-shell--inline' : ''}`} data-node-id={nodeId}>
    {variants.length > 0 && <div className="lesson-model-variants" aria-label="构造方案选择">
      <label>方案 <select value={variant?.id} onChange={event => setVariantId(event.target.value)}>{variants.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      {variant?.description && <details className="lesson-model-variant-info" name="lesson-model-tools"><summary>方案说明</summary><p>{variant.description}</p></details>}
    </div>}
    <ViewerSession key={`${nodeId}:${variant?.id ?? 'single'}`} initialZoom={initialZoom} node={node} variant={variant} inline={inline} autoRotate={autoRotate} onToggleAutoRotate={() => setAutoRotate(value => !value)} xrayEnabled={xrayEnabled} onToggleXray={() => setXrayEnabled(value => !value)} />
  </div>;
}
