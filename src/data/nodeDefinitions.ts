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
import { castRibbedFloorLayers, getLayerInfo as getCastRibbedFloorLayer } from "./castRibbedFloorLayers";
import { steelBattenTileRoofLayers, getLayerInfo as getSteelBattenTileRoofLayer } from "./steelBattenTileRoofLayers";
import { mortarBedTileRoofLayers, getLayerInfo as getMortarBedTileRoofLayer } from "./mortarBedTileRoofLayers";
import { woodBattenTileRoofLayers, getLayerInfo as getWoodBattenTileRoofLayer } from "./woodBattenTileRoofLayers";
import { blockWallCoreColumnLayers, getLayerInfo as getBlockWallCoreColumnLayer } from "./blockWallCoreColumnLayers";
import { cantileverSlabLayers, getLayerInfo as getCantileverSlabLayer } from "./cantileverSlabLayers";
import { bottomLandingEntranceLayers, getLayerInfo as getBottomLandingEntranceLayer } from "./bottomLandingEntranceLayers";
import { bottomLandingEntranceLoweredLayers, getLayerInfo as getBottomLandingEntranceLoweredLayer } from "./bottomLandingEntranceLoweredLayers";
import { bottomLandingEntranceCombinedLayers, getLayerInfo as getBottomLandingEntranceCombinedLayer } from "./bottomLandingEntranceCombinedLayers";
import { bottomLandingEntranceStraightLayers, getLayerInfo as getBottomLandingEntranceStraightLayer } from "./bottomLandingEntranceStraightLayers";

/* ── Static asset path helper ─────────────────────────────────── */

// Guarded so the single source of truth can be imported by Node/tsx tests
// (where `import.meta.env` is absent).  Vite statically replaces
// `import.meta.env` with the env object, so `?.BASE_URL` still resolves to
// the real base in dev (/ ) and production (/tcugz/); outside Vite it falls
// back to "/", which is the correct public-root interpretation for tests.
const BASE_URL = import.meta.env?.BASE_URL ?? "/";

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

/** Per-variant component detail (reserved for Phase 3 teaching panel). */
export interface VariantComponent {
  name: string;
  material: string;
  thickness: string;
}

/** Extended component knowledge for Phase 4 multi-variant knowledge panel. */
export interface VariantComponentKnowledge {
  objectName: string;
  title: string;
  aliases?: string[];
  category?: string;
  material?: string;
  construction?: string;
  description?: string;
  images?: Array<{ src: string; alt: string; caption?: string }>;
  tables?: Array<{ title?: string; columns: string[]; rows: string[][] }>;
  relatedNodeIds?: string[];
}

/** Phase 5: per-component explode descriptor. */
export interface VariantExplodeComponent {
  /** Exact GLB Object3D.name (not scoped key, not canonicalName). */
  objectName: string;
  aliases?: string[];
  /** Explode direction in model-local space (will be normalized). */
  direction: readonly [number, number, number];
  /** Maximum displacement in scene units. */
  distance: number;
  /** Optional phase window within global explode progress [0,1]. Defaults to 0–1. */
  start?: number;
  end?: number;
}

