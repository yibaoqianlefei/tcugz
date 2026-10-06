import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact mesh names; anti-slip strips are specified in the section only. */
export const rampFloorTwoLayers: NodeLayerInfo[] = [
  {
    objectName: '素土夯实', name: '素土夯实', order: 1,
    thickness: '图中未标注', material: '素土',
    description: '位于混凝土层下方的坡道基层，剖面要求素土夯实。分解模型观察坡段与端部的基层范围；图中300为端部水平尺寸，不作为素土厚度。',
  },
  {
    objectName: '150厚c15混凝土', name: 'C15混凝土层', order: 2,
    thickness: '150mm', material: 'C15混凝土',
    description: '沿坡段和两端连续设置的混凝土基层，上接水泥浆与砂浆面层，下接夯实素土。厚度150及强度等级C15按所附剖面标注。',
  },
  {
    objectName: '纯水泥浆一道（内掺建筑胶）', name: '纯水泥浆结合层', order: 3,
    thickness: '一道，图中未标注厚度', material: '纯水泥浆（内掺建筑胶）',
    description: '位于混凝土层与砂浆面层之间的薄层。剖面标注纯水泥浆一道、内掺建筑胶；可单独点选和分解观察，图中未给出建筑胶品种、掺量或具体厚度。',
  },
  {
    objectName: '20厚水泥砂浆面层', name: '水泥砂浆面层与防滑条做法', order: 4,
    thickness: '面层20mm；防滑条宽15mm、横向中距80mm、突出坡道面4mm（图示）',
    material: '1:2水泥砂浆；金刚砂粒（或屑）水泥防滑条（图示）',
    description: '坡道表面为20厚1:2水泥砂浆面层。所附剖面要求设置15宽金刚砂粒（或屑）水泥防滑条，横向中距80、突出坡道面4。当前模型未单独建模防滑条，相关尺寸用于对照图纸理解，点选本构件展示面层整体。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rampFloorTwoLayers.find(layer => layer.objectName === objectName);
}
