"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { LocalizerCanvas } from "@/features/planner/components/LocalizerCanvas";
import { usePlannerState } from "@/features/planner/hooks/usePlannerState";
import { loadImage, readFileAsDataUrl, splitTriptychPanels, triptychOrderToViews } from "@/features/planner/lib/media";
import { VIEW_CONFIG } from "@/features/planner/lib/geometry";
import { BoxRenderMode, ViewId } from "@/features/planner/types/planner";

export const PlannerShell = () => {
  const planner = usePlannerState();
  const [triptychOrder, setTriptychOrder] = useState("sag-cor-ax");
  const [boxRenderMode, setBoxRenderMode] = useState<BoxRenderMode>("flat2d");

  const showTarget = planner.showTarget || planner.showTargetAlways || planner.instructorMode;

  const handleParamChange = (key: string) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    planner.changeParam(key, value);
  };

  const handleViewUpload = async (event: ChangeEvent<HTMLInputElement>, viewId: ViewId) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !planner.caseId) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    if (!image) {
      return;
    }

    planner.setUploadedView(planner.caseId, viewId, dataUrl);
  };

  const handleTriptychUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !planner.caseId) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    if (!image) {
      return;
    }

    const panels = splitTriptychPanels(image);
    const mapping = triptychOrderToViews(triptychOrder);

    await Promise.all(
      mapping.map(async (viewId, index) => {
        planner.setUploadedView(planner.caseId!, viewId, panels[index]);
      })
    );
  };

  const sourceLabel = (viewId: ViewId): string => {
    const source = planner.getImageSource(viewId);
    if (!source) {
      return "No source";
    }
    if (source.startsWith("data:image")) {
      return "Uploaded image";
    }
    return source;
  };

  const calibrationStatus = useMemo(() => {
    if (!planner.caseId || !planner.currentProtocol) {
      return "Calibration: select case and protocol.";
    }
    return planner.calibrationActive
      ? "Calibration: instructor target active for this protocol."
      : "Calibration: default protocol target.";
  }, [planner.calibrationActive, planner.caseId, planner.currentProtocol]);

  return (
    <main className="container">
      <header className="card">
        <h1>MRI Planning Trainer</h1>
        <p>Type-safe Next.js core for MRI planning training and protocol calibration.</p>
      </header>

      {!planner.caseId ? (
        <section className="card">
          <h2>Select Case</h2>
          <div className="row">
            {planner.cases.map((entry) => (
              <button key={entry.id} onClick={() => planner.selectCase(entry.id)}>
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="row spread">
              <div>
                <h2>Plan Scan</h2>
                <p>
                  Case: <strong>{planner.caseConfig?.label}</strong>
                </p>
              </div>
              <button onClick={() => planner.selectCase(planner.caseId!)}>Restart Case</button>
            </div>

            <div className="grid grid-3">
              <label>
                Protocol
                <select
                  value={planner.protocolId ?? ""}
                  onChange={(event) => planner.selectProtocol(event.target.value)}
                >
                  {planner.caseConfig?.protocols.map((protocol) => (
                    <option key={protocol.id} value={protocol.id}>
                      {protocol.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Localizer Set
                <select
                  value={planner.localizerSetId ?? ""}
                  onChange={(event) => planner.selectLocalizerSet(event.target.value)}
                >
                  {planner.caseConfig?.localizerSets.map((set) => (
                    <option key={set.id} value={set.id}>
                      {set.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="inline-check">
                <input
                  type="checkbox"
                  checked={planner.instructorMode}
                  onChange={(event) => planner.setInstructorMode(event.target.checked)}
                />
                Instructor mode
              </label>
            </div>
          </section>

          <section className="card">
            <h3>Parameters</h3>
            <div className="grid grid-3">
              {(planner.currentProtocol?.parameterSpecs ?? []).map((item) => {
                const key = String(item.key);
                const label = item.unit ? `${item.label} (${item.unit})` : item.label;
                return (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={planner.params?.[key] ?? ""}
                    onChange={handleParamChange(key)}
                  />
                </label>
                );
              })}
            </div>
          </section>

          <section className="card">
            <h3>Coverage + Angulation</h3>
            <div className="grid grid-3">
              <label>
                Coverage X
                <input
                  type="range"
                  min="0.2"
                  max="1.8"
                  step="0.01"
                  value={planner.box?.size.x ?? 0.2}
                  onChange={(event) => planner.changeSize("x", Number(event.target.value))}
                />
              </label>
              <label>
                Coverage Y
                <input
                  type="range"
                  min="0.2"
                  max="1.8"
                  step="0.01"
                  value={planner.box?.size.y ?? 0.2}
                  onChange={(event) => planner.changeSize("y", Number(event.target.value))}
                />
              </label>
              <label>
                Coverage Z
                <input
                  type="range"
                  min="0.2"
                  max="1.8"
                  step="0.01"
                  value={planner.box?.size.z ?? 0.2}
                  onChange={(event) => planner.changeSize("z", Number(event.target.value))}
                />
              </label>
              <label>
                Axial Tilt
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={planner.box?.rotation.rz ?? 0}
                  onChange={(event) => planner.changeRotation("rz", Number(event.target.value))}
                />
              </label>
              <label>
                Sagittal Tilt
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={planner.box?.rotation.rx ?? 0}
                  onChange={(event) => planner.changeRotation("rx", Number(event.target.value))}
                />
              </label>
              <label>
                Coronal Tilt
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={planner.box?.rotation.ry ?? 0}
                  onChange={(event) => planner.changeRotation("ry", Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <section className="card">
            <h3>Localizer Images</h3>
            <div className="grid grid-3">
              <label>
                Axial image
                <input type="file" accept="image/*" onChange={(event) => handleViewUpload(event, "axial")} />
                <small>{sourceLabel("axial")}</small>
              </label>
              <label>
                Sagittal image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleViewUpload(event, "sagittal")}
                />
                <small>{sourceLabel("sagittal")}</small>
              </label>
              <label>
                Coronal image
                <input type="file" accept="image/*" onChange={(event) => handleViewUpload(event, "coronal")} />
                <small>{sourceLabel("coronal")}</small>
              </label>
              <label>
                3-panel screenshot
                <input type="file" accept="image/*" onChange={handleTriptychUpload} />
              </label>
              <label>
                Panel order
                <select value={triptychOrder} onChange={(event) => setTriptychOrder(event.target.value)}>
                  <option value="sag-cor-ax">Sagittal | Coronal | Axial</option>
                  <option value="ax-cor-sag">Axial | Coronal | Sagittal</option>
                  <option value="cor-sag-ax">Coronal | Sagittal | Axial</option>
                </select>
              </label>
            </div>
            <div className="row">
              <button onClick={() => planner.clearCaseUploads()}>Clear Uploaded Images</button>
            </div>
          </section>

          <section className="card">
            <h3>Instructor Calibration</h3>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={planner.showTargetAlways}
                onChange={(event) => planner.setShowTargetAlways(event.target.checked)}
              />
              Always show target overlay
            </label>
            <p>{calibrationStatus}</p>
            <div className="row">
              <button onClick={planner.setCalibrationForCurrent} disabled={!planner.instructorMode}>
                Save Current As Target
              </button>
              <button onClick={planner.resetCalibrationForCurrent} disabled={!planner.instructorMode}>
                Reset Protocol Target
              </button>
              <button onClick={planner.exportLastScore} disabled={!planner.lastScore}>
                Export Last Score JSON
              </button>
            </div>
          </section>

          <section className="card">
            <h3>3 Localizer Views</h3>
            <p>Drag in axial and sagittal. Coronal is derived from shared 3D prescription.</p>
            <div className="row">
              <label>
                Box View
                <select
                  value={boxRenderMode}
                  onChange={(event) => setBoxRenderMode(event.target.value as BoxRenderMode)}
                >
                  <option value="cube3d">3D Cube Wireframe</option>
                  <option value="flat2d">Flat 2D Box</option>
                </select>
              </label>
            </div>
            <div className="grid grid-3">
              {(["axial", "sagittal", "coronal"] as ViewId[]).map((viewId) => (
                <figure key={viewId}>
                  <figcaption>
                    {viewId[0].toUpperCase() + viewId.slice(1)} {VIEW_CONFIG[viewId].editable ? "(editable)" : "(derived)"}
                  </figcaption>
                  <LocalizerCanvas
                    viewId={viewId}
                    boxRenderMode={boxRenderMode}
                    imageSrc={planner.getImageSource(viewId)}
                    box={planner.box}
                    targetBox={planner.currentProtocol?.target ?? null}
                    showTarget={showTarget}
                    editable={VIEW_CONFIG[viewId].editable}
                    onBeginDrag={planner.beginDrag}
                    onMoveDrag={planner.moveDrag}
                    onEndDrag={planner.endDrag}
                  />
                </figure>
              ))}
            </div>
          </section>

          <section className="card row">
            <button onClick={planner.checkPlanning}>Check Planning</button>
            <button onClick={planner.resetPlan}>Reset</button>
          </section>

          <section className="card">
            <h3>Feedback</h3>
            <p className={planner.statusKind === "warn" ? "warn" : ""}>{planner.statusMessage}</p>
            {planner.lastScore && (
              <div>
                <p>
                  Position: {planner.lastScore.componentScores.positionPercent}% | Coverage: {" "}
                  {planner.lastScore.componentScores.coveragePercent}% | Angulation: {" "}
                  {planner.lastScore.componentScores.angulationPercent}% | Params: {" "}
                  {planner.lastScore.componentScores.parametersPercent}%
                </p>
                <p>
                  Matched target: {planner.lastScore.matchedTargetKind} ({planner.lastScore.matchedTargetIndex})
                </p>
                <p>
                  Target params:{" "}
                  {(planner.currentProtocol?.parameterSpecs ?? [])
                    .map((spec) => `${spec.label} ${planner.lastScore?.target.params[String(spec.key)] ?? "n/a"}`)
                    .join(", ")}
                </p>
                <p>Feedback: {planner.lastScore.feedback.join(" | ")}</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};
