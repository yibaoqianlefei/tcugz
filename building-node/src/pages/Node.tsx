import { useNavigate, useParams } from "react-router-dom";
import Viewer3D from "../components/Viewer3D";
import InfoCard from "../components/InfoCard";
import ExplodeSlider from "../components/ExplodeSlider";
import { nodes } from "../data/nodes";

export default function Node() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const nav = useNavigate();
  const node = nodes.find((n) => n.id === nodeId);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* ── Back button ── */}
      <button onClick={() => nav("/learn")} style={styles.back}>
        ← 返回节点列表
      </button>

      {/* ── Node title ── */}
      <div style={styles.nodeTitle}>
        {node?.name ?? "未知节点"}
      </div>

      {/* ── 3D Viewer ── */}
      <Viewer3D />

      {/* ── Info overlay ── */}
      <InfoCard />
      <ExplodeSlider />
    </div>
  );
}

const styles = {
  back: {
    position: "absolute" as const,
    left: 20,
    top: 20,
    zIndex: 10,
    background: "rgba(255,255,255,0.9)",
    border: "none",
    color: "#FF6B5A",
    fontSize: 13,
    cursor: "pointer",
    padding: "8px 14px",
    borderRadius: 6,
    backdropFilter: "blur(8px)",
  },
  nodeTitle: {
    position: "absolute" as const,
    left: 20,
    bottom: 20,
    zIndex: 10,
    fontFamily: "serif",
    fontSize: 20,
    color: "#2B2B2B",
    background: "rgba(255,255,255,0.9)",
    padding: "8px 16px",
    borderRadius: 6,
    backdropFilter: "blur(8px)",
  },
};
