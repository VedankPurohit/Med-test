"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { LocalizerCanvas } from "@/features/planner/components/LocalizerCanvas";
import { VIEW_CONFIG } from "@/features/planner/lib/geometry";
import { BoxRenderMode, ViewId } from "@/features/planner/types/planner";
import { useContributionSession } from "@/features/contribution/hooks/useContributionSession";
import { EXISTING_PROTOCOL_CATALOG, cloneProtocolEntry } from "@/features/contribution/lib/catalog";
import { buildContributionZipBlob, downloadBlob } from "@/features/contribution/lib/export";
import { buildContributionManifest, slugifyId } from "@/features/contribution/lib/manifest";
import { readFileAsBytes, readFileAsDataUrl } from "@/features/contribution/lib/media";
import { validateContributionDraft } from "@/features/contribution/lib/validation";
import {
  CONTRIBUTION_ANATOMY_TYPES,
  ContributionAnatomyType,
  ContributionProtocolEntry,
  ValidationIssue,
  emptyViews
} from "@/features/contribution/types";

const VIEW_IDS: ViewId[] = ["axial", "sagittal", "coronal"];
const SOURCE_APP_VERSION = "0.1.0";

const makeSpecKey = (key: string): string => key.trim().replace(/\s+/g, "");

export default function ContributionStudioPage() {
  const [anatomyType, setAnatomyType] = useState<ContributionAnatomyType>("brain");
  const [customTypeText, setCustomTypeText] = useState("");
  const [views, setViews] = useState(emptyViews);
  const [selectedProtocols, setSelectedProtocols] = useState<ContributionProtocolEntry[]>([]);
  const [catalogSelection, setCatalogSelection] = useState(EXISTING_PROTOCOL_CATALOG[0]?.key ?? "");
  const [statusMessage, setStatusMessage] = useState("Fill required data, place all protocols, then export ZIP.");
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

  useEffect(() => {
    session.ensureProtocols(selectedProtocols);
  }, [selectedProtocols, session.ensureProtocols]);

  const selectedProtocolIds = useMemo(() => new Set(selectedProtocols.map((protocol) => protocol.id)), [selectedProtocols]);

  const handleUploadView = async (event: ChangeEvent<HTMLInputElement>, viewId: ViewId) => {
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
    setStatusMessage(`${viewId} image uploaded.`);
  };

  const addExistingProtocol = () => {
    const entry = EXISTING_PROTOCOL_CATALOG.find((item) => item.key === catalogSelection);
    if (!entry) {
      return;
    }

    if (selectedProtocolIds.has(entry.protocol.id)) {
      setStatusKind("warn");
      setStatusMessage(`Protocol '${entry.protocol.label}' is already selected.`);
      return;
    }

    setSelectedProtocols((current) => [...current, cloneProtocolEntry(entry.protocol)]);
    session.setProtocolActive(entry.protocol.id);
    setStatusKind("info");
    setStatusMessage(`Added existing protocol '${entry.protocol.label}'.`);
  };

  const removeProtocol = (protocolId: string) => {
    setSelectedProtocols((current) => current.filter((protocol) => protocol.id !== protocolId));
    setStatusKind("info");
    setStatusMessage(`Removed protocol '${protocolId}'.`);
  };

  const addCustomSpec = () => {
    const key = makeSpecKey(specKey);
    const label = specLabel.trim();
    const min = Number(specMin);
    const max = Number(specMax);
    const step = Number(specStep);

    if (!key || !label || !Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) {
      setStatusKind("warn");
      setStatusMessage("Custom parameter spec values are invalid.");
      return;
    }

    if (customSpecs.some((spec) => String(spec.key) === key)) {
      setStatusKind("warn");
      setStatusMessage(`Parameter key '${key}' already exists for this custom protocol.`);
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

    setSpecKey("TR");
    setSpecLabel("TR");
    setSpecUnit("ms");
    setSpecMin("0");
    setSpecMax("10000");
    setSpecStep("1");
    setSpecInteger(false);

    setStatusKind("info");
    setStatusMessage(`Added custom parameter spec '${key}'.`);
  };

  const addCustomProtocol = () => {
    const label = customProtocolLabel.trim();
    const id = (customProtocolId.trim() || slugifyId(label)).toLowerCase();

    if (!label || !id) {
      setStatusKind("warn");
      setStatusMessage("Custom protocol must include id/label.");
      return;
    }

    if (customSpecs.length === 0) {
      setStatusKind("warn");
      setStatusMessage("Add at least one parameter spec for custom protocol.");
      return;
    }

    if (selectedProtocolIds.has(id)) {
      setStatusKind("warn");
      setStatusMessage(`Protocol id '${id}' already exists.`);
      return;
    }

    const parameterValues = Object.fromEntries(
      customSpecs.map((spec) => {
        const key = String(spec.key);
        const fallback = spec.min ?? 0;
        return [key, fallback];
      })
    );

    const next: ContributionProtocolEntry = {
      id,
      label,
      origin: "custom",
      notes: customProtocolNotes.trim() || undefined,
      parameterSpecs: customSpecs,
      parameterValues
    };

    setSelectedProtocols((current) => [...current, next]);
    session.setProtocolActive(next.id);

    setCustomProtocolLabel("");
    setCustomProtocolId("");
    setCustomProtocolNotes("");
    setCustomSpecs([]);

    setStatusKind("info");
    setStatusMessage(`Added custom protocol '${label}'.`);
  };

  const setActiveProtocol = (protocolId: string) => {
    session.setProtocolActive(protocolId);
  };

  const setBoxRenderMode = (mode: BoxRenderMode) => {
    session.setBoxRenderMode(mode);
  };

  const onParamInput = (key: string, value: string) => {
    session.changeParam(key, Number(value));
  };

  const exportZip = async () => {
    const protocolsForDraft = selectedProtocols.map((protocol) => ({
      ...protocol,
      parameterValues: { ...(session.placements[protocol.id]?.params ?? protocol.parameterValues) }
    }));

    const draft = {
      createdAt: new Date().toISOString(),
      anatomy: {
        primaryType: anatomyType,
        customTypeText: customTypeText.trim() || undefined
      },
      views,
      protocols: protocolsForDraft,
      placements: session.placements
    };

    const validationIssues = validateContributionDraft(draft);
    setIssues(validationIssues);

    if (validationIssues.length > 0) {
      setStatusKind("warn");
      setStatusMessage(`Validation failed: ${validationIssues.length} issue(s) found.`);
      return;
    }

    try {
      const manifest = buildContributionManifest(draft, { sourceAppVersion: SOURCE_APP_VERSION });
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
      setStatusMessage(error instanceof Error ? error.message : "Failed to export ZIP.");
    }
  };

  const activePlacement = session.activePlacement;

  return (
    <main className="planner-legacy">
      <div className="container">
        <section className="card">
          <h1>Create New Dataset Entry</h1>
          <p>Upload localizers, choose anatomy/protocols, place boxes per protocol, then export one ZIP package.</p>
        </section>

        <section className="card">
          <h2>1) Anatomy Type</h2>
          <div className="grid grid-3">
            <label>
              Anatomy type
              <select value={anatomyType} onChange={(event) => setAnatomyType(event.target.value as ContributionAnatomyType)}>
                {CONTRIBUTION_ANATOMY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Custom type text (for other)
              <input
                type="text"
                value={customTypeText}
                onChange={(event) => setCustomTypeText(event.target.value)}
                placeholder="e.g. ankle"
              />
            </label>
          </div>
        </section>

        <section className="card">
          <h2>2) Upload Required Views</h2>
          <div className="grid grid-3">
            {VIEW_IDS.map((viewId) => (
              <label key={viewId}>
                {viewId} image
                <input type="file" accept="image/*" onChange={(event) => void handleUploadView(event, viewId)} />
                <small>{views[viewId]?.fileName ?? "No file selected"}</small>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>3) Protocol Selection</h2>
          <div className="grid grid-3">
            <label>
              Add existing protocol
              <select value={catalogSelection} onChange={(event) => setCatalogSelection(event.target.value)}>
                {EXISTING_PROTOCOL_CATALOG.map((entry) => (
                  <option key={entry.key} value={entry.key}>
                    {entry.caseLabel} / {entry.protocolLabel}
                  </option>
                ))}
              </select>
            </label>
            <div className="row">
              <button type="button" onClick={addExistingProtocol}>Add Existing</button>
            </div>
          </div>

          <h3>Add Custom Protocol</h3>
          <div className="grid grid-3">
            <label>
              Protocol label
              <input value={customProtocolLabel} onChange={(event) => setCustomProtocolLabel(event.target.value)} />
            </label>
            <label>
              Protocol id (optional)
              <input value={customProtocolId} onChange={(event) => setCustomProtocolId(event.target.value)} placeholder="auto from label if empty" />
            </label>
            <label>
              Notes
              <input value={customProtocolNotes} onChange={(event) => setCustomProtocolNotes(event.target.value)} />
            </label>
          </div>

          <div className="grid grid-3">
            <label>
              Param key
              <input value={specKey} onChange={(event) => setSpecKey(event.target.value)} />
            </label>
            <label>
              Param label
              <input value={specLabel} onChange={(event) => setSpecLabel(event.target.value)} />
            </label>
            <label>
              Unit
              <input value={specUnit} onChange={(event) => setSpecUnit(event.target.value)} />
            </label>
            <label>
              Min
              <input type="number" value={specMin} onChange={(event) => setSpecMin(event.target.value)} />
            </label>
            <label>
              Max
              <input type="number" value={specMax} onChange={(event) => setSpecMax(event.target.value)} />
            </label>
            <label>
              Step
              <input type="number" value={specStep} onChange={(event) => setSpecStep(event.target.value)} />
            </label>
            <label className="inline-check">
              <input type="checkbox" checked={specInteger} onChange={(event) => setSpecInteger(event.target.checked)} />
              Integer value
            </label>
          </div>

          <div className="row">
            <button type="button" onClick={addCustomSpec}>Add Parameter Spec</button>
            <button type="button" onClick={addCustomProtocol}>Add Custom Protocol</button>
          </div>

          {customSpecs.length > 0 && (
            <p>
              Custom specs: {customSpecs.map((spec) => `${spec.label}(${String(spec.key)})`).join(", ")}
            </p>
          )}

          <h3>Selected Protocols ({selectedProtocols.length})</h3>
          <div className="row" style={{ flexWrap: "wrap" }}>
            {selectedProtocols.map((protocol) => (
              <div key={protocol.id} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: 8, minWidth: 220 }}>
                <strong>{protocol.label}</strong>
                <p><small>{protocol.id} • {protocol.origin}</small></p>
                <div className="row">
                  <button type="button" onClick={() => setActiveProtocol(protocol.id)}>Edit Placement</button>
                  <button type="button" onClick={() => removeProtocol(protocol.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>4) Per-Protocol Placement</h2>
          {!activePlacement || !session.activeProtocol ? (
            <p>Select/add a protocol to start placement.</p>
          ) : (
            <>
              <div className="grid grid-3">
                <label>
                  Active protocol
                  <select value={session.activeProtocol.id} onChange={(event) => setActiveProtocol(event.target.value)}>
                    {selectedProtocols.map((protocol) => (
                      <option key={protocol.id} value={protocol.id}>{protocol.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Box mode
                  <select value={activePlacement.boxRenderMode} onChange={(event) => setBoxRenderMode(event.target.value as BoxRenderMode)}>
                    <option value="flat2d">Flat 2D</option>
                    <option value="cube3d">3D Cube Wireframe</option>
                  </select>
                </label>
              </div>

              <h3>Protocol Parameters</h3>
              <div className="grid grid-3">
                {session.activeProtocol.parameterSpecs.map((spec) => {
                  const key = String(spec.key);
                  return (
                    <label key={key}>
                      {spec.unit ? `${spec.label} (${spec.unit})` : spec.label}
                      <input
                        type="number"
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={activePlacement.params[key] ?? ""}
                        onChange={(event) => onParamInput(key, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>

              <p>Drag in axial and sagittal views. Coronal remains derived from shared 3D box.</p>
              <div className="grid grid-3">
                {VIEW_IDS.map((viewId) => (
                  <figure key={viewId}>
                    <figcaption>
                      {viewId[0].toUpperCase() + viewId.slice(1)} {VIEW_CONFIG[viewId].editable ? "(editable)" : "(derived)"}
                    </figcaption>
                    <LocalizerCanvas
                      viewId={viewId}
                      boxRenderMode={activePlacement.boxRenderMode}
                      imageSrc={views[viewId]?.dataUrl ?? ""}
                      box={activePlacement.box}
                      targetBox={null}
                      showTarget={false}
                      editable={VIEW_CONFIG[viewId].editable}
                      onBeginDrag={(view, point) => session.beginDrag(view, point)}
                      onMoveDrag={session.moveDrag}
                      onEndDrag={session.endDrag}
                      onHitTest={(view, point) => session.hitTest(view, point)}
                    />
                  </figure>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <h2>5) Validate and Export</h2>
          <div className="row">
            <button type="button" onClick={exportZip}>Export ZIP</button>
          </div>
          <p className={statusKind === "warn" ? "warn" : ""}>{statusMessage}</p>
          {issues.length > 0 && (
            <div>
              <h3>Validation Issues</h3>
              <ul>
                {issues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    [{issue.code}] {issue.field}: {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
