import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Exact GLB mesh names (11). 尺寸措辞以图纸图 6-41「涂膜防水屋面高低屋面的泛水」
 *  中可辨认的标注为准（泛水高度 ≥250）；未标注的厚度、规格不引用、不推测。 */
export const coatingHighLowRoofFlashingLayers: NodeLayerInfo[] = [
  {
    objectName: '高侧墙体', name: '高侧墙体', order: 1,
    thickness: '图纸未标注墙厚',
    material: '墙体（剖面上以斜线填充表示；块材与强度等级未标注）',
    description: '高低屋面交接处的高侧墙体。对照图纸分别找上部钢板钉固位置和下部槽内卷材收头，辨认抹灰、压条与油膏的位置；模型仅截取局部，分解位移用于观察。',
  },
  {
    objectName: '低屋面结构板', name: '低屋面结构板', order: 2,
    thickness: '图纸未标注板厚与配筋',
    material: '钢筋混凝土（沿用原模型材质；强度等级未标注）',
    description: '低屋面的结构板，与上方基层、卷材及矮墙分别表达。分解后对照板面与矮墙上的卷材转折；动画移出距离不作为施工尺寸或工序依据。',
  },
  {
    objectName: '低屋面矮墙', name: '低屋面矮墙', order: 3,
    thickness: '图纸未标注截面尺寸',
    material: '矮墙（原图斜线图例不能单独确定材料品种）',
    description: '低侧矮墙与下方结构板在原图中有独立分界。沿卷材跨过墙顶、转至低屋面的路线观察上部钢板覆盖；材料品种、截面和实际搭接长度均未核定。',
  },
  {
    objectName: '找平找坡砂浆', name: '找平找坡砂浆', order: 4,
    thickness: '图纸未标注厚度与坡度',
    material: '砂浆（沿用模型对象名；配比未标注）',
    description: '模型中的屋面基层构件。分解后与结构板、卷材分别观察，核对低屋面至矮墙根部的转折；图纸未给厚度、坡度或施工配比。',
  },
  {
    objectName: '水泥砂浆抹灰', name: '水泥砂浆抹灰', order: 5,
    thickness: '图纸未标注厚度与配比',
    material: '水泥砂浆（图纸标注“水泥砂浆抹灰”）',
    description: '高侧墙面的抹灰面层，在图中与钢板上部固定边相邻，下部另有槽内卷材收头。分解后分别观察抹灰、墙体、压条与钉；不能把抹灰层本身当成已经核定的锚固基层。',
  },
  {
    objectName: '防水卷材及U形跨缝段', name: '防水卷材及U形跨缝段', order: 6,
    thickness: '原图竖向投影 ≥250；材料起算界面未核定，卷材厚度未标注',
    material: '防水卷材（图纸标注“防水卷材”；品种与层数未标注）',
    description: '图题为涂膜屋面语境，原引线实标防水卷材。沿槽内收头、U形跨缝、矮墙顶与屋面转角追踪连续路线；模型将这些段合为一个可选构件。≥250保留原图投影，精确材料测界未定，U形外观也不验证实际位移能力。',
  },
  {
    objectName: '镀锌薄钢板盖缝', name: '镀锌薄钢板盖缝', order: 7,
    thickness: '图纸未标注板厚',
    material: '镀锌薄钢板（图纸标注“镀锌薄钢板盖缝”）',
    description: '上部墙面固定边由另一组水泥钉固定，钢板向下折至矮墙上方跨盖，并保留端部返回与外撇。它与槽内卷材压条是两条独立路径；分解后对照覆盖关系，不把钢板误读为从槽内压条起步。',
  },
  {
    objectName: '嵌缝油膏', name: '嵌缝油膏', order: 8,
    thickness: '图纸未标注缝宽与嵌填深度',
    material: '嵌缝油膏（图纸标注“嵌缝油膏”）',
    description: '位于高侧墙面凹槽内的卷材收头附近，与压条及槽内固定钉分别表达。对照图纸观察局部嵌缝，不把它解释为钢板上部固定边的封口。',
  },
  {
    objectName: '收头压条', name: '收头压条', order: 9,
    thickness: '图纸未标注截面与规格',
    material: '压条（图纸标注“压条”；材质未标注）',
    description: '位于墙槽内的卷材收头处，与水泥钉配合压住卷材端部。图中钉穿过压条并进入墙体；分解用于辨认接口，不能由移出距离推定压紧长度或锚固参数。',
  },
  {
    objectName: '水泥钉-压条固定', name: '水泥钉-压条固定', order: 10,
    thickness: '图纸未标注钉长与间距',
    material: '金属水泥钉（图纸标注“水泥钉”）',
    description: '模型中的槽内压条固定组，点选时整组联动。对照图纸观察槽内钉穿过压条并进入墙体的位置，区别于钢板上部固定钉；钉规格、间距和锚固参数未给定。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 11,
    thickness: '图纸未标注钉长与间距',
    material: '金属水泥钉（图纸标注“水泥钉”）',
    description: '图中上部水泥钉穿过钢板的墙面固定竖边，与槽内“水泥钉-压条固定”分处两组位置。模型把多颗钉合为一个可选构件；图纸未给钉规格和固定间距。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return coatingHighLowRoofFlashingLayers.find(layer => canonicalName(layer.objectName) === name);
}
