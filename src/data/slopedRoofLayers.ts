/**
 * Sloped roof node — layer data mapping.
 * Maps GLB mesh objectName → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;
  aliases?: string[];
  name: string;
  order: number;
  thickness: string;
  material: string;
  description: string;
}

export const slopedRoofLayers: LayerInfo[] = [
  {
    objectName: "彩色水泥瓦",
    name: "屋面瓦",
    order: 9,
    thickness: "—",
    material: "彩色水泥瓦",
    description: "本例最外侧覆盖材料，与挂瓦条、顺水条及瓦下防水共同组成屋面。瓦片搭接、固定和边缘节点需配套核查，不能只凭水泥瓦名称推定通用坡度、耐久性或全部坡屋面的适用性。",
  },
  {
    objectName: "30*30木质挂瓦条并做防腐处理",
    name: "挂瓦条",
    order: 8,
    thickness: "30×30mm",
    material: "木材（原对象名注明防腐处理，未明确树种）",
    description: "位于顺水条外侧，横向布置以承托并配合固定屋面瓦。30×30mm和防腐处理来自原对象名；树种、固定、间距与处理要求需按实际瓦型、受力及材料系统核查。",
  },
  {
    objectName: "40*20木质顺水条并做防腐处理",
    name: "顺水条",
    order: 7,
    thickness: "40×20mm",
    material: "木材（原对象名注明防腐处理，未明确树种）",
    description: "本例顺水条位于细石混凝土层外侧，沿坡向布置并支承挂瓦条；40×20mm来自原对象名。条间间隙不自动等于完整通风或排水通路，进出口、固定及穿透处理需另查，不能据此规定统一间距。",
  },
  {
    objectName: "40厚细石混凝土捣实压光配双向单层4钢筋，",
    name: "细石混凝土保护层",
    order: 6,
    thickness: "40mm",
    material: "细石混凝土（原对象名含双向单层钢筋记录，未注明间距）",
    description: "本例位于保温板与顺水条之间，40mm及双向单层钢筋记录来自原对象名。没有独立钢筋网格、完整配筋或固定资料；钢筋间距、屋面整体受力、持钉和抗风连接均需原设计依据。",
  },
  {
    objectName: "60厚聚苯乙烯保温板",
    name: "保温层",
    order: 5,
    thickness: "60mm",
    material: "聚苯乙烯泡沫塑料板",
    description: "本例60mm聚苯乙烯保温板位于SBS防水卷材之上、细石混凝土层之下，厚度来自原对象名。层位事实不等于已确认某种完整倒置式系统；材料类别、吸水、压载、热桥及热湿条件需按原设计核查。",
  },
  {
    objectName: "4厚SBS防水卷材",
    name: "防水层",
    order: 4,
    thickness: "4mm",
    material: "SBS改性沥青防水卷材",
    description: "本例位于基层处理剂与保温板之间，4mm来自原对象名。瓦面导水与瓦下防水分别工作；屋脊、檐口、沟、穿透及固定位置应按实际体系核对连续性和节点增强，本模型不提供通用层数或全部边缘做法。",
  },
  {
    objectName: "涂沥青冷底子油一道",
    name: "基层处理剂（冷底子油）",
    order: 3,
    thickness: "涂刷一道",
    material: "沥青冷底子油",
    description: "位于本例找平层与SBS防水卷材之间，用于与卷材系统配套的基层处理；材料相容性和施工条件需核查。冷底子油不因名称或薄涂外观即构成独立隔汽层，模型中的可见厚度也不作为施工用量或干膜厚度。",
  },
  {
    objectName: "20厚1：2.5水泥砂浆找平",
    name: "找平层",
    order: 2,
    thickness: "20mm",
    material: "1:2.5水泥砂浆",
    description: "位于结构板与基层处理剂之间，20mm及1:2.5配比来自原对象名。实际基层需与卷材系统的平整、强度和含水等条件匹配；局部几何不能证明粘结无空鼓或整体排水坡度符合要求。",
  },
  {
    objectName: "钢筋混凝土屋面板",
    name: "结构层",
    order: 1,
    thickness: "原对象名未标注",
    material: "钢筋混凝土屋面板",
    description: "本例最下部结构板承接上部构造的相关作用，并经设计支承传入主体。原对象名未标注板厚，模型比例不作为设计厚度；配筋、支座和斜板受力需整体分析，不能仅由屋面有坡度就推定特定水平反力。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return slopedRoofLayers.find(
    (l) =>
      l.objectName === objectName ||
      (l.aliases && l.aliases.includes(objectName)),
  );
}
