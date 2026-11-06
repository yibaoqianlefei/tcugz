import {correctedParapetStorage} from './roof-parapet-storage-source-correction.mjs';
import {correctedEavesStorage} from './roof-eaves-storage-source-correction.mjs';
// Roof batch two: source-faithful native vector reconstruction.
// Graphic coordinates are not construction dimensions; no scan paths or raster images.
const ink = '#28313b';
const p = (d, fill = 'none', cls = 'outline', attrs = '') => `<path d="${d}" fill="${fill}" class="${cls}" stroke="${ink}" ${attrs}/>`;
const line = (a, b, cls = 'fine', attrs = '') => p(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`, 'none', cls, attrs);
const role = (id, body) => `<g data-role="${id}">${body}</g>`;
const part = (id, body, box) => ({ id, body: `<g data-geometry-id="${id}">${body}</g>`, box });
const param = (name, value, sourceLocator, conditions = '原图实例标注；不由图示像素推算构造尺寸，不作为其他节点或现行工程统一取值。') => ({ name, value, kind: 'source-example', sourceLocator, conditions });
const mark = (name, target, side, row) => ({ name, target, side, row });
const dim = (id, a, b, offset, label, axis = 'y') => ({ id, a, b, offset, label, axis, labelSide: 0, status: 'source-projection', measuredObjects: ['原图尺寸界线起点', '原图尺寸界线终点'] });
const sectionBreak = (x, y, width) => p(`M${x} ${y}h${width / 2 - 12}l6 -6 6 12 6 -6h${width / 2 - 6}`, 'none', 'medium');
const sourceHatch = prefix => `<defs><pattern id="${prefix}-source-hatch" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M-2 27L27-2M23 27L27 23" fill="none" stroke="#838b94" stroke-width=".65"/></pattern></defs>`;
const hatch = prefix => `url(#${prefix}-source-hatch)`;
const hidden = 'stroke-dasharray="9 6" style="stroke-width:1.1"';
// The source shows these passages dashed within the wall section. Preserve that
// projection convention instead of claiming a new same-plane structural slot.
function wallPassage(prefix, upper, lower, left = 220, right = 345, elbow = true) {
 let s = role(`${prefix}-hidden-upper-passage`, line([left, upper], [right, upper], 'fine', hidden) + line([left, upper + 13], [right, upper + 13], 'fine', hidden));
 s += role(`${prefix}-hidden-lower-passage`, line([left, lower], [right, lower], 'fine', hidden) + line([left, lower + 13], [right, lower + 13], 'fine', hidden));
 if (elbow) {
  s += role(`${prefix}-upper-outlet-open-elbow`, p(`M${left} ${upper}H165Q150 ${upper} 150 ${upper + 15}V${upper + 66}H159V${upper + 18}Q159 ${upper + 13} 166 ${upper + 13}H${left}`, 'white', 'medium'));
 } else {
  s += role(`${prefix}-upper-outlet-open-stub`, line([left - 37, upper], [left, upper], 'medium') + line([left - 37, upper + 13], [left, upper + 13], 'medium'));
 }
 s += role(`${prefix}-upper-inlet-open-stub`, line([right, upper], [right + 39, upper], 'medium') + line([right, upper + 13], [right + 39, upper + 13], 'medium'));
 s += role(`${prefix}-lower-outlet-open-stub`, line([left - 37, lower], [left, lower], 'medium') + line([left - 37, lower + 13], [left, lower + 13], 'medium'));
 s += role(`${prefix}-lower-inlet-open-stub`, line([right, lower], [right + 40, lower], 'medium') + line([right, lower + 13], [right + 40, lower + 13], 'medium'));
 return s;
}
function waterSurface(prefix, x, y, end) {
 // Water-area fill stops exactly at the surface and the visible protection face.
 return role(`${prefix}-water-surface`, line([x, y], [end, y], 'fine') + p(`M${end - 178} ${y}h42l-21 16Z`, '#28313b', 'fine'));
}
function parapetStorage() {
 const prefix = 'storage-parapet';
 let s = sourceHatch(prefix);
 s += role('parapet-wall-source-section', p('M220 67H345V518H220Z', hatch(prefix)));
 s += role('parapet-cap', p('M194 36H371V78H362V67H204V78H194Z', 'url(#concrete)', 'outline'));
 // Source upper finishing/return has independent boundaries; no inferred material.
 s += role('parapet-inner-thin-band', p('M345 67H352V307Q352 321 366 321H812V326H365Q345 326 345 307Z', '#e9edf1', 'medium'));
 // Both adjacent strips reuse this precise turn: (352,307), Q(352,321),
 // (366,321). The protection repeats the waterproof upper turn in reverse.
 s += role('parapet-waterproof-turn', p('M352 88H357V307Q357 316 366 316H812V321H366Q352 321 352 307Z', '#404952', 'medium'));
 s += role('parapet-protection-turn', p('M357 88H366V285L391 310H812V316H366Q357 316 357 307Z', 'url(#mortar)', 'medium'));
 s += role('roof-base-layer', p('M345 326H812V338H345Z', 'url(#mortar)', 'medium'));
 // Fill uses a compound path. Voids really subtract material, rather than white
 // ellipses concealing concrete that still occupies the same section.
 let slab = 'M364 338H812V404H364Z';
 for (const x of [400, 467, 534, 601, 668, 735, 802]) slab += `M${x - 26} 371a26 26 0 1 0 52 0a26 26 0 1 0-52 0Z`;
 s += `<defs><clipPath id="${prefix}-slab-crop"><path d="M364 338H812V404H364Z"/></clipPath></defs>` + role('hollow-roof-slab', `<g clip-path="url(#${prefix}-slab-crop)">${p(slab, 'url(#concrete)', 'outline', 'fill-rule="evenodd"')}</g>`);
 s += role('slab-end-joint', p('M345 338H364V404H345Z', '#35404a', 'medium'));
 // The gutter/hopper mouth and lower neck are deliberately not closed by a cap.
 s += role('external-rainwater-hopper', p('M75 330H84V416H75Z', 'white', 'medium') + p('M211 330H220V416H211Z', 'white', 'medium') + p('M68 416H90L116 475H107L80 425H68Z', 'white', 'medium') + p('M199 416H220V425H210L183 475H174L199 425Z', 'white', 'medium') + p('M107 475H116V484H121V526H113V484H107Z', 'white', 'medium') + p('M174 475H183V484H177V526H169V484H174Z', 'white', 'medium') + line([68, 330], [220, 330], 'fine') + line([68, 416], [220, 416], 'fine'));
 s += wallPassage(prefix, 213, 293);
 s += waterSurface(prefix, 384, 226, 812);
 s += role('source-crops', sectionBreak(220, 518, 125) + p('M812 304v35l5 5-5 5v61', 'none', 'fine'));
 const anchors = { waterSurface: [812, 226], upperFlashingProjection: [366, 88], overflowTop: [220, 213], overflowBottom: [220, 226], drainTop: [220, 293], drainBottom: [220, 306], slabTop: [364, 338], slabBottom: [364, 404], jointFace: [360.5, 387], hollowCenters: [400, 467, 534, 601, 668, 735, 802].map(x => [x, 371]), hopperMouth: [148, 330], hopperOutlet: [145, 526] };
 return { parts: [part('water-storage-parapet-section', s, [63, 30, 755, 503])], view: '女儿墙式蓄水屋面排水剖面', anchors,
  marks: [mark('溢水孔中距同泄水孔', [180, 213], 'left', 175), mark('泄水孔中距≤15 m', [380, 293], 'right', 269), mark('沥青麻丝嵌缝', [360.5, 387], 'right', 448)],
  dimensions: [dim('source-water-surface-to-flashing-top', anchors.waterSurface, anchors.upperFlashingProjection, 870, '≥100')],
  interfaces: [
   { id: 'parapet-visible-waterproof-turn', objects: ['parapet-inner-thin-band', 'parapet-waterproof-turn', 'parapet-protection-turn'], scope: '按原图保留独立薄带及墙根连续转折，未命名薄带不补成新设防层。' },
   { id: 'parapet-projected-two-wall-passages', objects: [`${prefix}-hidden-upper-passage`, `${prefix}-hidden-lower-passage`, `${prefix}-upper-outlet-open-elbow`, `${prefix}-lower-outlet-open-stub`], scope: '高低两道孔保持独立；墙内虚线及墙外开口按源投影表达，未据此补剖切孔壁材质。' },
   { id: 'parapet-open-hopper-neck', objects: ['external-rainwater-hopper'], scope: '雨水斗上部承接口和下方管腔保持开口，不以闭合矩形填死。' },
   { id: 'parapet-joint-slab', objects: ['slab-end-joint', 'hollow-roof-slab', 'parapet-wall-source-section'], scope: '板端嵌缝只占板墙之间的独立窄带，空心孔从板实体中扣除。' },
  ], orthogonalChecks: [
   { id: 'parapet-wall-vertical', points: [[220, 67], [220, 518]], relation: 'vertical' },
   { id: 'parapet-water-level-horizontal', points: [[384, 226], [812, 226]], relation: 'horizontal' },
  ] };
}
function eavesStorage() {
 const prefix = 'storage-eaves';
 let s = sourceHatch(prefix);
 s += role('bearing-wall-upper-source-section', p('M345 25H475V365H345Z', hatch(prefix)));
 s += role('bearing-base-source-concrete', p('M345 365H475V509H345Z', 'url(#concrete)'));
 s += role('bearing-wall-lower-source-section', p('M345 509H475V584H345Z', hatch(prefix)));
 s += role('flashing-upper-return', p('M475 47H487V72H525V132H517V88H475Z', 'url(#concrete)', 'medium'));
 s += role('flashing-upper-seal', p('M475 98H499L507 115H475Z', '#35404a', 'medium'));
 s += role('roof-waterproof', p('M475 115H481V318Q481 341 501 341H862V347H500Q475 347 475 319Z', '#404952', 'medium'));
 s += role('roof-protection', p('M481 121H490V294L522 326H862V341H501Q481 341 481 318Z', 'url(#mortar)', 'medium'));
 s += role('roof-base-layer', p('M475 347H862V365H475Z', 'url(#mortar)', 'medium'));
 let slab = 'M493 365H862V442H493Z';
 for (const x of [532, 617, 702, 787, 872]) slab += `M${x - 29} 403.5a29 29 0 1 0 58 0a29 29 0 1 0-58 0Z`;
 // Last source void is partial at the right crop, retained through clipping.
 s += `<defs><clipPath id="${prefix}-slab-crop"><path d="M493 365H862V442H493Z"/></clipPath></defs>` + role('hollow-roof-slab', `<g clip-path="url(#${prefix}-slab-crop)">${p(slab, 'url(#concrete)', 'outline', 'fill-rule="evenodd"')}</g>`);
 s += role('slab-end-joint', p('M475 365H493V442H475Z', '#35404a', 'medium'));
 // Concrete gutter has a genuine outlet opening. Its left and right portions
 // terminate at the funnel; neither material continues invisibly through it.
 s += role('eaves-gutter-structure-left', p('M40 225H87V238H51V245H68V320Q68 363 112 363H166L196 392V402L160 370H70V393H40Z', 'url(#concrete)'));
 s += role('eaves-gutter-structure-right', p('M302 363H345V383H290L274 399V392Z', 'url(#concrete)'));
 s += role('eaves-gutter-lining-left', p('M51 238H75V320Q75 356 112 356H170L203 389V494H196V392L166 363H112Q68 363 68 320V245H51Z', '#f4f6f8', 'medium'));
 s += role('eaves-gutter-lining-right', p('M267 389L300 356H345V363H302L274 392V494H267Z', '#f4f6f8', 'medium'));
 s += role('downpipe-wall-left', p('M170 356L203 389V494H210V386L175 351Z', '#e7ecf2', 'medium'));
 s += role('downpipe-wall-right', p('M260 386L295 351L300 356L267 389V494H260Z', '#e7ecf2', 'medium'));
 s += wallPassage(prefix, 223, 310, 345, 475, false);
 s += waterSurface(prefix, 514, 236, 862);
 s += role('source-crops', sectionBreak(345, 25, 130) + sectionBreak(345, 584, 130) + p('M862 319v45l5 6-5 5v73', 'none', 'fine'));
 const anchors = { waterSurface: [862, 236], upperFlashingProjection: [499, 98], left50UpperProjection: [345, 157], left50LowerProjection: [345, 223], overflowTop: [345, 223], overflowBottom: [345, 236], drainTop: [345, 310], drainBottom: [345, 323], slabTop: [493, 365], slabBottom: [493, 442], jointFace: [487, 411], gutterOutletOpeningLeft: [210, 494], gutterOutletOpeningRight: [260, 494], hollowCenters: [532, 617, 702, 787].map(x => [x, 403.5]), partialHollowCenter: [872, 403.5] };
 return { parts: [part('water-storage-eaves-section', s, [33, 18, 837, 574])], view: '檐沟式蓄水屋面排水剖面', anchors,
  marks: [mark('溢水孔每开间一个', [314, 223], 'left', 169), mark('泄水孔', [513, 310], 'right', 286), mark('沥青麻丝嵌缝', [487, 411], 'right', 489)],
  dimensions: [dim('source-water-surface-to-flashing-top', anchors.waterSurface, anchors.upperFlashingProjection, 911, '≥100'), { ...dim('source-left-local-50', anchors.left50LowerProjection, anchors.left50UpperProjection, 300, '50'), status: 'source-projection-upper-interface-unconfirmed', measuredObjects: ['原图溢水孔附近下端投影', '原图上方短尺寸界线，材料测界未明确'] }],
  interfaces: [
   { id: 'eaves-two-level-wall-passages', objects: [`${prefix}-hidden-upper-passage`, `${prefix}-hidden-lower-passage`, `${prefix}-upper-outlet-open-stub`, `${prefix}-lower-outlet-open-stub`], scope: '两道墙孔分别保留高低位置、墙内虚线与墙外短开口，不以单管替代。' },
   { id: 'eaves-gutter-open-downpipe', objects: ['eaves-gutter-structure-left', 'eaves-gutter-structure-right', 'eaves-gutter-lining-left', 'eaves-gutter-lining-right', 'downpipe-wall-left', 'downpipe-wall-right'], scope: '沟底在漏斗口断开，管腔向下贯通；左右混凝土不跨越真实出口。' },
   { id: 'eaves-roof-layers-turn', objects: ['roof-protection', 'roof-waterproof', 'roof-base-layer'], scope: '防水上翻转角与水平段连续，相邻层共界而不相互重复占面。' },
   { id: 'eaves-slab-end', objects: ['bearing-base-source-concrete', 'slab-end-joint', 'hollow-roof-slab'], scope: '原图嵌缝、承托段、板体及扣出的孔腔分别识读。' },
  ], orthogonalChecks: [
   { id: 'eaves-bearing-wall-vertical', points: [[345, 25], [345, 584]], relation: 'vertical' },
   { id: 'eaves-water-level-horizontal', points: [[514, 236], [862, 236]], relation: 'horizontal' },
   { id: 'eaves-ring-base-horizontal', points: [[345, 509], [475, 509]], relation: 'horizontal' },
  ] };
}
function accessHatch() {
 const prefix = 'roof-access';
 let s = sourceHatch(prefix);
 s += `<defs><pattern id="${prefix}-crossed-source-layer" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M-2-2L16 16M16-2L-2 16" fill="none" stroke="#8a929b" stroke-width=".65"/></pattern></defs>`;
 // Shared source-visible rounded contours. Graphic spacing separates lines;
 // it is not a thickness or a construction-sequence specification.
 s += role('hatch-left-structure-and-upstand', p('M210 352V112H280V352Z', hatch(prefix)) + p('M40 352H280V405H40Z', 'url(#concrete)'));
 s += role('hatch-right-structure-and-upstand', p('M540 352V112H610V352Z', hatch(prefix)) + p('M540 352H780V405H540Z', 'url(#concrete)'));
 s += role('hatch-left-bottom-source-layer', p('M40 352H210V334H40Z', 'white', 'medium'));
 s += role('hatch-right-bottom-source-layer', p('M610 334H780V352H610Z', 'white', 'medium'));
 s += role('hatch-left-crossed-source-layer', p('M40 296H210V334H40Z', `url(#${prefix}-crossed-source-layer)`, 'medium'));
 s += role('hatch-right-crossed-source-layer', p('M610 296H780V334H610Z', `url(#${prefix}-crossed-source-layer)`, 'medium'));
 // Original unlabelled white forming region below the rounded membrane turn.
 // Its curve is the exact reverse of the additional sheet's inner boundary;
 // it is not an air gap and is not assigned an unsupported mortar specification.
 s += role('hatch-left-unlabelled-forming-base', p('M210 260V296H171Q210 296 210 260Z', 'white', 'fine'));
 s += role('hatch-right-unlabelled-forming-base', p('M610 260V296H649Q610 296 610 260Z', 'white', 'fine'));
 // Source enlargement shows a local upper sheet ending before each drawing
 // crop. Do not extend this additional sheet over the entire roof or turn the
 // uncertain inner opening outlines into two filled sheets down to slab soffit.
 s += role('hatch-main-waterproof-left', p('M40 291H171Q205 291 205 260V112Q205 107 210 107H280Q285 107 285 112M210 112V260Q210 296 171 296H40', 'none', 'medium'));
 s += role('hatch-additional-membrane-left', p('M110 291L125 286H171Q200 286 200 260V112Q200 102 210 102H280', 'none', 'medium'));
 s += role('hatch-main-waterproof-right', p('M780 291H649Q615 291 615 260V112Q615 107 610 107H540Q535 107 535 112M610 112V260Q610 296 649 296H780', 'none', 'medium'));
 s += role('hatch-additional-membrane-right', p('M710 291L695 286H649Q620 286 620 260V112Q620 102 610 102H540', 'none', 'medium'));
 // Preserve the single visible inner-face/soffit outline continuously. It is
 // not evidence for two full-height waterproof sheets or an invented y158 end.
 s += role('hatch-inner-source-outlines', p('M285 112V416M535 112V416','none','medium'));
 s += role('hatch-soffit-source-outlines', p('M40 416H285M535 416H780','none','medium'));
 s += role('concrete-capping-ring-left', p('M211 74H283V102H211Z', 'url(#concrete)', 'outline'));
 s += role('concrete-capping-ring-right', p('M537 74H609V102H537Z', 'url(#concrete)', 'outline'));
 // Cover is an inverted U; its inner void and the access opening stay open.
 s += role('access-cover', p('M190 55H630V102H618V74H202V102H190Z', 'white', 'outline'));
 s += role('hatch-source-crops', p('M40 272v67l-6 6 6 6v65M780 272v67l6 6-6 6v65', 'none', 'fine'));
 const anchors = { roofWaterproofProjection: [40, 291], upper250Projection: [211, 102], openingLeft: [285, 405], openingRight: [535, 405], leftRingTop: [244, 74], rightRingTop: [571, 74], cover: [410, 55], membraneLeftTurn: [202.5, 258], membraneRightTurn: [617.5, 258], additionalVisibleEnds:[[110,291],[710,291]], materialInterpretationStopsAtY:112, supportCrownLevels: { cappingSoffitAndAdditionalTop: 102, additionalMainInterface: 107, mainWallInterface: 112 }, wallFaces: { leftOutside: 210, leftInside: 280, rightInside: 540, rightOutside: 610 } };
 return { parts: [part('roof-access-hatch-section', s, [31, 49, 758, 367])], view: '屋面检修口剖面', anchors,
  marks: [mark('混凝土压顶圈', [245, 88], 'left', 64), mark('人孔盖', [410, 55], 'right', 40), mark('附加卷材', [620, 234], 'right', 185), mark('防水层', [744, 291], 'right', 271)],
  dimensions: [{ ...dim('source-hatch-upstand-projection', anchors.roofWaterproofProjection, anchors.upper250Projection, -22, '250'), status: 'source-projection-material-interface-unconfirmed', measuredObjects: ['原图屋面上部水平投影', '原图压顶圈下沿附近上部投影'], scope: '保留250原数值及投影，不改为≥250，也不由模型高度反推。' }],
  interfaces: [
   { id: 'hatch-cover-ring-support', objects: ['access-cover', 'concrete-capping-ring-left', 'concrete-capping-ring-right'], scope: '盖板下缘在两侧压顶圈上共界支承，中心仍为空洞；不添加铰链、锁件或开启机构。' },
   { id: 'hatch-opening-preserved', objects: ['hatch-left-structure-and-upstand', 'hatch-right-structure-and-upstand'], scope: '左右井壁分离，洞口从盖板下方至板底贯通，未添加底板。' },
   { id: 'hatch-concentric-membrane-turns', objects: ['hatch-additional-membrane-left', 'hatch-main-waterproof-left', 'hatch-additional-membrane-right', 'hatch-main-waterproof-right'], scope: '原图上部局部附加线在屋面中途结束，防水层延至图幅截断边；共同转角轮廓保持连续。压顶下按原图平直墙顶恢复承托；洞内只保留连续至板底的中性面层边界，不补两条悬空短返回。层间绘图间距非工程厚度，不凭此确定施工先后。' },
   { id: 'hatch-rounding-forming-base', objects: ['hatch-left-unlabelled-forming-base', 'hatch-right-unlabelled-forming-base', 'hatch-left-structure-and-upstand', 'hatch-right-structure-and-upstand', 'hatch-main-waterproof-left', 'hatch-main-waterproof-right'], scope: '墙根白色成形区与卷材内弧共界、与井壁及下方原图交叉图例层相接；材料身份未标，不推定其配比或厚度。' },
  ], orthogonalChecks: [
   { id: 'hatch-opening-left-vertical', points: [[280, 139], [280, 405]], relation: 'vertical' },
   { id: 'hatch-opening-right-vertical', points: [[540, 139], [540, 405]], relation: 'vertical' },
   { id: 'hatch-cover-horizontal', points: [[190, 55], [630, 55]], relation: 'horizontal' },
  ] };
}
export const roofStorageDrawings = [
 {
  id: 'water-storage-parapet-drainage-01', title: '蓄水屋面 · 女儿墙式排水', file: 'water-storage-parapet-drainage-diagram.png', figure: null,
  revision: 'roof-batch2-parapet-r2-source-projection-2026-11-01',
  parameters: [
   param('水面至上部泛水投影距离', '≥100 mm', '原图右侧水面上方竖向尺寸；下端在水面，非蓄水区底'),
   param('泄水孔中距', '≤15 m', '原图中央“泄水孔中距≤15m”引线', '原图孔口沿墙布置中心间距；不是孔径、管径或水深，不按本局部剖面量取。'),
   param('溢水孔中距', '同泄水孔', '原图左上“溢水孔中距同泄水孔”'),
  ],
  note: '≥100为水面以上的原图投影；泄水孔中距≤15 m，溢水孔中距同泄水孔。',
  teaching: '分别识读高位溢水孔、低位泄水孔与墙外雨水斗，再追踪墙根泛水和空心板端嵌缝；蓄水深度未标注。',
  checks: ['重新独立查看原图整体及压顶、短孔口、雨水斗、板缝局部；不沿用r1原图保真结论。', '墙板剖面与墙外雨水斗外形投影分开表达；恢复三处完整横向口沿/套箍和短孔口可见端面。', '上部尺寸投影与竖向薄带起点恢复至邻近压顶底/墙顶的原图同高位置；≥100不作为水深。', '压顶挑出、斗身及管段相对墙厚的图形比例依原图恢复，绘图坐标不作为施工尺寸。', '六个完整孔、右端截取孔及第5/6孔间上宽下窄板缝轮廓均保留；板缝底部与填料仍未定。', '相邻带转角逐段共界；原图未明确材料的墙根外带及板上白色细带使用中性轮廓，不补砂浆图例。'],
  uncertainties: ['原截图未包含图号或教材印刷页码。', '墙体、压顶和保护构造的具体材料及厚度未标，按原图分界重建，不由模型命名补足。', '≥100上端邻近泛水上部，原图未充分给出精确材料测界，保留原投影身份。', '孔内管材、孔径、封堵和启闭措施未标，不增设阀件；历史蓄水实例不直接代表现行完整防水设防。'],
  sourceFeatures: ['上部压顶挑出及两侧斜收下缘', '墙内上下两道虚线孔投影及外伸短口端面', '墙根独立薄带及保护转折，未标材料保持中性', '六个完整孔及右端截取孔', '第5与第6完整孔之间上宽下窄的板缝双边界', '板端沥青麻丝嵌缝', '雨水斗外形投影的上横沿、筒底横沿、下接管套箍及管侧边', '≥100、≤15m及同距文字三种独立标注'], build: correctedParapetStorage,
 },
 {
  id: 'water-storage-eaves-drainage-01', title: '蓄水屋面 · 檐沟式排水', file: 'water-storage-eaves-drainage-diagram.png', figure: null,
  revision: 'roof-batch2-eaves-r4-thin-pipe-wall-2026-11-02',
  parameters: [param('水面至泛水上部投影距离', '≥100 mm', '原图右侧水面以上竖向尺寸'), param('溢水孔布置', '每开间一个', '原图左上溢水孔引线'), param('墙外局部尺寸片段', '50 mm', '原图左侧横排50、短横线与向下竖线', '原图未清晰显示下端界线，材料测界也未定；只保留原数与可见线段，不补完整两端尺寸，不认作孔径或水深。')],
  note: '溢水孔每开间一个；≥100、50分别保留原图投影，不作水深或孔径。',
  teaching: '比较高位溢水与低位泄水通向外侧檐沟的位置，沿沟底开口追踪水落管；再辨认承托段、空心板与板端嵌缝。',
  checks: ['2026-11-02重新实看原图整体及檐沟、漏斗/管端、收头、孔口和板端局部，撤回r1原图匹配结论。', '檐沟内独立水平投影线、管段下端原有横线和各短口端边保留，不以解释水流为由删除。', '上部收头保留台阶及真实斜边，主体墙面校正为垂直；不把扫描倾斜和真实折边一起拉直。', '≥100保留原投影；50仅保留原数与可见横竖片段，未补下端界线及起止斜划。', '四个完整孔及末端约四分之三圆弧的截取孔按源位置复核，未强制等距。', '未知薄带、水平四处及竖向三处记号保留，未补砂浆、配筋或固定件身份；实体与衬带按共界复核。'],
  uncertainties: ['原截图未含图号、印刷页码。', '原图50的上端短界线没有材料指认，保留源投影而不强行解释功能。', '收头材料、孔径、沟坡、雨水管直径及现代完整设防均未标注。', '墙内虚线孔是源图投影表达，不据此创造同剖切面的槽形削弱。'],
  sourceFeatures: ['上下墙身原截取范围；扫描倾斜另行校正', '上部泛水收头的台阶、斜边和独立暗色座', '两级墙孔虚线及可见短口端面', '溢水孔每开间一个', '外侧L形檐沟多带轮廓及独立内水平线', '漏斗斜边、两侧管段和原下端横向轮廓', '墙下承托段材料分界', '四个完整孔及右端截取孔、板端嵌缝', '未定身份的水平四记号及竖向三记号', '≥100投影及50可见尺寸片段'], build: correctedEavesStorage,
 },
 {
  id: 'roof-access-hatch-01', title: '屋面检修口', file: 'roof-access-hatch-diagram.png', figure: '图6-26', revision:'roof-batch2-hatch-r3-flat-bearing-2026-11-02',
  parameters: [param('检修口上部竖向投影', '250 mm', '图6-26左侧竖向尺寸；屋面水平线至压顶圈下沿附近投影', '保留原图250，不改为≥250；材料测界未从低清图强行指定，不从模型尺寸推算。')],
  note: '图6-26；250为原图竖向投影。防水层、附加卷材和压顶圈分别识读。',
  teaching: '追踪屋面防水沿洞口井壁上翻的路径，辨认人孔盖和两侧压顶圈之间的支承，确认检修通道保持贯通。',
  checks: ['图6-26原文件与用户D盘原文件摘要一致；实看放大图中的上部局部卷材端头。', '盖板水平、井壁垂直，保留双侧压顶与贯通洞口。', '附加层端头位于图幅内，防水层延至截断边；不量取实际搭接长度。', '平直井壁顶承托压顶下薄层；内侧保留一条连续至板底转折的中性轮廓，不再把两道卷材延伸至板底或新增悬空端头。', '附加卷材、防水层引线分别指向局部上层与外侧连续层；不借模型名称增加SBS道数。'],
  uncertainties: ['原图仅提供图号6-26，教材版本与印刷页码未取得。', '250上端邻压顶圈下沿，具体材料测界未确证，保持原尺寸投影身份。', '井壁与水平构造层材料、层厚、坡向、盖板材料及开启方式未逐一标注。', '墙根白色成形区保留原轮廓和卷材贴附关系，材料名称、配比及厚度未标，不强行归为已核定砂浆做法。', '原图标注只区分防水层和附加卷材；不能据模型对象名将其称为两道SBS或补定保温做法。'],
  sourceFeatures: ['图6-26图号', '上部人孔盖与两侧短下返', '混凝土压顶圈在剖面中左右分离', '双侧井壁与中心贯通洞口', '两侧水平层的原图不同图例', '墙根及井壁顶部相邻弧形薄线', '墙根卷材下未标材料的白色成形区', '左右远端截断', '250原数值和投影'], build: accessHatch,
 },
];
