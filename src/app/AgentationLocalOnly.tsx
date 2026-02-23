"use client";

import { useEffect, useState } from "react";
import { Agentation } from "agentation";
import AgentationErrorBoundary from "@/app/AgentationErrorBoundary";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export default function AgentationLocalOnly() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    const isLocalHost = LOCAL_HOSTNAMES.has(window.location.hostname);
    if (!isLocalHost) {
      setEnabled(false);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const enabledByQuery = params.get("agentation") === "1";
    const enabledByStorage = window.localStorage.getItem("agentation.enabled") === "1";
    setEnabled(enabledByQuery || enabledByStorage);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <AgentationErrorBoundary>
      <Agentation />
    </AgentationErrorBoundary>
  );
}
