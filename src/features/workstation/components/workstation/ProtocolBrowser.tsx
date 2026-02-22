'use client';

import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { getExamCards } from '@/features/workstation/lib/examcards';
import { isFolder, isProtocol } from '@/features/workstation/types/workstation';
import type { ExamCardEntry, ExamCardProtocol } from '@/features/workstation/types/workstation';

function ProtocolRow({ protocol }: { protocol: ExamCardProtocol }) {
  const addProtocol = useWorkstationStore((s) => s.addProtocol);
  const isAdded = useWorkstationStore(
    (s) => s.addedProtocols.some((p) => p.protocolId === protocol.id),
  );

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 text-[10px] transition-colors group"
      style={{
        paddingLeft: 32,
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--chrome-surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>
        {isAdded ? '\u2713' : '\u25B7'}
      </span>

      <span className="flex-1 truncate">{protocol.label}</span>

      <span
        className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wide"
        style={{
          background: 'var(--chrome-surface-raised)',
          color: 'var(--text-muted)',
        }}
      >
        {protocol.orientation}
      </span>

      <span className="text-[8px] w-8 text-right" style={{ color: 'var(--text-muted)' }}>
        {protocol.estimatedTime}
      </span>

      {!isAdded ? (
        <button
          onClick={() => addProtocol(protocol)}
          className="text-[8px] px-2 py-0.5 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          style={{
            background: 'var(--accent-blue-dim)',
            color: 'var(--accent-blue)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
          }}
        >
          + Add
        </button>
      ) : (
        <span
          className="text-[8px] px-2 py-0.5 rounded"
          style={{ color: 'var(--fb-good)', opacity: 0.7 }}
        >
          Added
        </span>
      )}
    </div>
  );
}

function FolderRow({
  entry,
  depth = 0,
}: {
  entry: ExamCardEntry;
  depth?: number;
}) {
  const expandedFolders = useWorkstationStore((s) => s.expandedFolders);
  const toggleFolder = useWorkstationStore((s) => s.toggleFolder);

  if (isProtocol(entry)) {
    return <ProtocolRow protocol={entry} />;
  }

  if (isFolder(entry)) {
    const isExpanded = expandedFolders.includes(entry.id);
    return (
      <div>
        <button
          onClick={() => toggleFolder(entry.id)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] transition-colors cursor-pointer"
          style={{
            paddingLeft: 12 + depth * 16,
            color: 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--chrome-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span
            className="text-[8px] transition-transform"
            style={{
              color: 'var(--text-muted)',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
          >
            &#9654;
          </span>
          <span className="font-medium tracking-wider uppercase text-[9px]">
            {entry.label}
          </span>
          <span className="text-[8px] ml-auto" style={{ color: 'var(--text-muted)' }}>
            {entry.children.length}
          </span>
        </button>

        {isExpanded && (
          <div className="animate-fade-in">
            {entry.children.map((child) => (
              <FolderRow
                key={isFolder(child) ? child.id : (child as ExamCardProtocol).id}
                entry={child}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ParameterSettings() {
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const protocols = useWorkstationStore((s) => s.addedProtocols);
  const activeProtocol = activeIndex !== null ? protocols[activeIndex] : null;

  if (!activeProtocol) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            SCAN PARAMETERS
          </div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--chrome-border-bright)' }}>
            Select a protocol to view parameters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <span
          className="text-[8px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Scan Parameters
        </span>
        <span className="text-[10px] font-medium ml-auto" style={{ color: 'var(--accent-blue)' }}>
          {activeProtocol.label}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { label: 'Orientation', value: activeProtocol.orientation },
            { label: 'FOV (mm)', value: '230 x 230' },
            { label: 'Slice Thickness', value: '4.0 mm' },
            { label: 'Slice Gap', value: '0.4 mm' },
            { label: 'TR (ms)', value: '4500' },
            { label: 'TE (ms)', value: '100' },
            { label: 'Matrix', value: '320 x 256' },
            { label: 'NSA', value: '1' },
            { label: 'Bandwidth', value: '220 Hz/px' },
            { label: 'Slices', value: '24' },
          ].map((param) => (
            <div key={param.label}>
              <div className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                {param.label}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                {param.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProtocolBrowser() {
  const browserOpen = useWorkstationStore((s) => s.browserOpen);
  const setBrowserOpen = useWorkstationStore((s) => s.setBrowserOpen);
  const phase = useWorkstationStore((s) => s.phase);

  const showParams = phase === 'survey-complete' || phase === 'protocol-active';

  if (showParams && !browserOpen) {
    return (
      <div
        className="flex flex-col shrink-0"
        style={{
          height: 220,
          background: 'var(--chrome-surface)',
          borderTop: '1px solid var(--chrome-border)',
        }}
      >
        <ParameterSettings />
      </div>
    );
  }

  if (showParams && browserOpen) {
    return (
      <div
        className="flex flex-col shrink-0 animate-slide-up"
        style={{
          height: 220,
          background: 'var(--chrome-surface)',
          borderTop: '1px solid var(--chrome-border)',
        }}
      >
        <div
          className="flex items-center h-7 shrink-0 px-3"
          style={{ borderBottom: '1px solid var(--chrome-border)' }}
        >
          <span
            className="text-[8px] uppercase tracking-[0.2em]"
            style={{ color: 'var(--text-muted)' }}
          >
            ExamCards
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setBrowserOpen(false)}
            className="px-2 h-full text-[10px] cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {getExamCards().map((folder) => (
            <FolderRow key={folder.id} entry={folder} />
          ))}
        </div>
      </div>
    );
  }

  if (!browserOpen) return null;

  const cards = getExamCards();

  return (
    <div
      className="flex flex-col shrink-0 animate-slide-up"
      style={{
        height: 220,
        background: 'var(--chrome-surface)',
        borderTop: '1px solid var(--chrome-border)',
      }}
    >
      <div
        className="flex items-center h-7 shrink-0 px-3"
        style={{ borderBottom: '1px solid var(--chrome-border)' }}
      >
        <span
          className="text-[8px] uppercase tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          ExamCards
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {cards.map((folder) => (
          <FolderRow key={folder.id} entry={folder} />
        ))}
      </div>
    </div>
  );
}
