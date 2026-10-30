'use client';

import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import type { TeachingRenderProps } from '@/features/guidance/types/guidance';
import { PopupTeachingStrategy } from '@/features/guidance/strategies/PopupTeachingStrategy';
import { InlineTeachingStrategy } from '@/features/guidance/strategies/InlineTeachingStrategy';

const STRATEGIES = { popup: PopupTeachingStrategy, inline: InlineTeachingStrategy };

export function ParameterTeachingSlot(props: TeachingRenderProps) {
  const strategyId = useGuidanceStore((s) => s.activeTeachingStrategy);
  const Strategy = STRATEGIES[strategyId as keyof typeof STRATEGIES] ?? PopupTeachingStrategy;
  return <Strategy.render {...props} />;
}
