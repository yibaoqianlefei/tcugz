import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Exact GLB mesh names (11). 尺寸措辞以图纸图 6-41「涂膜防水屋面高低屋面的泛水」
 *  中可辨认的标注为准（泛水高度 ≥250）；未标注的厚度、规格不引用、不推测。 */
export const coatingHighLowRoofFlashingLayers: NodeLayerInfo[] = [
  {
    objectName: '高侧墙体', name: '高侧墙体', order: 1,
    thickness: '图纸未标注墙厚',
    material: '墙体（剖面上以斜线填充表示；块材与强度等级未标注）',
    description: '高低屋面高差处的高侧墙体，泛水沿其表面向上翻起，抹灰层、收头压条与嵌缝油膏都依附在这一面上。模型只截取墙根一段，分解时向左移出 200 mm，可看清与抹灰、卷材收头的先后关系。',
  },
  {
    objectName: '低屋面结构板', name: '低屋面结构板', order: 2,
    thickness: '图纸未标注板厚与配筋',
    material: '钢筋混凝土（沿用原模型材质；强度等级未标注）',
    description: '低屋面的结构板，其上依次做找平找坡砂浆与防水卷材。分解时该构件连同下方一起移出约 0.78 m，可对照看清防水卷材在板面、矮墙上的连续转折。',
  },
  {
    objectName: '低屋面矮墙', name: '低屋面矮墙', order: 3,
    thickness: '图纸未标注截面尺寸',
    material: '混凝土（剖面以混凝土图例表示）',
    description: '高低屋面交界处低侧的混凝土矮墙（反口），防水卷材沿墙面上翻后压入镀锌薄钢板盖缝下方。分解时向下移出，可看到矮墙顶面与盖缝钢板的搭接长度。',
  },
  {
    objectName: '找平找坡砂浆', name: '找平找坡砂浆', order: 4,
    thickness: '图纸未标注厚度与坡度',
    material: '水泥砂浆（剖面以带骨料的点状图例表示）',
    description: '铺在低屋面结构板上的找平找坡层，为防水卷材提供平整基层。分解时该构件向下移出约 0.52 m，可与结构板、卷材分开观察它在矮墙根部的转折与压边。',
  },
  {
    objectName: '水泥砂浆抹灰', name: '水泥砂浆抹灰', order: 5,
    thickness: '图纸未标注厚度与配比',
    material: '水泥砂浆（图纸标注“水泥砂浆抹灰”）',
    description: '高侧墙面的抹灰面层，泛水上端的收头压条与水泥钉就固定在这层抹灰上。分解时向上、向外移出，可查看抹灰面、卷材端部与压条的叠合顺序。',
  },
  {
    objectName: '防水卷材及U形跨缝段', name: '防水卷材及U形跨缝段', order: 6,
    thickness: '泛水高度图纸标注 ≥250；卷材厚度未标注',
    material: '防水卷材（图纸标注“防水卷材”；品种与层数未标注）',
    description: '本节点的核心构件：卷材沿低屋面铺至矮墙，上翻后压入镀锌薄钢板盖缝的下方，在高低屋面交界处形成 U 形跨缝段，泛水高度 ≥250。模型把平铺段、上翻段与 U 形跨缝段合并为一个构件，点选时整组联动；分解时向外、向下移出，可完整看到 U 形轮廓。',
  },
  {
    objectName: '镀锌薄钢板盖缝', name: '镀锌薄钢板盖缝', order: 7,
    thickness: '图纸未标注板厚',
    material: '镀锌薄钢板（图纸标注“镀锌薄钢板盖缝”）',
    description: '盖在 U 形跨缝段外面的镀锌薄钢板：一端勾入高侧墙面的凹槽、另一端罩住矮墙顶，把卷材的跨缝段压在下面。分解时向外移出 100 mm，可对照钢板与卷材、矮墙的搭接关系。',
  },
  {
    objectName: '嵌缝油膏', name: '嵌缝油膏', order: 8,
    thickness: '图纸未标注缝宽与嵌填深度',
    material: '嵌缝油膏（图纸标注“嵌缝油膏”）',
    description: '嵌在高侧墙面凹槽内的油膏，封住盖缝钢板上端与墙面之间的缝隙。分解时向墙内侧移出，可与盖缝钢板分开观察这道嵌缝的断面形状。',
  },
  {
    objectName: '收头压条', name: '收头压条', order: 9,
    thickness: '图纸未标注截面与规格',
    material: '压条（图纸标注“压条”；材质未标注）',
    description: '泛水上端收头处的压条，把卷材端部压紧在抹灰面上，与水泥钉配合固定。分解时向上、向外小幅移出（约 20 mm、100 mm），可看到卷材端部被压住的长度。',
  },
  {
    objectName: '水泥钉-压条固定', name: '水泥钉-压条固定', order: 10,
    thickness: '图纸未标注钉长与间距',
    material: '金属水泥钉（图纸标注“水泥钉”）',
    description: '固定收头压条的成套水泥钉，模型把这一组钉与压紧件合并为一个构件，分解时保持原位，便于对照它穿过的层次（压条→卷材→抹灰→墙体）。图纸只给出钉的位置，未标注规格与间距。',
  },
  {
    objectName: '水泥钉', name: '水泥钉', order: 11,
    thickness: '图纸未标注钉长与间距',
    material: '金属水泥钉（图纸标注“水泥钉”）',
    description: '抹灰面上部的另一组水泥钉，图中以引线单独标注。模型把多颗钉子合并为一个构件，点选时整组联动；分解时保持原位。它与“水泥钉-压条固定”分属两处固定点，识图时不要混为一处。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return coatingHighLowRoofFlashingLayers.find(layer => canonicalName(layer.objectName) === name);
}