/** Phase 5: per-variant explode configuration. */
export interface VariantExplodeConfig {
  enabled: boolean;
  components: readonly VariantExplodeComponent[];
}

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
  /** Per-variant component breakdown (reserved for Phase 3, not yet rendered). */
  components?: VariantComponent[];
  /** Per-variant detailed knowledge entries for Phase 4. */
  componentKnowledge?: VariantComponentKnowledge[];
  /** Phase 5: per-variant explode configuration. */
  explode?: VariantExplodeConfig;
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
    id: "steel-batten-tile-roof-01",
    title: "钢挂瓦条块瓦屋面构造",
    description:
      "钢挂瓦条块瓦屋面：块瓦→挂瓦条→顺水条→防水卷材→水泥砂浆找平层→细石混凝土找平层→钢筋混凝土屋面板。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/steel-batten-tile-roof-01.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/steel-batten-tile-roof/steel-batten-tile-roof.glb"),
      scale: 2.5,
    },
    diagram: {
      path: assetPath("images/roof/steel-batten-tile-roof-01.png"),
    },
    layerConfig: {
      layers: steelBattenTileRoofLayers as NodeLayerInfo[],
      getLayerInfo: getSteelBattenTileRoofLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "mortar-bed-tile-roof-01",
    title: "砂浆卧瓦块瓦屋面构造",
    description:
      "砂浆卧瓦块瓦屋面：块瓦→水泥砂浆卧瓦层→防水卷材→水泥砂浆找平层→钢筋混凝土屋面板。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/mortar-bed-tile-roof-01.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/mortar-bed-tile-roof/mortar-bed-tile-roof.glb"),
      scale: 2.5,
    },
    diagram: {
      path: assetPath("images/roof/mortar-bed-tile-roof-01.png"),
    },
    layerConfig: {
      layers: mortarBedTileRoofLayers as NodeLayerInfo[],
      getLayerInfo: getMortarBedTileRoofLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "wood-batten-tile-roof-01",
    title: "木挂瓦条块瓦屋面构造",
    description:
      "木挂瓦条块瓦屋面：块瓦→木挂瓦条→木顺水条→防水卷材（或防水涂膜）→水泥砂浆找平层→细石混凝土找平层→钢筋混凝土屋面板。",
    category: "屋顶",
    thumbnail: assetPath("images/roof/wood-batten-tile-roof-01.png"),
    status: "available",
    model: {
      path: assetPath("models/roof/wood-batten-tile-roof/wood-batten-tile-roof.glb"),
      scale: 2.5,
    },
    diagram: {
      path: assetPath("images/roof/wood-batten-tile-roof-01.png"),
    },
    layerConfig: {
      layers: woodBattenTileRoofLayers as NodeLayerInfo[],
      getLayerInfo: getWoodBattenTileRoofLayer as (objectName: string) => NodeLayerInfo | undefined,
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

  /* ── Floor nodes ─────────────────────────────────────────── */
  {
    id: "cast-ribbed-floor-01",
    title: "现浇肋梁楼板",
    description:
      "现浇肋梁楼板构造：现浇板、次梁（肋梁）、主梁与柱现浇成整体楼盖，荷载传递路径为 板→次梁→主梁→柱。",
    category: "楼地层",
    thumbnail: assetPath("images/floor/cast-ribbed-floor.png"),
    status: "available",
    model: {
      path: assetPath("models/floor/cast-ribbed-floor/cast-ribbed-floor.glb"),
      scale: 3.5,
      // Static model (no GLTF explode animation) → loads fully-expanded and
      // the timeline is locked, consistent with the other no-animation nodes.
      noAnimation: true,
      nonInteractive: ["其他"],
    },
    diagram: {
      path: assetPath("images/floor/cast-ribbed-floor.png"),
    },
    layerConfig: {
      layers: castRibbedFloorLayers as NodeLayerInfo[],
      getLayerInfo: getCastRibbedFloorLayer as (objectName: string) => NodeLayerInfo | undefined,
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
    id: "block-wall-core-column-01",
    title: "砌块墙墙芯柱构造",
    description:
      "砌块墙墙芯柱构造：砌块墙体→2Φ12通长筋→灌C15细石混凝土，在空心砌块孔洞内形成钢筋混凝土芯柱。",
    category: "墙体",
    thumbnail: assetPath("images/wall/block-wall-core-column-01.png"),
    status: "available",
    model: {
      path: assetPath("models/wall/block-wall-core-column/block-wall-core-column.glb"),
      scale: 3.5,
      noAnimation: true,
    },
    diagram: {
      path: assetPath("images/wall/block-wall-core-column-01.png"),
    },
    layerConfig: {
      layers: blockWallCoreColumnLayers as NodeLayerInfo[],
      getLayerInfo: getBlockWallCoreColumnLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
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

  {
    id: "bottom-landing-entrance-01",
    title: "底层中间平台下作出入口（底层长短跑）",
    description:
      "底层平行双跑楼梯在中间平台下作出入口的构造处理方式——底层长短跑：将底层两个梯段改为不等跑，起步第一跑为长跑（级数增多）、第二跑为短跑（级数减少），抬高中间平台标高，使平台下净高满足通行要求（≥2000mm）。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/bottom-landing-entrance-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/bottom-landing-entrance/bottom-landing-entrance.glb"),
      scale: 2,
      noAnimation: true,
    },
    diagram: {
      path: assetPath("images/stairs/bottom-landing-entrance-diagram.png"),
    },
    layerConfig: {
      layers: bottomLandingEntranceLayers as NodeLayerInfo[],
      getLayerInfo: getBottomLandingEntranceLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "bottom-landing-entrance-02",
    title: "底层中间平台下作出入口（局部降低地坪）",
    description:
      "底层平行双跑楼梯在中间平台下作出入口的构造处理方式——局部降低地坪：保持底层两个梯段等跑不变，将中间平台下的地面标高局部降低（将室外台阶部分内移），使平台下净高满足通行要求（≥2000mm）。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/bottom-landing-entrance-lowered-floor-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/bottom-landing-entrance/bottom-landing-entrance-lowered-floor.glb"),
      scale: 2,
      noAnimation: true,
    },
    diagram: {
      path: assetPath("images/stairs/bottom-landing-entrance-lowered-floor-diagram.png"),
    },
    layerConfig: {
      layers: bottomLandingEntranceLoweredLayers as NodeLayerInfo[],
      getLayerInfo: getBottomLandingEntranceLoweredLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "bottom-landing-entrance-03",
    title: "底层中间平台下作出入口（底层长短跑并局部降低地坪）",
    description:
      "底层平行双跑楼梯在中间平台下作出入口的构造处理方式——长短跑并局部降低地坪：既将底层第一跑加长（长短跑）抬高中间平台，又适当降低平台下地坪标高，两者叠加共同满足平台下净高（≥2000mm），兼有两种方法的优点，在工程中应用最为广泛。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/bottom-landing-entrance-combined-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/bottom-landing-entrance/bottom-landing-entrance-combined.glb"),
      scale: 2,
      noAnimation: true,
    },
    diagram: {
      path: assetPath("images/stairs/bottom-landing-entrance-combined-diagram.png"),
    },
    layerConfig: {
      layers: bottomLandingEntranceCombinedLayers as NodeLayerInfo[],
      getLayerInfo: getBottomLandingEntranceCombinedLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  {
    id: "bottom-landing-entrance-04",
    title: "底层中间平台下作出入口（底层直跑）",
    description:
      "底层平行双跑楼梯在中间平台下作出入口的构造处理方式——底层直跑：底层采用直行单跑楼梯，从底层地坪直达楼层，中间不设休息平台，从根上避免平台下空间不足的问题；入口设于梯段一侧，入口处雨篷底面标高应保证净高≥2m，常用于南方地区住宅建筑。",
    category: "楼梯",
    thumbnail: assetPath("images/stairs/bottom-landing-entrance-straight-diagram.png"),
    status: "available",
    model: {
      path: assetPath("models/stairs/bottom-landing-entrance/bottom-landing-entrance-straight.glb"),
      scale: 2,
      noAnimation: true,
    },
    diagram: {
      path: assetPath("images/stairs/bottom-landing-entrance-straight-diagram.png"),
    },
    layerConfig: {
      layers: bottomLandingEntranceStraightLayers as NodeLayerInfo[],
      getLayerInfo: getBottomLandingEntranceStraightLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
  },

  /* ── Multi-variant presentation — Phase 2 ──
     ════════════════════════════════════════════════════════════
     Three models loaded in single ModelViewer Canvas with shared
     camera, lights, and OrbitControls. Variants provide model
     sources via resolveNodeModelSources().
     ════════════════════════════════════════════════════════════ */
  {
    id: "wall-damp-proof-course",
    title: "墙身防潮层的位置",
    description:
      "同一构造问题在三种不同条件下的防潮层做法：密实垫层、透水垫层、室内外高差。",
    category: "墙体",
    thumbnail: null,
    status: "available",
    presentationMode: "variants",
    /** layerConfig required by ConstructionKnowledgePanel. */
    layerConfig: {
      layers: plasterPlinthLayers as NodeLayerInfo[],
      getLayerInfo: getPlasterPlinthLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    variants: [
      {
        id: "dense-base",
        label: "A",
        title: "密实材料垫层",
        description:
          "地面垫层采用密实材料时，水平防潮层设置于室内地面附近，垫层具有较好的阻水能力。",
        model: {
          path: assetPath("models/wall/wall-damp-proof/damp-proof-a-v2.glb"),
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
        explode: {
          enabled: true,
          components: [
            { objectName: "地面垫层为密实材料001", direction: [0, 1, 0], distance: 0.8 },
            { objectName: "地面垫层为密实材料001_1", direction: [0, 1, 0], distance: 0.4, start: 0.2 },
            { objectName: "地面垫层为密实材料001_2", direction: [0, -1, 0], distance: 0.5 },
          ],
        },
        componentKnowledge: [
          {
            objectName: "地面垫层为密实材料001",
            title: "密实垫层主体",
            category: "垫层",
            material: "C15混凝土",
            construction: "浇筑密实，振捣均匀，养护不少于7天",
            description:
              "密实垫层是防潮构造的基础层。采用低水灰比的C15混凝土浇筑，密实度高、透水性低，能有效阻止地下水汽上升。垫层厚度通常不小于80mm，与室内地面面层共同构成完整的水平防潮体系。",
            images: [
              { src: assetPath("images/wall/plaster-plinth-diagram.png"), alt: "密实垫层构造示意", caption: "密实垫层防潮体系示意" },
            ],
            relatedNodeIds: ["plaster-plinth-01"],
          },
          {
            objectName: "地面垫层为密实材料001_1",
            title: "水平防潮层",
            category: "防潮",
            material: "防水砂浆",
            construction: "20mm厚防水砂浆，分两遍涂抹",
            description:
              "水平防潮层直接设置在垫层之上。防水砂浆由水泥、砂和防水剂按比例配制，分两次涂抹以确保均匀覆盖。防潮层须连续无间断，搭接宽度≥100mm。",
            tables: [
              {
                title: "防水砂浆配比",
                columns: ["材料", "比例", "用量"],
                rows: [
                  ["普通硅酸盐水泥", "1", "—"],
                  ["中粗砂", "2.5", "—"],
                  ["防水剂", "5%", "按水泥重量"],
                  ["水", "0.5", "—"],
                ],
              },
            ],
          },
        ],
      },
      {
        id: "permeable-base",
        label: "B",
        title: "透水材料垫层",
        description:
          "地面垫层采用透水材料时，需要调整水平防潮层位置，避免水分进入墙身。",
        model: {
          path: assetPath("models/wall/wall-damp-proof/damp-proof-b-v2.glb"),
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
        explode: {
          enabled: true,
          components: [
            { objectName: "地面垫层为透水材料001", direction: [0, 1, 0], distance: 0.6 },
            { objectName: "地面垫层为透水材料001_1", direction: [0.3, 0.8, 0], distance: 0.5, start: 0.1 },
            { objectName: "地面垫层为透水材料001_2", direction: [0, -1, 0], distance: 0.7, start: 0.3, end: 0.9 },
          ],
        },
        componentKnowledge: [
          {
            objectName: "地面垫层为透水材料001",
            title: "透水垫层主体",
            category: "垫层",
            material: "级配碎石",
            construction: "分层铺设，每层≤100mm，碾压密实",
            description:
              "透水垫层采用级配碎石或砂砾铺设。与密实垫层不同，透水垫层本身不具备阻水能力，地下水汽可通过孔隙上升。因此防潮层的设置位置需要高于透水垫层的毛细水上升高度，通常设置在室内地面标高以上。",
            relatedNodeIds: ["stone-apron-01"],
          },
          {
            objectName: "地面垫层为透水材料001_1",
            title: "抬高防潮层",
            category: "防潮",
            material: "SBS改性沥青防水卷材",
            construction: "热熔法铺贴，搭接≥100mm，卷材延伸至墙体",
            description:
              "由于垫层透水，防潮层必须抬高至透水垫层毛细水影响范围之上。采用SBS改性沥青卷材，热熔法施工，与墙体防潮层形成连续防水屏障。这一做法有效阻断了透水垫层中的毛细水上升路径。",
            tables: [
              {
                title: "SBS卷材性能指标",
                columns: ["项目", "指标", "标准"],
                rows: [
                  ["可溶物含量", "≥2100g/m²", "GB 18242"],
                  ["耐热度", "≥90°C", "GB 18242"],
                  ["低温柔度", "≤-20°C", "GB 18242"],
                  ["不透水性", "0.3MPa/30min", "GB 18242"],
                ],
              },
            ],
            relatedNodeIds: ["flat-roof-01"],
          },
        ],
      },
      {
        id: "level-difference",
        label: "C",
        title: "室内外地面有高差",
        description:
          "室内外地面存在高差时，需要结合水平与垂直防潮构造处理。",
        model: {
          path: assetPath("models/wall/wall-damp-proof/damp-proof-c-v2.glb"),
          scale: 2,
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
        explode: {
          enabled: true,
          components: [
            { objectName: "室内地面有高差001", direction: [0, 1, 0], distance: 0.5, start: 0, end: 0.5 },
            { objectName: "室内地面有高差001_1", direction: [0, 1.2, 0], distance: 0.9, start: 0.1, end: 0.8 },
            { objectName: "室内地面有高差001_2", direction: [0, -1, 0], distance: 0.6 },
          ],
        },
        componentKnowledge: [
          {
            objectName: "室内地面有高差001",
            title: "低侧水平防潮层",
            category: "防潮",
            material: "防水砂浆",
            construction: "20mm厚防水砂浆，与室内地坪平齐",
            description:
              "在室内外高差场景中，室外地面低于室内地面。低侧的水平防潮层设置在略高于室外地面处，防止室外潮气渗入墙体。该层须与垂直防潮层可靠搭接。",
            relatedNodeIds: ["plaster-plinth-01"],
          },
          {
            objectName: "室内地面有高差001_1",
            title: "垂直防潮层",
            category: "防潮",
            material: "防水砂浆 + 防水涂料",
            construction: "自低侧防潮层向上延伸至室内地面标高以上",
            description:
              "垂直防潮层连接低侧和高侧水平防潮层，沿墙体垂直敷设。采用防水砂浆打底+防水涂料面层的复合做法，形成连续的L形防潮屏障。这是高差场景中最为关键的构造节点。",
            images: [
              { src: assetPath("images/wall/plaster-plinth-diagram.png"), alt: "高差防潮示意", caption: "室内外高差防潮构造" },
            ],
            tables: [
              {
                title: "垂直防潮层构造层次",
                columns: ["层次", "材料", "厚度"],
                rows: [
                  ["面层", "水泥基防水涂料", "2mm"],
                  ["中层", "防水砂浆", "10mm"],
                  ["底层", "界面处理剂", "—"],
                ],
              },
            ],
            relatedNodeIds: ["faced-plinth-01", "plaster-plinth-01"],
          },
        ],
      },
    ],
  },

  {
    id: "cantilever-slab-01",
    title: "挑梁搭板三种构造",
    description:
      "挑梁搭板的三种构造做法：设置边梁、挑梁外露、L形挑梁卡口板，对比悬挑板与挑梁的不同连接与支承方式。",
    category: "楼地层",
    thumbnail: null,
    status: "available",
    presentationMode: "variants",
    /** layerConfig required by ConstructionKnowledgePanel (general layers). */
    layerConfig: {
      layers: cantileverSlabLayers as NodeLayerInfo[],
      getLayerInfo: getCantileverSlabLayer as (objectName: string) => NodeLayerInfo | undefined,
    },
    diagram: {
      path: assetPath("images/floor/cantilever-slab-diagram.png"),
    },
    variants: [
      {
        id: "edge-beam",
        label: "A",
        title: "设置边梁",
        description:
          "挑梁搭板在悬挑端设置边梁，与挑梁、现浇板整体现浇形成封闭框架，提高悬挑端的整体刚度与抗扭能力，边梁兼作栏杆或女儿墙的支承。",
        model: {
          path: assetPath("models/floor/cantilever-slab/cantilever-slab-edge-beam.glb"),
          scale: 2,
        },
        differenceSummary: [
          "悬挑端设置边梁，与挑梁、板形成整体框架",
          "边梁提高悬挑端刚度与抗扭能力，兼作栏杆支承",
        ],
        components: [
          { name: "挑梁", material: "钢筋混凝土", thickness: "按结构计算" },
          { name: "现浇挑板", material: "钢筋混凝土", thickness: "按结构计算" },
          { name: "边梁", material: "钢筋混凝土", thickness: "按结构计算" },
        ],
        componentKnowledge: [
          {
            objectName: "挑梁搭板-_设置边梁",
            title: "设置边梁挑梁搭板",
            category: "楼地层",
            material: "钢筋混凝土",
            construction: "挑梁与边梁、现浇板整体现浇，边梁设于悬挑端",
            description:
              "设置边梁的挑梁搭板在悬挑端沿板边设置边梁，与挑梁和板整体现浇成封闭的框架体系。边梁一方面约束悬挑端的扭转与变形、提高整体刚度，另一方面兼作阳台栏杆或女儿墙的支承构件，常用于需要较强整体性与抗风压的悬挑部位。",
            images: [
              { src: assetPath("images/floor/cantilever-slab-diagram.png"), alt: "挑梁搭板剖面", caption: "挑梁搭板构造示意" },
            ],
            relatedNodeIds: ["cast-ribbed-floor-01"],
          },
        ],
      },
      {
        id: "exposed-beam",
        label: "B",
        title: "挑梁外露",
        description:
          "挑梁从墙体悬挑、梁底直接外露，不设边梁。挑梁支承悬挑板，梁的截面与布置直接可见，构造简洁、支模方便。",
        model: {
          path: assetPath("models/floor/cantilever-slab/cantilever-slab-exposed-beam.glb"),
          scale: 2,
        },
        differenceSummary: [
          "挑梁梁底外露，不设边梁",
          "构造简洁，梁截面与布置直接可见",
        ],
        components: [
          { name: "挑梁（外露）", material: "钢筋混凝土", thickness: "按结构计算" },
          { name: "现浇挑板", material: "钢筋混凝土", thickness: "按结构计算" },
        ],
        componentKnowledge: [
          {
            objectName: "挑梁搭板-挑梁外露",
            title: "挑梁外露构造",
            category: "楼地层",
            material: "钢筋混凝土",
            construction: "挑梁从墙体悬挑、梁底外露，与现浇板整体浇筑",
            description:
              "挑梁外露做法中挑梁从墙体悬挑而出，梁底直接外露，悬挑端不设边梁。挑梁支承悬挑板，梁的截面尺寸与布置间距直接可见，构造简洁、支模与配筋方便。外露梁底面应注意滴水线处理，防止雨水沿梁底流至墙体。",
            images: [
              { src: assetPath("images/floor/cantilever-slab-diagram.png"), alt: "挑梁搭板剖面", caption: "挑梁搭板构造示意" },
            ],
            relatedNodeIds: ["cast-ribbed-floor-01"],
          },
        ],
      },
      {
        id: "l-notch-board",
        label: "C",
        title: "L形挑梁卡口板",
        description:
          "采用L形截面的挑梁，板端设卡口（企口）与L形挑梁相互咬合，板嵌入梁的卡口槽内，增强板梁连接的整体性，防止板端翘起或脱离。",
        model: {
          path: assetPath("models/floor/cantilever-slab/cantilever-slab-l-notch-board.glb"),
          scale: 2,
        },
        differenceSummary: [
          "L形截面的挑梁，提供承托卡槽",
          "卡口板端嵌入挑梁卡口，板梁咬合连接",
        ],
        components: [
          { name: "L形挑梁", material: "钢筋混凝土", thickness: "按结构计算" },
          { name: "卡口板", material: "钢筋混凝土", thickness: "按结构计算" },
          { name: "现浇挑板", material: "钢筋混凝土", thickness: "按结构计算" },
        ],
        componentKnowledge: [
          {
            objectName: "挑梁搭板-_L形挑梁卡口板",
            title: "L形挑梁卡口板构造",
            category: "楼地层",
            material: "钢筋混凝土",
            construction: "L形挑梁与卡口板咬合连接，板端嵌入挑梁卡口槽",
            description:
              "L形挑梁卡口板采用L形截面的挑梁，悬挑板板端设置卡口（企口），卡口板端嵌入L形挑梁的卡口槽内，使板与梁相互咬合。这种连接方式提高板梁结合的整体性，约束板端的竖向位移与翘曲，避免使用中板端与梁脱离，适用于预制与现浇相结合的悬挑构造。",
            images: [
              { src: assetPath("images/floor/cantilever-slab-diagram.png"), alt: "挑梁搭板剖面", caption: "挑梁搭板构造示意" },
            ],
            relatedNodeIds: ["cast-ribbed-floor-01"],
          },
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

if (import.meta.env?.DEV) {
  validateNodeDefinitions(nodeDefinitions);
}
