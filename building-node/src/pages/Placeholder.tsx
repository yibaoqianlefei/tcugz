import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { colors, spacing, radius, typography } from "../data/tokens";

export default function Placeholder({ title = "页面" }: { title?: string }) {
  const nav = useNavigate();

  return (
    <div style={s.page}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={s.card}
      >
        {/* Serif display heading */}
        <h2 style={s.title}>{title}</h2>

        {/* Divider */}
        <div style={s.divider} />

        <p style={s.desc}>此页面正在建设中</p>

        <button
          onClick={() => nav("/")}
          style={s.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors["primary-active"];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
          }}
        >
          返回主控制台
        </button>
      </motion.div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    background: colors.canvas,
  },

  card: {
    background: colors.white,
    borderRadius: radius.lg,
    border: `1px solid ${colors.hairline}`,
    padding: spacing.xl,
    maxWidth: 420,
    width: "90%",
    textAlign: "center" as const,
  },

  title: {
    fontFamily: typography.font.display,
    fontSize: 28,
    fontWeight: 400,
    color: colors.ink,
    marginBottom: spacing.md,
  },

  divider: {
    width: 40,
    height: 2,
    background: colors.primary,
    margin: `0 auto ${spacing.md}px auto`,
  },

  desc: {
    fontFamily: typography.font.body,
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing.lg,
  },

  button: {
    padding: `${spacing.sm}px ${spacing.lg}px`,
    borderRadius: radius.md,
    border: "none",
    background: colors.primary,
    color: colors["on-primary"],
    fontFamily: typography.font.body,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};
