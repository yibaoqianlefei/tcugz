import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { menu } from "../data/menu";
import Title from "./Title";

export default function Sidebar() {
  const nav = useNavigate();

  return (
    <div style={styles.container}>
      {/* ── Title ── */}
      <Title />

      {/* ── Menu Groups ── */}
      {menu.map((group, gi) => (
        <div key={gi} style={{ marginTop: 24 }}>
          <div style={styles.groupTitle}>
            ── {group.title} ──
          </div>

          {group.items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={item.disabled ? {} : hoverStyle}
              whileTap={item.disabled ? {} : { scale: 0.98 }}
              onClick={() => {
                if (!item.disabled && item.path) nav(item.path);
              }}
              style={{
                ...styles.item,
                opacity: item.disabled ? 0.4 : 1,
                cursor: item.disabled ? "not-allowed" : "pointer",
              }}
            >
              <span>{item.icon}</span>
              <span style={{ marginLeft: 8 }}>{item.label}</span>
              {item.disabled && (
                <span style={styles.badge}>即将上线</span>
              )}
            </motion.div>
          ))}
        </div>
      ))}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── User Panel ── */}
      <div style={styles.userPanel}>
        <div style={styles.avatar}>U</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>学生用户</div>
          <div style={{ fontSize: 11, color: "#999" }}>建筑学 · 大三</div>
        </div>
      </div>

      {/* ── Footer Slogan ── */}
      <div style={styles.footer}>
        理解构造 · 掌握建筑 —— 从节点到体系
      </div>
    </div>
  );
}

const hoverStyle = {
  y: -1,
  backgroundColor: "rgba(255,107,90,0.08)",
};

const styles = {
  container: {
    width: 384,
    minWidth: 384,
    height: "100vh",
    padding: 24,
    background: "#F6F1E8",
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
    overflowY: "auto" as const,
  },
  groupTitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  item: {
    padding: "10px 12px",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    position: "relative" as const,
    color: "#2B2B2B",
    fontSize: 14,
    transition: "background-color 0.2s",
  },
  badge: {
    fontSize: 10,
    marginLeft: "auto",
    color: "#FF6B5A",
  },
  userPanel: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 12px",
    borderTop: "1px solid rgba(0,0,0,0.06)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#FF6B5A",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
  },
  footer: {
    fontSize: 11,
    color: "#bbb",
    textAlign: "center" as const,
    paddingTop: 12,
  },
};
