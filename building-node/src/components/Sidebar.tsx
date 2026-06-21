import { motion as fm } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { menu } from "../data/menu";
import { colors, spacing, radius, typography } from "../data/tokens";
import Title from "./Title";

export default function Sidebar() {
  const nav = useNavigate();

  return (
    <nav style={s.container}>
      {/* ── Brand Title ── */}
      <Title />

      {/* ── Menu Groups ── */}
      {menu.map((group, gi) => (
        <div key={gi} style={{ marginTop: spacing.lg }}>
          {/* Section label */}
          <div style={s.groupLabel}>── {group.title} ──</div>

          {group.items.map((item, i) => {
            const isDisabled = item.disabled;

            return (
              <fm.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={isDisabled ? {} : { y: -1, backgroundColor: "rgba(255,107,90,0.06)" }}
                whileTap={isDisabled ? {} : { scale: 0.98 }}
                onClick={() => {
                  if (!isDisabled && item.path) nav(item.path);
                }}
                style={{
                  ...s.menuItem,
                  opacity: isDisabled ? 0.4 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  color: colors.ink,
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={s.menuLabel}>{item.label}</span>
                {isDisabled && <span style={s.badge}>即将上线</span>}
              </fm.div>
            );
          })}
        </div>
      ))}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── User Panel ── */}
      <div style={s.userPanel}>
        <div style={s.avatar}>U</div>
        <div>
          <div style={{ fontFamily: typography.font.body, fontWeight: 500, fontSize: 13, color: colors.ink }}>
            学生用户
          </div>
          <div style={{ fontFamily: typography.font.body, fontSize: 11, color: colors["muted-soft"] }}>
            建筑学 · 大三
          </div>
        </div>
      </div>

      {/* ── Footer Slogan ── */}
      <div style={s.footer}>
        理解构造 · 掌握建筑 —— 从节点到体系
      </div>
    </nav>
  );
}

// ── Styles (token-driven) ─────────────────────────────────────
const s = {
  container: {
    width: 384,
    minWidth: 384,
    height: "100vh",
    padding: spacing.lg,
    background: colors.canvas,
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
    overflowY: "auto" as const,
  },

  groupLabel: {
    ...typography.scale.caption,
    color: colors["muted-soft"],
    marginBottom: spacing.xs,
  },

  menuItem: {
    padding: `${spacing.sm}px ${spacing.sm}px`,
    borderRadius: radius.md,
    display: "flex",
    alignItems: "center",
    position: "relative" as const,
    transition: "background-color 0.2s ease",
    ...typography.scale.nav,
  },

  menuLabel: {
    marginLeft: spacing.xs,
  },

  badge: {
    ...typography.scale.caption,
    marginLeft: "auto",
    color: colors.primary,
  },

  userPanel: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.sm}px`,
    borderTop: `1px solid ${colors.hairline}`,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: colors.primary,
    color: colors["on-primary"],
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: typography.font.body,
    fontSize: 14,
    fontWeight: 600,
  },

  footer: {
    fontFamily: typography.font.body,
    fontSize: 11,
    color: colors["muted-soft"],
    textAlign: "center" as const,
    paddingTop: spacing.sm,
  },
};
