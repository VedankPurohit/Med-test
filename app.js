const CASES = {
  brain: {
    label: "Brain",
    protocols: {
      brain_ax_t2: {
        label: "Brain Axial T2",
        target: {
          center: { x: 0.02, y: -0.06, z: 0.12 },
          size: { x: 0.95, y: 0.78, z: 0.55 },
          rotation: { rx: -6, ry: 2, rz: 10 },
          params: { TR: 4200, TE: 95, FOV: 220, Slices: 24, SliceThickness: 5, SliceGap: 0.5 },
        },
        initial: {
          center: { x: -0.24, y: 0.17, z: 0.34 },
          size: { x: 0.62, y: 0.56, z: 0.42 },
          rotation: { rx: 8, ry: -5, rz: -8 },
          params: { TR: 3000, TE: 70, FOV: 240, Slices: 18, SliceThickness: 4, SliceGap: 1.2 },
        },
        tolerances: { center: 0.22, size: 0.21, rotation: 16, param: 0.22 },
      },
      brain_cor_flair: {
        label: "Brain Coronal FLAIR",
        target: {
          center: { x: 0.04, y: -0.02, z: 0.06 },
          size: { x: 0.86, y: 0.68, z: 0.75 },
          rotation: { rx: -12, ry: -4, rz: 2 },
          params: { TR: 8500, TE: 110, FOV: 230, Slices: 28, SliceThickness: 4, SliceGap: 0.5 },
        },
        initial: {
          center: { x: -0.15, y: 0.11, z: -0.24 },
          size: { x: 0.66, y: 0.60, z: 0.44 },
          rotation: { rx: 9, ry: 7, rz: 11 },
          params: { TR: 6400, TE: 85, FOV: 250, Slices: 20, SliceThickness: 5, SliceGap: 1.0 },
        },
        tolerances: { center: 0.23, size: 0.20, rotation: 17, param: 0.22 },
      },
    },
  },
  spine: {
    label: "Spine",
    protocols: {
      cspine_sag_t2: {
        label: "C-Spine Sagittal T2",
        target: {
          center: { x: -0.12, y: -0.08, z: 0.0 },
          size: { x: 0.62, y: 1.02, z: 0.58 },
          rotation: { rx: 14, ry: 8, rz: -4 },
          params: { TR: 3000, TE: 105, FOV: 260, Slices: 15, SliceThickness: 3, SliceGap: 0.3 },
        },
        initial: {
          center: { x: 0.2, y: 0.28, z: -0.24 },
          size: { x: 0.44, y: 0.68, z: 0.34 },
          rotation: { rx: -4, ry: -7, rz: 8 },
          params: { TR: 2300, TE: 70, FOV: 300, Slices: 12, SliceThickness: 4, SliceGap: 1.0 },
        },
        tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
      },
      lspine_ax_t2: {
        label: "L-Spine Axial T2",
        target: {
          center: { x: 0.06, y: -0.14, z: -0.18 },
          size: { x: 0.76, y: 0.56, z: 0.44 },
          rotation: { rx: -8, ry: 3, rz: 12 },
          params: { TR: 3500, TE: 100, FOV: 210, Slices: 20, SliceThickness: 4, SliceGap: 0.4 },
        },
        initial: {
          center: { x: -0.22, y: 0.1, z: 0.18 },
          size: { x: 0.48, y: 0.38, z: 0.30 },
          rotation: { rx: 10, ry: -6, rz: -10 },
          params: { TR: 2400, TE: 75, FOV: 260, Slices: 14, SliceThickness: 5, SliceGap: 1.2 },
        },
        tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
      },
    },
  },
};

const VIEW_CONFIG = {
  axial: { axes: ["x", "y"], editable: true, moveAxes: ["x", "y"] },
  sagittal: { axes: ["y", "z"], editable: true, moveAxes: ["y", "z"] },
  coronal: { axes: ["x", "z"], editable: false, moveAxes: ["x", "z"] },
};

const VIEW_IDS = ["axial", "sagittal", "coronal"];
const LOCALIZER_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"];
const LOCAL_STORAGE_KEY = "mriTrainerUploadedLocalizersV1";
const CALIBRATION_STORAGE_KEY = "mriTrainerCalibratedTargetsV1";
const EDGE_INDEXES = [
  [0, 1],
  [0, 2],
  [0, 4],
  [1, 3],
  [1, 5],
  [2, 3],
  [2, 6],
  [3, 7],
  [4, 5],
  [4, 6],
  [5, 7],
  [6, 7],
];

