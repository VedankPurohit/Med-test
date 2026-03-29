"use client";

import { useCallback } from "react";
import { useWorkstationStore } from "@/features/workstation/stores/useWorkstationStore";
import { useGuidanceStore } from "@/features/guidance/stores/useGuidanceStore";

export default function NotesPanel() {
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const notes = useGuidanceStore((s) => s.protocolNotes);
  const setNote = useGuidanceStore((s) => s.setProtocolNote);

  const activeProtocol =
    activeIndex !== null ? protocols[activeIndex] : null;
  const activeKey = activeProtocol?.protocolId ?? "";
  const currentNote = notes[activeKey] ?? "";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!activeKey) return;
      setNote(activeKey, e.target.value);
    },
    [activeKey, setNote]
  );

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--chrome-surface)",
        padding: 8,
      }}
    >
      <div
        style={{
          fontSize: 8,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 4,
        }}
      >
        {activeProtocol ? `Notes — ${activeProtocol.shortName}` : "Notes"}
      </div>
      <textarea
        value={currentNote}
        onChange={handleChange}
        placeholder={
          activeProtocol
            ? "Add notes for this sequence..."
            : "Select a sequence to add notes"
        }
        disabled={!activeProtocol}
        style={{
          flex: 1,
          resize: "none",
          background: "var(--input-bg)",
          border: "1px solid var(--input-border)",
          borderRadius: 3,
          padding: 6,
          fontSize: 9,
          fontFamily: "inherit",
          color: "var(--text-primary)",
          outline: "none",
        }}
      />
    </div>
  );
}
