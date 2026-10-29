import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isHitboxName, canonicalName } from '../../src/utils/nameUtils.ts';
import { collectOutlineSources, createFeatureEdges, separateOpaqueSurfaceDepth } from '../../src/utils/modelOutlines.ts';

const width = 960, height = 540;
const status = document.querySelector('#status'), progress = document.querySelector('#progress');
const button = document.querySelector('#render'), finalize = document.querySelector('#finalize');
const filter = document.querySelector('#filter'), gallery = document.querySelector('#renders'), errors = document.querySelector('#errors');
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(width, height); renderer.setPixelRatio(1); renderer.setClearColor(0xffffff, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
document.querySelector('#stage').append(renderer.domElement);
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
const environment = pmrem.fromScene(room, 0.04); scene.environment = environment.texture; scene.environmentIntensity = 0.65; room.dispose();
scene.add(new THREE.HemisphereLight(0xf6f8ff, 0xaaaebc, 1.4));
const key = new THREE.DirectionalLight(0xfff6e9, 2.8); key.position.set(4, 12, 6); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
key.shadow.bias = -0.00015; key.shadow.normalBias = 0.015; scene.add(key);
const fill = new THREE.DirectionalLight(0xe2eaff, 1.25); fill.position.set(-4, 3, -5); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.10 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
const camera = new THREE.OrthographicCamera(-4, 4, 2.25, -2.25, 0.01, 100);
const draco = new DRACOLoader().setDecoderPath('/draco/').setWorkerLimit(2);
const loader = new GLTFLoader().setDRACOLoader(draco);
const catalog = await (await fetch('/__node-preview/catalog')).json();
button.disabled = false; button.textContent = `生成模型渲染图（${catalog.nodes.length}）`;
status.textContent = '就绪'; status.dataset.state = 'idle';

function measure(model) {
  const box = new THREE.Box3(); let triangles = 0, meshes = 0;
  model.updateMatrixWorld(true);
  model.traverseVisible(mesh => {
    if (!mesh.isMesh || isHitboxName(mesh.name) || Math.abs(mesh.matrixWorld.determinant()) < 1e-12) return;
    const materials = [mesh.material].flat(); if (materials.every(material => material.opacity === 0)) return;
    mesh.geometry.computeBoundingBox();
    box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
    triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3; meshes++;
  });
  return { box, triangles, meshes };
}
function getDirection(node) {
  if (node.id === 'stair-flight-offset-multiple-01') return new THREE.Vector3(5, 3, 7).normalize();
  if (node.initialView) { const v = new THREE.Vector3(...node.initialView).normalize(); v.y = Math.max(v.y, 0.42); return v.normalize(); }
  if (node.id.startsWith('roof-truss-')) return new THREE.Vector3(1.4, 0.9, 5).normalize();
  if (node.category === '楼地层' || node.category === '基础') return new THREE.Vector3(5, 4.3, 6).normalize();
  return new THREE.Vector3(5, 3, 7).normalize();
}
function dispose(model) {
  const textures = new Set(), materials = new Set(), geometries = new Set();
  model.traverse(item => {
    if (item.geometry) geometries.add(item.geometry);
    for (const material of [item.material].flat().filter(Boolean)) { materials.add(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value); }
  });
  textures.forEach(texture => { texture.dispose(); texture.source?.data?.close?.(); });
  materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
  scene.remove(model); renderer.renderLists.dispose();
}
async function render(node) {
  const gltf = await loader.loadAsync(node.source), model = gltf.scene;
  let mixer, wrapper; let poseTime = 0; let poseCandidates = [];
  try {
    model.traverse(mesh => { if (mesh.isMesh && isHitboxName(mesh.name)) mesh.visible = false; });
    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      const duration = Math.max(...gltf.animations.map(clip => clip.duration));
      const actions = gltf.animations.map(source => {
        const clip = source.clone(); clip.duration = duration;
        const action = mixer.clipAction(clip); action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; return action;
      });
      // A previous endpoint can clamp/pause an action. Reset every action before
      // seeking again so the chosen complete pose is actually evaluated.
      const sample = time => { actions.forEach(action => action.reset().play()); mixer.setTime(time); return measure(model); };
      const candidates = [0.001, duration].map(time => ({ time, ...sample(time) }));
      poseCandidates = candidates.map(candidate => ({ time: candidate.time, meshes: candidate.meshes, triangles: Math.round(candidate.triangles) }));
      const mostMeshes = Math.max(...candidates.map(candidate => candidate.meshes));
      const mostTriangles = Math.max(...candidates.filter(candidate => candidate.meshes === mostMeshes).map(candidate => candidate.triangles));
      const full = candidates.filter(candidate => candidate.meshes === mostMeshes && candidate.triangles >= mostTriangles - 0.5);
      full.sort((a, b) => a.box.getSize(new THREE.Vector3()).length() - b.box.getSize(new THREE.Vector3()).length());
      poseTime = full[0].time; sample(poseTime);
    }
    let measured = measure(model);
    if (!measured.meshes || measured.box.isEmpty()) throw new Error('No visible mesh geometry');
    const max = Math.max(...measured.box.getSize(new THREE.Vector3()).toArray());
    wrapper = new THREE.Group(); wrapper.add(model); wrapper.scale.setScalar(4 / max);
    wrapper.position.copy(measured.box.getCenter(new THREE.Vector3())).multiplyScalar(-4 / max);
    scene.add(wrapper); measured = measure(wrapper);
    model.traverse(mesh => { if (mesh.isMesh && !isHitboxName(mesh.name)) { mesh.castShadow = true; mesh.receiveShadow = true; for (const material of [mesh.material].flat()) separateOpaqueSurfaceDepth(material); } });
    const animated = new Set(gltf.animations.flatMap(clip => clip.tracks.map(track => THREE.PropertyBinding.parseTrackName(track.name).nodeName)));
    for (const { owner, meshes } of collectOutlineSources(model, node.outlineExcluded, name => canonicalName(name, node.groups), animated)) {
      const geometry = createFeatureEdges(meshes.map(mesh => mesh.geometry));
      const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: '#3e4659', transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }));
      lines.renderOrder = 1; owner.add(lines);
    }
    floor.position.y = measured.box.min.y - 0.025;
    const direction = getDirection(node); camera.position.copy(direction).multiplyScalar(20); camera.lookAt(0, 0, 0); camera.updateMatrixWorld(true);
    // Project actual vertices, avoiding the excessive empty corners of a rotated box.
    const projected = new THREE.Box3(), point = new THREE.Vector3(); wrapper.updateMatrixWorld(true);
    wrapper.traverseVisible(mesh => {
      if (!mesh.isMesh || isHitboxName(mesh.name) || Math.abs(mesh.matrixWorld.determinant()) < 1e-12) return;
      const positions = mesh.geometry.attributes.position;
      for (let index = 0; index < positions.count; index++) projected.expandByPoint(point.fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
    });
    const span = projected.getSize(new THREE.Vector3()), center = projected.getCenter(new THREE.Vector3());
    const half = Math.max(span.y / 2, span.x / 2 / (width / height)) * 1.16;
    camera.left = center.x - half * width / height; camera.right = center.x + half * width / height;
    camera.top = center.y + half; camera.bottom = center.y - half; camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const png = await new Promise(resolve => renderer.domElement.toBlob(resolve, 'image/png'));
    const response = await fetch(`/__node-preview/save/${node.id}`, { method: 'POST', body: png, headers: { 'X-Render-Metadata': encodeURIComponent(JSON.stringify({ poseTime, poseCandidates, direction: direction.toArray(), meshes: measured.meshes, triangles: Math.round(measured.triangles) })) } });
    const result = await response.json(); if (!response.ok) throw new Error(result.error);
    const figure = document.createElement('figure'), image = document.createElement('img'), caption = document.createElement('figcaption');
    image.src = '/' + result.path + '?v=' + Date.now(); image.alt = node.title; caption.textContent = node.title;
    figure.append(image, caption); gallery.append(figure);
  } finally { mixer?.stopAllAction(); dispose(wrapper ?? model); }
}
button.addEventListener('click', async () => {
  const ids = filter.value.split(',').map(value => value.trim()).filter(Boolean);
  const selected = catalog.nodes.filter(node => !ids.length || ids.includes(node.id));
  errors.textContent = ''; gallery.replaceChildren(); button.disabled = true; finalize.disabled = true;
  progress.max = selected.length; progress.value = 0; status.dataset.state = 'rendering'; let failures = 0;
  for (const node of selected) {
    status.textContent = `${progress.value + 1} / ${selected.length} · ${node.title}`;
    try { await render(node); } catch (error) { failures++; errors.textContent += `${node.id}: ${error.message}\n`; }
    progress.value++; await new Promise(resolve => requestAnimationFrame(resolve));
  }
  status.textContent = `完成 ${selected.length - failures} / ${selected.length}；失败 ${failures}`;
  status.dataset.state = failures ? 'error' : 'complete'; button.disabled = false; finalize.disabled = false;
});
finalize.addEventListener('click', async () => {
  const response = await fetch('/__node-preview/finalize', { method: 'POST' }); const result = await response.json();
  status.textContent = response.ok ? `索引完成：${result.count} 张，${(result.bytes / 1024 / 1024).toFixed(2)} MB` : result.error;
  status.dataset.state = response.ok ? 'finalized' : 'error';
});
