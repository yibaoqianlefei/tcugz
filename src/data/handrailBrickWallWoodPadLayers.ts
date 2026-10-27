import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** 图5-32（a）砖墙弯管托架与木垫块。Exact GLB mesh names (8).
 *  图纸标注：DN25 钢管镀铬、水平 80、竖向 60、φ50 木垫块、M10 螺栓、
 *  120×120×60 洞、细石混凝土填实。 */
export const handrailBrickWallWoodPadLayers: NodeLayerInfo[] = [
  {
    objectName: '砖墙', name: '砖墙', order: 1,
    thickness: '图中未标注（模型截取的墙体局部约 160 mm 厚）',
    material: '砖砌体（依剖面斜线图例；砖强度等级与砂浆标号未标注）',
    description: '留洞并填实的基层墙体，剖面以单向斜线表示砖砌体。模型在墙体上留出一处矩形洞，弯脚螺栓的弯钩端即埋入洞内细石混凝土；分解时该构件保持原位。图中未标注墙厚与砌筑做法，不作推测。',
  },
  {
    objectName: '墙面抹面层', name: '墙面抹面层', order: 2,
    thickness: '模型几何厚约 20 mm；图纸未标注',
    material: '抹面层（剖面以点状填充表示，砂浆种类与配比未标注）',
    description: '覆盖在砖墙外表面的薄层，剖面上以点状填充表示。图纸水平 80 的起点即在此层外表面；模型中厚约 20 mm，木垫块紧贴这一层的表面。图中未说明抹面砂浆的分层做法和强度要求。',
  },
  {
    objectName: '细石混凝土填实', name: '洞内细石混凝土填实', order: 3,
    thickness: '图纸标注洞 120×120×60（模型洞内混凝土约 120×120×60 mm）',
    material: '细石混凝土（图纸标注“细石混凝土填实”；强度等级未标注）',
    description: '填实墙洞、供弯脚螺栓锚固的细石混凝土块，图纸注明“120×120×60 洞，细石混凝土填实”。模型中该块填满洞口，螺栓弯钩埋在其中；分解后可见混凝土块、螺栓与砖墙的相对位置。图中未给出混凝土强度等级与配筋做法。',
  },
  {
    objectName: '弯脚连接螺栓', name: '弯脚连接螺栓', order: 4,
    thickness: '图纸标注 M10；螺栓长度未标注（模型穿墙段约 158 mm）',
    material: '钢材（模型为金属外观；钢号与镀层未标注）',
    description: '图纸标注“M10 螺栓”。一端弯成钩状埋入洞内细石混凝土中，另一端穿过木垫块与弯管托架用螺母拧紧，靠弯钩和螺母形成拉结。分解后观察弯钩段、穿墙直段与螺母的配合；图中未给出螺栓长度、埋深与拧紧要求。',
  },
  {
    objectName: '六角螺母', name: '六角螺母', order: 5,
    thickness: '配合 M10 螺栓，对边宽度未标注（模型约 17 mm 见方）',
    material: '钢材（模型为金属外观；性能等级未标注）',
    description: '与 M10 弯脚螺栓配套的螺母，在托架外侧拧紧，把木垫块和弯管托架压向墙面。模型按与螺栓同步外移的分解路径处理，分解后可看到它相对托架的位置。图中未标注螺母规格、垫圈及防松做法。',
  },
  {
    objectName: '木垫块', name: '木垫块', order: 6,
    thickness: '图纸标注 φ50（模型约 50×50×20 mm 的方垫块）',
    material: '木材（图纸标注“φ50 木垫块”；树种未标注）',
    description: '图纸标注“φ50 木垫块”，夹在墙面与弯管托架之间，使托架不直接顶压抹面层，并给螺栓留出压紧空间。分解后观察它被螺栓与托架夹住的位置关系。图中未给出垫块厚度与防腐处理做法。',
  },
  {
    objectName: '镀铬连续弯管', name: '镀铬连续弯管托架', order: 7,
    thickness: '图纸标注 DN25；管壁厚度与弯曲半径未标注',
    material: '图纸标注钢管镀铬；钢号未标注',
    description: '夹在木垫块外侧、再把扶手托离墙面的连续弯管。图纸标注“DN25 钢管镀铬”，并给出水平 80、竖向 60 两个控制尺寸（模型中扶手中心距抹面层外表面约 80 mm，扶手底面至弯管水平段约 60 mm）。分解后观察它与木垫块、螺栓、扶手的接触位置。',
  },
  {
    objectName: '木扶手', name: '木扶手', order: 8,
    thickness: '图中未标注（模型截面约 65×58 mm）',
    material: '木材（同图组图5-32 标注为木扶手；树种未标注）',
    description: '沿墙连续的扶手杆件，本模型按 500 mm 长截取，截面近方形并作圆角。弯管托架的立管自扶手底面插入固定；分解后观察扶手底面与立管的套接关系。图中未给出扶手截面尺寸、插入深度及固定件做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return handrailBrickWallWoodPadLayers.find(layer => canonicalName(layer.objectName) === name);
}
