/**
 * 🏗️ 节点单一配置源 — Single Source of Truth for ALL node registration.
 *
 * 以前新增节点需要分别在 nodesIndex、NodeDetail (MODEL_PATHS/DIAGRAM_IMAGES/
 * MODEL_SCALES/MODEL_GROUPS)、ConstructionKnowledgePanel (LAYER_CONFIG + imports)
 * 多处注册。现在只需在此文件注册一次。
 *
 * 接入点：
 *   - NodeDetail           → getNodeDefinition(nodeId)
 *   - ConstructionKnowledgePanel → node.layerConfig
 *   - LibraryPage/CasesPage/DataAnalysis → nodeDefinitions (兼容 nodesIndex 接口)
 *   - TextbookPage/ModelNodeCard/MarkdownRenderer → getNodeDefinition()
 *   - nodesIndex.ts        → 兼容导出层（不再独立维护数据）
 */

import { roofDrainageLayers, getLayerInfo as getRoofDrainageLayer } from "./roofDrainageLayers";
import { organizedDrainageLayers, getLayerInfo as getOrganizedDrainageLayer } from "./organizedDrainageLayers";
import { flatRoofLayers, getLayerInfo as getFlatRoofLayer } from "./flatRoofLayers";
import { slopedRoofLayers, getLayerInfo as getSlopedRoofLayer } from "./slopedRoofLayers";
import { constructionColumnLayers, getLayerInfo as getConstructionColumnLayer } from "./constructionColumnLayers";
import { apronFlashingLayers, getLayerInfo as getApronFlashingLayer } from "./apronFlashingLayers";
import { eavesGutterLayers, getLayerInfo as getEavesGutterLayer } from "./eavesGutterLayers";
import { stoneApronLayers, getLayerInfo as getStoneApronLayer } from "./stoneApronLayers";
import { foamInsulationLayers, getLayerInfo as getFoamInsulationLayer } from "./foamInsulationLayers";
import { rockwoolInsulationLayers, getLayerInfo as getRockwoolInsulationLayer } from "./rockwoolInsulationLayers";
import { concreteStepsLayers, getLayerInfo as getConcreteStepsLayer } from "./concreteStepsLayers";
import { plasterPlinthLayers, getLayerInfo as getPlasterPlinthLayer } from "./plasterPlinthLayers";
import { stairCompositionLayers, getLayerInfo as getStairCompositionLayer } from "./stairCompositionLayers";
import { facedPlinthLayers, getLayerInfo as getFacedPlinthLayer } from "./facedPlinthLayers";
import { stonePlinthLayers, getLayerInfo as getStonePlinthLayer } from "./stonePlinthLayers";
import { rcElevatedStepsLayers, getLayerInfo as getRcElevatedStepsLayer } from "./rcElevatedStepsLayers";

/* ── Static asset path helper ─────────────────────────────────── */

const BASE_URL = import.meta.env.BASE_URL;

function assetPath(path: string): string {
  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface NodeLayerInfo {
  objectName: string;
  name: string;
  order?: number;
  aliases?: string[];
  thickness: string;
  material: string;
  description: string;
}

export interface NodeLayerConfig {
  layers: NodeLayerInfo[];
  getLayerInfo: (objectName: string) => NodeLayerInfo | undefined;
}

export interface NodeModelConfig {
  path: string;
  scale: number;
  groups?: Record<string, string>;
  /** When true, the node loads in fully-expanded state and the timeline is locked. */
  noAnimation?: boolean;
  /** Canonical names of meshes to exclude from hover/click/highlight. */
  nonInteractive?: string[];
}

export interface NodeDiagramConfig {
  path: string;
}

export type NodeStatus = "available" | "development";

/** Node presentation mode: single-model (default) or multi-variant. */
export type NodePresentationMode = "single" | "variants";

/** Per-variant model config for multi-variant presentation nodes. */
export interface NodeModelVariant {
  id: string;
  label: string;
  title: string;
  description?: string;
  model: {
    path: string;
    scale?: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
  };
  differenceSummary?: string[];
}

export interface NodeDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  status: NodeStatus;

  model?: NodeModelConfig;
  diagram?: NodeDiagramConfig;
  layerConfig?: NodeLayerConfig;

  loadContent?: () => Promise<{ default: unknown }>;

  textbookLinks?: Array<{
    moduleId: string;
    chapterId?: string;
  }>;

  /** Multi-variant presentation mode. Omitted or "single" = normal single-model node. */
  presentationMode?: NodePresentationMode;
  /** Required when presentationMode === "variants". */
  variants?: NodeModelVariant[];
}

