import {
  FAT_SUPPRESSION_MODES,
  PHASE_ENC_DIRECTIONS,
  ProtocolParameterSpec
} from "@/features/planner/types/planner";

type EnumOption = {
  label: string;
  value: number;
};

export const getParameterOptions = (key: string): EnumOption[] | null => {
  if (key === "PhaseEncDir") {
    return PHASE_ENC_DIRECTIONS.map((label, value) => ({ label, value }));
  }
  if (key === "FatSuppression") {
    return FAT_SUPPRESSION_MODES.map((label, value) => ({ label, value }));
  }
  return null;
};

export const formatParameterValue = (
  key: string,
  value: number,
  spec?: ProtocolParameterSpec
): string => {
  const option = getParameterOptions(key)?.find((entry) => entry.value === value);
  if (option) {
    return option.label;
  }
  return `${value}${spec?.unit ? ` ${spec.unit}` : ""}`;
};
