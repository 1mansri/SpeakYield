"use client";

import { ChevronRight } from "lucide-react";
import { Deal, Language, OrderStep } from "@/lib/types";
import { commodityEmoji } from "@/lib/commodities";
import { grouped } from "@/lib/format";

const STEPS: OrderStep[] = ["confirmed", "matched", "picked-up", "delivered"];

const STATUS_LABELS: Record<Language, Record<OrderStep, string>> = {
  hi: {
    confirmed: "पुष्टि हुई",
    matched: "मिल गया",
    "picked-up": "रास्ते में",
    delivered: "पहुँच गया",
  },
  bn: {
    confirmed: "নিশ্চিত",
    matched: "মিলেছে",
    "picked-up": "পথে",
    delivered: "পৌঁছেছে",
  },
  en: {
    confirmed: "Confirmed",
    matched: "Matched",
    "picked-up": "In transit",
    delivered: "Delivered",
  },
};

/**
 * The deal currently in flight, as one line on the home screen.
 *
 * The full card lives on the deals tab; here the farmer only needs to know it exists and
 * how far along it is, so this trades detail for height — the market board is what they
 * opened the app to see, and a running deal shouldn't push it under the fold to say
 * something a progress rail says in four dots.
 */
export default function ActiveDealStrip({
  language,
  deal,
  onOpen,
}: {
  language: Language;
  deal: Deal;
  onOpen: () => void;
}) {
  const stepIndex = STEPS.indexOf(deal.status);
  const status = STATUS_LABELS[language][deal.status];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-accent/35 bg-accent/[0.07] px-3 py-2.5 text-left"
    >
      <span aria-hidden className="text-xl">
        {commodityEmoji(deal.commodity, deal.action)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-base font-semibold text-text-primary">
            {deal.commodity} · {deal.quantity} {deal.unit}
          </span>
          <span className="shrink-0 text-base font-bold tabular-nums text-primary">
            ₹{grouped(deal.amount)}
          </span>
        </span>

        {/* Four segments for four steps — the whole delivery in the height of a rule,
            with the stage named beside it so the bar isn't the only thing carrying it. */}
        <span className="flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1" aria-hidden>
            {STEPS.map((step, i) => (
              <span
                key={step}
                className={`h-1 flex-1 rounded-full ${
                  i <= stepIndex ? "bg-accent" : "bg-accent/20"
                }`}
              />
            ))}
          </span>
          <span className="shrink-0 text-sm font-semibold text-accent-dark">{status}</span>
        </span>
      </div>

      <ChevronRight size={17} className="shrink-0 text-text-secondary" />
    </button>
  );
}
