import { useState, useEffect, useMemo } from "react";
import { useNodeStore } from "../../store/nodeStore";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ExternalLink, ImageIcon, Table2 } from "lucide-react";
import { getNodeDefinition, type NodeLayerInfo } from "../../data/nodeDefinitions";
import { canonicalName } from "../../utils/nameUtils";
import { parseScopedKey } from "../../utils/variantIdentity";
import { resolveComponentKnowledge } from "../../utils/resolveComponentKnowledge";

/* ═══════════════════════════════════════════════════════════════
   Pure helpers — no component state dependencies
   ═══════════════════════════════════════════════════════════════ */

/** Normalize object names: strip spaces/underscores/dots, unify CJK punctuation */
function normalizeName(str: string): string {
  return str
    .replace(/：/g, ":")
    .replace(/[\s_.]+/g, "")
    .replace(/，/g, ",")
    .replace(/、/g, ",");
}

/** Match a 3D component name against the layer list, with progressive suffix stripping */
function findMatchingLayer(
  selectedObject: string,
  layers: NodeLayerInfo[],
): NodeLayerInfo | undefined {
  const norm = normalizeName(selectedObject);
  let matched = layers.find((l) => normalizeName(l.objectName) === norm);
  if (!matched) {
    let base = norm;
    while (base.length > 1 && /[_\d]+$/.test(base)) {
      base = base.replace(/[_\d]+$/, "");
      matched = layers.find((l) => normalizeName(l.objectName) === base);
      if (matched) break;
    }
  }
  return matched;
}

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */

