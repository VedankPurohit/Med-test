"use client";

import { ChangeEvent, type CSSProperties, type ReactNode, useEffect, useMemo, useState } from "react";
import { LocalizerCanvas } from "@/features/planner/components/LocalizerCanvas";
import { VIEW_CONFIG } from "@/features/planner/lib/geometry";
import { BoxRenderMode, HandleId, PlannerBox, ViewId } from "@/features/planner/types/planner";
import { ORIENTATION_LABELS, ViewType } from "@/features/workstation/types/mri";
import { useContributionSession } from "@/features/contribution/hooks/useContributionSession";
import { EXISTING_PROTOCOL_CATALOG, cloneProtocolEntry } from "@/features/contribution/lib/catalog";
import { buildContributionZipBlob, downloadBlob } from "@/features/contribution/lib/export";
import { buildContributionManifest, slugifyId } from "@/features/contribution/lib/manifest";
import { readFileAsBytes, readFileAsDataUrl } from "@/features/contribution/lib/media";
import { validateContributionDraft } from "@/features/contribution/lib/validation";
import { APP_VERSION } from "@/lib/appVersion";
import {
  CONTRIBUTION_ANATOMY_TYPES,
  ContributionAnatomyType,
  ContributionProtocolEntry,
  ValidationIssue,
  emptyViews
} from "@/features/contribution/types";

const VIEWS: ViewType[] = ["sagittal", "coronal", "axial"];

const AXIS_COLORS: Record<string, string> = {
  A: "var(--axis-ap)",
  P: "var(--axis-ap)",
  R: "var(--axis-rl)",
  L: "var(--axis-rl)",
  H: "var(--axis-fh)",
  F: "var(--axis-fh)"
};

const VIEW_LABELS: Record<ViewType, string> = {
  sagittal: "SAGITTAL",
  coronal: "CORONAL",
  axial: "AXIAL"
};

function TopBar({
  selectedCount,
  issueCount,
  statusMessage,
  statusKind,
  canExport,
  onExport
}: {
  selectedCount: number;
  issueCount: number;
  statusMessage: string;
  statusKind: "info" | "warn";
  canExport: boolean;
  onExport: () => void;
}) {
  return (
    <div
      className="flex items-center h-10 px-3 gap-3 shrink-0 select-none"
      style={{ background: "var(--toolbar-gradient)", borderBottom: "1px solid var(--chrome-border)" }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-blue)", boxShadow: "var(--glow-blue)" }} />
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-primary)" }}>
          MedAssist
        </span>
      </div>

      <div className="w-px h-4" style={{ background: "var(--chrome-border)" }} />

      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
        Contribution Studio
      </span>

      <span className="text-[9px] px-2 py-0.5 rounded" style={{ background: "var(--accent-blue-dim)", color: "var(--accent-blue)" }}>
        Protocols {selectedCount}
      </span>

      <span
        className="text-[9px] px-2 py-0.5 rounded"
        style={{
          background: issueCount === 0 ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)",
          color: issueCount === 0 ? "var(--fb-good)" : "var(--fb-bad)"
        }}
      >
        {issueCount === 0 ? "Valid" : `${issueCount} issue${issueCount === 1 ? "" : "s"}`}
      </span>

      <div className="flex-1" />

      <span
        className="text-[9px] max-w-[48ch] truncate"
        style={{ color: statusKind === "warn" ? "var(--fb-bad)" : "var(--text-muted)" }}
        title={statusMessage}
      >
        {statusMessage}
      </span>

      <button
        onClick={onExport}
        disabled={!canExport}
        className="px-3 py-1 rounded text-[9px] font-medium transition-colors"
        style={{
          background: canExport ? "var(--accent-blue)" : "var(--chrome-surface-raised)",
          border: `1px solid ${canExport ? "var(--accent-blue)" : "var(--chrome-border)"}`,
          color: canExport ? "#fff" : "var(--text-muted)",
          cursor: canExport ? "pointer" : "not-allowed",
          boxShadow: canExport ? "var(--glow-blue)" : "none"
        }}
      >
        Export ZIP
      </button>
    </div>
  );
}

