/**
 * Flat roof node — layer data mapping.
 * Maps GLB mesh objectName (exact Blender export names) → construction knowledge.
 */
export interface LayerInfo {
  objectName: string;   // matches GLB mesh.name exactly
  name: string;         // Chinese display name
  order: number;        // construction layer order (1=bottom → N=top)
  thickness: string;    // e.g. "40mm"
  material: string;     // material description
  description: string;  // teaching content
}

export const flatRoofLayers: LayerInfo[] = [
  {
    objectName: "钢筋混凝土屋面",
    name: "结构层",
    order: 1,
    thickness: "原对象名未标注",
    material: "钢筋混凝土屋面板",
    description: "位于本例各层下方，承接上部屋面构造的相关作用并经设计支承传入主体。原对象名未给出板厚，模型比例不作为结构板厚、配筋或承载能力的设计依据。",
  },
  {
    objectName: "60厚聚苯乙烯保温板",
    name: "保温层",
    order: 2,
    thickness: "60mm",
    material: "聚苯乙烯泡沫塑料板",
    description: "本例保温板位于结构层之上、找坡层之下，60mm来自原对象名。名称仅注明聚苯乙烯，未确认挤塑或模塑类别。保温、热桥和受潮性能仍需结合实际系统核查。",
  },
  {
    objectName: "1：1：6 水泥、砂子、焦渣、最薄处30厚，找2%坡",
    name: "找坡层",
    order: 3,
    thickness: "最薄处30mm",
    material: "水泥砂子焦渣（1:1:6）",
    description: "原对象名记录配比1:1:6、最薄处30mm及找2%坡，均按本例识读。模型只显示局部层次，没有完整坡面、沟与落口，不能据此验证排水坡向或将这些参数作为所有屋面的要求。",
  },
  {
    objectName: "20厚1：3水泥砂浆找平层",
    name: "找平层",
    order: 4,
    thickness: "20mm",
    material: "1:3水泥砂浆",
    description: "位于找坡层与基层处理剂之间，为上部卷材系统提供施工基层。20mm与配比来自原对象名；实际平整、强度、含水状态及处理方式需与所用材料匹配，几何平整不等于已证明粘结或无空鼓。",
  },
  {
    objectName: "涂沥青冷底子油一道",
    name: "基层处理剂（冷底子油）",
    order: 5,
    thickness: "涂刷一道",
    material: "沥青冷底子油",
    description: "本例位于找平层与SBS卷材之间，用于与卷材系统配套的基层处理。冷底子油不能仅凭材料名称或薄涂外观认定为独立隔汽层。模型为便于观察赋予其可见几何厚度，该厚度不作为施工用量或干膜厚度。",
  },
  {
    objectName: "4厚SBS改性沥青卷材防水层",
    name: "防水层",
    order: 6,
    thickness: "4mm",
    material: "SBS改性沥青卷材",
    description: "本例SBS卷材位于基层处理剂之上、350号干铺卷材之下，4mm来自原对象名。模型未包含完整女儿墙、管根和落口；节点增强、收头、防水层数与厚度需按实际设计和适用要求核查，不能从该对象推定通用上翻高度。",
  },
  {
    objectName: "干铺350号沥青卷材一层",
    name: "干铺卷材层（350号）",
    order: 7,
    thickness: "一层",
    material: "350号沥青卷材",
    description: "按原对象名记录为干铺350号沥青卷材一层；模型中位于SBS防水层与细石混凝土保护层之间，并不位于保温层下方。其隔离、隔汽或其他设计用途尚需原设计说明、材料性能及接缝处理证据确认，不凭位置或名称指定用途。",
  },
  {
    objectName: "40厚细石混凝土毛面",
    name: "保护层",
    order: 8,
    thickness: "40mm",
    material: "细石混凝土毛面",
    description: "本例最上部为40mm细石混凝土毛面，覆盖下部卷材，厚度来自原对象名。保护层的支承、分格、排水及可上人条件应按所选系统与使用荷载确定，本模型未提供通用分格间距或上人适用性证明。",
  },
];

export function getLayerInfo(objectName: string): LayerInfo | undefined {
  return flatRoofLayers.find((l) => l.objectName === objectName);
}
