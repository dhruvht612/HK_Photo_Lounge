export function ImagePlaceholder({ className = '' }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-ink-800 to-ink-900 ${className}`}
      aria-hidden
    >
      <div className="text-center text-sand-200/30">
        <p className="font-display text-lg">HK</p>
        <p className="text-[10px] uppercase tracking-[0.3em]">Photo</p>
      </div>
    </div>
  );
}
