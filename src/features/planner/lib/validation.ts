import { ProtocolConfig } from "@/features/planner/types/planner";

const finite = (value: number): boolean => Number.isFinite(value);

export const validateProtocolConfig = (protocol: ProtocolConfig): string[] => {
  const errors: string[] = [];

  if (!protocol.id.trim()) {
    errors.push("Protocol id is required.");
  }
  if (!protocol.label.trim()) {
    errors.push("Protocol label is required.");
  }

  const paramKeys = protocol.parameterSpecs.map((item) => String(item.key));
  if (new Set(paramKeys).size !== paramKeys.length) {
    errors.push(`Protocol ${protocol.id} has duplicate parameter spec keys.`);
  }

  for (const spec of protocol.parameterSpecs) {
    if (!spec.label.trim()) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} has empty label.`);
    }
    if (spec.min !== undefined && !finite(spec.min)) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} min must be finite.`);
    }
    if (spec.max !== undefined && !finite(spec.max)) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} max must be finite.`);
    }
    if (spec.min !== undefined && spec.max !== undefined && spec.min > spec.max) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} min cannot exceed max.`);
    }
    if (spec.step !== undefined && (!finite(spec.step) || spec.step <= 0)) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} step must be > 0.`);
    }
    if (spec.weight !== undefined && (!finite(spec.weight) || spec.weight < 0)) {
      errors.push(`Protocol ${protocol.id} parameter ${spec.key} weight must be >= 0.`);
    }
  }

  const targetKeys = Object.keys(protocol.target.params);
  const missingSpecs = targetKeys.filter((key) => !paramKeys.includes(key));
  if (missingSpecs.length > 0) {
    errors.push(`Protocol ${protocol.id} missing parameterSpecs for: ${missingSpecs.join(", ")}.`);
  }

  return errors;
};

