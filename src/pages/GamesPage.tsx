import { Link } from "react-router-dom";

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center">
      <h1 className="text-3xl font-normal font-serif text-ink tracking-tight mb-3">作业训练</h1>
      <p className="text-muted mb-8">拖拽式构件组装游戏正在建设中</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-sm font-medium
          hover:bg-primary-active transition-colors"
      >
        返回主控制台
      </Link>
    </div>
  );
}
