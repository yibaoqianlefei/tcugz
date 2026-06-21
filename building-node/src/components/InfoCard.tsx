import { useNodeStore } from "../store/nodeStore";

export default function InfoCard() {
  const selected = useNodeStore((s) => s.selected);

  return (
    <div style={box}>
      <h3>构件信息</h3>
      <p>{selected || "点击构件"}</p>
    </div>
  );
}

const box = {
  position: "absolute" as const,
  right: 20,
  top: 20,
  width: 220,
  padding: 12,
  background: "white",
};
