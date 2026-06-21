import { useNodeStore } from "../store/nodeStore";

export default function ExplodeSlider() {
  const setExplode = useNodeStore((s) => s.setExplode);

  return (
    <div style={bar}>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        onChange={(e) => setExplode(Number(e.target.value))}
      />
    </div>
  );
}

const bar = {
  position: "absolute" as const,
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
};
