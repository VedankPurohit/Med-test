export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => {
      reject(new Error(`readFileAsDataUrl failed: ${reader.error?.message ?? "unknown FileReader error"}`));
    };
    reader.onabort = () => {
      reject(new Error("readFileAsDataUrl aborted"));
    };
    reader.readAsDataURL(file);
  });

export const readFileAsBytes = async (file: File): Promise<Uint8Array> => {
  const buffer = await file.arrayBuffer();
  return new Uint8Array(buffer);
};
