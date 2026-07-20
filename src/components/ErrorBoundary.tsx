import { Component, type ReactNode } from "react";

/* ── Types ──────────────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((options: { error: Error; reset: () => void }) => ReactNode);
  /** When resetKey changes, a captured error is cleared automatically (e.g. route or nodeId change). */
  resetKey?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/* ── Component ──────────────────────────────────────────────── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack ?? "");
    }
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Auto-clear when the identity key changes (route navigation, node switch)
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset(): void {
    this.setState({ error: null });
  }

  render(): ReactNode {
    if (this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({ error: this.state.error, reset: this.reset });
      }
      return this.props.fallback;
    }
    return this.props.children;
  }
}
