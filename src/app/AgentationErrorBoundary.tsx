"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type AgentationErrorBoundaryProps = {
  children: ReactNode;
};

type AgentationErrorBoundaryState = {
  hasError: boolean;
};

export default class AgentationErrorBoundary extends Component<
  AgentationErrorBoundaryProps,
  AgentationErrorBoundaryState
> {
  state: AgentationErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AgentationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("agentation.enabled", "0");
    }
    // Keep the workstation usable even if Agentation crashes.
    console.error("Agentation disabled after runtime error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