const state = {
  caseId: null,
  protocolId: null,
  box: null,
  params: null,
  drag: null,
  showTarget: false,
  showTargetAlways: false,
  instructorMode: false,
  lastScore: null,
  calibratedTargets: {},
  localizers: {
    brain: {
      axial: { image: null, source: "fallback" },
      sagittal: { image: null, source: "fallback" },
      coronal: { image: null, source: "fallback" },
    },
    spine: {
      axial: { image: null, source: "fallback" },
      sagittal: { image: null, source: "fallback" },
      coronal: { image: null, source: "fallback" },
    },
  },
  uploadedData: {
    brain: { axial: null, sagittal: null, coronal: null },
    spine: { axial: null, sagittal: null, coronal: null },
  },
};

const els = {
  caseStep: document.getElementById("case-step"),
  plannerStep: document.getElementById("planner-step"),
  selectedCaseLabel: document.getElementById("selected-case-label"),
  changeCaseBtn: document.getElementById("change-case-btn"),
  protocolSelect: document.getElementById("protocol-select"),
  paramTR: document.getElementById("param-tr"),
  paramTE: document.getElementById("param-te"),
  paramFOV: document.getElementById("param-fov"),
  paramSlices: document.getElementById("param-slices"),
  paramThickness: document.getElementById("param-thickness"),
  paramGap: document.getElementById("param-gap"),
  sizeX: document.getElementById("size-x"),
  sizeY: document.getElementById("size-y"),
  sizeZ: document.getElementById("size-z"),
  angleAxial: document.getElementById("angle-axial"),
  angleSagittal: document.getElementById("angle-sagittal"),
  angleCoronal: document.getElementById("angle-coronal"),
  uploadAxial: document.getElementById("upload-axial"),
  uploadSagittal: document.getElementById("upload-sagittal"),
  uploadCoronal: document.getElementById("upload-coronal"),
  statusAxial: document.getElementById("status-axial"),
  statusSagittal: document.getElementById("status-sagittal"),
  statusCoronal: document.getElementById("status-coronal"),
  clearCaseImagesBtn: document.getElementById("clear-case-images-btn"),
  instructorMode: document.getElementById("instructor-mode"),
  showTarget: document.getElementById("show-target"),
  saveTargetBtn: document.getElementById("save-target-btn"),
  resetTargetBtn: document.getElementById("reset-target-btn"),
  exportScoreBtn: document.getElementById("export-score-btn"),
  calibrationStatus: document.getElementById("calibration-status"),
  checkBtn: document.getElementById("check-btn"),
  resetBtn: document.getElementById("reset-btn"),
  feedback: document.getElementById("feedback"),
  canvases: {
    axial: document.getElementById("view-axial"),
    sagittal: document.getElementById("view-sagittal"),
    coronal: document.getElementById("view-coronal"),
  },
};

init();

async function init() {
  setupEventListeners();
  loadUploadedLocalizerMap();
  loadCalibratedTargets();
  await hydrateLocalizerImages();
  updateCalibrationStatus();
  renderAll();
}

