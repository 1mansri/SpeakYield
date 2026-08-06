"use client";

import { Language } from "@/lib/types";
import { copy } from "@/lib/copy";

/**
 * The price spread across competing offers, with the selected one marked and the local
 * mandi rate as a reference tick.
 *
 * This is the platform's value proposition rendered in one line: the farmer can see the
 * range they're choosing within, and how far above the local rate the best offer sits.
 */
export default function SpreadBar({
  language,
  min,
  max,
  selected,
  mandiPrice,
  unit,
}: {
  language: Language;
  min: number;
  max: number;
  selected: number;
  mandiPrice: number | null;
  unit: string;
}) {
  const t = copy[language];
  const span = max - min;

  // A single offer (or an all-equal set) has no spread to draw — pin the marker centre
  // rather than dividing by zero.
  const positionOf = (value: number) =>
    span <= 0 ? 50 : Math.min(100, Math.max(0, ((value - min) / span) * 100));

  const mandiInRange = mandiPrice !== null && mandiPrice >= min && mandiPrice <= max;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-base text-text-secondary">{t.spreadLabel}</span>
        <span className="text-base font-semibold tabular-nums text-text-primary">
          ₹{min} – ₹{max}
          <span className="text-sm font-normal text-text-secondary">/{unit}</span>
        </span>
      </div>

      <div className="relative h-3 rounded-full bg-gradient-to-r from-border to-primary/40">
        {mandiInRange && (
          <span
            className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-text-secondary"
            style={{ left: `${positionOf(mandiPrice)}%` }}
            aria-hidden
          />
        )}
        <span
          className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-primary shadow-[0_2px_6px_rgba(47,107,60,0.4)]"
          style={{ left: `${positionOf(selected)}%` }}
          aria-hidden
        />
      </div>

      {mandiInRange && (
        <div className="flex justify-between text-sm text-text-secondary">
          <span>{t.mandiRate} ₹{mandiPrice}</span>
        </div>
      )}
    </div>
  );
}

/** How the chosen price compares with the local mandi rate, phrased from the farmer's
 *  point of view: selling above it is a gain, buying below it is. */
export function mandiDelta(
  price: number,
  mandiPrice: number | null,
  action: "sell" | "buy",
): { key: "aboveMandi" | "belowMandi" | "atMandi"; amount: number; good: boolean } | null {
  if (mandiPrice === null || mandiPrice <= 0) return null;

  const diff = Math.round((price - mandiPrice) * 100) / 100;
  if (diff === 0) return { key: "atMandi", amount: 0, good: false };
  if (diff > 0) return { key: "aboveMandi", amount: diff, good: action === "sell" };
  return { key: "belowMandi", amount: Math.abs(diff), good: action === "buy" };
}
