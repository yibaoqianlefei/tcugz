import type { NodeLayerInfo } from './nodeDefinitions';
import { canonicalName } from '../utils/nameUtils';

export const escalatorLayers: NodeLayerInfo[] = [
  {
    objectName: '底层楼板及底坑', name: '底层楼板及底坑', order: 1,
    thickness: '尺寸结合图纸底坑剖面识读', material: '楼板及底坑（具体材料与配筋未标注）',
    description: '自动扶梯下端的楼板与底坑合并为一个构件，分解时保持原位。对照图纸中底层需设底坑的说明，观察扶梯下端与楼板、底坑的空间关系。',
  },
  {
    objectName: '楼板', name: '楼板', order: 2,
    thickness: '楼板厚度及配筋未标注', material: '楼板（具体材料未标注）',
    description: '与扶梯上端相接的水平楼板构件。分解后对照固定护栏、端部盖板和底层楼板，观察上下层通行面的高差及扶梯开口位置。',
  },
  {
    objectName: '外包装空腔', name: '外包装空腔', order: 3,
    thickness: '包装构造与板厚未标注', material: '外包装（具体材料未标注）',
    description: '名称沿用原模型，表现梯段下方及两端的外包轮廓。分解后查看其与梯级、底坑的相对位置；图纸说明层间扶梯可取消底坑，但需做装修包装。',
  },
  {
    objectName: '围裙板及侧盖板', name: '围裙板及侧盖板', order: 4,
    thickness: '板厚及连接方式未标注', material: '围裙板及侧盖板（具体材料未标注）',
    description: '沿梯级两侧布置，原模型将围裙板和侧盖板合并。分解后观察它们与工作梯级、扶手及外包装之间的层次关系。',
  },
  {
    objectName: '工作梯级', name: '工作梯级', order: 5,
    thickness: '梯级尺寸结合图纸各组示意参数识读', material: '梯级（具体材料未标注）',
    description: '倾斜段及端部的工作梯级合并为一组可点选构件。分解可观察其与梳齿、侧板的关系；原文件提供的是构件分解动画，不是梯级循环运行演示。',
  },
  {
    objectName: '梳齿与端部盖板', name: '梳齿与端部盖板', order: 6,
    thickness: '梳齿及盖板细部尺寸未标注', material: '梳齿与盖板（具体材料未标注）',
    description: '位于扶梯上下端出入口，原模型将梳齿和端部盖板合并。转动并分解后，观察其与梯级及楼板通行面的衔接位置，并对照图纸平面和立面。',
  },
  {
    objectName: '电梯扶手', name: '扶手', order: 7,
    thickness: '高度与轮廓结合图纸立面识读', material: '扶手及栏板组合（具体材料规格未标注）',
    description: '对应原模型“电梯扶手”，包含沿梯段连续布置的扶手与栏板几何体。点选可整组联动，分解后观察它与围裙板、侧盖板和梯级的相对位置。',
  },
  {
    objectName: '固定护栏', name: '固定护栏', order: 8,
    thickness: '高度结合图纸护栏标注识读', material: '护栏组合（具体材料规格未标注）',
    description: '位于上层开口一侧的固定护栏，与扶梯扶手分别建模。分解后对照上层楼板及图纸中的护栏标注，观察开口边缘的围护关系。',
  },
];

export function getLayerInfo(objectName: string): NodeLayerInfo | undefined {
  const name = canonicalName(objectName);
  return escalatorLayers.find(layer => canonicalName(layer.objectName) === name);
}
