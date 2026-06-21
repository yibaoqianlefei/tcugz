import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useNodeStore } from "../store/nodeStore";

const parts = [
  { id: "a" },
  { id: "b" },
  { id: "c" },
];

export default function Model() {
  const ref = useRef<any>(null);
  const explode = useNodeStore((s) => s.explode);
  const setSelected = useNodeStore((s) => s.setSelected);
  const selected = useNodeStore((s) => s.selected);

  useFrame(() => {
    if (!ref.current) return;

    ref.current.children.forEach((c: any, i: number) => {
      c.position.x = i * explode * 1.5;
    });
  });

  return (
    <group ref={ref}>
      {parts.map((p, i) => (
        <mesh
          key={p.id}
          position={[i * 1.2, 0, 0]}
          onClick={() => setSelected(p.id)}
        >
          <boxGeometry />
          <meshStandardMaterial
            color={selected === p.id ? "orange" : "skyblue"}
          />
        </mesh>
      ))}
    </group>
  );
}
