'use client';

import type { ProtocolStatus } from '@/features/workstation/types/workstation';

const STATUS_CONFIG: Record<
  ProtocolStatus,
  { color: string; pulse?: boolean; label: string }
> = {
  pending: { color: '#8a8a9e', label: 'Not Planned' },
  planning: { color: '#d29922', label: 'Planning' },
  active: { color: '#d29922', pulse: true, label: 'Active' },
  scanning: { color: '#2563eb', pulse: true, label: 'Scanning' },
  completed: { color: '#3fb950', label: 'Completed' },
  skipped: { color: '#6a6a7e', label: 'Skipped' },
  error: { color: '#f85149', label: 'Error' },
};

export function StatusIcon({
  status,
  size = 10,
}: {
  status: ProtocolStatus;
  size?: number;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      title={config.label}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: config.color,
        boxShadow: config.pulse
          ? `0 0 6px ${config.color}`
          : undefined,
        animation: config.pulse
          ? 'pulse-soft 2s ease-in-out infinite'
          : undefined,
        flexShrink: 0,
      }}
    />
  );
}
