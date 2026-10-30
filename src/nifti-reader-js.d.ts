declare module "nifti-reader-js" {
  export function isCompressed(data: ArrayBuffer): boolean;
  export function decompress(data: ArrayBuffer): ArrayBuffer;
  export function isNIFTI(data: ArrayBuffer): boolean;
  export function readHeader(data: ArrayBuffer): NiftiHeader | null;
  export function readImage(
    header: NiftiHeader,
    data: ArrayBuffer
  ): ArrayBuffer;

  export interface NiftiHeader {
    dims: number[];
    pixDims: number[];
    datatypeCode: number;
  }

  export const NIFTI1: {
    TYPE_UINT8: number;
    TYPE_INT16: number;
    TYPE_INT32: number;
    TYPE_FLOAT32: number;
    TYPE_FLOAT64: number;
  };
}
