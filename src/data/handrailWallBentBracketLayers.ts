import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** 图5-32（b）混凝土预埋板弯管托架。Exact GLB mesh names (5).
 *  图纸标注：DN25 钢管镀铬、水平 80、竖向 60、预埋铁件焊接；
 *  卡片只引用这些字面标注与模型几何量，未标注处不作推测。 */
export const handrailWallBentBracketLayers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土墙', name: '钢筋混凝土墙', order: 1,
    thickness: '图中未标注（模型截取的墙体局部约 160 mm 厚）',
    material: '钢筋混凝土（依剖面斜线加点图例；强度等级与配筋未标注）',
    description: '预埋件锚固的基层墙体，剖面以斜线加点表示混凝土。模型在墙体上留出一处局部凹口，抹面层贴在其外侧；分解时该构件保持原位，便于对照其余构件的外移方向。图中未标注墙厚与配筋，不作推测。',
  },
  {
    objectName: '墙面抹面层', name: '墙面抹面层', order: 2,
    thickness: '模型几何厚约 20 mm；图纸未标注',
    material: '抹面层（剖面以点状填充表示，砂浆种类与配比未标注）',
    description: '覆盖在墙体外表面的薄层，剖面上以点状填充表示。图纸水平 80 的起点即在此层外表面；模型中该层厚约 20 mm，预埋钢板的外露面与其基本齐平。图中未说明抹面砂浆的分层做法和强度要求。',
  },
  {
    objectName: '预埋钢板与弯钩锚脚', name: '预埋钢板与弯钩锚脚', order: 3,
    thickness: '图中未标注（模型约 90×90 mm，锚脚伸入墙内 60 mm）',
    material: '钢材（模型材质为金属外观；钢号与焊条型号未标注）',
    description: '原模型将预埋钢板和两道弯钩锚脚合并为同一构件，点选时整组联动。分解后观察锚脚埋入墙内、钢板与抹面层齐平的位置关系；图纸只在此处标注“预埋铁件焊接”，未给出焊缝形式、尺寸和锚固长度。',
  },
  {
    objectName: '镀铬连续弯管', name: '镀铬连续弯管托架', order: 4,
    thickness: '图纸标注 DN25；管壁厚度与弯曲半径未标注',
    material: '图纸标注钢管镀铬；钢号未标注',
    description: '由钢板端部伸出、再弯折成水平段的连续弯管，把扶手托离墙面。图纸标注“DN25 钢管镀铬”，并给出水平 80、竖向 60 两个控制尺寸（模型中扶手中心距抹面层外表面约 80 mm，扶手底面至弯管水平段约 60 mm）。分解后可看到它与预埋钢板、木扶手的接触位置。',
  },
  {
    objectName: '木扶手', name: '木扶手', order: 5,
    thickness: '图中未标注（模型截面约 61×100 mm）',
    material: '木材（同图组图5-32 标注为木扶手；树种未标注）',
    description: '沿墙连续的扶手杆件，本模型按 500 mm 长截取，截面为圆角矩形。弯管托架的立管自扶手底面插入并固定；分解后观察扶手底面与立管的套接关系。图中未给出扶手截面尺寸、插入深度及固定件做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return handrailWallBentBracketLayers.find(layer => canonicalName(layer.objectName) === name);
}