function setupEventListeners() {
  document.querySelectorAll(".case-btn").forEach((btn) => {
    btn.addEventListener("click", () => selectCase(btn.dataset.case));
  });

  els.changeCaseBtn.addEventListener("click", () => {
    state.caseId = null;
    state.protocolId = null;
    state.box = null;
    state.params = null;
    state.drag = null;
    state.showTarget = false;
    state.showTargetAlways = false;
    els.showTarget.checked = false;
    els.plannerStep.classList.add("hidden");
    els.caseStep.classList.remove("hidden");
    els.feedback.textContent = "Choose case/protocol and start planning.";
    updateUploadStatuses();
    updateCalibrationStatus();
    renderAll();
  });

  els.protocolSelect.addEventListener("change", () => {
    applyProtocol(els.protocolSelect.value);
  });

  els.paramTR.addEventListener("input", () => updateParam("TR", els.paramTR.value));
  els.paramTE.addEventListener("input", () => updateParam("TE", els.paramTE.value));
  els.paramFOV.addEventListener("input", () => updateParam("FOV", els.paramFOV.value));
  els.paramSlices.addEventListener("input", () => updateParam("Slices", els.paramSlices.value));
  els.paramThickness.addEventListener("input", () => updateParam("SliceThickness", els.paramThickness.value));
  els.paramGap.addEventListener("input", () => updateParam("SliceGap", els.paramGap.value));

  els.sizeX.addEventListener("input", () => updateSize("x", els.sizeX.value));
  els.sizeY.addEventListener("input", () => updateSize("y", els.sizeY.value));
  els.sizeZ.addEventListener("input", () => updateSize("z", els.sizeZ.value));

  els.angleAxial.addEventListener("input", () => updateRotation("rz", els.angleAxial.value));
  els.angleSagittal.addEventListener("input", () => updateRotation("rx", els.angleSagittal.value));
  if (els.angleCoronal) {
    els.angleCoronal.addEventListener("input", () => updateRotation("ry", els.angleCoronal.value));
  }

  els.uploadAxial.addEventListener("change", (event) => handleUpload(event, "axial"));
  els.uploadSagittal.addEventListener("change", (event) => handleUpload(event, "sagittal"));
  els.uploadCoronal.addEventListener("change", (event) => handleUpload(event, "coronal"));

  els.clearCaseImagesBtn.addEventListener("click", async () => {
    if (!state.caseId) {
      return;
    }
    VIEW_IDS.forEach((viewId) => {
      state.uploadedData[state.caseId][viewId] = null;
    });
    persistUploadedLocalizerMap();
    await hydrateLocalizerImagesForCase(state.caseId);
    clearUploadInputValues();
    updateUploadStatuses();
    renderAll();
  });

  els.instructorMode.addEventListener("change", () => {
    state.instructorMode = Boolean(els.instructorMode.checked);
    renderAll();
    updateCalibrationStatus();
  });

  els.showTarget.addEventListener("change", () => {
    state.showTargetAlways = Boolean(els.showTarget.checked);
    renderAll();
  });

  els.saveTargetBtn.addEventListener("click", saveCurrentAsTarget);
  els.resetTargetBtn.addEventListener("click", resetProtocolTarget);
  els.exportScoreBtn.addEventListener("click", exportLastScore);

  els.checkBtn.addEventListener("click", checkPlan);
  els.resetBtn.addEventListener("click", () => {
    if (state.protocolId) {
      applyProtocol(state.protocolId);
      els.feedback.textContent = "Reset to protocol starting state.";
      renderAll();
    }
  });

  Object.entries(els.canvases).forEach(([viewId, canvas]) => {
    if (!VIEW_CONFIG[viewId].editable) {
      return;
    }
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (event) => onPointerDown(event, viewId));
    canvas.addEventListener("pointermove", (event) => onPointerMove(event, viewId));
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
  });
}

function selectCase(caseId) {
  state.caseId = caseId;
  state.showTarget = false;
  state.lastScore = null;
  els.caseStep.classList.add("hidden");
  els.plannerStep.classList.remove("hidden");
  els.selectedCaseLabel.textContent = `Case: ${CASES[caseId].label}`;
  els.instructorMode.checked = state.instructorMode;
  els.showTarget.checked = state.showTargetAlways;
  clearUploadInputValues();
  updateUploadStatuses();
  populateProtocols();
  updateCalibrationStatus();
}

function populateProtocols() {
  const protocols = CASES[state.caseId].protocols;
  els.protocolSelect.innerHTML = "";
  Object.entries(protocols).forEach(([protocolId, protocol]) => {
    const option = document.createElement("option");
    option.value = protocolId;
    option.textContent = protocol.label;
    els.protocolSelect.appendChild(option);
  });
  applyProtocol(Object.keys(protocols)[0]);
}

function applyProtocol(protocolId) {
  state.protocolId = protocolId;
  const protocol = getCurrentProtocol();
  state.box = {
    center: { ...protocol.initial.center },
    size: { ...protocol.initial.size },
    rotation: { ...protocol.initial.rotation },
  };
  state.params = { ...protocol.initial.params };
  state.showTarget = false;
  state.lastScore = null;
  syncInputsToState();
  updateCalibrationStatus();
  renderAll();
}

function getDefaultProtocol() {
  if (!state.caseId || !state.protocolId) {
    return null;
  }
  return CASES[state.caseId].protocols[state.protocolId];
}

function getCurrentProtocol() {
  const base = getDefaultProtocol();
  if (!base) {
    return null;
  }
  const key = getProtocolKey(state.caseId, state.protocolId);
  const calibrated = state.calibratedTargets[key];
  if (!calibrated) {
    return base;
  }
  const fallback = base.target;
  return {
    ...base,
    target: {
      center: {
        x: finiteOr(calibrated?.center?.x, fallback.center.x),
        y: finiteOr(calibrated?.center?.y, fallback.center.y),
        z: finiteOr(calibrated?.center?.z, fallback.center.z),
      },
      size: {
        x: finiteOr(calibrated?.size?.x, fallback.size.x),
        y: finiteOr(calibrated?.size?.y, fallback.size.y),
        z: finiteOr(calibrated?.size?.z, fallback.size.z),
      },
      rotation: {
        rx: finiteOr(calibrated?.rotation?.rx, fallback.rotation.rx),
        ry: finiteOr(calibrated?.rotation?.ry, fallback.rotation.ry),
        rz: finiteOr(calibrated?.rotation?.rz, fallback.rotation.rz),
      },
      params: {
        TR: finiteOr(calibrated?.params?.TR, fallback.params.TR),
        TE: finiteOr(calibrated?.params?.TE, fallback.params.TE),
        FOV: finiteOr(calibrated?.params?.FOV, fallback.params.FOV),
        Slices: finiteOr(calibrated?.params?.Slices, fallback.params.Slices),
        SliceThickness: finiteOr(
          calibrated?.params?.SliceThickness,
          fallback.params.SliceThickness
        ),
        SliceGap: finiteOr(calibrated?.params?.SliceGap, fallback.params.SliceGap),
      },
    },
  };
}

