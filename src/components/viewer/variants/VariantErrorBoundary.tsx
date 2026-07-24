import { Component, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   VariantErrorBoundary — catches errors inside the variants
   model area only. Does NOT affect normal ModelViewer.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  children: ReactNode;
  nodeId: string;
}

interface State {
  error: Error | null;
}

export class VariantErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error(
        "[VariantErrorBoundary]",
        error,
        info.componentStack ?? "",
      );
    }
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.state.error && prevProps.nodeId !== this.props.nodeId) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f7] gap-2 p-8">
          <p className="text-sm text-muted">多方案模型加载失败</p>
          <p className="text-xs text-muted-soft text-center max-w-md">
            模型资源暂时无法显示，请刷新页面重试
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium
                hover:bg-primary-active transition-colors"
            >
              刷新页面
            </button>
          </div>
          {import.meta.env.DEV && (
            <p className="text-[11px] text-muted-soft mt-3 font-mono max-w-md text-center break-all">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
