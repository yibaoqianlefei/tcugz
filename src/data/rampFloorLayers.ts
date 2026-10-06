import type { NodeLayerInfo } from './nodeDefinitions';

/** Exact mesh names; dimensions and materials follow the supplied section. */
export const rampFloorLayers: NodeLayerInfo[] = [
  {
    objectName: '素土夯实', name: '素土夯实', order: 1,
    thickness: '图中未标注', material: '素土',
    description: '坡道构造的最下部基层，按剖面图要求夯实。分解模型可观察其与上方混凝土层的接触范围；图中端部的300为水平尺寸，不作为素土厚度。',
  },
  {
    objectName: '150厚c15混凝土', name: 'C15混凝土层', order: 2,
    thickness: '150mm', material: 'C15混凝土',
    description: '位于素土上方、粘结层下方，沿坡道和端部形成连续基层。转动模型观察坡段及两端与地面的衔接，对照剖面图中的150厚C15混凝土标注。',
  },
  {
    objectName: '干硬性水泥砂浆粘结层', name: '干硬性水泥砂浆粘结层', order: 3,
    thickness: '25mm', material: '1:3干硬性水泥砂浆，上撒素水泥',
    description: '铺设在混凝土层与水泥方砖之间。剖面标注25厚1:3干硬性水泥砂浆粘结层、上撒素水泥；分解后可辨认这道连续薄层与砖面层的位置关系。',
  },
  {
    objectName: '水泥方砖', name: '水泥方砖面层', order: 4,
    thickness: '50mm', material: '水泥方砖（图示亦可采用红砖或盲道砖）',
    description: '坡道最上方的块材面层，模型展示水泥方砖及砖缝。剖面标注50厚水泥方砖、缝宽5；转动模型观察砖块沿坡面的铺设和坡道端部收口。',
  },
  {
    objectName: '水封缝', name: '砖缝填充与洒水封缝', order: 5,
    thickness: '缝宽5mm（图示）', material: '干石灰粗砂扫缝后洒水封缝（图示）',
    description: '对应水泥方砖之间的缝隙，模型对象名为“水封缝”。剖面要求干石灰粗砂扫缝后洒水封缝；分解此构件可以观察填缝范围及其与方砖的衔接。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return rampFloorLayers.find(layer => layer.objectName === objectName);
}
