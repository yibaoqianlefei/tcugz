import { motion } from "framer-motion";
import { useNodeStore } from "../store/nodeStore";
import { colors, spacing, radius, typography, elevation } from "../data/tokens";
import { nodes } from "../data/nodes";

export default function InfoCard() {
  const selected = useNodeStore((s) => s.selected);

  // Find part name from nodes data
  const partName = (() => {
    if (!selected) return null;
    for (const node of nodes) {
      const part = node.parts.find((p) => p.id === selected);
      if (part) return { name: part.name, desc: part.desc };
    }
    return { name: selected, desc: "" };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={s.card}
    >
      {/* Card header */}
      <div style={s.header}>
        <span style={s.dot} />
        <h4 style={s.heading}>构件信息</h4>
      </div>

      {/* Divider */}
      <div style={s.divider} />

      {/* Content */}
      {partName ? (
        <div>
          <div style={s.partName}>{partName.name}</div>
          <div style={s.partDesc}>{partName.desc}</div>
        </div>
      ) : (
        <p style={s.placeholder}>点击 3D 构件查看详情</p>
      )}
    </motion.div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  card: {
    position: "absolute" as const,
    right: spacing.lg,
    top: spacing.lg,
    width: 240,
    padding: spacing.md,
    background: colors.white,
    borderRadius: radius.lg,
    ...elevation.hairline,
    boxShadow: "0 2px 8px rgba(20,20,19,0.06)",
    backdropFilter: "blur(16px)",
    zIndex: 10,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: colors.primary,
    flexShrink: 0,
  },

  heading: {
    fontFamily: typography.font.body,
    fontSize: 12,
    fontWeight: 500,
    color: colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },

  divider: {
    height: 1,
    background: colors.hairline,
    margin: `${spacing.sm}px 0`,
  },

  partName: {
    fontFamily: typography.font.display,
    fontSize: 16,
    fontWeight: 600,
    color: colors.ink,
    marginBottom: 4,
  },

  partDesc: {
    fontFamily: typography.font.body,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 1.5,
  },

  placeholder: {
    fontFamily: typography.font.body,
    fontSize: 13,
    color: colors["muted-soft"],
    fontStyle: "italic",
  },
};
