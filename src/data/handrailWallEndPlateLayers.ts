import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

/** Exact GLB mesh names (4). Dimension wording follows the supplied figure:
 *  the end-connection detail is a crop of 图5-32（b）and carries no numbers,
 *  so only modelled geometry and printed labels are quoted. */
export const handrailWallEndPlateLayers: NodeLayerInfo[] = [
  {
    objectName: '钢筋混凝土墙', name: '钢筋混凝土墙', order: 1,
    thickness: '图中未标注（模型截取的墙体局部约 160 mm 厚）',
    material: '钢筋混凝土（依节点名称及剖面斜线加点图例；强度等级与配筋未标注）',
    description: '预埋件锚固的基层墙体，剖面以斜线加点表示混凝土。模型截取墙体上的一处局部凹口，抹面层贴在其朝向扶手的一侧；分解时该构件保持原位，便于对照其余构件的外移方向。图中未标注墙厚与配筋，不作推测。',
  },
  {
    objectName: '墙面抹面层', name: '墙面抹面层', order: 2,
    thickness: '模型几何厚约 20 mm；图纸未标注',
    material: '抹面层（剖面以点状填充表示，砂浆种类与配比未标注）',
    description: '覆盖在墙体外表面的薄层，剖面上以点状填充表示。模型中该层贴在混凝土墙与预埋件之间，厚度约 20 mm，预埋钢板的外露面与其基本齐平。图中只给出这一层的位置，未说明抹面砂浆的分层做法和强度要求。',
  },
  {
    objectName: '预埋钢板与弯钩锚脚', name: '预埋钢板与弯钩锚脚', order: 3,
    thickness: '钢板与锚脚尺寸、锚固长度均未标注',
    material: '钢材（模型材质为金属外观；钢号与焊条型号未标注）',
    description: '原模型将预埋钢板、两道弯钩锚脚和伸出的连接扁钢合并为同一构件，点选时整组联动。分解后观察弯钩锚脚埋入墙内、钢板与抹面层齐平、扁钢伸向扶手端部的位置关系；图纸只在钢板与扁钢交接处标注“预埋铁件焊接”，未给出焊缝形式、尺寸和锚固长度。',
  },
  {
    objectName: '木扶手端部', name: '木扶手端部', order: 4,
    thickness: '模型端部截面约 60 mm 宽、66 mm 高；图纸未标注',
    material: '木材（依图纸“木扶手”标注；树种与含水率未标注）',
    description: '靠墙扶手的收头段，图纸标注为“木扶手”。模型中该段套在预埋件伸出的扁钢外，扁钢埋入端部内完成固定；分解后可看到扁钢与扶手端部的插接范围。图中未给出端部截面尺寸、扁钢规格及木螺丝等连接件做法。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return handrailWallEndPlateLayers.find(layer => canonicalName(layer.objectName) === name);
}