function updateParam(key, value) {
  if (!state.params) return;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return;
  state.params[key] = key === "Slices" ? Math.max(1, Math.round(parsed)) : parsed;
}

function updateSize(axis, value) {
  if (!state.box) return;
  state.box.size[axis] = clamp(Number(value), 0.2, 1.8);
  renderAll();
}

function updateRotation(axis, value) {
  if (!state.box) return;
  state.box.rotation[axis] = clamp(Number(value), -45, 45);
  renderAll();
}

function syncInputsToState() {
  if (!state.box || !state.params) return;
  els.paramTR.value = state.params.TR;
  els.paramTE.value = state.params.TE;
  els.paramFOV.value = state.params.FOV;
  els.paramSlices.value = state.params.Slices;
  els.paramThickness.value = state.params.SliceThickness;
  els.paramGap.value = state.params.SliceGap;

  els.sizeX.value = state.box.size.x;
  els.sizeY.value = state.box.size.y;
  els.sizeZ.value = state.box.size.z;

  els.angleAxial.value = state.box.rotation.rz;
  els.angleSagittal.value = state.box.rotation.rx;
  if (els.angleCoronal) {
    els.angleCoronal.value = state.box.rotation.ry;
  }
}

function onPointerDown(event, viewId) {
  if (!state.box) return;

  const canvas = els.canvases[viewId];
  const point = pointerToNorm(event, canvas);
  const geometry = getProjectedBoxGeometry(state.box, viewId);

  if (!geometry) {
    return;
  }

  const hit =
    pointInPolygon(point, geometry.hull) || distance2(point, geometry.center2D) <= 0.02;

  if (!hit) {
    return;
  }

  const [axisA, axisB] = VIEW_CONFIG[viewId].moveAxes;
  state.drag = {
    viewId,
    pointerId: event.pointerId,
    axisA,
    axisB,
    offsetA: point.x - state.box.center[axisA],
    offsetB: point.y - state.box.center[axisB],
  };

  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event, viewId) {
  if (!state.drag || state.drag.viewId !== viewId || !state.box) {
    return;
  }

  const canvas = els.canvases[viewId];
  const point = pointerToNorm(event, canvas);

  state.box.center[state.drag.axisA] = clamp(point.x - state.drag.offsetA, -1, 1);
  state.box.center[state.drag.axisB] = clamp(point.y - state.drag.offsetB, -1, 1);
  renderAll();
}

function onPointerUp() {
  if (!state.drag) return;
  const canvas = els.canvases[state.drag.viewId];
  if (canvas && canvas.hasPointerCapture(state.drag.pointerId)) {
    canvas.releasePointerCapture(state.drag.pointerId);
  }
  state.drag = null;
}

function pointerToNorm(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (event.clientX - rect.left) * scaleX;
  const py = (event.clientY - rect.top) * scaleY;

  return {
    x: (px / canvas.width) * 2 - 1,
    y: (1 - py / canvas.height) * 2 - 1,
  };
}

function renderAll() {
  Object.entries(els.canvases).forEach(([viewId, canvas]) => {
    drawView(canvas, viewId);
  });
}

function drawView(canvas, viewId) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  drawLocalizerBackground(ctx, state.caseId, viewId, w, h);
  drawGrid(ctx, w, h);

  if (!state.box) {
    return;
  }

  if (state.showTarget || state.showTargetAlways || state.instructorMode) {
    const target = getCurrentProtocol().target;
    drawProjectedBox(ctx, target, viewId, {
      lineWidth: 1.5,
      color: "#f4df9d",
      alpha: 0.7,
      dashed: true,
    });
  }

  drawProjectedBox(ctx, state.box, viewId, {
    lineWidth: VIEW_CONFIG[viewId].editable ? 2.8 : 2.0,
    color: VIEW_CONFIG[viewId].editable ? "#57fff1" : "#ffe49d",
    alpha: 1,
    dashed: false,
  });

  if (!VIEW_CONFIG[viewId].editable) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, h - 26, w, 26);
    ctx.fillStyle = "#f4f7fb";
    ctx.font = "12px sans-serif";
    ctx.fillText("Derived from shared 3D prescription", 10, h - 9);
  }
}

