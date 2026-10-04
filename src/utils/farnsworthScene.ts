import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CaseTopicId } from '../data/caseStudies';

/** Metres. HABS IL-1105, sheets 3–7 (2009 measured condition).
 * Major dimensions are measured; rolled profiles, finishes and fixture shapes
 * are nominal reconstructions. Presentation ground / planting is separately
 * grouped and illustrative, not a reconstruction of the historic site.
 */
export const farnsworthDimensions = {
  length: 23.57, width: 8.744, columnBay: 6.706,
  floor: 1.3716, terrace: 0.6604, ceiling: 4.2418, roof: 4.7752,
  terraceLength: 16.84, terraceWidth: 6.90,
  coreLength: 7.50, coreWidth: 3.78,
  columnDepth: .2159, columnWidth: .20574,
  channelDepth: .381, joistDepth: .3048,
};

export function createFarnsworthScene() {
  const d = farnsworthDimensions;
  const scene = new THREE.Group(); scene.name = 'farnsworth-house-habs-reconstruction';
  const parts = new Map<CaseTopicId, THREE.Group>();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const group = (name: string, topic?: CaseTopicId) => {
    const result = new THREE.Group(); result.name = name;
    if (topic) { parts.set(topic, result); result.userData.caseTopic = topic; }
    scene.add(result); return result;
  };
  const steel = group('eight-columns-and-steel-frame', 'pilotis');
  const glazing = group('glazing-and-doors', 'windows');
  const platforms = group('travertine-platforms-and-stairs', 'roof');
  const roofShell = group('roof-assembly');
  const interior = group('service-core-and-wardrobe');

  // Deterministic, authored material variation, not a photograph of the original finish.
  const texture = (wood: boolean) => {
    const width = 128, height = 256, pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain = wood ? Math.sin(x * .37 + Math.sin(y * .016) * .6) * 9 + Math.sin(x * 2.1) * 3 : Math.sin(y * .24 + Math.sin(x * .026) * 1.7) * 3;
      const shade = grain + (noise - Math.floor(noise) - .5) * (wood ? 6 : 7);
      const base = wood ? [159, 117, 76] : [210, 202, 179];
      const offset = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) pixels[offset + c] = base[c] + shade;
      pixels[offset + 3] = 255;
    }
    const map = new THREE.DataTexture(pixels, width, height); map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.magFilter = THREE.LinearFilter;
    map.minFilter = THREE.LinearMipmapLinearFilter; map.generateMipmaps = true; map.needsUpdate = true;
    textures.add(map); return map;
  };
  const paint = new THREE.MeshStandardMaterial({ color: '#d9dbd5', roughness: .48, metalness: .12, envMapIntensity:.55 });
  const stoneMap=texture(false), woodMap=texture(true);
  const stone = new THREE.MeshStandardMaterial({ color: '#f0ebde', map: stoneMap, bumpMap:stoneMap, bumpScale:.0012, roughness: .82, envMapIntensity:.4 });
  const wood = new THREE.MeshStandardMaterial({ color: '#dcc2a4', map: woodMap, bumpMap:woodMap, bumpScale:.0006, roughness: .62, envMapIntensity:.45 });
  const metal = new THREE.MeshStandardMaterial({ color: '#9ca5aa', roughness: .3, metalness: .8 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#b7ccc6', transparent: true, opacity: .12, roughness: .10, metalness: 0, clearcoat: .65, envMapIntensity:.7, depthWrite: false, side: THREE.DoubleSide });
  const gravelPixels = new Uint8Array(128*128*4);
  for(let i=0;i<128*128;i++) {
    const shade=153+Math.floor((Math.sin(i*91.7)*45758.53%1)*9);
    gravelPixels.set([shade,shade,shade-4,255],i*4);
  }
  const gravelMap=new THREE.DataTexture(gravelPixels,128,128); gravelMap.colorSpace=THREE.SRGBColorSpace;
  gravelMap.wrapS=gravelMap.wrapT=THREE.RepeatWrapping; gravelMap.repeat.set(12,5);
  gravelMap.magFilter=THREE.LinearFilter; gravelMap.minFilter=THREE.LinearMipmapLinearFilter; gravelMap.generateMipmaps=true; gravelMap.anisotropy=4;
  gravelMap.needsUpdate=true; textures.add(gravelMap);
  const gravel = new THREE.MeshStandardMaterial({ color: '#d9d8ca', roughness: .98, map: gravelMap, bumpMap:gravelMap, bumpScale:.003 });
  const white = new THREE.MeshStandardMaterial({ color: '#dfdfd8', roughness: .8 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2e3031', roughness: .75 });
  [paint, stone, wood, metal, glass, gravel, white, dark].forEach(m => materials.add(m));
  const edgeMaterial = new THREE.LineBasicMaterial({ color: '#62665f', transparent: true, opacity: .22 }); materials.add(edgeMaterial);
  function mesh(parent: THREE.Group, name: string, geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial, position: number[], edges = false) {
    geometries.add(geometry);
    const own = material.clone(); materials.add(own);
    const object = new THREE.Mesh(geometry, own); object.name = name; object.position.set(position[0], position[1], position[2]);
    object.userData.caseOriginalColor = own.color.clone(); object.userData.caseTopic = parent.userData.caseTopic;
    object.castShadow = material !== glass; object.receiveShadow = material !== glass;
    parent.add(object);
    if (edges) {
      const edge = new THREE.EdgesGeometry(geometry, 28); geometries.add(edge);
      const lines = new THREE.LineSegments(edge, edgeMaterial); lines.raycast = () => {}; object.add(lines);
    }
    return object;
  }
  const box = (p: THREE.Group, name: string, size: number[], pos: number[], material = paint, edges = false) => mesh(p, name, new THREE.BoxGeometry(size[0], size[1], size[2]), material, pos, edges);
  function iBeam(p: THREE.Group, name: string, depth: number, width: number, length: number, pos: number[], axis: 'x' | 'y' | 'z', flange = .014, web = .009) {
    const t = flange, w = width / 2, h = depth / 2;
    const points = [[-w,-h],[w,-h],[w,-h+t],[web/2,-h+t],[web/2,h-t],[w,h-t],[w,h],[-w,h],[-w,h-t],[-web/2,h-t],[-web/2,-h+t],[-w,-h+t]];
    const shape = new THREE.Shape(points.map(([x,y]) => new THREE.Vector2(x,y)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false }); geometry.translate(0,0,-length/2);
    const beam = mesh(p,name,geometry,paint,pos);
    if (axis === 'y') beam.rotation.x = -Math.PI/2;
    if (axis === 'x') beam.rotation.y = Math.PI/2;
    return beam;
  }
  // C15 perimeter sections open towards the slab. Outer web faces touch the
  // inner flanges of the W8 columns, following the welded connection described
  // in TT 2013 §4.04. Small flange/web thicknesses remain nominal dimensions.
  function channel(p: THREE.Group, name: string, length: number, pos: number[], rotation: number) {
    const h = d.channelDepth / 2, flange = .016, web = .018, width = .095;
    const shape = new THREE.Shape([[0,-h],[width,-h],[width,-h+flange],[web,-h+flange],[web,h-flange],[width,h-flange],[width,h],[0,h]].map(([x,y])=>new THREE.Vector2(x,y)));
    const geometry = new THREE.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false}); geometry.translate(0,0,-length/2);
    const beam = mesh(p,name,geometry,paint,pos,true); beam.rotation.y = rotation;
    return beam;
  }
  const xs = [-10.08, -3.374, 3.334, 10.046];
  const columnZ = d.width/2+d.columnDepth/2;
  for (const x of xs) for (const z of [-columnZ, columnZ]) iBeam(steel,'main-column',d.columnDepth,d.columnWidth,4.57,[x,2.285,z],'y',.017,.010);
  // Continuous perimeter channels and the transverse joist rhythm visible below the slabs.
  const floorBeamY = d.floor-.032-d.channelDepth/2, roofBeamY = d.ceiling+.205;
  const joistWidth=.131, joistFlange=.014, joistWeb=.009;
  const joistXs = Array.from({length:13},(_,n)=>-10.08+n*1.6764);
  for (const y of [floorBeamY,roofBeamY]) {
    for (const z of [-d.width/2,d.width/2]) {
      channel(steel,'perimeter-channel',d.length,[0,y,z],z>0?Math.PI/2:-Math.PI/2);
    }
    for (const x of [-d.length/2,d.length/2]) channel(steel,'end-channel',d.width-.036,[x,y,0],x<0?0:Math.PI);
    for (const x of joistXs) iBeam(steel,y<d.floor?'floor-joist':'roof-joist',d.joistDepth,joistWidth,d.width-.036,[x,y<d.floor?y:d.ceiling+.17,0],'z',joistFlange,joistWeb);
  }
  // Precast permanent formwork bears on the bottom flanges; concrete infill
  // clears the top flanges. The mortar bed meets the stone underside.
  const floorGaps=[-11.66,...joistXs,11.66];
  const precastBottom=floorBeamY-d.joistDepth/2+joistFlange, precastTop=precastBottom+.05;
  const fillTop=d.floor-.052;
  for(let n=0;n<floorGaps.length-1;n++) {
    const first=n===0,last=n===floorGaps.length-2;
    const x0=floorGaps[n]+(first?0:joistWidth/2+.001),x1=floorGaps[n+1]-(last?0:joistWidth/2+.001);
    const p0=first?-d.length/2+.018:floorGaps[n]+joistWeb/2+.001,p1=last?d.length/2-.018:floorGaps[n+1]-joistWeb/2-.001;
    box(platforms,'floor-precast-form',[p1-p0,.05,8.48],[(p0+p1)/2,precastBottom+.025,0],white);
    box(platforms,'main-floor-infill',[x1-x0,fillTop-precastTop,8.48],[(x0+x1)/2,(fillTop+precastTop)/2,0],white);
  }
  box(platforms,'floor-finish-bed',[23.35,.020,8.5],[0,d.floor-.042,0],white);
  box(platforms,'main-travertine',[23.35,.032,8.5],[0,d.floor-.016,0],stone,true);
  box(roofShell,'suspended-ceiling',[23.35,.016,8.5],[0,d.ceiling+.008,0],white);
  // Precast channel planks, not a solid rectangular roof slab. Batch their
  // skins and ribs into one draw call; they bear on the cross-girder tops.
  const roofPieces: THREE.BufferGeometry[]=[];
  const roofBottom=d.ceiling+.17+d.joistDepth/2, roofTop=d.ceiling+.4224, skin=.0269;
  for(let n=0;n<floorGaps.length-1;n++) {
    const first=n===0,last=n===floorGaps.length-2;
    const x0=first?-d.length/2+.018:floorGaps[n]+.0015,x1=last?d.length/2-.018:floorGaps[n+1]-.0015;
    const rib0=first?-d.length/2+.095:x0,rib1=last?d.length/2-.095:x1;
    for(let z=-4.25;z<4.25;z+=.6096) {
      const width=Math.min(.6096,4.25-z),centerZ=z+width/2;
      roofPieces.push(new THREE.BoxGeometry(x1-x0,skin,width-.003).translate((x0+x1)/2,roofTop-skin/2,centerZ));
      for(const dz of [-width/2+.025,width/2-.025]) roofPieces.push(new THREE.BoxGeometry(rib1-rib0,roofTop-roofBottom-skin,.047).translate((rib0+rib1)/2,(roofTop-skin+roofBottom)/2,centerZ+dz));
    }
  }
  const roofGeometry=mergeGeometries(roofPieces); roofPieces.forEach(piece=>piece.dispose());
  mesh(roofShell,'precast-roof',roofGeometry,white,[0,0,0]);
  box(roofShell,'roof-insulation',[23.35,.050,8.5],[0,d.ceiling+.4474,0],white);
  box(roofShell,'roof-weathering',[23.35,.055,8.5],[0,d.roof-.0325,0],gravel);
  for (const z of [-4.37,4.37]) box(roofShell,'roof-edge',[d.length,.08,.095],[0,d.roof-.04,z],paint,true);
  for (const x of [-11.74,11.74]) box(roofShell,'roof-edge',[.095,.08,d.width],[x,d.roof-.04,0],paint,true);
  // Lower terrace is part of the architecture, offset south-west exactly as on sheet 3.
  const terraceX = -10.06, terraceNorth=columnZ+d.columnDepth/2, terraceSouth=terraceNorth+d.terraceWidth;
  const terraceZ=(terraceNorth+terraceSouth)/2, terraceBeamY=d.terrace-.032-d.channelDepth/2;
  const terraceXs=[-16.78,-10.08,-3.374], terraceJoists=Array.from({length:9},(_,n)=>-16.78+n*1.6764);
  const terraceGaps=[terraceX-d.terraceLength/2+.095,...terraceJoists,terraceX+d.terraceLength/2-.095];
  const terracePrecastBottom=terraceBeamY-d.joistDepth/2+joistFlange, terracePrecastTop=terracePrecastBottom+.05;
  for(let n=0;n<terraceGaps.length-1;n++) {
    const first=n===0,last=n===terraceGaps.length-2;
    const x0=terraceGaps[n]+(first?0:joistWidth/2+.001),x1=terraceGaps[n+1]-(last?0:joistWidth/2+.001);
    const p0=first?terraceX-d.terraceLength/2+.018:terraceGaps[n]+joistWeb/2+.001,p1=last?terraceX+d.terraceLength/2-.018:terraceGaps[n+1]-joistWeb/2-.001;
    box(platforms,'terrace-precast-form',[p1-p0,.05,d.terraceWidth-.20],[(p0+p1)/2,terracePrecastBottom+.025,terraceZ],white);
    box(platforms,'lower-terrace-infill',[x1-x0,d.terrace-.052-terracePrecastTop,d.terraceWidth-.20],[(x0+x1)/2,(d.terrace-.052+terracePrecastTop)/2,terraceZ],white);
  }
  box(platforms,'terrace-finish-bed',[d.terraceLength,.020,d.terraceWidth],[terraceX,d.terrace-.042,terraceZ],white);
  box(platforms,'lower-travertine',[d.terraceLength,.032,d.terraceWidth],[terraceX,d.terrace-.016,terraceZ],stone,true);
  for (const z of [terraceNorth,terraceSouth]) channel(platforms,'terrace-channel',d.terraceLength,[terraceX,terraceBeamY,z],z===terraceNorth?-Math.PI/2:Math.PI/2);
  for (const x of [-18.48,-1.64]) channel(platforms,'terrace-end',d.terraceWidth-.036,[x,terraceBeamY,terraceZ],x<terraceX?0:Math.PI);
  for(const x of terraceJoists) iBeam(platforms,'terrace-joist',d.joistDepth,joistWidth,d.terraceWidth-.036,[x,terraceBeamY,terraceZ],'z',joistFlange,joistWeb);
  for (const x of terraceXs) {
    // Two north terrace supports coincide with main columns; do not duplicate them.
    for (const z of [columnZ,terraceSouth+d.columnDepth/2]) if (!(z < 5 && x > -11)) iBeam(platforms,'terrace-column',d.columnDepth,d.columnWidth,.6,[x,.3,z],'y',.017,.010);
  }
  // Tile seams are one line buffer, avoiding hundreds of individual meshes.
  const seams: number[] = [];
  const tileLines = (x0: number,x1: number,z0: number,z1: number,y: number) => {
    for(let x=x0+.8382;x<x1;x+=.8382) seams.push(x,y,z0,x,y,z1);
    for(let z=z0+.6096;z<z1;z+=.6096) seams.push(x0,y,z,x1,y,z);
  };
  tileLines(-11.67,11.67,-4.25,4.25,d.floor+.001); tileLines(-18.48,-1.64,terraceNorth,terraceSouth,d.terrace+.001);
  const seamGeometry = new THREE.BufferGeometry(); seamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(seams,3)); geometries.add(seamGeometry);
  const seamMaterial = new THREE.LineBasicMaterial({ color:'#918c7f',transparent:true,opacity:.32 }); materials.add(seamMaterial);
  const seamLines = new THREE.LineSegments(seamGeometry,seamMaterial); seamLines.raycast=()=>{}; platforms.add(seamLines);
  function stairs(count: number, lowerY: number, upperY: number, upperZ: number, run: number) {
    const rise = (upperY-lowerY)/(count+1), tread = run/count;
    for (let n=0;n<count;n++) box(platforms,'open-travertine-tread',[3.66435,.065,tread-.005],[-6.70,upperY-rise*(n+1)-.0325,upperZ+tread*(n+.5)],stone,true);
    const supportRise=rise*count,slope=supportRise/run,angle=Math.atan(slope),extension=.04,tail=.12;
    const fullRun=run+extension+tail,length=Math.hypot(fullRun,slope*fullRun);
    const highTop=upperY-rise-.065-.006;
    const midZ=upperZ+(run-extension+tail)/2,supportY=highTop-slope*(midZ-upperZ)-.05/Math.cos(angle);
    for (const x of [-8.10,-5.30]) {
      const stringer=box(platforms,'stair-stringer',[.025,.10,length],[x,supportY,midZ]);
      stringer.rotation.x=angle;
      stringer.userData.stairSupport={highTop,upperZ,run,supportRise};
      // Small sloped bearing pieces meet flat tread undersides without the
      // inclined bar cutting into the stone. Connection shapes are nominal.
      for(let n=0;n<count;n++) {
        const z=upperZ+tread*(n+.5), top=upperY-rise*(n+1)-.065;
        const barTop=highTop-(z-upperZ)/run*supportRise, gap=top-barTop;
        const vertices=[-.018,0,-.05,.018,0,-.05,.018,0,.05,-.018,0,.05,-.018,-gap+slope*.05,-.05,.018,-gap+slope*.05,-.05,.018,-gap-slope*.05,.05,-.018,-gap-slope*.05,.05];
        const bearing=new THREE.BufferGeometry(); bearing.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        bearing.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]); bearing.computeVertexNormals();
        mesh(platforms,'tread-bearing',bearing,paint,[x,top,z]);
      }
      // Visible support rods recorded on HABS sheet 7 (2009 museum condition).
      // Underground concrete is not invented as part of the displayed model.
      if(lowerY===0) {
        const z=upperZ+tread*(count-.5),top=lowerY+rise-.065,bottom=-.06;
        mesh(platforms,'stair-support-pin',new THREE.CylinderGeometry(.0095,.0095,top-bottom,12),paint,[x,(top+bottom)/2,z]);
      }
    }
  }
  stairs(5,d.terrace,d.floor,d.width/2+.012,2.1844); stairs(4,0,d.terrace,terraceSouth+.012,1.368425);
  const sillY=d.floor+.022, headY=d.ceiling-.02, frameHeight=headY-sillY, frameCenter=(sillY+headY)/2;
  const glassBottom=sillY+.0205,glassTop=headY-.0205,glassHeight=glassTop-glassBottom;
  const glassCenter=(glassBottom+glassTop)/2, west=-5.079, east=11.67;
  const mullions=[west,-3.374,-.021,3.334,6.69,10.046,east];
  for(const z of [-4.265,4.265]) {
    for(let i=0;i<mullions.length-1;i++) box(glazing,'fixed-glass',[(mullions[i+1]-mullions[i])-.044,glassHeight,.0064],[(mullions[i+1]+mullions[i])/2,glassCenter,z],glass);
    for(const x of mullions) box(glazing,'steel-glazing-mullion',[.038,frameHeight,.048],[x,frameCenter,z]);
    for(const y of [sillY,headY]) box(glazing,'glass-head-and-sill',[east-west,.035,.05],[(east+west)/2,y,z]);
    for(const x of xs.filter(x=>x>=west)) for(const y of [sillY,headY]) {
      const innerFace=Math.abs(z)+.024,outerFace=d.width/2;
      box(glazing,'glazing-column-tie',[.038,.012,outerFace-innerFace],[x,y,Math.sign(z)*(innerFace+outerFace)/2]);
    }
  }
  for(const x of [west,east]) {
    for(const z of (x === west ? [-4.265,4.265] : [-4.265,-1.445,1.445,4.265])) box(glazing,'end-mullion',[.048,frameHeight,.038],[x,frameCenter,z]);
    for(const y of [sillY,headY]) box(glazing,'end-head-and-sill',[.05,.035,8.53],[x,y,0]);
  }
  // West end: two full-height doors and fixed side lights, no opaque end wall.
  const doorCenter=.305, doorHalf=1.05;
  for(const [z0,z1] of [[-4.265,doorCenter-doorHalf],[doorCenter+doorHalf,4.265]]) box(glazing,'entry-side-light',[.0064,glassHeight,z1-z0-.044],[west,glassCenter,(z0+z1)/2],glass);
  for(const z of [doorCenter-doorHalf,doorCenter,doorCenter+doorHalf]) box(glazing,'entry-door-frame',[.06,frameHeight,.038],[west-.016,frameCenter,z]);
  for(const z of [doorCenter-doorHalf/2,doorCenter+doorHalf/2]) {
    box(glazing,'entry-door-glass',[.0064,glassHeight,doorHalf-.044],[west-.019,glassCenter,z],glass);
    for(const y of [sillY,headY]) box(glazing,'entry-door-rail',[.06,.035,doorHalf],[west-.016,y,z]);
    box(glazing,'entry-door-handle',[.11,.025,.05],[west-.07,d.floor+1.05,z>doorCenter?doorCenter+.09:doorCenter-.09],metal);
  }
  for(const [z0,z1] of [[-4.265,-1.445],[1.445,4.265]]) box(glazing,'east-side-light',[.0064,glassHeight,z1-z0-.044],[east,glassCenter,(z0+z1)/2],glass);
  box(glazing,'east-upper-light',[.0064,glassHeight-.643,2.846],[east,glassBottom+.643+(glassHeight-.643)/2,0],glass);
  for(const z of [-.7225,.7225]) box(glazing,'hopper-window',[.0064,.594,1.401],[east,glassBottom+.3,z],glass);
  box(glazing,'hopper-transom',[.048,.04,2.9],[east,glassBottom+.62,0]); box(glazing,'hopper-divider',[.048,.62,.038],[east,glassBottom+.31,0]);
  // Service core, kitchen, two bathrooms and mechanical room (sheet 6).
  const coreX=4.18, coreZ=-1.55, coreH=2.4384, coreY=d.floor+coreH/2;
  const left=.43,right=7.93,north=-3.44,south=.34;
  box(interior,'core-north-partition',[7.5,coreH,.09],[coreX,coreY,-2.6],wood);
  // Room partitions, including door openings rather than a single solid box.
  for(const x of [left,right]) {
    const rear=x===left?-2.6:-2.335;
    box(interior,'bathroom-end-wall',[.09,coreH,-.89-rear],[x,coreY,(rear-.89)/2],wood,true);
    box(interior,'bathroom-door',[.05,2.10,.78],[x,d.floor+1.05,-.50],wood,true);
    box(interior,'bathroom-door-head',[.09,coreH-2.1,.9],[x,d.floor+2.1+(coreH-2.1)/2,-.5],wood);
    box(interior,'bathroom-south-jamb',[.09,coreH,.45],[x,coreY,.115],wood);
    box(interior,'door-knob',[.12,.035,.035],[x,d.floor+1.0,-.19],metal);
  }
  box(interior,'mechanical-partition',[.09,coreH,1.71],[2.90,coreY,-1.745],white);
  box(interior,'mechanical-door',[.05,2.10,.78],[2.90,d.floor+1.05,-.50],wood,true);
  box(interior,'mechanical-door-head',[.09,coreH-2.1,.9],[2.90,d.floor+2.1+(coreH-2.1)/2,-.5],white);
  box(interior,'mechanical-south-jamb',[.09,coreH,.45],[2.90,coreY,.115],white);
  box(interior,'mechanical-partition',[.09,coreH,2.49],[5.32,coreY,-1.09],white);
  box(interior,'master-bath-rear-partition',[2.61,coreH,.09],[6.625,coreY,-2.335],white);
  // South wood panels above and beside the recessed fireplace.
  box(interior,'wood-above-hearth',[7.50,coreH-.83,.10],[coreX,d.floor+.83+(coreH-.83)/2,south],wood);
  for(const [x,w] of [[1.91,2.96],[6.455,2.96]]) box(interior,'hearth-side-panels',[w,.83,.10],[x,d.floor+.415,south],wood);
  box(interior,'recessed-fireback',[1.55,.70,.14],[coreX,d.floor+.4,south-.18],dark);
  box(interior,'hearth-stone',[1.8,.06,.52],[coreX,d.floor+.03,south-.09],stone);
  const coreCeiling = box(interior,'core-ceiling',[7.5,.09,3.78],[coreX,d.floor+coreH-.045,coreZ],wood);
  // Panel joints and cabinet fronts follow the measured elevations; profile widths are nominal.
  for(let x=left+.83;x<right;x+=.83) box(interior,'veneer-panel-joint',[.007,coreH-.84,.008],[x,d.floor+.84+(coreH-.84)/2,south+.056],dark);
  box(interior,'kitchen-cabinet-bottom',[4.86,.04,.60],[coreX,d.floor+.02,north+.33],white);
  for(const z of [north+.042,north+.618]) box(interior,'kitchen-cabinet-face',[4.86,.80,.025],[coreX,d.floor+.4,z],white,true);
  for(const x of [1.76,2.95,3.58,4.83,6.60]) box(interior,'kitchen-cabinet-partition',[.025,.8,.55],[x,d.floor+.4,north+.33],white);
  // Actual countertop opening: no black rectangle floating over an uncut slab.
  const counterShape=new THREE.Shape(); counterShape.moveTo(-2.45,-.33); counterShape.lineTo(2.45,-.33); counterShape.lineTo(2.45,.33); counterShape.lineTo(-2.45,.33); counterShape.closePath();
  const sinkHole=new THREE.Path(); sinkHole.moveTo(-.24,-.19); sinkHole.lineTo(-.24,.19); sinkHole.lineTo(.28,.19); sinkHole.lineTo(.28,-.19); sinkHole.closePath(); counterShape.holes.push(sinkHole);
  const counter=mesh(interior,'aluminium-counter',new THREE.ExtrudeGeometry(counterShape,{depth:.035,bevelEnabled:false}),metal,[coreX,d.floor+.8575,north+.33],true); counter.rotation.x=Math.PI/2;
  box(interior,'kitchen-backsplash',[4.9,.13,.025],[coreX,d.floor+.92,-2.61],metal);
  box(interior,'kitchen-upper-cabinets',[4.86,.70,.34],[coreX,d.floor+1.65,-2.79],wood,true);
  for(let x=1.8;x<6.6;x+=.61) {
    box(interior,'cabinet-front-seam',[.005,.73,.01],[x,d.floor+.42,north+.025],dark);
    box(interior,'cabinet-pull',[.18,.018,.035],[x+.2,d.floor+.7,north-.005],metal);
    box(interior,'upper-cabinet-seam',[.007,.7,.008],[x,d.floor+1.65,-2.965],dark);
  }
  for(const x of [left+.6,right-.6]) box(interior,'kitchen-end-storage',[1.18,coreH,.64],[x,coreY,north+.30],wood,true);
  box(interior,'sink-bottom',[.50,.015,.36],[4.2,d.floor+.716,north+.33],metal);
  for(const x of [3.947,4.453]) box(interior,'sink-side',[.014,.13,.38],[x,d.floor+.78,north+.33],metal);
  for(const z of [north+.146,north+.514]) box(interior,'sink-end',[.49,.13,.012],[4.2,d.floor+.78,z],metal);
  const tap=mesh(interior,'tap',new THREE.TorusGeometry(.08,.012,6,14,Math.PI),metal,[4.2,d.floor+.98,-2.91]); tap.rotation.z=Math.PI;
  for(const x of [2.78,3.18]) for(const z of [-3.28,-2.99]) mesh(interior,'hob',new THREE.CylinderGeometry(.09,.09,.007,16),dark,[x,d.floor+.866,z]);
  for(const x of [1.3,6.95]) {
    const rearOffset=x<4?0:.265;
    const vanityShape=new THREE.Shape(); vanityShape.moveTo(-.31,-.235); vanityShape.lineTo(.31,-.235); vanityShape.lineTo(.31,.235); vanityShape.lineTo(-.31,.235); vanityShape.closePath();
    const opening=new THREE.Path(); opening.absellipse(0,0,.17,.136,0,Math.PI*2,true,0); vanityShape.holes.push(opening);
    const vanity=mesh(interior,'bathroom-vanity',new THREE.ExtrudeGeometry(vanityShape,{depth:.03,bevelEnabled:false}),stone,[x,d.floor+.80,-2.28+rearOffset]); vanity.rotation.x=Math.PI/2;
    const basin=mesh(interior,'washbasin',new THREE.SphereGeometry(.17,16,12,0,Math.PI*2,Math.PI/2,Math.PI/2),white,[x,d.floor+.80,-2.28+rearOffset]); basin.scale.set(1,.5,.8); basin.material.side=THREE.DoubleSide;
    box(interior,'mirror',[.62,.8,.008],[x,d.floor+1.43,-2.544+rearOffset],metal);
    const bowlProfile=[[.10,0],[.11,.06],[.20,.14],[.21,.18],[.20,.20],[.17,.20],[.15,.16],[.075,.075],[.02,.07]].map(([r,y])=>new THREE.Vector2(r,y));
    const toilet=mesh(interior,'wc',new THREE.LatheGeometry(bowlProfile,24),white,[x+(x<4?-.55:.55),d.floor+.22,-2.18+rearOffset]); toilet.scale.set(.8,1,1.25);
    box(interior,'wc-cistern',[.36,.4,.14],[x+(x<4?-.55:.55),d.floor+.50,-2.47+rearOffset],white);
    mesh(interior,'wc-pedestal',new THREE.CylinderGeometry(.10,.13,.22,12),white,[x+(x<4?-.55:.55),d.floor+.11,-2.18+rearOffset]);
  }
  box(interior,'guest-shower-floor',[.72,.025,.72],[2.42,d.floor+.013,-2.19],stone);
  box(interior,'master-bath-base',[.62,.05,1.55],[5.75,d.floor+.025,-1.3],white);
  for(const x of [5.48,6.02]) box(interior,'master-bath-side',[.08,.40,1.55],[x,d.floor+.25,-1.3],white,true);
  for(const z of [-2.025,-.575]) box(interior,'master-bath-end',[.46,.40,.10],[5.75,d.floor+.25,z],white,true);
  // Freestanding wardrobe separates sleeping and living space without reaching the ceiling.
  box(interior,'teak-wardrobe',[.5715,1.829,3.658],[9.18,d.floor+.9145,1.84],wood,true);
  for(const z of [.48,1.40,2.32,3.23]) {
    box(interior,'wardrobe-joint',[.008,1.79,.007],[8.891,d.floor+.9145,z],dark);
    box(interior,'wardrobe-pull',[.035,.12,.018],[8.877,d.floor+.9,z+.12],metal);
  }
  mesh(interior,'underfloor-utility-shaft',new THREE.CylinderGeometry(.356,.356,d.floor-.25,24),white,[coreX,(d.floor-.25)/2,-1.55]);
  // Roof service upstands shown in the east/west elevations. Detail shapes approximate.
  for(const x of [3.62,4.80]) {
    box(roofShell,'service-upstand',[.30,.25,.30],[x,d.roof+.10,-1.7],metal,true);
    box(roofShell,'service-cap',[.46,.09,.46],[x,d.roof+.27,-1.7],paint,true);
  }
  box(roofShell,'service-curb',[3.45,.20,.48],[coreX,d.roof+.055,-1.7],paint,true);
  const bounds = new THREE.Box3().setFromObject(scene);
  // Keep presentation dressing separate, so it cannot shrink the camera's building fit.
  const setting = group('presentation-setting'); setting.userData.illustrative = true;
  const lawnPixels = new Uint8Array(256 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const shade = (grain - Math.floor(grain) - .5) * 8 + Math.sin(x * .045 + Math.sin(y * .031)) * 3;
    lawnPixels.set([169 + shade, 179 + shade, 155 + shade, 255], (y * 256 + x) * 4);
  }
  const lawnMap = new THREE.DataTexture(lawnPixels, 256, 256); lawnMap.colorSpace = THREE.SRGBColorSpace;
  lawnMap.wrapS = lawnMap.wrapT = THREE.RepeatWrapping; lawnMap.repeat.set(10, 8);
  lawnMap.magFilter = THREE.LinearFilter; lawnMap.minFilter = THREE.LinearMipmapLinearFilter;
  lawnMap.generateMipmaps = true; lawnMap.anisotropy = 4; lawnMap.needsUpdate = true; textures.add(lawnMap);
  const lawn = new THREE.MeshStandardMaterial({color:'#e4e8d9',map:lawnMap,bumpMap:lawnMap,bumpScale:.004,roughness:1}); materials.add(lawn);
  const pathMaterial = new THREE.MeshStandardMaterial({color:'#b8b6a5',roughness:.95}); materials.add(pathMaterial);
  const leafMaterial = new THREE.MeshStandardMaterial({color:'#6f8266',roughness:.96}); materials.add(leafMaterial);
  box(setting,'presentation-lawn',[90,.16,80],[-3.8,-.081,3.2],lawn);
  box(setting,'presentation-path',[3.70,.013,2.4],[-6.70,.007,13.65],pathMaterial);
  for(const x of [-8.5,-4.9]) box(setting,'path-edge',[.045,.019,2.4],[x,.012,13.65],stone);
  for(const [x,z] of [[-18.5,-3.0],[10.2,11.3]]) {
    box(setting,'planting-bed',[1.65,.025,1.35],[x,.012,z],pathMaterial);
    for(let i=0;i<3;i++) {
      const plant=mesh(setting,'low-shrub',new THREE.IcosahedronGeometry(.36,2),leafMaterial,[x+(i-1)*.40,.29,z+(i%2)*.28]);
      plant.scale.set(1,.7,1); plant.rotation.y=i*1.2;
    }
  }
  // Sparse tufts at the margins; never obscure the columns, glazing or stair flights.
  const tuftMaterial = new THREE.MeshStandardMaterial({color:'#748568',roughness:1,side:THREE.DoubleSide}); materials.add(tuftMaterial);
  for(const [x,z] of [[-19,9],[11,-4],[-15,13],[7,13]]) for(let i=0;i<5;i++) {
    const blade=mesh(setting,'grass-tuft',new THREE.ConeGeometry(.017,.22,3),tuftMaterial,[x+(i-2)*.08,.11,z+Math.sin(i)*.06]);
    blade.rotation.z=(i-2)*.16;
  }
  const anchors: Record<CaseTopicId,THREE.Vector3> = {
    pilotis:new THREE.Vector3(-3.374,.80,4.48),
    windows:new THREE.Vector3(6.69,2.65,4.30),
    roof:new THREE.Vector3(-8.2,.67,9),
  };
  return { scene, parts, bounds, anchors, roofShell, coreCeiling, setting, dispose:()=>{ geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose()); } };
}

export function highlightFarnsworthPart(model: Pick<ReturnType<typeof createFarnsworthScene>, 'parts'>, selected: CaseTopicId|null) {
  model.parts.forEach((group,id)=>group.traverse(object=>{
    if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial)) return;
    object.material.color.copy(object.userData.caseOriginalColor as THREE.Color);
    object.material.emissive.set(id===selected?'#5368a7':'#000000'); object.material.emissiveIntensity=id===selected?.12:0;
  }));
}
