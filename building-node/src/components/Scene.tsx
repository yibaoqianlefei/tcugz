import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function Scene() {
  return (
    <>
      {/* ── Top Right Tools ── */}
      <div style={topRight}>
        <button style={styles.button}>贡献节点</button>
        <button style={styles.button}>关于项目</button>
      </div>

      {/* ── Bottom Right Controls ── */}
      <div style={bottomRight}>
        <button style={styles.button}>自动旋转</button>
        <button style={styles.button}>场景切换</button>
      </div>

      {/* ── 3D Canvas ── */}
      <Canvas camera={{ position: [3, 2, 5] }}>
        <ambientLight intensity={0.7} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
        <OrbitControls autoRotate />
      </Canvas>
    </>
  );
}

const styles = {
  button: {
    padding: "8px 16px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.85)",
    color: "#2B2B2B",
    fontSize: 12,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },
} as const;

const topRight = {
  position: "absolute" as const,
  right: 20,
  top: 20,
  display: "flex",
  gap: 8,
  zIndex: 10,
};

const bottomRight = {
  position: "absolute" as const,
  right: 20,
  bottom: 20,
  display: "flex",
  gap: 8,
  zIndex: 10,
};
