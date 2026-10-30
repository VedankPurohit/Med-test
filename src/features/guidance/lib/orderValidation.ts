import type { ProtocolListItem } from "@/features/workstation/types/workstation";
import type { ProtocolConfig } from "@/features/planner/types/planner";
import type { OrderValidationResult } from "@/features/guidance/types/guidance";
import { resolveProtocol } from "@/features/workstation/lib/protocolRegistry";

/**
 * Validates that the given protocol list is ordered by workflowOrder.
 * Protocols without workflowOrder are allowed in any position.
 */
export function validateSequenceOrder(
  protocols: ProtocolListItem[]
): OrderValidationResult {
  const resolved = protocols.map((p) => ({
    item: p,
    config: resolveProtocol(p.protocolId)?.protocolConfig ?? null,
  }));

  const ordered = resolved.filter(
    (r): r is { item: ProtocolListItem; config: ProtocolConfig } =>
      r.config !== null && r.config.workflowOrder !== undefined
  );

  if (ordered.length <= 1) {
    return { valid: true };
  }

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1].config.workflowOrder!;
    const curr = ordered[i].config.workflowOrder!;
    if (curr < prev) {
      return {
        valid: false,
        hint: `"${ordered[i].item.label}" should come after "${ordered[i - 1].item.label}" in the standard protocol order.`,
      };
    }
  }

  return { valid: true };
}
