import Sidebar from "./Sidebar";
import Scene from "./Scene";
import { colors } from "../data/tokens";

export default function HomeLayout() {
  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: colors.canvas,
      }}
    >
      {/* ── Left: Sidebar ── */}
      <Sidebar />

      {/* ── Right: 3D Scene ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          background: colors["surface-dark"],
        }}
      >
        <Scene />
      </div>
    </div>
  );
}
