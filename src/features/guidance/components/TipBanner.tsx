'use client';

type TipBannerProps = {
  message: string;
  visible: boolean;
  onDismiss?: () => void;
};

export function TipBanner({ message, visible, onDismiss }: TipBannerProps) {
  if (!visible) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded text-[10px] animate-slide-up"
      style={{
        background: 'var(--plan-orange)',
        color: '#ffffff',
      }}
    >
      <span className="flex-1 leading-relaxed">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[10px] cursor-pointer transition-opacity"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: '#ffffff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          aria-label="Dismiss tip"
        >
          ×
        </button>
      )}
    </div>
  );
}
