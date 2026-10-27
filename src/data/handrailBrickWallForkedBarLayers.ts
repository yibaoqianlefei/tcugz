import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** 图5-32（c）砖墙入墙分叉扁钢。Exact GLB mesh names (5).
 *  图纸标注：木扶手、扁钢伸入洞内、120×120×60 洞、细石混凝土填实。 */
export const handrailBrickWallForkedBarLayers: NodeLayerInfo[] = [
  {
    objectName: '砖墙局部', name: '砖墙局部', order: 1,
    thickness: '图中未标注（模型截取的墙体局部约 160 mm 厚）',
    material: '砖砌体（依剖面斜线图例；砖强度等级与砂浆标号未标注）',
    description: '留洞并填实的基层墙体，剖面以单向斜线表示砖砌体。模型在墙体上留出一处矩形洞，洞内填细石混凝土，扁钢末端就锚固在这块混凝土里；分解时该构件保持原位。图中未标注墙厚与砌筑做法，不作推测。',
  },
  {
    objectName: '墙面抹面层', name: '墙面抹面层', order: 2,
    thickness: '模型几何厚约 20 mm；图纸未标注',
    material: '抹面层（剖面以点状填充表示，砂浆种类与配比未标注）',
    description: '覆盖在砖墙外表面的薄层，剖面上以点状填充表示。模型中厚约 20 mm，扁钢从这一层穿出后接木扶手端部。图中只给出该层位置，未说明抹面砂浆的分层做法和强度要求。',
  },
  {
    objectName: '细石混凝土', name: '洞内细石混凝土', order: 3,
    thickness: '图纸标注洞 120×120×60（模型洞内混凝土约 120×120×60 mm）',
    material: '细石混凝土（图纸标注“细石混凝土填实”；强度等级未标注）',
    description: '填实墙洞、供扁钢锚固的细石混凝土块，图纸注明“120×120×60 洞，细石混凝土填实”。模型按此尺寸建出洞口与填实块，分叉扁钢末端埋在其中；分解后可见混凝土块与墙体、扁钢的相对位置。图中未给出混凝土强度等级与钢筋做法。',
  },
  {
    objectName: '入墙分叉扁钢', name: '入墙分叉扁钢', order: 4,
    thickness: '图纸未标注扁钢截面（模型扁钢末端分叉张开约 47 mm）',
    material: '钢材（模型为金属外观；钢号未标注）',
    description: '图纸注明“扁钢伸入洞内”。伸入端被分叉张开成两点锚固，埋入细石混凝土中防止拔出；另一端穿出抹面层支撑木扶手端部。分解后观察分叉段与混凝土块、直段与扶手端部的套接关系。图中未给出扁钢规格、分叉长度与固定件做法。',
  },
  {
    objectName: '木扶手端部', name: '木扶手端部', order: 5,
    thickness: '图中未标注（模型端部截面约 60 mm 宽、76 mm 高）',
    material: '木材（图纸标注“木扶手”；树种未标注）',
    description: '靠墙扶手的收头段，图纸标注为“木扶手”。模型中该段套在扁钢直段外完成固定；分解后观察扁钢插入端部的范围。图中未给出端部截面尺寸、扁钢规格及木螺丝等连接件做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return handrailBrickWallForkedBarLayers.find(layer => canonicalName(layer.objectName) === name);
}
