import { useEffect, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { useNodeStore } from "../../store/nodeStore";
import { getNodeDefinition, type NodeLayerInfo } from "../../data/nodeDefinitions";
import { parseScopedKey } from "../../utils/variantIdentity";
import "../../styles/node-knowledge-sheet.css";

/**
 * EXPERIMENT (mobile only, single node): reveal the selected component's
 * knowledge card without leaving the 3D model.
 *
 * peek — one line name + summary, canvas keeps almost all of its height.
 * half — full card fields plus the component list, canvas stays visible above.
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

/**
 * The workbench canvas only re-measures on a window resize; without this pump
 * it would keep its old height for half a second and snap once the sheet has
 * already settled. Feeding resize frames keeps the model in step with the card.
 */
function pumpCanvasResize(durationMs = 360) {
  if (typeof window === "undefined") return;
  const start = performance.now();
  const step = () => {
    window.dispatchEvent(new Event("resize"));
    if (performance.now() - start < durationMs) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const CLOSE_MS = 320;

export default function ComponentKnowledgeSheet({ nodeId }: { nodeId: string }) {
  const selectedObject = useNodeStore((s) => s.selectedObject);
  const objectName = selectedObject ? parseScopedKey(selectedObject).objectName : "";
  if (!objectName) return null;
  // Keyed by selection: picking another component remounts the card in peek.
  return <SheetBody key={objectName} nodeId={nodeId} objectName={objectName} />;
}

function SheetBody({ nodeId, objectName }: { nodeId: string; objectName: string }) {
  const node = getNodeDefinition(nodeId);
  const setSelectedObject = useNodeStore((s) => s.setSelectedObject);
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [mode, setMode] = useState<"peek" | "half">("peek");

  // Keep the canvas in step with the card while it grows, shrinks or collapses.
  useEffect(() => {
    pumpCanvasResize(380);
  }, [mode]);

  const layers = (node?.layerConfig?.layers ?? []).slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  const layer = findLayer(layers, objectName);
  if (!open) return null;

  const title = layer?.name ?? objectName;
  const summary = firstSentence(layer?.description);
  const close = () => {
    setLeaving(true);
    pumpCanvasResize(CLOSE_MS + 120);
    window.setTimeout(() => {
      setOpen(false);
      setSelectedObject(null);
    }, CLOSE_MS);
  };

  return (
    <div className="node-sheet-slot" data-open={!leaving}>
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
              </span>
              <ChevronUp className="node-sheet-chevron" size={18} aria-hidden="true" />
            </button>
            <button type="button" className="node-sheet-close" onClick={close} aria-label="关闭构件知识">
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="node-sheet-row" data-open={mode === "peek"}>
            <div className="node-sheet-row-inner">
              <p className="node-sheet-summary">{summary || "已选中该构件"}</p>
            </div>
          </div>

          <div className="node-sheet-row" data-open={mode === "half"}>
            <div className="node-sheet-row-inner">
              <div className="node-sheet-body" id="node-sheet-body" inert={mode !== "half"}>
                {layer && (
                  <dl className="node-sheet-fields">
                    {layer.thickness && (
                      <div>
                        <dt>厚度 / 尺寸</dt>
                        <dd>{layer.thickness}</dd>
                      </div>
                    )}
                    {layer.material && (
                      <div>
                        <dt>材料</dt>
                        <dd>{layer.material}</dd>
                      </div>
                    )}
                    {layer.description && (
                      <div className="node-sheet-detail">
                        <dt>说明</dt>
                        <dd>{layer.description}</dd>
                      </div>
                    )}
                  </dl>
                )}

                <p className="node-sheet-list-label">构件列表 · 点选可在模型上切换</p>
                <ul className="node-sheet-list">
                  {layers.map((item) => {
                    const active = item.objectName === layer?.objectName;
                    return (
                      <li key={item.objectName}>
                        <button
                          type="button"
                          className="node-sheet-item"
                          aria-pressed={active}
                          onClick={() => setSelectedObject(item.objectName)}
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
    </div>
  );
}
