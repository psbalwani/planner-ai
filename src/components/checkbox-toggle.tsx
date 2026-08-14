"use client";

export default function CheckboxToggle({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-40 ${
        checked
          ? "border-accent bg-accent text-white"
          : "border-line bg-surface hover:border-accent/50"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path
            d="M3 8.5L6.5 12L13 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
