import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFarnsworthScene, farnsworthDimensions as d, highlightFarnsworthPart } from '../src/utils/farnsworthScene';

const model = createFarnsworthScene();
const meshes: THREE.Mesh[] = [];
model.scene.traverse(object=>{ if(object instanceof THREE.Mesh) meshes.push(object); });
const named = (name: string) => meshes.filter(mesh=>mesh.name===name);
assert.equal(named('main-column').length,8,'HABS has eight main steel columns');
assert.equal(named('open-travertine-tread').length,9,'Two stair flights: four and five treads');
assert.equal(named('fixed-glass').length,12);
assert.equal(named('entry-door-glass').length,2);
assert.equal(named('hopper-window').length,2);
assert.equal(named('underfloor-utility-shaft').length,1);
assert.equal(model.setting.userData.illustrative,true,'Presentation landscaping is distinguished from the measured building');
assert(named('low-shrub').every(mesh=>mesh.parent===model.setting));
assert(model.parts.size===3,'Presentation setting does not become a teaching topic');
const roofBounds = new THREE.Box3().setFromObject(model.roofShell);
assert(Math.abs(roofBounds.getSize(new THREE.Vector3()).x-d.length)<.01);
const mainFloor = named('main-travertine')[0];
const floorBounds=new THREE.Box3().setFromObject(mainFloor);
assert(Math.abs(floorBounds.max.y-d.floor)<.00001,'Survey floor datum');
const terraceBounds=new THREE.Box3().setFromObject(named('lower-travertine')[0]);
assert(Math.abs(terraceBounds.getSize(new THREE.Vector3()).x-16.84)<.00001,'Measured lower platform length');
assert(Math.abs(terraceBounds.max.y-d.terrace)<.00001);
// These are incompatible solids. Welded/attached frame members are deliberately
// excluded from generic collision counting: contact alone is not a defect.
const volumeOverlap=(a: THREE.Mesh,b: THREE.Mesh)=>{
  const intersection=new THREE.Box3().setFromObject(a).intersect(new THREE.Box3().setFromObject(b));
  if(intersection.isEmpty()) return 0;
  const size=intersection.getSize(new THREE.Vector3()); return size.x*size.y*size.z;
};
for(const slab of named('main-floor-infill')) for(const beam of named('floor-joist')) assert(volumeOverlap(slab,beam)<1e-7,'Floor infill must not pass through beam web');
for(const beam of named('roof-joist')) for(const layer of [...named('suspended-ceiling'),...named('precast-roof')]) assert(volumeOverlap(beam,layer)<1e-7,'Roof slabs clear the steel beams');
for(const panel of named('fixed-glass')) for(const column of named('main-column')) assert(volumeOverlap(panel,column)<1e-7,'Glass cannot pass through main columns');
// Check the actual load path, not just whether isolated boxes avoid overlaps.
const boundsOf=(mesh:THREE.Mesh)=>new THREE.Box3().setFromObject(mesh);
for(const column of named('main-column')) {
  const b=boundsOf(column),positive=column.position.z>0,face=positive?b.min.z:b.max.z;
  for(const channel of named('perimeter-channel').filter(beam=>Math.sign(beam.position.z)===Math.sign(column.position.z))) {
    const c=boundsOf(channel);
    assert(Math.abs(face-(positive?c.max.z:c.min.z))<1e-6,'Perimeter channel touches the column flange for its welded connection');
  }
}
for(const beam of [...named('floor-joist'),...named('roof-joist')]) {
  const b=boundsOf(beam);
  assert(Math.abs((b.max.y-b.min.y)-.3048)<1e-6,'Recorded twelve-inch cross-girder depth');
  assert(Math.abs(b.max.z-(d.width/2-.018))<1e-6 && Math.abs(b.min.z+(d.width/2-.018))<1e-6,'Cross-girder ends meet both channel webs');
}
const roofPrecastBottom=boundsOf(named('precast-roof')[0]).min.y;
assert(named('roof-joist').every(beam=>Math.abs(boundsOf(beam).max.y-roofPrecastBottom)<1e-6),'Roof channel-plank ribs bear on girder top flanges');
for(const panel of named('fixed-glass')) for(const frame of [...named('steel-glazing-mullion'),...named('glass-head-and-sill')]) assert(volumeOverlap(panel,frame)<1e-8,'Glazing pane clears its steel frame');
for(const joist of named('floor-joist')) {
  const lowerFlangeTop=boundsOf(joist).min.y+.014;
  const supported=named('floor-precast-form').filter(panel=>Math.abs(panel.position.x-joist.position.x)<1.1);
  assert(supported.length>0 && supported.every(panel=>Math.abs(boundsOf(panel).min.y-lowerFlangeTop)<1e-6),'Precast floor panels bear on lower girder flanges');
}
for(const bar of named('stair-stringer')) {
  const upperFrame=bar.userData.stairSupport.upperZ<5 ? named('perimeter-channel') : named('terrace-channel');
  assert(upperFrame.some(frame=>volumeOverlap(bar,frame)>1e-8),'Every stair stringer reaches its landing frame');
}
for(const sink of [...named('sink-bottom'),...named('sink-side'),...named('sink-end')]) for(const cabinet of [...named('kitchen-cabinet-face'),...named('kitchen-cabinet-partition')]) assert(volumeOverlap(sink,cabinet)<1e-7,'Sink must fit inside the hollow cabinet');
for(const support of named('stair-stringer')) {
  const {highTop,upperZ,run,supportRise}=support.userData.stairSupport;
  for(const tread of named('open-travertine-tread').filter(tread=>tread.position.z>upperZ && tread.position.z<upperZ+run)) {
    const uphillEdge=tread.position.z-(tread.geometry as THREE.BoxGeometry).parameters.depth/2;
    const top=highTop-(uphillEdge-upperZ)/run*supportRise;
    assert(top <= tread.position.y-.0325+1e-6,'Even the uphill edge of the sloping bar must remain below the entire stone tread');
  }
}
for(const bearing of named('tread-bearing')) {
  const bounds=new THREE.Box3().setFromObject(bearing);
  const tread=named('open-travertine-tread').find(tread=>Math.abs(tread.position.z-bearing.position.z)<.0001)!;
  assert(Math.abs(bounds.max.y-(tread.position.y-.0325))<1e-6,'Sloped bearing supports the flat tread underside');
}
let triangles=0;
for(const mesh of meshes) {
  const positions=mesh.geometry.attributes.position;
  assert([...positions.array].every(Number.isFinite),mesh.name);
  triangles+=(mesh.geometry.index?.count??positions.count)/3;
}
assert(triangles<60000,`Browser triangle budget: ${triangles}`);
assert(meshes.length<400,`Draw call budget: ${meshes.length}`);
const glass=named('fixed-glass')[0].material as THREE.MeshPhysicalMaterial;
const alpha=glass.opacity;
highlightFarnsworthPart(model,'windows'); assert(glass.emissiveIntensity>0); assert.equal(glass.opacity,alpha);
highlightFarnsworthPart(model,null); assert.equal(glass.emissiveIntensity,0);
const geometrySet=new Set(meshes.map(mesh=>mesh.geometry));
let disposed=0; geometrySet.forEach(geometry=>geometry.addEventListener('dispose',()=>disposed++));
model.dispose(); assert.equal(disposed,geometrySet.size,'Releasing a case disposes all owned mesh geometry');
console.log(`PASS HABS geometry contract: ${meshes.length} meshes, ${triangles} triangles, complete external envelope, separate presentation setting`);
