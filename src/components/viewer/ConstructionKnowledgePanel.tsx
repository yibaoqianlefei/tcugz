import { useState, useEffect } from "react";
import { useNodeStore } from "../../store/nodeStore";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { nodesIndex } from "../../data/nodesIndex";
import { roofDrainageLayers, getLayerInfo as getRoofDrainageLayer } from "../../data/roofDrainageLayers";
import { organizedDrainageLayers, getLayerInfo as getOrganizedDrainageLayer } from "../../data/organizedDrainageLayers";
import { flatRoofLayers, getLayerInfo as getFlatRoofLayer } from "../../data/flatRoofLayers";
import { slopedRoofLayers, getLayerInfo as getSlopedRoofLayer } from "../../data/slopedRoofLayers";
import { canonicalName } from "../../utils/nameUtils";

const LAYER_CONFIG: Record<string, { layers: any[]; getLayerInfo: (name: string) => any }> = {
  "flat-roof-01": { layers: flatRoofLayers, getLayerInfo: getFlatRoofLayer },
  "sloped-roof-01": { layers: slopedRoofLayers, getLayerInfo: getSlopedRoofLayer },
  "organized-drainage-01": { layers: organizedDrainageLayers, getLayerInfo: getOrganizedDrainageLayer },
};

const DEFAULT_LAYERS = { layers: roofDrainageLayers, getLayerInfo: getRoofDrainageLayer };

/**
 * ConstructionKnowledgePanel — accordion-style layer cards.
 * Click to expand in-place with smooth Framer Motion layout animations.
 * Selected state syncs to 3D viewport highlight.
 */
export default function ConstructionKnowledgePanel() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);

  // 3D highlight sync (read + write) + linkage toggle
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const linkageEnabled = useNodeStore((s) => s.linkageEnabled);

  // Accordion state: which card is expanded (null = all collapsed)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const config = (nodeId && LAYER_CONFIG[nodeId]) || DEFAULT_LAYERS;
  const layers = [...config.layers].sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  const getLayerInfo = config.getLayerInfo;

  // ── Normalize: remove spaces, unify Chinese/English punctuation ──
  function normalizeName(str: string): string {
    return str
      .replace(/：/g, ":")           // full-width colon
      .replace(/[\s_.]+/g, "")      // spaces + underscores + dots (Three.js strips all)
      .replace(/，/g, ",")
      .replace(/、/g, ",");
  }

  // ── Sync: 3D click → panel auto-expand (gated by linkageEnabled) ──
  useEffect(() => {
    if (!linkageEnabled) return;
    if (!selectedObject) {
      setExpandedId(null);
      return;
    }
    // Find matching layer: try exact, then progressively strip suffixes
    const norm = normalizeName(selectedObject);
    let matched = layers.find((l) => normalizeName(l.objectName) === norm);
    if (!matched) {
      // Strip trailing digits/underscores progressively (01_1 → 01)
      let base = norm;
      while (base.length > 1 && /[_\d]+$/.test(base)) {
        base = base.replace(/[_\d]+$/, "");
        matched = layers.find((l) => normalizeName(l.objectName) === base);
        if (matched) break;
      }
    }
    if (matched) {
      setExpandedId(matched.objectName);
    } else {
      console.warn("[面板警告] 3D点击命中，但数据中找不到对应名称:", selectedObject);
    }
  }, [selectedObject, layers]);

  const handleToggle = (objectName: string) => {
    if (expandedId === objectName) {
      setExpandedId(null);
      if (linkageEnabled) setSelectedObject(null);
    } else {
      setExpandedId(objectName);
      // Send canonical form (spaces→_, dots→del) so 3D lookup matches
      if (linkageEnabled) setSelectedObject(canonicalName(objectName));
    }
  };

  return (
    <div
      className="hidden lg:flex flex-col flex-shrink-0 bg-canvas border-l border-hairline overflow-y-auto"
      style={{ width: 360 }}
    >
      {/* ── Node Info Header ── */}
      <div className="flex-shrink-0 px-5 py-5 border-b border-hairline">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-5 bg-primary rounded-full flex-shrink-0" />
          <h2 className="text-lg font-normal font-serif text-ink tracking-tight">
            {node?.title ?? "未知节点"}
          </h2>
        </div>
        {node?.description && (
          <p className="text-sm text-muted leading-relaxed">{node.description}</p>
        )}
        {node?.category && (
          <div className="mt-3">
            <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider bg-surface-card px-2 py-0.5 rounded-full">
              {node.category}
            </span>
          </div>
        )}
      </div>

      {/* ── Accordion layer list ── */}
      <div className="flex-1 px-5 py-5">
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
          构件列表
        </h3>
        <p className="text-[10px] text-muted-soft mb-3">
          点击构件展开查看详情
        </p>

        <motion.ul layout className="space-y-2.5">
          {layers.map((layer) => {
            const isExpanded = expandedId === layer.objectName;
            const info = getLayerInfo(layer.objectName);

            return (
              <motion.li key={layer.objectName} layout>
                {/* ── Card header (always visible) ── */}
                <button
                  onClick={() => handleToggle(layer.objectName)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors duration-200
                    ${isExpanded
                      ? "bg-primary/5 border-primary/30 shadow-sm rounded-b-none border-b-0"
                      : "bg-surface-card border-hairline hover:border-primary/20 hover:bg-surface-cream-strong/50"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpanded ? "bg-primary" : "bg-muted-soft"}`}
                    />
                    <span className={`text-sm font-medium break-words line-clamp-2 ${isExpanded ? "text-primary" : "text-body"}`}>
                      {layer.objectName}
                    </span>
                  </div>
                  {/* Collapsed summary */}
                  <div className="ml-4 flex gap-3 text-[10px] text-muted-soft mt-1">
                    <span>{layer.thickness}</span>
                    <span>{layer.material}</span>
                  </div>
                </button>

                {/* ── Expandable detail ── */}
                <AnimatePresence initial={false}>
                  {isExpanded && info && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="bg-primary/5 border border-primary/30 border-t-0 rounded-b-xl px-4 pb-4 pt-3 space-y-3">
                        <Field label="厚度" value={info.thickness} />
                        <Field label="材料" value={info.material} />
                        <Field label="说明" value={info.description} />

                        {/* Collapse button */}
                        <button
                          onClick={() => handleToggle(layer.objectName)}
                          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg
                            text-xs text-muted-soft hover:text-muted hover:bg-surface-card transition-colors"
                        >
                          <ChevronUp size={14} strokeWidth={1.5} />
                          <span>收起</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-hairline">
        <p className="text-[10px] text-muted-soft text-center">
          建筑构造交互系统
        </p>
      </div>
    </div>
  );
}

/* ── Helper: detail field ── */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
        {label}
      </span>
      <p className="text-sm text-body mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
