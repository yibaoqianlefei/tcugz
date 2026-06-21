import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { colors, radius, spacing, typography } from "../data/tokens";

export default function Scene() {
  return (
    <>
      {/* ── Top Right: Action Buttons ── */}
      <div style={s.topRight}>
        <button style={s.ghostButton}>贡献节点</button>
        <button style={s.primaryButton}>关于项目</button>
      </div>

      {/* ── Bottom Right: Camera Controls ── */}
      <div style={s.bottomRight}>
        <button style={s.ghostButton}>自动旋转</button>
        <button style={s.ghostButton}>场景切换</button>
      </div>

      {/* ── 3D Canvas ── */}
      <Canvas camera={{ position: [3, 2, 5] }}>
        <ambientLight intensity={0.7} />
        <mesh>
          <boxGeometry />
          <meshStandardMaterial color="#bfb9ae" />
        </mesh>
        <OrbitControls autoRotate />
      </Canvas>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  topRight: {
    position: "absolute" as const,
    right: spacing.lg,
    top: spacing.lg,
    display: "flex",
    gap: spacing.xs,
    zIndex: 10,
  },

  bottomRight: {
    position: "absolute" as const,
    right: spacing.lg,
    bottom: spacing.lg,
    display: "flex",
    gap: spacing.xs,
    zIndex: 10,
  },

  // Secondary ghost button (cream on dark context)
  ghostButton: {
    ...typography.scale.button,
    padding: `${spacing.xs}px ${spacing.md}px`,
    borderRadius: radius.md,
    border: `1px solid rgba(250,249,245,0.2)`,
    background: "rgba(250,249,245,0.1)",
    color: colors["on-dark"],
    fontSize: 12,
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    transition: "background 0.2s ease",
  },

  // Primary coral button
  primaryButton: {
    ...typography.scale.button,
    padding: `${spacing.xs}px ${spacing.md}px`,
    borderRadius: radius.md,
    border: "none",
    background: colors.primary,
    color: colors["on-primary"],
    fontSize: 12,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};
