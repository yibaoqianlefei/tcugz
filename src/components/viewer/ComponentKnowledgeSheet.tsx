import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { useNodeStore } from "../../store/nodeStore";
import { getNodeDefinition, type NodeLayerInfo } from "../../data/nodeDefinitions";
import { makeScopedKey, parseScopedKey } from "../../utils/variantIdentity";
import { resolveComponentKnowledge } from "../../utils/resolveComponentKnowledge";
import { Link, useLocation } from "react-router-dom";
import { getNodeLearningContext, learningRoute } from "../../utils/curriculumLearning";
import "../../styles/node-knowledge-sheet.css";

/**
 * Mobile component knowledge sheet: read the selected component's card without
 * leaving the 3D model.
 *
 * peek — one line name + summary, the canvas keeps almost all of its height.
 * half — full card fields plus the component list, the canvas stays visible.
 *
 * Works for single-model nodes (layerConfig) and for multi-variant nodes
 * (variant.componentKnowledge); nodes without either show nothing.
 */

function normalizeName(value: string): string {
  return value.normalize("NFKC").replace(/[\s_.]+/g, "").toLowerCase();
}

function findLayer(layers: NodeLayerInfo[], objectName: string): NodeLayerInfo | undefined {
  const target = normalizeName(objectName);
  const direct = layers.find((layer) => normalizeName(layer.objectName) === target);
  if (direct) return direct;
  let base = target;
  while (base.length > 1 && /[_\d]+$/.test(base)) {
    base = base.replace(/[_\d]+$/, "");
    const match = layers.find((layer) => normalizeName(layer.objectName) === base);
    if (match) return match;
  }
  return undefined;
}

function firstSentence(text: string | undefined): string {
  if (!text) return "";
  const trimmed = text.trim();
  const cut = trimmed.search(/[。！？；]/);
  return cut > 0 ? trimmed.slice(0, cut + 1) : trimmed;
}

/** The sheet is a phone-only affordance: 361–767px, matching the stylesheet. */
const SHEET_QUERY = "(min-width: 361px) and (max-width: 767px)";

function useSheetViewport() {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" && window.matchMedia(SHEET_QUERY).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(SHEET_QUERY);
    const update = () => setMatches(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return matches;
}

type SheetItem = { key: string; name: string; material?: string };
type SheetField = { label: string; value: string; block?: boolean };

export default function ComponentKnowledgeSheet({ nodeId }: { nodeId: string }) {
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const enabled = useSheetViewport();
  return (
    <AnimatePresence>
      {enabled && selectedObject && <SheetBody key={nodeId} nodeId={nodeId} selectedObject={selectedObject} />}
    </AnimatePresence>
  );
}

function SheetBody({ nodeId, selectedObject }: { nodeId: string; selectedObject: string }) {
  const node = getNodeDefinition(nodeId);
  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const selectedVariantId = useNodeStore((s) => s.selectedVariantId);
  const [mode, setMode] = useState<"peek" | "half">("peek");
  const reducedMotion = useReducedMotion();
  const isPresent = useIsPresent();
  const location = useLocation();
  const courseContext = getNodeLearningContext(nodeId, location.search);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Keep the open/peek mode while selecting another part, but start its full
  // explanation at the top rather than inheriting the previous card's scroll.
  useLayoutEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [selectedObject]);

  const { objectName } = parseScopedKey(selectedObject);
  if (!node) return null;
  const resolved = resolveComponentKnowledge({ node, selectedObject, selectedVariantId });
  const variant = node.variants?.find((item) => item.id === (resolved?.variantId ?? null));
  const layers = variant ? [] : (node.layerConfig?.layers ?? []).slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  const layer = variant ? undefined : findLayer(layers, objectName);

  if (!variant && !layers.length) return null;

  let title: string;
  let summary: string;
  const fields: SheetField[] = [];
  let items: SheetItem[];

  if (variant) {
    const component = resolved?.component;
    const knowledge = variant.componentKnowledge ?? [];
    title = component?.title ?? objectName;
    summary = component?.description ?? "";
    if (component?.category) fields.push({ label: "类别", value: component.category });
    if (component?.material) fields.push({ label: "材料", value: component.material });
    if (component?.construction) fields.push({ label: "构造做法", value: component.construction });
    if (component?.description) fields.push({ label: "说明", value: component.description, block: true });
    items = knowledge.map((item) => ({
      key: makeScopedKey(variant.id, item.objectName),
      name: item.title || item.objectName,
      material: item.material,
    }));
  } else {
    title = layer?.name ?? objectName;
    summary = layer?.description ?? "";
    if (layer?.thickness) fields.push({ label: "厚度 / 尺寸", value: layer.thickness });
    if (layer?.material) fields.push({ label: "材料", value: layer.material });
    if (layer?.description) fields.push({ label: "说明", value: layer.description, block: true });
    items = layers.map((item) => ({ key: item.objectName, name: item.name, material: item.material }));
  }

  return (
    <motion.div className="node-sheet-slot"
      inert={!isPresent} aria-hidden={!isPresent}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}>
      <div className="node-sheet-slot-inner">
        <section className="node-sheet" data-mode={mode} aria-labelledby="node-sheet-title">
          <div className="node-sheet-head">
            <button
              type="button"
              className="node-sheet-toggle"
              onClick={() => setMode(mode === "peek" ? "half" : "peek")}
              aria-expanded={mode === "half"}
              aria-controls="node-sheet-body"
            >
              <span className="node-sheet-grip" aria-hidden="true" />
              <span className="node-sheet-title" id="node-sheet-title">
                <strong>{title}</strong>
                {variant && <em>{variant.label} · {variant.title}</em>}
              </span>
              <ChevronUp className="node-sheet-chevron" size={18} aria-hidden="true" />
            </button>
            <button type="button" className="node-sheet-close" onClick={() => setSelectedObject(null)} aria-label="关闭构件知识">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="node-sheet-row" data-open={mode === "peek"}>
            <div className="node-sheet-row-inner">
              <p className="node-sheet-summary"><span>{firstSentence(summary) || "已选中该构件"}</span></p>
            </div>
          </div>

          <div className="node-sheet-row" data-open={mode === "half"}>
            <div className="node-sheet-row-inner">
              <div ref={bodyRef} className="node-sheet-body" id="node-sheet-body" inert={mode !== "half"}>
                {courseContext && <Link className="wall-sheet-course" to={learningRoute(courseContext)}>教材 · {courseContext.lessonTitle} ↗</Link>}
                {fields.length > 0 && (
                  <dl className="node-sheet-fields">
                    {fields.map((field) => (
                      <div key={field.label} className={field.block ? "node-sheet-detail" : undefined}>
                        <dt>{field.label}</dt>
                        <dd>{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="node-sheet-list-label">构件列表 · 点选可在模型上切换</p>
                <ul className="node-sheet-list">
                  {items.map((item) => {
                    const active = item.key === selectedObject;
                    return (
                      <li key={item.key}>
                        <button
                          type="button"
                          className="node-sheet-item"
                          aria-pressed={active}
                          onClick={() => setSelectedObject(item.key)}
                        >
                          <span>{item.name}</span>
                          {item.material && <em>{item.material}</em>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