/* ═══════════════════════════════════════════════════════════════
   Model group mappings (per-node component aggregation)
   ═══════════════════════════════════════════════════════════════ */

/** 构造柱马牙槎 — 4 子构件 → 合并为单一组件 */
const COLUMN_GROUPS: Record<string, string> = {
  "01": "马牙槎",
  "02": "马牙槎",
  "03": "马牙槎",
  "04": "马牙槎",
};

/**
 * 块石散水 — mesh 名含两个特殊字符（全角冒号 + dot 后缀）
 * canonicalName 在双 dot 场景下后缀剥离不稳定，覆盖可能出现的各种变体
 */
const STONE_GROUPS: Record<string, string> = {
  "120厚块石,1：2.5水泥砂浆灌缝.001": "120厚块石,1：25水泥砂浆灌缝",
  "120厚块石,1：25水泥砂浆灌缝001": "120厚块石,1：25水泥砂浆灌缝",
  "120厚块石,1：25水泥砂浆灌缝": "120厚块石,1：25水泥砂浆灌缝",
};

/* ═══════════════════════════════════════════════════════════════
   Node definitions — the single source of truth
   ═══════════════════════════════════════════════════════════════ */

export const nodeDefinitions: NodeDefinition[] = [
  /* ── Roof nodes ─────────────────────────────────────────── */
  {
    id: "flat-roof-01",
    title: "平屋面构造",
    description:
      "上人平屋面，八层构造：保护层、隔气层(卷材)、防水层、隔气层(冷底子油)、找平层、找坡层、保温层、结构层。",
    category: "屋顶",
    thumbnail: null,
    status: "available",
    model: {
      path: assetPath("models/roof/flat-roof/flat-roof.glb"),
      scale: 2.5,
      groups: {
        "40厚细石混凝土毛面001": "40厚细石混凝土毛面",
        "40厚细石混凝土毛面001_1": "40厚细石混凝土毛面",
        "40厚细石混凝土毛面001_2": "40厚细石混凝土毛面",
        "钢筋混凝土屋面002": "钢筋混凝土屋面",
      },
    },
    layerConfig: {
      layers: flatRoofLayers as NodeLayerInfo[],
      getLayerInfo: getFlatRoofLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    loadContent: () => import("./flatRoof"),
  },

  {
    id: "sloped-roof-01",
    title: "坡屋顶构造",
    description:
      "坡屋顶（斜屋顶）构造层次：彩色水泥瓦→挂瓦条→顺水条→保温层→隔气层→防水层→找平层→结构层。",
    category: "屋顶",
    thumbnail: null,
    status: "available",
    model: {
      path: assetPath("models/roof/sloped-roof/sloped-roof.glb"),
      scale: 2.5,
      groups: {
        "钢筋混凝土屋面板001": "钢筋混凝土屋面板",
      },
    },
    layerConfig: {
      layers: slopedRoofLayers as NodeLayerInfo[],
      getLayerInfo: getSlopedRoofLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "roof-drainage-01",
    title: "无组织排水屋顶",
    description:
      "无组织排水屋面构造节点，包含防水层、保温层、结构层等关键构件。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/roof-drainage-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/roof-drainage/roof-drainage.glb"),
      scale: 2.5,
    },
    diagram: {
      path: assetPath("images/roof/roof-drainage-diagram.png"),
    },
    layerConfig: {
      layers: roofDrainageLayers as NodeLayerInfo[],
      getLayerInfo: getRoofDrainageLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    loadContent: () => import("./roofDrainage"),
  },

  {
    id: "organized-drainage-01",
    title: "有组织排水屋顶",
    description:
      "有组织排水屋面构造节点，包含天沟、雨水斗、落水管等构件。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/organized-drainage-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/organized-drainage/organized-drainage.glb"),
      scale: 2.5,
    },
    diagram: {
      path: assetPath("images/roof/organized-drainage-diagram.png"),
    },
    layerConfig: {
      layers: organizedDrainageLayers as NodeLayerInfo[],
      getLayerInfo: getOrganizedDrainageLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    loadContent: () => import("./organizedDrainage"),
  },

  {
    id: "eaves-gutter-01",
    title: "檐沟外排水",
    description:
      "屋顶檐沟有组织排水节点，六层构件：屋面顶→檐沟→檐沟分水→排水口→墙体→圈梁。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/eaves-gutter-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/eaves-gutter/eaves-gutter.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/roof/eaves-gutter-diagram.png"),
    },
    layerConfig: {
      layers: eavesGutterLayers as NodeLayerInfo[],
      getLayerInfo: getEavesGutterLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  /* ── Wall nodes ─────────────────────────────────────────── */
  {
    id: "construction-column-01",
    title: "构造柱",
    description:
      "砖混结构墙体交接处的钢筋混凝土构造柱，包含混凝土柱、钢筋、箍筋、墙体、圈梁、楼板及马牙槎。",
    category: "墙体",
    thumbnail: assetPath("images/wall/construction-column-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/construction-column/construction-column.glb"),
      scale: 4,
      groups: COLUMN_GROUPS,
    },
    diagram: {
      path: assetPath("images/wall/construction-column-diagram.png"),
    },
    layerConfig: {
      layers: constructionColumnLayers as NodeLayerInfo[],
      getLayerInfo: getConstructionColumnLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    loadContent: () => import("./constructionColumn"),
  },

  {
    id: "apron-flashing-01",
    title: "细石混凝土散水构造",
    description:
      "外墙根部散水构造节点，九层构造：细石混凝土面层→饰面层→防水层→钢筋混凝土墙体→聚乙烯泡沫缝→密封膏嵌缝→保温层→卵石灌浆垫层→素土夯实。",
    category: "墙体",
    thumbnail: assetPath("images/wall/apron-flashing-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/apron-flashing/apron-flashing.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/wall/apron-flashing-diagram.png"),
    },
    layerConfig: {
      layers: apronFlashingLayers as NodeLayerInfo[],
      getLayerInfo: getApronFlashingLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "stone-apron-01",
    title: "块石散水构造",
    description:
      "外墙根部块石铺砌散水节点，九层构造：饰面层→防水层→钢筋混凝土墙体→聚乙烯泡沫缝→密封膏嵌缝→保温层→块石面层(120mm)→粗砂垫层(30mm)→素土夯实。",
    category: "墙体",
    thumbnail: assetPath("images/wall/stone-apron-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/stone-apron/stone-apron.glb"),
      scale: 2,
      groups: STONE_GROUPS,
    },
    diagram: {
      path: assetPath("images/wall/stone-apron-diagram.png"),
    },
    layerConfig: {
      layers: stoneApronLayers as NodeLayerInfo[],
      getLayerInfo: getStoneApronLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "foam-insulation-01",
    title: "粘贴泡沫塑料保温板外保温",
    description:
      "EPS/XPS板外保温系统，七层构造：饰面层→抹面层→增强网→锚栓→保温板→胶粘剂→基层墙体。",
    category: "墙体",
    thumbnail: assetPath("images/wall/foam-insulation-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/foam-insulation/foam-insulation.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/wall/foam-insulation-diagram.png"),
    },
    layerConfig: {
      layers: foamInsulationLayers as NodeLayerInfo[],
      getLayerInfo: getFoamInsulationLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "rockwool-insulation-01",
    title: "粘贴岩棉防火保温板外保温",
    description:
      "A级岩棉防火外保温系统，七层构造：饰面层→抹面层→防水层→锚栓→岩棉保温板→找平层→基层墙体。",
    category: "墙体",
    thumbnail: assetPath("images/wall/rockwool-insulation-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/rockwool-insulation/rockwool-insulation.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/wall/rockwool-insulation-diagram.png"),
    },
    layerConfig: {
      layers: rockwoolInsulationLayers as NodeLayerInfo[],
      getLayerInfo: getRockwoolInsulationLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "faced-plinth-01",
    title: "贴面勒脚构造做法",
    description:
      "外墙根部贴面勒脚节点，五层构造：回填土→垫层→防潮层→贴面层→墙体。贴面勒脚比抹灰勒脚更耐久美观。",
    category: "墙体",
    thumbnail: assetPath("images/wall/faced-plinth-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/faced-plinth/faced-plinth.glb"),
      scale: 2,
      noAnimation: true,
      nonInteractive: ["其余"],
    },
    diagram: {
      path: assetPath("images/wall/faced-plinth-diagram.png"),
    },
    layerConfig: {
      layers: facedPlinthLayers as NodeLayerInfo[],
      getLayerInfo: getFacedPlinthLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "stone-plinth-01",
    title: "石砌勒脚构造做法",
    description:
      "外墙根部石砌勒脚节点，四层构造：回填土→垫层→石砌层→墙体。石砌勒脚采用天然石材，耐久抗冻、质感厚重。",
    category: "墙体",
    thumbnail: assetPath("images/wall/stone-plinth-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/stone-plinth/stone-plinth.glb"),
      scale: 2,
      noAnimation: true,
      nonInteractive: ["其余"],
    },
    diagram: {
      path: assetPath("images/wall/stone-plinth-diagram.png"),
    },
    layerConfig: {
      layers: stonePlinthLayers as NodeLayerInfo[],
      getLayerInfo: getStonePlinthLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "plaster-plinth-01",
    title: "抹灰勒脚构造做法",
    description:
      "外墙根部抹灰勒脚节点，五层构造：素土夯实→垫层→防潮层→抹灰层→墙体。勒脚保护墙体根部免受雨水溅湿和机械碰撞。",
    category: "墙体",
    thumbnail: assetPath("images/wall/plaster-plinth-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/plaster-plinth/plaster-plinth.glb"),
      scale: 2,
      noAnimation: true,
      nonInteractive: ["其余"],
    },
    diagram: {
      path: assetPath("images/wall/plaster-plinth-diagram.png"),
    },
    layerConfig: {
      layers: plasterPlinthLayers as NodeLayerInfo[],
      getLayerInfo: getPlasterPlinthLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  /* ── Stairs nodes ────────────────────────────────────────── */
  {
    id: "rc-elevated-steps-01",
    title: "钢筋混凝土架空台阶",
    description:
      "室外架空台阶节点，七层构造：素土夯实→独立基础垫层→踏步斜梁→钢筋混凝土踏步→水平平台→面层→建筑外墙。架空台阶通过独立基础与建筑外墙分离，避免不均匀沉降。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/rc-elevated-steps-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/rc-elevated-steps/rc-elevated-steps.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/stairs/rc-elevated-steps-diagram.png"),
    },
    layerConfig: {
      layers: rcElevatedStepsLayers as NodeLayerInfo[],
      getLayerInfo: getRcElevatedStepsLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "stair-composition-01",
    title: "楼梯的组成",
    description:
      "楼梯基本构造节点，六个组成部分：中间平台→梯段→楼层平台→栏杆→顶层水平栏杆→其他构件。楼梯是建筑垂直交通的核心构件。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/stair-composition-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/stair-composition/stair-composition.glb"),
      scale: 3.5,
      noAnimation: true,
      nonInteractive: ["其余"],
    },
    diagram: {
      path: assetPath("images/stairs/stair-composition-diagram.png"),
    },
    layerConfig: {
      layers: stairCompositionLayers as NodeLayerInfo[],
      getLayerInfo: getStairCompositionLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "concrete-steps-01",
    title: "混凝土台阶",
    description:
      "C15混凝土室外台阶构造，五层：面层→混凝土台阶→碎石垫层(80mm)→素土夯实→墙柱。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/concrete-steps-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/concrete-steps/concrete-steps.glb"),
      scale: 2,
    },
    diagram: {
      path: assetPath("images/stairs/concrete-steps-diagram.png"),
    },
    layerConfig: {
      layers: concreteStepsLayers as NodeLayerInfo[],
      getLayerInfo: getConcreteStepsLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  /* ── Multi-variant presentation — WIP (temp test data) ──── */
  /* ⚠️ TEMPORARY: 目标 GLB 尚未就绪，使用现有模型验证组件。
     正式上线前需替换为 wall-damp-proof-course/ 下的真实三方案 GLB。 */
  {
    id: "wall-damp-proof-course",
    title: "墙身防潮层的位置",
    description:
      "同一构造问题在三种不同条件下的防潮层做法：密实垫层、透水垫层、室内外高差。",
    category: "墙体",
    thumbnail: null,
    status: "available",
    presentationMode: "variants",
    variants: [
      {
        id: "dense-base",
        label: "A",
        title: "密实材料垫层",
        description:
          "地面垫层采用密实材料时，水平防潮层设置于室内地面附近，垫层具有较好的阻水能力。",
        model: {
          path: assetPath("models/wall/plaster-plinth/plaster-plinth.glb"),
          scale: 2,
        },
        differenceSummary: [
          "室内地面附近设置水平防潮层",
          "垫层具有较好的阻水能力",
        ],
        components: [
          { name: "墙体", material: "砖砌体 / 混凝土", thickness: "240mm" },
          { name: "水平防潮层", material: "防水砂浆 / 卷材", thickness: "20mm" },
          { name: "密实垫层", material: "C15混凝土", thickness: "80mm" },
          { name: "室内地面面层", material: "水泥砂浆", thickness: "20mm" },
          { name: "素土夯实", material: "压实填土", thickness: "—" },
        ],
        model: {
          path: assetPath("models/wall/plaster-plinth/plaster-plinth.glb"),
          scale: 2,
        },
        differenceSummary: [
          "室内地面附近设置水平防潮层",
          "垫层具有较好的阻水能力",
        ],
        components: [
          { name: "墙体", material: "砖砌体 / 混凝土", thickness: "240mm" },
          { name: "水平防潮层", material: "防水砂浆 / 卷材", thickness: "20mm" },
          { name: "密实垫层", material: "C15混凝土", thickness: "80mm" },
          { name: "室内地面面层", material: "水泥砂浆", thickness: "20mm" },
          { name: "素土夯实", material: "压实填土", thickness: "—" },
        ],
      },
      {
        id: "permeable-base",
        label: "B",
        title: "透水材料垫层",
        description:
          "地面垫层采用透水材料时，需要调整水平防潮层位置，避免水分进入墙身。",
        model: {
          path: assetPath("models/wall/plaster-plinth/plaster-plinth.glb"),
          scale: 2,
        },
        differenceSummary: [
          "水平防潮层高于透水垫层影响区域",
          "重点阻断垫层中的水分上升",
        ],
        components: [
          { name: "墙体", material: "砖砌体 / 混凝土", thickness: "240mm" },
          { name: "水平防潮层", material: "防水砂浆 / 卷材", thickness: "20mm" },
          { name: "透水垫层", material: "碎石 / 砂砾", thickness: "100mm" },
          { name: "室内地面面层", material: "水泥砂浆", thickness: "20mm" },
          { name: "素土夯实", material: "压实填土", thickness: "—" },
        ],
      },
      {
        id: "level-difference",
        label: "C",
        title: "室内外地面有高差",
        description:
          "室内外地面存在高差时，需要结合水平与垂直防潮构造处理。",
        model: {
          path: assetPath("models/wall/faced-plinth/faced-plinth.glb"),
          scale: 2.5,
        },
        differenceSummary: [
          "高低位置分别处理水平防潮",
          "高差范围设置垂直防潮层",
        ],
        components: [
          { name: "墙体", material: "砖砌体 / 混凝土", thickness: "240mm" },
          { name: "水平防潮层（低侧）", material: "防水砂浆 / 卷材", thickness: "20mm" },
          { name: "水平防潮层（高侧）", material: "防水砂浆 / 卷材", thickness: "20mm" },
          { name: "垂直防潮层", material: "防水砂浆", thickness: "15mm" },
          { name: "室内地面面层", material: "水泥砂浆", thickness: "20mm" },
          { name: "素土夯实", material: "压实填土", thickness: "—" },
        ],
      },
    ],
  },

  /* ── Case-study nodes (development) ─────────────────────── */
  {
    id: "yuncheng-c-01",
    title: "01",
    description: "郓城县南湖新区公共服务建筑C地块设计 - 构造节点01",
    category: "案例",
    thumbnail: null,
    status: "development",
  },
  {
    id: "yuncheng-c-02",
    title: "02",
    description: "郓城县南湖新区公共服务建筑C地块设计 - 构造节点02",
    category: "案例",
    thumbnail: null,
    status: "development",
  },
  {
    id: "yuncheng-c-03",
    title: "03",
    description: "郓城县南湖新区公共服务建筑C地块设计 - 构造节点03",
    category: "案例",
    thumbnail: null,
    status: "development",
  },
];

