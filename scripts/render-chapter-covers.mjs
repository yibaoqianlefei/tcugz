// Render real textbook models into transparent chapter artwork.
// Run against the local Vite server; CHAPTER_RENDER_URL defaults to :5173.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.env.CHAPTER_RENDER_URL ?? 'http://127.0.0.1:5173/';
const work = 'tmp/chapter-covers';
const output = 'public/images/chapters';
const chapters = [
  { id: 'foundation', path: 'foundation/independent-foundation/stepped-base.glb', nodeId: 'independent-foundation-01', view: [4, 2.8, 6], hidden: [] },
  { id: 'floor', path: 'floor/cast-ribbed-floor/cast-ribbed-floor.glb', nodeId: 'cast-ribbed-floor-01', view: [4, 2.5, 6], hidden: [] },
  { id: 'stairs', path: 'stairs/stair-composition/stair-composition.glb', nodeId: 'stair-composition-01', view: [-5, 3, 5], hidden: [] },
  { id: 'roof', path: 'roof/steel-batten-tile-roof/steel-batten-tile-roof.glb', nodeId: 'steel-batten-tile-roof-01', view: [-5, 3, 5], hidden: [] },
  { id: 'deformation-joint', path: 'roof/high-low-roof-joint/high-low-roof-joint-01.glb', nodeId: 'high-low-roof-joint-01', view: [4, 2.5, 6], hidden: [] },
];
await mkdir(work, { recursive: true });
await mkdir(output, { recursive: true });
await writeFile(`${work}/index.html`, '<!doctype html><html><body style="margin:0"><script type="module" src="./render.js"></script></body></html>');
await writeFile(`${work}/render.js`, `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
const width=1600, height=1400;
const renderer=new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
renderer.setSize(width,height);renderer.setPixelRatio(1);renderer.setClearColor(0xffffff,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
document.body.append(renderer.domElement);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff,0x8e95a3,1.5));
const key=new THREE.DirectionalLight(0xfff4e5,2);key.position.set(4,8,6);scene.add(key);
const fill=new THREE.DirectionalLight(0xe0e9ff,0.7);fill.position.set(-4,3,-2);scene.add(fill);
const camera=new THREE.OrthographicCamera(-3,3,2,-2,0.01,1000);
const draco=new DRACOLoader().setDecoderPath('/node_modules/three/examples/jsm/libs/draco/gltf/');
const loader=new GLTFLoader().setDRACOLoader(draco);
let model;
window.loadCover=async config=>{
  if(model) scene.remove(model);
  const gltf=await loader.loadAsync('/models/'+config.path);model=gltf.scene;
  const mixer=new THREE.AnimationMixer(model);
  gltf.animations.forEach(clip=>{ const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play(); });
  // These node assets start assembled and animate towards an exploded view.
  // Use their first keyframe for the complete construction, not the final exploded state.
  if(gltf.animations.length) mixer.setTime(0);
  const meshes=[];
  model.updateMatrixWorld(true);
  model.traverse(mesh=>{
    if(!mesh.isMesh||mesh.name==='chapter-outline') return;
    const box=new THREE.Box3().setFromObject(mesh);meshes.push({name:mesh.name,size:box.getSize(new THREE.Vector3()).toArray(),position:box.getCenter(new THREE.Vector3()).toArray()});
    if(/hitbox/i.test(mesh.name)||config.hidden.includes(mesh.name)){mesh.visible=false;return;}
    for(const material of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
      material.roughness=Math.max(material.roughness,0.72);material.metalness=Math.min(material.metalness,0.2);
    }
    const edgePositions=new THREE.EdgesGeometry(mesh.geometry,35).getAttribute('position').array;
    const edgeGeometry=new LineSegmentsGeometry().setPositions(edgePositions);
    const edgeMaterial=new LineMaterial({color:0x242730,linewidth:1.65,transparent:true,opacity:0.88,resolution:new THREE.Vector2(width,height),toneMapped:false});
    const edges=new LineSegments2(edgeGeometry,edgeMaterial);
    edges.name='chapter-outline';mesh.add(edges);
  });
  const box=new THREE.Box3();
  model.traverse(mesh=>{if(mesh.isMesh&&mesh.visible&&mesh.name!=='chapter-outline')box.expandByObject(mesh);});
  model.position.sub(box.getCenter(new THREE.Vector3()));model.updateMatrixWorld(true);scene.add(model);
  window.currentCover={ meshes,animations:gltf.animations.map(clip=>({name:clip.name,duration:clip.duration,tracks:clip.tracks.map(t=>({name:t.name,times:Array.from(t.times),values:Array.from(t.values)}))})) };
};
window.renderCover=(view=[4,2.5,6])=>{
  camera.position.set(...view).normalize().multiplyScalar(50);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
  const points=[];
  model.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.visible||mesh.name==='chapter-outline')return;
    const box=new THREE.Box3().setFromObject(mesh);
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  });
  const bounds=new THREE.Box3().setFromPoints(points),span=bounds.getSize(new THREE.Vector3()),mid=bounds.getCenter(new THREE.Vector3());
  const half=Math.max(span.y/2,span.x/2/(width/height))*1.08;
  camera.left=mid.x-half*(width/height);camera.right=mid.x+half*(width/height);camera.top=mid.y+half;camera.bottom=mid.y-half;camera.updateProjectionMatrix();
  renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
};
window.coverReady=true;
`);

const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1600,height:1400}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}${work}/index.html`);
  await page.waitForFunction(()=>window.coverReady,undefined,{timeout:45000});
  const report=[];
  for(const chapter of chapters){
    await page.evaluate(config=>window.loadCover(config),chapter);
    await writeFile(`${work}/${chapter.id}-model.json`,JSON.stringify(await page.evaluate(()=>window.currentCover),null,2));
    const views={front:chapter.view,back:[-4,2.5,-6],side:[-5,3,5]};
    for(const [name,view]of Object.entries(views)){
      const data=await page.evaluate(view=>window.renderCover(view),view);
      await writeFile(`${work}/${chapter.id}-${name}.png`,Buffer.from(data.split(',')[1],'base64'));
    }
    const selected=process.env[`CHAPTER_${chapter.id.toUpperCase().replaceAll('-','_')}_VIEW`]??'front';
    if(!views[selected])throw new Error(`Unknown cover view: ${selected}`);
    const rendered=sharp(`${work}/${chapter.id}-${selected}.png`);
    const {data,info}=await rendered.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let left=info.width,top=info.height,right=-1,bottom=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      if(data[(y*info.width+x)*4+3]<64)continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<left||bottom<top)throw new Error(`Empty chapter cover: ${chapter.id}`);
    const padding=36;left=Math.max(0,left-padding);top=Math.max(0,top-padding);right=Math.min(info.width-1,right+padding);bottom=Math.min(info.height-1,bottom+padding);
    const crop={left,top,width:right-left+1,height:bottom-top+1};
    await rendered.extract(crop).webp({quality:91}).toFile(`${output}/${chapter.id}.webp`);
    report.push({chapter:chapter.id,source:chapter.path,nodeId:chapter.nodeId,view:selected,camera:views[selected],assemblyFrame:0,width:crop.width,height:crop.height,hidden:chapter.hidden});
    console.log(`${chapter.id}: ${crop.width} × ${crop.height} (${selected}).`);
  }
  if(errors.length)throw new Error(errors.join('\n'));
  await writeFile(`${work}/report.json`,JSON.stringify(report,null,2));
}finally{await browser.close();}