export default function ConstructionKnowledgePanel() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = getNodeDefinition(nodeId);
  const navigate = useNavigate();

  const selectedObject = useNodeStore((s) => s.selectedObject);
  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const selectedVariantId = useNodeStore((s) => s.selectedVariantId);
  const setSelectedVariantId = useNodeStore((s) => s.setSelectedVariantId);
  const linkageEnabled = useNodeStore((s) => s.linkageEnabled);

  // ── Manual expand state (used when linkage is OFF, normal nodes only) ──
  const [manualState, setManualState] = useState<{
    nodeId: string | undefined;
    expandedId: string | null;
  }>(() => ({ nodeId, expandedId: null }));
  const manualExpandedId = manualState.nodeId === nodeId ? manualState.expandedId : null;

  // ── Sorted layers (normal nodes only) ──
  const config = node?.layerConfig;
  const layers = useMemo(
    () =>
      [...(config?.layers ?? [])].sort(
        (a, b) => (b.order ?? 0) - (a.order ?? 0),
      ),
    [config],
  );

  const isMultiModel = node?.presentationMode === "variants";

  // ── Resolve knowledge (Phase 4) ──
  const knowledge = useMemo(() => {
    if (!node) return null;
    return resolveComponentKnowledge({
      node,
      selectedObject,
      selectedVariantId,
    });
  }, [node, selectedObject, selectedVariantId]);

  // ── Derived: which card 3D selection points to (normal nodes only) ──
  const linkedExpandedId = useMemo(() => {
    if (!linkageEnabled || !selectedObject || isMultiModel) return null;
    const { objectName } = parseScopedKey(selectedObject);
    const matched = findMatchingLayer(objectName, layers);
    return matched?.objectName ?? null;
  }, [linkageEnabled, selectedObject, layers, isMultiModel]);

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      linkageEnabled &&
      selectedObject &&
      !linkedExpandedId &&
      !isMultiModel
    ) {
      console.warn(
        "[面板警告] 3D点击命中，但数据中找不到对应名称:",
        selectedObject,
      );
    }
  }, [linkageEnabled, selectedObject, linkedExpandedId, isMultiModel]);

  const expandedId = linkageEnabled ? linkedExpandedId : manualExpandedId;

  // ── Card toggle (normal nodes) ──
  const handleToggle = (objectName: string) => {
    const isCurrentlyExpanded = expandedId === objectName;
    if (isCurrentlyExpanded) {
      if (linkageEnabled) {
        setSelectedObject(null);
      } else {
        setManualState({ nodeId, expandedId: null });
      }
    } else {
      if (linkageEnabled) {
        setSelectedObject(canonicalName(objectName));
      } else {
        setManualState({ nodeId, expandedId: objectName });
      }
    }
  };

  // ── Navigate to related node, clearing old selection ──
  const handleNavigateToNode = (targetId: string) => {
    setSelectedObject(null);
    setSelectedVariantId(null);
    // Phase 6 Step 2: clean up explode scope before navigating
    useNodeStore.getState().resetExplode();
    navigate(`/node/${targetId}`);
  };

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */

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

      {/* ═══════════════════════════════════════════════════════
         Multi-variant knowledge detail (Phase 4)
         ═══════════════════════════════════════════════════════ */}
      {isMultiModel && (
        <div className="flex-1 px-5 py-5">
          {!selectedObject && !selectedVariantId ? (
            /* State 1: nothing selected */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-muted-soft">
                选择上方方案标签，然后点击模型构件
              </p>
              <p className="text-[10px] text-muted-soft/70 mt-1">
                查看构造做法与工程参数
              </p>
            </div>
          ) : selectedVariantId && !selectedObject ? (
            /* State 2: variant selected but no mesh */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-body">
                {knowledge?.variantTitle}
              </p>
              <p className="text-xs text-muted-soft mt-2">
                点击模型构件查看构造知识
              </p>
            </div>
          ) : knowledge && knowledge.isUnconfigured ? (
            /* State 3: mesh selected but no knowledge configured */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="w-10 h-10 rounded-full bg-surface-card flex items-center justify-center mb-3">
                <span className="text-muted-soft text-lg">?</span>
              </span>
              <p className="text-sm font-medium text-muted">已选择：{knowledge.objectName}</p>
              <p className="text-xs text-muted-soft mt-1">
                该构件暂未配置教学内容
              </p>
            </div>
          ) : knowledge && knowledge.component ? (
            /* State 4: full knowledge */
            <div className="space-y-4">
              {/* Variant context */}
              {knowledge.variantLabel && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {knowledge.variantLabel} 方案
                  </span>
                  <span className="text-xs text-muted-soft">
                    {knowledge.variantTitle}
                  </span>
                </div>
              )}

              {/* Component header */}
              <div>
                <h3 className="text-sm font-medium text-ink">
                  {knowledge.component.title}
                </h3>
                {knowledge.component.category && (
                  <span className="text-[10px] text-muted-soft mt-0.5">
                    {knowledge.component.category}
                  </span>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {knowledge.component.material && (
                  <DetailField label="材料" value={knowledge.component.material} />
                )}
                {knowledge.component.construction && (
                  <DetailField label="构造做法" value={knowledge.component.construction} />
                )}
                {knowledge.component.description && (
                  <DetailField label="说明" value={knowledge.component.description} />
                )}
              </div>

              {/* Images */}
              {knowledge.component.images && knowledge.component.images.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ImageIcon size={12} className="text-muted-soft" />
                    <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
                      构造图示
                    </span>
                  </div>
                  {knowledge.component.images.map((img, i) => (
                    <figure key={i} className="mb-2">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full rounded-lg border border-hairline"
                      />
                      {img.caption && (
                        <figcaption className="text-[10px] text-muted-soft mt-1 text-center">
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}

              {/* Tables */}
              {knowledge.component.tables && knowledge.component.tables.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Table2 size={12} className="text-muted-soft" />
                    <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
                      参数表
                    </span>
                  </div>
                  {knowledge.component.tables.map((table, i) => (
                    <div key={i} className="mb-3 overflow-x-auto">
                      {table.title && (
                        <p className="text-[11px] font-medium text-body mb-1">
                          {table.title}
                        </p>
                      )}
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-surface-card">
                            {table.columns.map((col, ci) => (
                              <th
                                key={ci}
                                className="text-left px-2 py-1.5 border border-hairline text-muted font-medium"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, ri) => (
                            <tr key={ri}>
                              {row.map((cell, ci) => (
                                <td
                                  key={ci}
                                  className="px-2 py-1 border border-hairline text-body"
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Related nodes */}
              {knowledge.component.relatedNodeIds &&
                knowledge.component.relatedNodeIds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ExternalLink size={12} className="text-muted-soft" />
                      <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
                        关联节点
                      </span>
                    </div>
                    <div className="space-y-1">
                      {knowledge.component.relatedNodeIds.map((rid) => {
                        const target = getNodeDefinition(rid);
                        if (!target) return null;
                        return (
                          <button
                            key={rid}
                            onClick={() => handleNavigateToNode(rid)}
                            className="w-full text-left px-3 py-2 rounded-lg border border-hairline
                              hover:border-primary/30 hover:bg-primary/5 transition-colors
                              flex items-center justify-between group"
                          >
                            <span className="text-xs text-body group-hover:text-primary">
                              {target.title}
                            </span>
                            <ExternalLink size={11} className="text-muted-soft group-hover:text-primary" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         Normal node accordion (existing behavior)
         ═══════════════════════════════════════════════════════ */}
      {!isMultiModel && (
        <div className="flex-1 px-5 py-5">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            构件列表
          </h3>
          <p className="text-[10px] text-muted-soft mb-3">
            点击构件展开查看详情
          </p>

          {layers.length === 0 ? (
            <p className="text-xs text-muted-soft text-center py-8">
              暂无构件数据
            </p>
          ) : (
            <motion.ul layout className="space-y-2.5">
              {layers.map((layer) => {
                const isExpanded = expandedId === layer.objectName;
                const info = config?.getLayerInfo(layer.objectName);

                return (
                  <motion.li key={layer.objectName} layout>
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
                      <div className="ml-4 flex gap-3 text-[10px] text-muted-soft mt-1">
                        <span>{layer.thickness}</span>
                        <span>{layer.material}</span>
                      </div>
                    </button>

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
                            <DetailField label="厚度" value={info.thickness} />
                            <DetailField label="材料" value={info.material} />
                            <DetailField label="说明" value={info.description} />
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
          )}
        </div>
      )}

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
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-muted-soft uppercase tracking-wider">
        {label}
      </span>
      <p className="text-sm text-body mt-0.5 leading-relaxed">{value}</p>
    </div>
  );
}
