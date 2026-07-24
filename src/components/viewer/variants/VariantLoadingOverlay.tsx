/* ═══════════════════════════════════════════════════════════════
   VariantLoadingOverlay — shows while GLBs are loading.
   Rendered as an overlay, NOT as a Canvas replacement.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  loadedCount: number;
  totalCount: number;
}

export default function VariantLoadingOverlay({ loadedCount, totalCount }: Props) {
  if (loadedCount >= totalCount) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f5f5f7]/80 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-soft">
          正在加载构造方案 {loadedCount}/{totalCount}
        </p>
      </div>
    </div>
  );
}
