import { useNodeStore } from "../store/nodeStore";
import { colors, spacing, radius, typography } from "../data/tokens";

export default function ExplodeSlider() {
  const explode = useNodeStore((s) => s.explode);
  const setExplode = useNodeStore((s) => s.setExplode);

  return (
    <div style={s.container}>
      {/* Label row */}
      <div style={s.labelRow}>
        <span style={s.label}>构件展开</span>
        <span style={s.value}>{Math.round(explode * 100)}%</span>
      </div>

      {/* Custom-styled range input */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={explode}
        onChange={(e) => setExplode(Number(e.target.value))}
        style={s.slider}
      />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  container: {
    position: "absolute" as const,
    bottom: spacing.xl,
    left: "50%",
    transform: "translateX(-50%)",
    background: colors.white,
    borderRadius: radius.lg,
    padding: `${spacing.sm}px ${spacing.md}px`,
    border: `1px solid ${colors.hairline}`,
    boxShadow: "0 2px 8px rgba(20,20,19,0.06)",
    backdropFilter: "blur(16px)",
    width: 260,
    zIndex: 10,
  },

  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },

  label: {
    fontFamily: typography.font.body,
    fontSize: 11,
    fontWeight: 500,
    color: colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },

  value: {
    fontFamily: typography.font.body,
    fontSize: 11,
    fontWeight: 500,
    color: colors.primary,
  },

  slider: {
    width: "100%",
    height: 4,
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    background: colors.hairline,
    borderRadius: 2,
    outline: "none",
    cursor: "pointer",
    // Thumb styling is handled via pseudo-elements — basic inline fallback
    accentColor: colors.primary,
  },
};
