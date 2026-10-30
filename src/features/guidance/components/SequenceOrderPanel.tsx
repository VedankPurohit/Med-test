'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import { validateSequenceOrder } from '@/features/guidance/lib/orderValidation';
import type { ProtocolListItem } from '@/features/workstation/types/workstation';
import type { OrderValidationResult } from '@/features/guidance/types/guidance';

/* ------------------------------------------------------------------ */
/*  SortableItem                                                       */
/* ------------------------------------------------------------------ */

function SortableItem({ protocol }: { protocol: ProtocolListItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: protocol.protocolId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    marginBottom: '6px',
    borderRadius: '6px',
    background: 'var(--chrome-bg)',
    border: '1px solid var(--chrome-border)',
    cursor: 'grab',
    userSelect: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span
        style={{
          color: 'var(--chrome-border-bright)',
          fontSize: '12px',
          lineHeight: 1,
          flexShrink: 0,
          letterSpacing: '1px',
        }}
        aria-hidden
      >
        &#x2807;
      </span>

      <span
        style={{
          color: 'var(--text-primary)',
          fontSize: '11px',
          flex: 1,
          fontWeight: 500,
        }}
      >
        {protocol.shortName}
      </span>

      <span
        style={{
          fontSize: '8px',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: '9999px',
          background: 'rgba(100, 160, 255, 0.12)',
          color: 'var(--accent-blue)',
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}
      >
        {protocol.orientation}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SequenceOrderPanel                                                 */
/* ------------------------------------------------------------------ */

interface SequenceOrderPanelProps {
  open: boolean;
  onConfirm: () => void;
}

export default function SequenceOrderPanel({
  open,
  onConfirm,
}: SequenceOrderPanelProps) {
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);
  const reorderProtocols = useWorkstationStore((s) => s.reorderProtocols);
  const tipsEnabled = useGuidanceStore((s) => s.tipsEnabled);

  const [validation, setValidation] = useState<OrderValidationResult>({
    valid: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  /* Validate whenever the protocol list changes */
  useEffect(() => {
    setValidation(validateSequenceOrder(addedProtocols));
  }, [addedProtocols]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = addedProtocols.findIndex(
        (p) => p.protocolId === active.id,
      );
      const newIndex = addedProtocols.findIndex(
        (p) => p.protocolId === over.id,
      );
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(addedProtocols, oldIndex, newIndex);
      reorderProtocols(reordered.map((p) => p.protocolId));
    },
    [addedProtocols, reorderProtocols],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Scrim */}
      <div className="modal-scrim" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sequence-order-title"
        className="modal-dialog p-5 animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '400px',
        }}
      >
        {/* Title */}
        <h2
          id="sequence-order-title"
          className="text-[11px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Arrange Sequences
        </h2>

        {/* Subtitle */}
        <p
          className="text-[10px] mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          Drag to arrange in the correct scanning order
        </p>

        {/* Sortable list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={addedProtocols.map((p) => p.protocolId)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ marginBottom: '12px' }}>
              {addedProtocols.map((protocol) => (
                <SortableItem
                  key={protocol.protocolId}
                  protocol={protocol}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Validation message */}
        <div
          className="text-[10px] mb-4 px-2 py-1.5 rounded"
          style={{
            minHeight: '18px',
            color: validation.valid ? 'var(--fb-good)' : 'var(--fb-bad)',
            background: validation.valid ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.06)',
          }}
        >
          {validation.valid && 'Order is correct'}
          {!validation.valid && tipsEnabled && validation.hint}
          {!validation.valid && !tipsEnabled && 'Sequence order is incorrect'}
        </div>

        {/* Confirm button */}
        <div className="flex justify-end">
          <button
            disabled={!validation.valid}
            onClick={onConfirm}
            className="btn-sm btn-primary text-[10px] font-semibold"
            style={{
              padding: '5px 16px',
              background: validation.valid
                ? 'var(--accent-blue)'
                : 'var(--chrome-border)',
              color: validation.valid ? '#ffffff' : 'var(--text-muted)',
              opacity: validation.valid ? 1 : 0.6,
              cursor: validation.valid ? 'pointer' : 'not-allowed',
            }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}
