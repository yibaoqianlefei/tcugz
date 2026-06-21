import Sidebar from "./Sidebar";
import Scene from "./Scene";

export default function HomeLayout() {
  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      {/* ── Left: Sidebar ── */}
      <Sidebar />

      {/* ── Right: 3D Scene ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <Scene />
      </div>
    </div>
  );
}