function drawProjectedBox(ctx, box, viewId, style) {
  const geometry = getProjectedBoxGeometry(box, viewId);
  if (!geometry) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = style.alpha;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  if (style.dashed) {
    ctx.setLineDash([7, 5]);
  }

  for (const [i, j] of EDGE_INDEXES) {
    const a = geometry.screenPoints[i];
    const b = geometry.screenPoints[j];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  const centerScreen = normToScreen(geometry.center2D, ctx.canvas.width, ctx.canvas.height);
  ctx.beginPath();
  ctx.arc(centerScreen.x, centerScreen.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = style.color;
  ctx.fill();
  ctx.restore();
}

function getProjectedBoxGeometry(box, viewId) {
  const corners = getBoxCorners3D(box);
  const projected = corners.map((point3D) => projectPoint(point3D, viewId));
  const hull = convexHull(projected);

  return {
    projected,
    hull,
    screenPoints: projected.map((p) => normToScreen(p, 320, 320)),
    center2D: projectPoint(box.center, viewId),
  };
}

function getBoxCorners3D(box) {
  const hx = box.size.x / 2;
  const hy = box.size.y / 2;
  const hz = box.size.z / 2;

  const local = [
    [-hx, -hy, -hz],
    [hx, -hy, -hz],
    [-hx, hy, -hz],
    [hx, hy, -hz],
    [-hx, -hy, hz],
    [hx, -hy, hz],
    [-hx, hy, hz],
    [hx, hy, hz],
  ];

  return local.map(([x, y, z]) => {
    const rotated = rotate3D({ x, y, z }, box.rotation);
    return {
      x: rotated.x + box.center.x,
      y: rotated.y + box.center.y,
      z: rotated.z + box.center.z,
    };
  });
}

function rotate3D(point, rotation) {
  const rx = toRad(rotation.rx);
  const ry = toRad(rotation.ry);
  const rz = toRad(rotation.rz);

  let x = point.x;
  let y = point.y;
  let z = point.z;

  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  y = y1;
  z = z1;

  const x2 = x * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z * Math.cos(ry);
  x = x2;
  z = z2;

  const x3 = x * Math.cos(rz) - y * Math.sin(rz);
  const y3 = x * Math.sin(rz) + y * Math.cos(rz);
  x = x3;
  y = y3;

  return { x, y, z };
}

function projectPoint(point, viewId) {
  if (viewId === "axial") {
    return { x: point.x, y: point.y };
  }
  if (viewId === "sagittal") {
    return { x: point.y, y: point.z };
  }
  return { x: point.x, y: point.z };
}

function normToScreen(point, width, height) {
  return {
    x: ((point.x + 1) / 2) * width,
    y: (1 - (point.y + 1) / 2) * height,
  };
}

function drawGrid(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i += 1) {
    const x = (w / 6) * i;
    const y = (h / 6) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLocalizerBackground(ctx, caseId, viewId, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  if (caseId === "spine") {
    g.addColorStop(0, "#111418");
    g.addColorStop(1, "#1e2228");
  } else {
    g.addColorStop(0, "#0f161c");
    g.addColorStop(1, "#1b2733");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  if (!caseId) {
    drawPlaceholderText(ctx, w, h, "Select case");
    return;
  }

  const localizer = state.localizers[caseId]?.[viewId];
  if (localizer?.image) {
    drawImageCover(ctx, localizer.image, w, h);
    return;
  }

  if (caseId === "brain") {
    drawBrainSketch(ctx, viewId, w, h);
  } else {
    drawSpineSketch(ctx, viewId, w, h);
  }
}

function drawImageCover(ctx, image, w, h) {
  const scale = Math.max(w / image.width, h / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.drawImage(image, dx, dy, dw, dh);
  ctx.fillStyle = "rgba(0, 0, 0, 0.10)";
  ctx.fillRect(0, 0, w, h);
}

function drawBrainSketch(ctx, viewId, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#cbd6df";

  if (viewId === "axial") {
    ellipse(ctx, w * 0.5, h * 0.5, w * 0.34, h * 0.27);
    ctx.fill();
    ctx.fillStyle = "#9faebe";
    ellipse(ctx, w * 0.45, h * 0.5, w * 0.08, h * 0.13);
    ctx.fill();
    ellipse(ctx, w * 0.55, h * 0.5, w * 0.08, h * 0.13);
    ctx.fill();
  } else if (viewId === "sagittal") {
    ellipse(ctx, w * 0.52, h * 0.5, w * 0.26, h * 0.34);
    ctx.fill();
    ctx.fillStyle = "#97a6b5";
    ellipse(ctx, w * 0.54, h * 0.55, w * 0.08, h * 0.16);
    ctx.fill();
  } else {
    ellipse(ctx, w * 0.5, h * 0.52, w * 0.31, h * 0.32);
    ctx.fill();
    ctx.fillStyle = "#98a9bc";
    ellipse(ctx, w * 0.5, h * 0.55, w * 0.07, h * 0.12);
    ctx.fill();
  }

  ctx.restore();
}

function drawSpineSketch(ctx, viewId, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#c8d0d8";

  if (viewId === "sagittal") {
    roundedRect(ctx, w * 0.43, h * 0.12, w * 0.14, h * 0.76, 12);
    ctx.fill();
    ctx.fillStyle = "#93a4b2";
    for (let i = 0; i < 7; i += 1) {
      const yy = h * 0.18 + i * h * 0.1;
      roundedRect(ctx, w * 0.4, yy, w * 0.2, h * 0.025, 5);
      ctx.fill();
    }
  } else if (viewId === "coronal") {
    roundedRect(ctx, w * 0.46, h * 0.1, w * 0.08, h * 0.8, 10);
    ctx.fill();
    ctx.fillStyle = "#91a2af";
    for (let i = 0; i < 8; i += 1) {
      const yy = h * 0.16 + i * h * 0.09;
      roundedRect(ctx, w * 0.42, yy, w * 0.16, h * 0.02, 4);
      ctx.fill();
    }
  } else {
    ellipse(ctx, w * 0.5, h * 0.54, w * 0.26, h * 0.18);
    ctx.fill();
    ctx.fillStyle = "#8ca0af";
    ellipse(ctx, w * 0.5, h * 0.54, w * 0.1, h * 0.07);
    ctx.fill();
  }

  ctx.restore();
}

function drawPlaceholderText(ctx, w, h, text) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "16px sans-serif";
  ctx.fillText(text, w * 0.35, h * 0.52);
  ctx.restore();
}

function checkPlan() {
  const protocol = getCurrentProtocol();
  if (!protocol || !state.box || !state.params) {
    return;
  }

  state.showTarget = true;

  const centerErr =
    (Math.abs(state.box.center.x - protocol.target.center.x) +
      Math.abs(state.box.center.y - protocol.target.center.y) +
      Math.abs(state.box.center.z - protocol.target.center.z)) /
    3;

  const sizeErr =
    (Math.abs(state.box.size.x - protocol.target.size.x) +
      Math.abs(state.box.size.y - protocol.target.size.y) +
      Math.abs(state.box.size.z - protocol.target.size.z)) /
    3;

  const rotationErr =
    (angleDiff(state.box.rotation.rx, protocol.target.rotation.rx) +
      angleDiff(state.box.rotation.ry, protocol.target.rotation.ry) +
      angleDiff(state.box.rotation.rz, protocol.target.rotation.rz)) /
    3;

  const paramErrs = {
    TR: relativeDiff(state.params.TR, protocol.target.params.TR),
    TE: relativeDiff(state.params.TE, protocol.target.params.TE),
    FOV: relativeDiff(state.params.FOV, protocol.target.params.FOV),
    Slices: relativeDiff(state.params.Slices, protocol.target.params.Slices),
    SliceThickness: relativeDiff(
      state.params.SliceThickness,
      protocol.target.params.SliceThickness
    ),
    SliceGap: relativeDiff(state.params.SliceGap, protocol.target.params.SliceGap),
  };

  const paramErr =
    (paramErrs.TR +
      paramErrs.TE +
      paramErrs.FOV +
      paramErrs.Slices +
      paramErrs.SliceThickness +
      paramErrs.SliceGap) /
    6;

  const centerScore = scoreFromError(centerErr, protocol.tolerances.center);
  const sizeScore = scoreFromError(sizeErr, protocol.tolerances.size);
  const rotationScore = scoreFromError(rotationErr, protocol.tolerances.rotation);
  const paramScore = scoreFromError(paramErr, protocol.tolerances.param);

  const finalScore =
    centerScore * 0.4 + sizeScore * 0.25 + rotationScore * 0.2 + paramScore * 0.15;

  const finalPct = Math.round(finalScore * 100);
  const pass =
    finalPct >= 75 && centerScore > 0.55 && sizeScore > 0.55 && rotationScore > 0.45;

  state.lastScore = {
    timestamp: new Date().toISOString(),
    caseId: state.caseId,
    protocolId: state.protocolId,
    calibratedTargetUsed: Boolean(
      state.calibratedTargets[getProtocolKey(state.caseId, state.protocolId)]
    ),
    finalScorePercent: finalPct,
    pass,
    componentScores: {
      positionPercent: pct(centerScore),
      coveragePercent: pct(sizeScore),
      angulationPercent: pct(rotationScore),
      parametersPercent: pct(paramScore),
    },
    rawErrors: {
      center: round(centerErr, 4),
      size: round(sizeErr, 4),
      rotationDegreesMean: round(rotationErr, 2),
      paramRelativeMean: round(paramErr, 4),
      perParamRelative: Object.fromEntries(
        Object.entries(paramErrs).map(([k, v]) => [k, round(v, 4)])
      ),
    },
    target: deepClone(protocol.target),
    attempt: {
      box: deepClone(state.box),
      params: deepClone(state.params),
    },
  };

  els.feedback.innerHTML = `
    <div class="score">
      <strong>${pass ? "PASS" : "NOT YET"}</strong> - Overall score: ${finalPct}%
    </div>
    <p>
      Position: ${pct(centerScore)}% | Coverage: ${pct(sizeScore)}% | Angulation: ${pct(rotationScore)}% | Parameters: ${pct(paramScore)}%
    </p>
    <p>
      Target params: TR ${protocol.target.params.TR}, TE ${protocol.target.params.TE}, FOV ${protocol.target.params.FOV}, Slices ${protocol.target.params.Slices}, Thick ${protocol.target.params.SliceThickness}, Gap ${protocol.target.params.SliceGap}
    </p>
    <p>
      Current params: TR ${state.params.TR}, TE ${state.params.TE}, FOV ${state.params.FOV}, Slices ${state.params.Slices}, Thick ${state.params.SliceThickness}, Gap ${state.params.SliceGap}
    </p>
    <p>
      Error summary: position ${round(centerErr, 3)}, coverage ${round(sizeErr, 3)}, angulation ${round(rotationErr, 1)} deg
    </p>
    <p class="${pass ? "" : "warn"}">
      ${
        pass
          ? "Prescription is within acceptable range for this protocol."
          : "Move and angle the box toward the dashed target and tune parameters toward protocol values."
      }
    </p>
  `;

  updateCalibrationStatus();
  renderAll();
}

function saveCurrentAsTarget() {
  if (!state.instructorMode) {
    els.feedback.innerHTML = `<p class="warn">Enable Instructor mode before saving calibration target.</p>`;
    return;
  }
  if (!state.caseId || !state.protocolId || !state.box || !state.params) {
    return;
  }
  const key = getProtocolKey(state.caseId, state.protocolId);
  state.calibratedTargets[key] = {
    center: deepClone(state.box.center),
    size: deepClone(state.box.size),
    rotation: deepClone(state.box.rotation),
    params: deepClone(state.params),
  };
  persistCalibratedTargets();
  updateCalibrationStatus();
  state.showTarget = true;
  renderAll();
  els.feedback.innerHTML = `
    <div class="score"><strong>Calibration Saved</strong> - This protocol now uses your instructor target.</div>
    <p>Case: ${state.caseId}, Protocol: ${state.protocolId}</p>
  `;
}

function resetProtocolTarget() {
  if (!state.instructorMode) {
    els.feedback.innerHTML = `<p class="warn">Enable Instructor mode before resetting calibration target.</p>`;
    return;
  }
  if (!state.caseId || !state.protocolId) {
    return;
  }
  const key = getProtocolKey(state.caseId, state.protocolId);
  if (state.calibratedTargets[key]) {
    delete state.calibratedTargets[key];
    persistCalibratedTargets();
  }
  updateCalibrationStatus();
  renderAll();
  els.feedback.innerHTML = `<p>Calibration reset. Default protocol target is active again.</p>`;
}

function exportLastScore() {
  if (!state.lastScore) {
    els.feedback.innerHTML = `<p class="warn">No score to export yet. Click "Check Planning" first.</p>`;
    return;
  }
  const fileName = `mri-score-${state.caseId}-${state.protocolId}-${Date.now()}.json`;
  downloadJson(fileName, state.lastScore);
}

function scoreFromError(error, tolerance) {
  return clamp(1 - error / tolerance, 0, 1);
}

function angleDiff(a, b) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

function relativeDiff(a, b) {
  return Math.abs(a - b) / Math.max(Math.abs(b), 1);
}

function pct(value) {
  return Math.round(value * 100);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function distance2(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) {
    return false;
  }
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

function convexHull(points) {
  if (!points || points.length < 3) {
    return points || [];
  }

  const sorted = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function getProtocolKey(caseId, protocolId) {
  return `${caseId}:${protocolId}`;
}

function loadCalibratedTargets() {
  const raw = localStorage.getItem(CALIBRATION_STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.calibratedTargets = parsed;
    }
  } catch {
    localStorage.removeItem(CALIBRATION_STORAGE_KEY);
  }
}

function persistCalibratedTargets() {
  localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(state.calibratedTargets));
}

function updateCalibrationStatus() {
  if (!els.calibrationStatus) {
    return;
  }
  const hasProtocol = Boolean(state.caseId && state.protocolId);
  if (els.saveTargetBtn) {
    els.saveTargetBtn.disabled = !state.instructorMode || !hasProtocol;
  }
  if (els.resetTargetBtn) {
    els.resetTargetBtn.disabled = !state.instructorMode || !hasProtocol;
  }
  if (els.exportScoreBtn) {
    els.exportScoreBtn.disabled = !state.lastScore;
  }
  if (!state.caseId || !state.protocolId) {
    els.calibrationStatus.textContent = "Calibration: select a case and protocol.";
    return;
  }
  const key = getProtocolKey(state.caseId, state.protocolId);
  if (state.calibratedTargets[key]) {
    els.calibrationStatus.textContent = "Calibration: instructor target active for this protocol.";
  } else {
    els.calibrationStatus.textContent = "Calibration: default protocol target.";
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finiteOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function clearUploadInputValues() {
  els.uploadAxial.value = "";
  els.uploadSagittal.value = "";
  els.uploadCoronal.value = "";
}

function loadUploadedLocalizerMap() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    ["brain", "spine"].forEach((caseId) => {
      VIEW_IDS.forEach((viewId) => {
        const value = parsed?.[caseId]?.[viewId] || null;
        state.uploadedData[caseId][viewId] = typeof value === "string" ? value : null;
      });
    });
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

function persistUploadedLocalizerMap() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.uploadedData));
}

async function hydrateLocalizerImages() {
  await Promise.all([hydrateLocalizerImagesForCase("brain"), hydrateLocalizerImagesForCase("spine")]);
  updateUploadStatuses();
}

async function hydrateLocalizerImagesForCase(caseId) {
  await Promise.all(
    VIEW_IDS.map(async (viewId) => {
      const uploadedDataUrl = state.uploadedData[caseId][viewId];
      if (uploadedDataUrl) {
        const uploadedImage = await loadImage(uploadedDataUrl);
        if (uploadedImage) {
          setLocalizer(caseId, viewId, uploadedImage, "uploaded");
          return;
        }
      }

      const bundledImage = await tryLoadBundledLocalizer(caseId, viewId);
      if (bundledImage) {
        setLocalizer(caseId, viewId, bundledImage, "assets");
      } else {
        setLocalizer(caseId, viewId, null, "fallback");
      }
    })
  );
}

function setLocalizer(caseId, viewId, image, source) {
  state.localizers[caseId][viewId] = { image, source };
}

async function tryLoadBundledLocalizer(caseId, viewId) {
  for (const ext of LOCALIZER_EXTENSIONS) {
    const path = `assets/localizers/${caseId}/${viewId}.${ext}`;
    const image = await loadImage(path);
    if (image) {
      return image;
    }
  }
  return null;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function handleUpload(event, viewId) {
  if (!state.caseId) {
    event.target.value = "";
    return;
  }

  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);

    if (!image) {
      els.feedback.innerHTML = `<p class="warn">Unable to read uploaded image for ${viewId}.</p>`;
      event.target.value = "";
      return;
    }

    state.uploadedData[state.caseId][viewId] = dataUrl;
    persistUploadedLocalizerMap();
    setLocalizer(state.caseId, viewId, image, "uploaded");
    updateUploadStatuses();
    renderAll();
    event.target.value = "";
  } catch {
    els.feedback.innerHTML = `<p class="warn">Upload failed for ${viewId}. Try a different image file.</p>`;
    event.target.value = "";
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateUploadStatuses() {
  const statusElements = {
    axial: els.statusAxial,
    sagittal: els.statusSagittal,
    coronal: els.statusCoronal,
  };

  VIEW_IDS.forEach((viewId) => {
    const statusEl = statusElements[viewId];
    if (!statusEl) {
      return;
    }

    if (!state.caseId) {
      statusEl.textContent = "Source: select case";
      return;
    }

    const source = state.localizers[state.caseId][viewId].source;
    if (source === "uploaded") {
      statusEl.textContent = "Source: uploaded image";
    } else if (source === "assets") {
      statusEl.textContent = "Source: assets/localizers file";
    } else {
      statusEl.textContent = "Source: fallback sketch";
    }
  });
}