function ProtocolSidebar({
  protocols,
  activeProtocolId,
  onActivate,
  onRemove
}: {
  protocols: ContributionProtocolEntry[];
  activeProtocolId: string | null;
  onActivate: (protocolId: string) => void;
  onRemove: (protocolId: string) => void;
}) {
  return (
    <div
      className="flex flex-col h-full select-none"
      style={{ width: 220, background: "var(--sidebar-bg)", borderRight: "1px solid var(--chrome-border)" }}
    >
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: "1px solid var(--chrome-border)" }}>
        <div className="text-[8px] uppercase tracking-[0.2em] mb-1" style={{ color: "var(--text-muted)" }}>
          Selected Protocols
        </div>
        <div className="text-[9px]" style={{ color: "var(--text-secondary)" }}>
          {protocols.length} protocol{protocols.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {protocols.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              No protocols added
            </div>
            <div className="text-[8px] mt-1" style={{ color: "var(--chrome-border-bright)" }}>
              Use Setup panel below
            </div>
          </div>
        ) : (
          protocols.map((protocol) => {
            const isActive = protocol.id === activeProtocolId;
            return (
              <div
                key={protocol.id}
                className="flex items-center gap-2 px-2 py-1.5 group"
                style={{
                  cursor: "pointer",
                  background: isActive ? "var(--sidebar-row-active)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--accent-blue)" : "2px solid transparent"
                }}
                onClick={() => onActivate(protocol.id)}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: isActive ? "var(--accent-blue)" : "var(--text-muted)", boxShadow: isActive ? "var(--glow-blue)" : "none" }}
                />

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] truncate" style={{ color: isActive ? "var(--accent-blue)" : "var(--text-secondary)", fontWeight: isActive ? 500 : 400 }}>
                    {protocol.label}
                  </div>
                  <div className="text-[8px] truncate" style={{ color: "var(--text-muted)" }}>
                    {protocol.id}
                  </div>
                </div>

                <span className="text-[7px] px-1 py-0.5 rounded uppercase tracking-wide" style={{ background: "var(--chrome-surface-raised)", color: "var(--text-muted)" }}>
                  {protocol.origin}
                </span>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(protocol.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-[10px] transition-opacity"
                  style={{ color: "var(--fb-bad)", cursor: "pointer" }}
                >
                  &#x2715;
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CanvasPanel({
  view,
  imageSrc,
  box,
  boxRenderMode,
  onBeginDrag,
  onMoveDrag,
  onEndDrag,
  onHitTest
}: {
  view: ViewType;
  imageSrc: string;
  box: PlannerBox;
  boxRenderMode: BoxRenderMode;
  onBeginDrag: (viewId: ViewId, point: { x: number; y: number }, mode: BoxRenderMode) => boolean;
  onMoveDrag: (viewId: ViewId, point: { x: number; y: number }) => void;
  onEndDrag: () => void;
  onHitTest: (viewId: ViewId, point: { x: number; y: number }, mode: BoxRenderMode) => HandleId | null;
}) {
  const viewId = view as ViewId;
  const labels = ORIENTATION_LABELS[view];

  return (
    <div
      className="relative flex-1 flex flex-col overflow-hidden animate-fade-in"
      style={{ background: "var(--panel-bg)", border: "1px solid var(--panel-border)" }}
    >
      <div
        className="flex items-center gap-2 px-2 py-1 text-[9px] tracking-[0.15em] uppercase shrink-0"
        style={{ background: "var(--chrome-surface)", borderBottom: "1px solid var(--chrome-border)", color: "var(--text-secondary)" }}
      >
        {VIEW_LABELS[view]}
        <span className="text-[7px] ml-auto" style={{ color: VIEW_CONFIG[viewId].editable ? "var(--accent-blue)" : "var(--text-muted)" }}>
          {VIEW_CONFIG[viewId].editable ? "EDITABLE" : "DERIVED"}
        </span>
      </div>

      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        <LocalizerCanvas
          viewId={viewId}
          boxRenderMode={boxRenderMode}
          imageSrc={imageSrc}
          box={box}
          targetBox={null}
          showTarget={false}
          editable={VIEW_CONFIG[viewId].editable}
          onBeginDrag={onBeginDrag}
          onMoveDrag={onMoveDrag}
          onEndDrag={onEndDrag}
          onHitTest={onHitTest}
        />

        {Object.entries(labels).map(([position, label]) => (
          <span
            key={position}
            className="absolute text-[12px] font-bold z-10 pointer-events-none"
            style={{
              color: AXIS_COLORS[label] ?? "var(--text-primary)",
              textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
              ...(position === "top"
                ? { top: 30, left: "50%", transform: "translateX(-50%)" }
                : position === "bottom"
                  ? { bottom: 8, left: "50%", transform: "translateX(-50%)" }
                  : position === "left"
                    ? { left: 8, top: "50%", transform: "translateY(-50%)" }
                    : { right: 8, top: "50%", transform: "translateY(-50%)" })
            }}
          >
            {label}
          </span>
        ))}

        <div className="panel-scanline absolute inset-0 z-10" />
      </div>
    </div>
  );
}

function LabeledControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-[8px] uppercase tracking-[0.16em] mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 30,
  padding: "0 8px",
  borderRadius: 6,
  border: "1px solid var(--input-border)",
  background: "var(--input-bg)",
  color: "var(--text-primary)",
  fontSize: 11
};

const actionBtnStyle: CSSProperties = {
  border: "1px solid rgba(37,99,235,0.28)",
  background: "var(--accent-blue-dim)",
  color: "var(--accent-blue)",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer"
};

const subBtnStyle: CSSProperties = {
  border: "1px solid var(--chrome-border)",
  background: "var(--chrome-surface-raised)",
  color: "var(--text-secondary)",
  borderRadius: 6,
  padding: "6px 10px",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer"
};

const makeSpecKey = (value: string): string => value.trim().replace(/\s+/g, "");

export default function ContributionStudioPage() {
  const [anatomyType, setAnatomyType] = useState<ContributionAnatomyType>("brain");
  const [customTypeText, setCustomTypeText] = useState("");
  const [views, setViews] = useState(emptyViews);
  const [selectedProtocols, setSelectedProtocols] = useState<ContributionProtocolEntry[]>([]);
  const [catalogSelection, setCatalogSelection] = useState(EXISTING_PROTOCOL_CATALOG[0]?.key ?? "");
  const [statusMessage, setStatusMessage] = useState("Complete setup below, then place each protocol and export.");
  const [statusKind, setStatusKind] = useState<"info" | "warn">("info");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  const [customProtocolLabel, setCustomProtocolLabel] = useState("");
  const [customProtocolId, setCustomProtocolId] = useState("");
  const [customProtocolNotes, setCustomProtocolNotes] = useState("");
  const [customSpecs, setCustomSpecs] = useState<ContributionProtocolEntry["parameterSpecs"]>([]);
  const [specKey, setSpecKey] = useState("TR");
  const [specLabel, setSpecLabel] = useState("TR");
  const [specUnit, setSpecUnit] = useState("ms");
  const [specMin, setSpecMin] = useState("0");
  const [specMax, setSpecMax] = useState("10000");
  const [specStep, setSpecStep] = useState("1");
  const [specInteger, setSpecInteger] = useState(false);

  const session = useContributionSession(selectedProtocols);
  const ensureProtocols = session.ensureProtocols;

  useEffect(() => {
    ensureProtocols(selectedProtocols);
  }, [selectedProtocols, ensureProtocols]);

  const selectedProtocolIds = useMemo(() => new Set(selectedProtocols.map((entry) => entry.id)), [selectedProtocols]);

  const draftForValidation = useMemo(() => {
    const protocolsForDraft = selectedProtocols.map((protocol) => ({
      ...protocol,
      parameterValues: { ...(session.placements[protocol.id]?.params ?? protocol.parameterValues) }
    }));

    return {
      createdAt: new Date().toISOString(),
      anatomy: {
        primaryType: anatomyType,
        customTypeText: customTypeText.trim() || undefined
      },
      views,
      protocols: protocolsForDraft,
      placements: session.placements
    };
  }, [anatomyType, customTypeText, selectedProtocols, session.placements, views]);

  useEffect(() => {
    setIssues(validateContributionDraft(draftForValidation));
  }, [draftForValidation]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, viewId: ViewId) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const [dataUrl, bytes] = await Promise.all([readFileAsDataUrl(file), readFileAsBytes(file)]);

    setViews((current) => ({
      ...current,
      [viewId]: {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        dataUrl,
        bytes
      }
    }));

    setStatusKind("info");
    setStatusMessage(`${viewId.toUpperCase()} image uploaded.`);
  };

  const addExistingProtocol = () => {
    const selected = EXISTING_PROTOCOL_CATALOG.find((entry) => entry.key === catalogSelection);
    if (!selected) {
      return;
    }

    if (selectedProtocolIds.has(selected.protocol.id)) {
      setStatusKind("warn");
      setStatusMessage(`Protocol '${selected.protocol.label}' already selected.`);
      return;
    }

    setSelectedProtocols((current) => [...current, cloneProtocolEntry(selected.protocol)]);
    session.setProtocolActive(selected.protocol.id);
    setStatusKind("info");
    setStatusMessage(`Added '${selected.protocol.label}'.`);
  };

  const removeProtocol = (protocolId: string) => {
    setSelectedProtocols((current) => current.filter((entry) => entry.id !== protocolId));
    setStatusKind("info");
    setStatusMessage(`Removed '${protocolId}'.`);
  };

  const addCustomSpec = () => {
    const key = makeSpecKey(specKey);
    const label = specLabel.trim();
    const min = Number(specMin);
    const max = Number(specMax);
    const step = Number(specStep);

    if (!key || !label || !Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) {
      setStatusKind("warn");
      setStatusMessage("Custom parameter spec is invalid.");
      return;
    }

    if (customSpecs.some((entry) => String(entry.key) === key)) {
      setStatusKind("warn");
      setStatusMessage(`Spec key '${key}' already exists.`);
      return;
    }

    setCustomSpecs((current) => [
      ...current,
      {
        key,
        label,
        unit: specUnit.trim() || undefined,
        min,
        max,
        step,
        integer: specInteger
      }
    ]);

    setStatusKind("info");
    setStatusMessage(`Added parameter spec '${key}'.`);
  };

  const addCustomProtocol = () => {
    const label = customProtocolLabel.trim();
    const id = (customProtocolId.trim() || slugifyId(label)).toLowerCase();

    if (!label || !id) {
      setStatusKind("warn");
      setStatusMessage("Custom protocol requires a label.");
      return;
    }

    if (customSpecs.length === 0) {
      setStatusKind("warn");
      setStatusMessage("Add at least one parameter spec first.");
      return;
    }

    if (selectedProtocolIds.has(id)) {
      setStatusKind("warn");
      setStatusMessage(`Protocol id '${id}' already selected.`);
      return;
    }

    const parameterValues = Object.fromEntries(customSpecs.map((entry) => [String(entry.key), entry.min ?? 0]));

    const protocol: ContributionProtocolEntry = {
      id,
      label,
      origin: "custom",
      notes: customProtocolNotes.trim() || undefined,
      parameterSpecs: customSpecs,
      parameterValues
    };

    setSelectedProtocols((current) => [...current, protocol]);
    session.setProtocolActive(protocol.id);

    setCustomProtocolLabel("");
    setCustomProtocolId("");
    setCustomProtocolNotes("");
    setCustomSpecs([]);

    setStatusKind("info");
    setStatusMessage(`Added custom protocol '${label}'.`);
  };

  const exportZip = async () => {
    const validation = validateContributionDraft(draftForValidation);
    setIssues(validation);

    if (validation.length > 0) {
      setStatusKind("warn");
      setStatusMessage(`Validation failed: ${validation.length} issue(s).`);
      return;
    }

    try {
      const manifest = buildContributionManifest(draftForValidation, { sourceAppVersion: APP_VERSION });
      const blob = await buildContributionZipBlob(manifest, {
        axial: views.axial!.bytes,
        sagittal: views.sagittal!.bytes,
        coronal: views.coronal!.bytes
      });

      const fileName = `contribution-${manifest.anatomy.primaryType}-${Date.now()}.zip`;
      downloadBlob(fileName, blob);
      setStatusKind("info");
      setStatusMessage(`ZIP exported: ${fileName}`);
    } catch (error) {
      setStatusKind("warn");
      setStatusMessage(error instanceof Error ? error.message : "Export failed.");
    }
  };

  const activePlacement = session.activePlacement;
  const activeProtocol = session.activeProtocol;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar
        selectedCount={selectedProtocols.length}
        issueCount={issues.length}
        statusMessage={statusMessage}
        statusKind={statusKind}
        canExport={issues.length === 0}
        onExport={() => void exportZip()}
      />

      <div className="flex-1 min-h-0 flex">
        <ProtocolSidebar
          protocols={selectedProtocols}
          activeProtocolId={activeProtocol?.id ?? null}
          onActivate={session.setProtocolActive}
          onRemove={removeProtocol}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <div
            className="flex items-center gap-3 px-2 py-1 shrink-0"
            style={{ background: "var(--chrome-surface)", borderBottom: "1px solid var(--chrome-border)" }}
          >
            <span className="text-[8px] uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
              Placement Workspace
            </span>
            <div className="w-px h-3" style={{ background: "var(--chrome-border)" }} />
            <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>
              {activeProtocol ? activeProtocol.label : "No active protocol"}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => activePlacement && session.setBoxRenderMode(activePlacement.boxRenderMode === "flat2d" ? "cube3d" : "flat2d")}
              disabled={!activePlacement}
              className="px-2 py-1 rounded text-[8px] uppercase tracking-wide"
              style={{
                border: "1px solid var(--chrome-border)",
                background: "var(--chrome-surface-raised)",
                color: "var(--text-secondary)",
                cursor: activePlacement ? "pointer" : "not-allowed",
                opacity: activePlacement ? 1 : 0.5
              }}
            >
              {activePlacement?.boxRenderMode === "cube3d" ? "3D Wire" : "Flat 2D"}
            </button>
          </div>

          <div className="flex-1 min-h-0 flex gap-px p-px" style={{ background: "var(--chrome-border)" }}>
            {activePlacement ? (
              VIEWS.map((view) => (
                <CanvasPanel
                  key={view}
                  view={view}
                  imageSrc={views[view]?.dataUrl ?? ""}
                  box={activePlacement.box}
                  boxRenderMode={activePlacement.boxRenderMode}
                  onBeginDrag={(viewId, point) => session.beginDrag(viewId, point)}
                  onMoveDrag={session.moveDrag}
                  onEndDrag={session.endDrag}
                  onHitTest={(viewId, point) => session.hitTest(viewId, point)}
                />
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ background: "var(--chrome-surface)" }}>
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                    No Protocol Active
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)" }}>
                    Add/select a protocol in the left sidebar.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className="shrink-0"
            style={{ height: 230, borderTop: "1px solid var(--chrome-border)", background: "var(--chrome-surface)" }}
          >
            <div className="h-full grid grid-cols-3 gap-px" style={{ background: "var(--chrome-border)" }}>
              <div className="p-3 overflow-y-auto" style={{ background: "var(--chrome-surface)" }}>
                <div className="text-[8px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
                  Anatomy + Views
                </div>

                <div className="space-y-2">
                  <LabeledControl label="Anatomy Type">
                    <select value={anatomyType} onChange={(event) => setAnatomyType(event.target.value as ContributionAnatomyType)} style={inputStyle}>
                      {CONTRIBUTION_ANATOMY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </LabeledControl>

                  <LabeledControl label="Custom Type Text">
                    <input
                      value={customTypeText}
                      onChange={(event) => setCustomTypeText(event.target.value)}
                      placeholder="e.g. ankle"
                      style={inputStyle}
                    />
                  </LabeledControl>

                  <div className="grid grid-cols-1 gap-1.5">
                    {(["axial", "sagittal", "coronal"] as ViewId[]).map((viewId) => (
                      <label key={viewId} className="block">
                        <div className="text-[8px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--text-muted)" }}>
                          {viewId}
                        </div>
                        <input type="file" accept="image/*" onChange={(event) => void handleUpload(event, viewId)} style={{ ...inputStyle, height: 28 }} />
                        <div className="text-[8px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                          {views[viewId]?.fileName ?? "No file selected"}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 overflow-y-auto" style={{ background: "var(--chrome-surface)" }}>
                <div className="text-[8px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
                  Existing Protocols
                </div>

                <LabeledControl label="Catalog">
                  <select value={catalogSelection} onChange={(event) => setCatalogSelection(event.target.value)} style={inputStyle}>
                    {EXISTING_PROTOCOL_CATALOG.map((entry) => (
                      <option key={entry.key} value={entry.key}>
                        {entry.caseLabel} / {entry.protocolLabel}
                      </option>
                    ))}
                  </select>
                </LabeledControl>

                <div className="mt-2">
                  <button onClick={addExistingProtocol} style={actionBtnStyle}>Add Existing</button>
                </div>

                <div className="h-px my-3" style={{ background: "var(--chrome-border)" }} />

                <div className="text-[8px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
                  Custom Protocol
                </div>

                <div className="space-y-2">
                  <LabeledControl label="Label">
                    <input value={customProtocolLabel} onChange={(event) => setCustomProtocolLabel(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Id (optional)">
                    <input value={customProtocolId} onChange={(event) => setCustomProtocolId(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Notes">
                    <input value={customProtocolNotes} onChange={(event) => setCustomProtocolNotes(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                </div>
              </div>

              <div className="p-3 overflow-y-auto" style={{ background: "var(--chrome-surface)" }}>
                <div className="text-[8px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--text-muted)" }}>
                  Parameter Specs
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <LabeledControl label="Key">
                    <input value={specKey} onChange={(event) => setSpecKey(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Label">
                    <input value={specLabel} onChange={(event) => setSpecLabel(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Unit">
                    <input value={specUnit} onChange={(event) => setSpecUnit(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Min">
                    <input type="number" value={specMin} onChange={(event) => setSpecMin(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Max">
                    <input type="number" value={specMax} onChange={(event) => setSpecMax(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                  <LabeledControl label="Step">
                    <input type="number" value={specStep} onChange={(event) => setSpecStep(event.target.value)} style={inputStyle} />
                  </LabeledControl>
                </div>

                <label className="flex items-center gap-2 mt-2 text-[9px]" style={{ color: "var(--text-secondary)" }}>
                  <input type="checkbox" checked={specInteger} onChange={(event) => setSpecInteger(event.target.checked)} />
                  Integer value
                </label>

                <div className="flex gap-2 mt-2">
                  <button onClick={addCustomSpec} style={subBtnStyle}>Add Spec</button>
                  <button onClick={addCustomProtocol} style={actionBtnStyle}>Add Custom</button>
                </div>

                {customSpecs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {customSpecs.map((spec) => (
                      <span key={String(spec.key)} className="px-2 py-1 rounded text-[8px]" style={{ background: "var(--chrome-surface-raised)", color: "var(--text-secondary)" }}>
                        {spec.label} ({String(spec.key)})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col shrink-0"
          style={{ width: 270, background: "var(--chrome-surface)", borderLeft: "1px solid var(--chrome-border)" }}
        >
          <div className="p-3 border-b" style={{ borderColor: "var(--chrome-border)" }}>
            <div className="text-[8px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>
              Active Protocol Params
            </div>

            {!activeProtocol || !activePlacement ? (
              <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>
                Select a protocol to edit parameters.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {activeProtocol.label}
                </div>
                {activeProtocol.parameterSpecs.map((spec) => {
                  const key = String(spec.key);
                  return (
                    <LabeledControl key={key} label={spec.unit ? `${spec.label} (${spec.unit})` : spec.label}>
                      <input
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={activePlacement.params[key] ?? ""}
                        onChange={(event) => session.changeParam(key, Number(event.target.value))}
                        style={inputStyle}
                      />
                    </LabeledControl>
                  );
                })}

                <div className="pt-1">
                  <div className="text-[8px] uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Coverage
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["x", "y", "z"] as const).map((axis) => (
                      <label key={axis} className="text-[8px] block" style={{ color: "var(--text-muted)" }}>
                        <span className="flex justify-between mb-0.5">
                          <span>{axis.toUpperCase()}</span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {(activePlacement.box.size[axis] ?? 0.5).toFixed(2)}
                          </span>
                        </span>
                        <input
                          type="range"
                          min="0.2"
                          max="1.8"
                          step="0.01"
                          value={activePlacement.box.size[axis] ?? 0.5}
                          onChange={(event) => session.changeSize(axis, Number(event.target.value))}
                          className="w-full"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[8px] uppercase tracking-[0.15em] mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Angulation
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([
                      { axis: "rx" as const, label: "Sag" },
                      { axis: "ry" as const, label: "Cor" },
                      { axis: "rz" as const, label: "Ax" }
                    ]).map(({ axis, label }) => (
                      <label key={axis} className="text-[8px] block" style={{ color: "var(--text-muted)" }}>
                        <span className="flex justify-between mb-0.5">
                          <span>{label}</span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {(activePlacement.box.rotation[axis] ?? 0).toFixed(0)}°
                          </span>
                        </span>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          step="1"
                          value={activePlacement.box.rotation[axis] ?? 0}
                          onChange={(event) => session.changeRotation(axis, Number(event.target.value))}
                          className="w-full"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 p-3 overflow-y-auto">
            <div className="text-[8px] uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>
              Validation
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px]" style={{ color: "var(--text-secondary)" }}>Current status</span>
              <span
                className="text-[9px] px-2 py-0.5 rounded"
                style={{
                  background: issues.length === 0 ? "rgba(63,185,80,0.12)" : "rgba(248,81,73,0.12)",
                  color: issues.length === 0 ? "var(--fb-good)" : "var(--fb-bad)"
                }}
              >
                {issues.length === 0 ? "Ready" : `${issues.length} issue${issues.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {issues.length === 0 ? (
              <div className="text-[9px]" style={{ color: "var(--fb-good)" }}>
                All required data is complete and valid.
              </div>
            ) : (
              <div className="space-y-1">
                {issues.map((issue, index) => (
                  <div key={`${issue.code}-${index}`} className="text-[8px] leading-relaxed px-2 py-1 rounded" style={{ background: "rgba(248,81,73,0.08)", color: "var(--fb-bad)" }}>
                    [{issue.code}] {issue.field}: {issue.message}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex gap-2 flex-wrap">
              <button onClick={() => void exportZip()} disabled={issues.length > 0} style={{ ...actionBtnStyle, opacity: issues.length === 0 ? 1 : 0.45, cursor: issues.length === 0 ? "pointer" : "not-allowed" }}>
                Export ZIP
              </button>

              {activeProtocol && (
                <button onClick={() => session.setProtocolActive(activeProtocol.id)} style={subBtnStyle}>
                  Refresh Active
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
