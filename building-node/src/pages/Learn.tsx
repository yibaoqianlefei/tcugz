import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { nodes } from "../data/nodes";

export default function Learn() {
  const nav = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <button onClick={() => nav("/")} style={styles.back}>
          ← 返回主控制台
        </button>

        <h2 style={styles.title}>学习节点</h2>
        <p style={styles.subtitle}>选择一个建筑构造节点开始学习</p>

        {nodes.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring" }}
            whileHover={{ y: -1, backgroundColor: "rgba(255,107,90,0.08)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nav(`/node/${n.id}`)}
            style={styles.card}
          >
            <div style={styles.cardTitle}>{n.name}</div>
            <div style={styles.cardMeta}>
              {n.parts.length} 个构件 · {n.parts.map((p) => p.name).join(" / ")}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#F6F1E8",
    display: "flex",
    justifyContent: "center",
  },
  inner: {
    width: 600,
    padding: "60px 24px",
  },
  back: {
    background: "none",
    border: "none",
    color: "#FF6B5A",
    fontSize: 13,
    cursor: "pointer",
    padding: 0,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "serif",
    color: "#2B2B2B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#999",
    marginBottom: 32,
  },
  card: {
    padding: "20px 24px",
    margin: "10px 0",
    background: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    border: "1px solid rgba(0,0,0,0.04)",
    color: "#2B2B2B",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: "#999",
  },
};
