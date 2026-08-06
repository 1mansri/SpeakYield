"use client";

import { IndianRupee } from "lucide-react";
import { Deal, Language, OrderStep } from "@/lib/types";
import { copy } from "@/lib/copy";
import { commodityEmoji } from "@/lib/commodities";

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

function relativeDay(createdAt: number, language: Language): string {
  const days = Math.floor((Date.now() / 1000 - createdAt) / 86400);
  if (days <= 0) return { hi: "आज", bn: "আজ", en: "Today" }[language];
  if (days === 1) return { hi: "कल", bn: "গতকাল", en: "Yesterday" }[language];
  return { hi: `${days} दिन पहले`, bn: `${days} দিন আগে`, en: `${days} days ago` }[language];
}

/** One trade in the farmer's record: what moved, to whom, for how much, and where it is. */
export default function DealCard({ language, deal }: { language: Language; deal: Deal }) {
  const t = copy[language];
  const live = deal.status !== "delivered";
  const selling = deal.action === "sell";

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-2xl">
            {commodityEmoji(deal.commodity, deal.action)}
          </span>
          <span className="text-lg font-semibold text-text-primary">
            {deal.commodity} · {deal.quantity} {deal.unit}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
            live ? "bg-accent/15 text-accent-dark" : "bg-primary/10 text-primary"
          }`}
        >
          {STATUS_LABELS[language][deal.status]}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base text-text-secondary">{deal.partner}</span>
          <span className="text-sm text-text-secondary">
            {relativeDay(deal.createdAt, language)} · ₹{deal.price}/{deal.unit}
          </span>
        </div>
        <span
          className={`flex shrink-0 items-center text-xl font-bold tabular-nums ${
            selling ? "text-primary" : "text-text-primary"
          }`}
        >
          {selling ? "+" : "−"}
          <IndianRupee size={16} />
          {deal.amount}
        </span>
      </div>

      {/* Fees are already netted out of `amount`, so say so rather than let the farmer
          wonder why the total isn't quantity × price. */}
      <span className="text-sm text-text-secondary">
        {selling ? t.netAmount : t.paymentDone}
      </span>
    </div>
  );
}
