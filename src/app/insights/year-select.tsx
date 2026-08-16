"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface YearOption {
  value: string; // "current" or a year, e.g. "2025" — used to build the URL
  label: string; // "Current" or "2025"
}

export default function YearSelect({
  options,
  selected,
}: {
  options: YearOption[];
  selected: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((option) => option.value === selected)?.label ?? selected;

  function choose(value: string) {
    setOpen(false);
    router.push(value === "current" ? "/insights" : `/insights?year=${value}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg bg-bg px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-line/50"
      >
        {selectedLabel}
        <svg
          viewBox="0 0 12 12"
          fill="none"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-32 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-card">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-ink transition-colors hover:bg-bg"
            >
              {option.label}
              {option.value === selected && (
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-accent">
                  <path
                    d="M2 6l2.5 2.5L10 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
