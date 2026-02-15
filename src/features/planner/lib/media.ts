import { ViewId } from "@/features/planner/types/planner";

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

export const splitTriptychPanels = (image: HTMLImageElement): string[] => {
  const panelWidth = Math.floor(image.width / 3);
  const panelHeight = image.height;

  if (panelWidth < 60 || panelHeight < 60) {
    throw new Error("Triptych image too small");
  }

  const dataUrls: string[] = [];
  for (let index = 0; index < 3; index += 1) {
    const sx = index * panelWidth;
    const sw = index === 2 ? image.width - sx : panelWidth;
    const side = Math.min(sw, panelHeight);
    const cropX = sx + Math.max(0, Math.floor((sw - side) / 2));
    const cropY = Math.max(0, Math.floor((panelHeight - side) / 2));

    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 320;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable");
    }

    context.drawImage(image, cropX, cropY, side, side, 0, 0, 320, 320);
    dataUrls.push(canvas.toDataURL("image/png"));
  }

  return dataUrls;
};

export const triptychOrderToViews = (order: string): ViewId[] => {
  if (order === "ax-cor-sag") {
    return ["axial", "coronal", "sagittal"];
  }
  if (order === "cor-sag-ax") {
    return ["coronal", "sagittal", "axial"];
  }
  return ["sagittal", "coronal", "axial"];
};

export const downloadJson = (fileName: string, payload: unknown): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
};
