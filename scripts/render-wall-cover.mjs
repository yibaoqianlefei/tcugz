// Render the existing construction-column GLB into a static chapter cover.
// Run with the local Vite server available at WALL_RENDER_URL (default :5173).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.env.WALL_RENDER_URL ?? 'http://127.0.0.1:5173/';
const work = 'tmp/wall-cover';
await mkdir(work, { recursive: true });
await writeFile(`${work}/index.html`, '<!doctype html><html><body style="margin:0"><script type="module" src="./render.js"></script></body></html>');
await writeFile(`${work}/render.js`, `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
renderer.setSize(1400, 960);
renderer.setPixelRatio(1);
renderer.setClearColor(0xffffff, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8e95a3, 1.5));
const light = new THREE.DirectionalLight(0xfff4e5, 2.0);
light.position.set(4,8,6);light.castShadow = true;
light.shadow.mapSize.set(2048,2048);
light.shadow.camera.left=-5;light.shadow.camera.right=5;
light.shadow.camera.top=5;light.shadow.camera.bottom=-5;
light.shadow.bias=-0.0002;light.shadow.normalBias=0.012;
scene.add(light);
const fill = new THREE.DirectionalLight(0xe0e9ff, 0.7);fill.position.set(-4,3,-2);scene.add(fill);
const draco = new DRACOLoader().setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/');
const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('/models/wall/construction-column/construction-column.glb');
const model = gltf.scene;
const mixer = new THREE.AnimationMixer(model);
window.coverTracks = gltf.animations.map(clip => ({ name:clip.name, duration:clip.duration, tracks:clip.tracks.map(t => ({ name:t.name, times:Array.from(t.times), values:Array.from(t.values) })) }));
gltf.animations.forEach(clip => {
  const action=mixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
});
mixer.setTime(Math.max(...gltf.animations.map(clip => clip.duration)));
model.traverse(mesh => {
  if (!mesh.isMesh) return;
  if (/hitbox/i.test(mesh.name)) { mesh.visible=false; return; }
  mesh.castShadow=true;mesh.receiveShadow=true;
  for (const material of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) {
    material.roughness=Math.max(material.roughness,0.72);
    material.metalness=Math.min(material.metalness,0.2);
    if (/钢筋|箍筋/.test(mesh.name)) material.color.set('#62708a');
  }
});
model.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(model);
const center = box.getCenter(new THREE.Vector3());
model.position.sub(center);
scene.add(model);
const size = box.getSize(new THREE.Vector3());
const ground = new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.ShadowMaterial({ opacity:0.12 }));
ground.rotation.x=-Math.PI/2;ground.position.y=-size.y/2-0.01;ground.receiveShadow=true;scene.add(ground);
const camera = new THREE.OrthographicCamera(-3,3,2,-2,0.01,100);
window.renderCover = (view=[4,2.5,6]) => {
  camera.position.set(...view).normalize().multiplyScalar(15);
  camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const fitBox = new THREE.Box3().setFromObject(model);
  const points=[];
  for(const x of [fitBox.min.x,fitBox.max.x]) for(const y of [fitBox.min.y,fitBox.max.y]) for(const z of [fitBox.min.z,fitBox.max.z]) points.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const bounds=new THREE.Box3().setFromPoints(points);
  const span=bounds.getSize(new THREE.Vector3());const mid=bounds.getCenter(new THREE.Vector3());
  const half=Math.max(span.y/2, span.x/2/(1400/960))*1.12;
  camera.left=mid.x-half*(1400/960);camera.right=mid.x+half*(1400/960);
  camera.top=mid.y+half;camera.bottom=mid.y-half;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
};
window.renderCover();
window.coverReady=true;
`);
const browser = await chromium.launch({ headless:true, args:['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport:{ width:1400,height:960 } });
  const errors=[];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.goto(`${base}${work}/index.html`);
  await page.waitForFunction(() => window.coverReady, undefined, { timeout:45000 });
  await writeFile(`${work}/tracks.json`, JSON.stringify(await page.evaluate(() => window.coverTracks), null, 2));
  const views = { front:[4,2.5,6], back:[-4,2.5,-6], side:[-5,3,5] };
  for(const [name, view] of Object.entries(views)) {
    const data = await page.evaluate(view => window.renderCover(view), view);
    await writeFile(`${work}/${name}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  if(errors.length) throw new Error(errors.join('\n'));
  const chosen=process.env.WALL_COVER_VIEW ?? 'front';
  if(!views[chosen]) throw new Error('Unknown WALL_COVER_VIEW');
  await mkdir('public/images/wall', { recursive:true });
  const rendered=sharp(`${work}/${chosen}.png`);
  const stats=await rendered.stats();
  if(stats.channels[0].stdev < 10) throw new Error('Cover render is empty; refusing to replace the chapter asset.');
  // Frame the real geometry, excluding only excess transparent canvas/shadow.
  const { data,info }=await rendered.ensureAlpha().raw().toBuffer({ resolveWithObject:true });
  let left=info.width,top=info.height,right=0,bottom=0;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    if(data[(y*info.width+x)*4+3] < 64) continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  const padding=40;
  left=Math.max(0,left-padding);top=Math.max(0,top-padding);
  right=Math.min(info.width-1,right+padding);bottom=Math.min(info.height-1,bottom+padding);
  const crop={ left,top,width:right-left+1,height:bottom-top+1 };
  await rendered.extract(crop).webp({ quality:88 }).toFile('public/images/wall/chapter-cover.webp');
  console.log(`Cover dimensions: ${crop.width} × ${crop.height}.`);
  console.log(`Wall cover rendered from the assembled GLB (${chosen}).`);
} finally { await browser.close(); }