/* ═══════════════════════════════════════════════════════════════
   Lookup map & query functions
   ═══════════════════════════════════════════════════════════════ */

const nodeDefinitionMap = new Map<string, NodeDefinition>(
  nodeDefinitions.map((node) => [node.id, node]),
);

export function getNodeDefinition(id?: string): NodeDefinition | undefined {
  return id ? nodeDefinitionMap.get(id) : undefined;
}

export async function getNodeData(id: string): Promise<unknown | null> {
  const loader = getNodeDefinition(id)?.loadContent;
  if (!loader) return null;

  try {
    const module = await loader();
    return module.default;
  } catch (error) {
    console.error(`[nodeDefinitions] 节点内容加载失败: ${id}`, error);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Dev-time validation
   ═══════════════════════════════════════════════════════════════ */

function validateNodeDefinitions(defs: NodeDefinition[]): void {
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const node of defs) {
    // 1. ID must not be empty
    if (!node.id) {
      errors.push(`节点 ID 不能为空`);
      continue;
    }

    // 2. ID must be unique
    if (seen.has(node.id)) {
      errors.push(`[${node.id}] 节点 ID 重复`);
      continue;
    }
    seen.add(node.id);

    // 3. available 节点必须有 model（variants 节点除外）
    if (
      node.status === "available" &&
      !node.model &&
      node.presentationMode !== "variants"
    ) {
      errors.push(`[${node.id}] status="available" 但缺少 model 配置`);
    }

    // 4. available 节点必须有 layerConfig（variants 节点除外）
    if (
      node.status === "available" &&
      !node.layerConfig &&
      node.presentationMode !== "variants"
    ) {
      errors.push(`[${node.id}] status="available" 但缺少 layerConfig 配置`);
    }

    // 5. model.path 不能为空
    if (node.model && !node.model.path) {
      errors.push(`[${node.id}] model.path 不能为空`);
    }

    // 6. model.scale 必须大于 0
    if (node.model && node.model.scale <= 0) {
      errors.push(`[${node.id}] model.scale 必须大于 0，当前值: ${node.model.scale}`);
    }

    // 7. 同一节点 layer.objectName 不能重复
    if (node.layerConfig?.layers) {
      const layerNames = new Set<string>();
      for (const l of node.layerConfig.layers) {
        if (layerNames.has(l.objectName)) {
          errors.push(`[${node.id}] layer.objectName 重复: "${l.objectName}"`);
        }
        layerNames.add(l.objectName);
      }
    }

    // 9. thumbnail/diagram 路径不能错误重复拼接 BASE_URL
    if (node.thumbnail && node.thumbnail.includes(`${BASE_URL}${BASE_URL}`)) {
      errors.push(`[${node.id}] thumbnail 路径重复拼接 BASE_URL: ${node.thumbnail}`);
    }
    if (node.diagram?.path && node.diagram.path.includes(`${BASE_URL}${BASE_URL}`)) {
      errors.push(`[${node.id}] diagram.path 重复拼接 BASE_URL: ${node.diagram.path}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `[nodeDefinitions] 配置校验失败 (${errors.length} 个错误):\n${errors.map((e) => `  • ${e}`).join("\n")}`,
    );
  }
}

if (import.meta.env.DEV) {
  validateNodeDefinitions(nodeDefinitions);
}
