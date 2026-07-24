import { Undo2 } from "lucide-react";
import type { VariantSelection } from "./variantTypes";

/* ═══════════════════════════════════════════════════════════════
   VariantToolbar — floating controls below the viewport.
   Provides Reset and "全部展示" button.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  selection: VariantSelection;
  onReset: () => void;
  onShowAll: () => void;
}

export default function VariantToolbar({ selection, onReset, onShowAll }: Props) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-2 py-2 px-3 bg-canvas border-t border-hairline">
      {selection.mode === "selected" && (
        <button
          onClick={onShowAll}
          className="px-3 py-1.5 rounded-lg border border-hairline text-xs text-muted
            hover:text-primary hover:border-primary/30 transition-colors"
        >
          全部展示
        </button>
      )}
      <button
        onClick={onReset}
        className="w-8 h-8 rounded-lg flex items-center justify-center
          text-muted-soft hover:text-primary hover:bg-hairline transition-colors"
        title="重置视角"
      >
        <Undo2 size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
