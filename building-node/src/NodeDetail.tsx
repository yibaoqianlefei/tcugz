import { useParams, Link } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { nodesIndex } from "./data/nodesIndex";

/**
 * 3D Node Detail Page — simplified from 02-2.
 * Shows a 3D exploded view of the building construction node.
 * Full layer-by-layer GLB loading will be added when models are available.
 */
export default function NodeDetail() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const node = nodesIndex.find((n) => n.id === nodeId);

  return (
    <div className="w-screen h-screen relative bg-surface-dark">
      {/* Back link */}
      <Link
        to="/library"
        className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg
          bg-white/10 backdrop-blur-md border border-white/15
          text-on-dark text-sm hover:bg-white/20 transition-colors"
      >
        ← 返回节点库
      </Link>

      {/* Node title */}
      <div className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-lg
        bg-white/10 backdrop-blur-md border border-white/15">
        <h2 className="text-on-dark font-serif text-lg tracking-tight">
          {node?.title ?? "未知节点"}
        </h2>
        {node?.description && (
          <p className="text-on-dark-soft text-xs mt-0.5 max-w-md">{node.description}</p>
        )}
      </div>

      {/* Info panel */}
      <div className="absolute top-4 right-4 z-10 w-56 p-4 rounded-xl
        bg-white border border-hairline shadow-[0_2px_8px_rgba(20,20,19,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <h4 className="text-xs font-medium text-muted uppercase tracking-wider">构件信息</h4>
        </div>
        <div className="h-px bg-hairline mb-3" />
        <p className="text-sm text-muted-soft italic">点击 3D 构件查看详情</p>
        <p className="text-xs text-muted-soft mt-2">
          {node?.category ? `分类：${node.category}` : ""}
        </p>
      </div>

      {/* 3D Viewer */}
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} />
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#bfb9ae" />
        </mesh>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
