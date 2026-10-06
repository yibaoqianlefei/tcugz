import type { NodeLayerInfo } from './nodeDefinitions';

/** Source object names; material requirements follow the supplied section. */
export const balconyRailingMortiseLayers: NodeLayerInfo[] = [
  {
    objectName: '阳台板', name: '阳台板', order: 1,
    thickness: '图中未标注', material: '混凝土（模型示意）',
    description: '位于连接节点下方的阳台板，承托板边挡水带。对照剖面观察阳台板、挡水带与栏杆脚的位置关系；图中没有板厚和配筋标注。',
  },
  {
    objectName: '现浇挡水带', name: '带槽口的现浇挡水带', order: 2,
    thickness: '图示竖向尺寸60mm', material: '现浇混凝土（模型对象名）',
    description: '设于阳台板边缘，上部槽口容纳栏杆脚的嵌入端和坐浆填充。分解模型可以观察槽口与栏杆脚底端的对应关系。剖面标注竖向60尺寸，左侧文字被截断，未推测混凝土等级。',
  },
  {
    objectName: '坐浆与侧缝填充', name: '坐浆与侧缝填充', order: 3,
    thickness: '图中未标注', material: 'M10水泥砂浆（图示坐浆要求）',
    description: '位于栏杆脚底端与挡水带槽口之间，模型将底部坐浆和侧缝填充作为一个构件。剖面明确标注“坐M10水泥砂浆”；分解后观察承托面及周边填充范围。保留原模型纹理，实际材料说明按剖面采用水泥砂浆。',
  },
  {
    objectName: '带榫栏杆脚', name: '带榫栏杆脚', order: 4,
    thickness: '截面与嵌入深度未标注', material: '混凝土外观（模型示意，剖面未明确材料）',
    description: '源模型命名为“带榫栏杆脚”，下端嵌入挡水带槽口并由坐浆承托。分解和转动模型观察嵌入端、槽口及砂浆的接触关系；本节点展示局部连接，图中未标注栏杆脚截面、嵌入深度和材料要求。',
  },
  {
    objectName: '饰面包覆', name: '板边饰面包覆', order: 5,
    thickness: '图中未标注', material: '混凝土外观（模型示意，具体饰面未标注）',
    description: '包覆阳台板边缘和挡水带外侧，沿栏杆脚周围收口。源动画中该构件固定，其余构件分离后可观察包覆范围和内部槽口关系。剖面没有明确饰面材料或厚度。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  return balconyRailingMortiseLayers.find(layer => layer.objectName === objectName);
}
