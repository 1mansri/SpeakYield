"use client";

import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { Action, DealsData, Language } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { getDeals } from "@/lib/api";
import { grouped } from "@/lib/format";
import DealCard from "@/components/DealCard";

/** All deals, or one direction of the book. */
type Filter = "all" | Action;

/**
 * The farmer's standing record. This tab is the single clearest answer to "is this a
 * marketplace or a chatbot?" — a conversation has nothing to show here.
 *
 * Crop sold and inputs bought are one book, so All leads and lists both. The headline
 * figure stays earnings even there — deliberately not earnings-minus-spend, since a
 * netted number under a label reading "earned" is a number that can go negative and
 * still claim to be income. Switching to Buy re-reads the header as spending, which is
 * the only place that total belongs.
 */
export default function DealsScreen({
  language,
  userId,
  refreshKey,
}: {
  language: Language;
  userId?: string;
  /** Bumped by the app after a deal completes, so the list reflects it immediately. */
  refreshKey: number;
}) {
  const t = copy[language];
  const [data, setData] = useState<DealsData | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;
    getDeals(userId)
      .then((loaded) => {
        if (!cancelled) setData(loaded);
      })
      .catch(() => {
        // Nothing actionable for the farmer here — an empty list reads the same as a
        // failed load, and the market tab already surfaces backend trouble.
      });
    return () => {
      cancelled = true;
    };
  }, [userId, refreshKey]);

  const shown = data?.deals.filter((d) => filter === "all" || d.action === filter) ?? [];
  const live = shown.filter((d) => d.status !== "delivered");
  const past = shown.filter((d) => d.status === "delivered");

  const earned = data?.earnedThisMonth ?? 0;
  const spent = data?.spentThisMonth ?? 0;
  const header =
    filter === "buy"
      ? { amount: spent, label: t.spentThisMonth, count: fill(t.ordersCount, { n: data?.buyCount ?? 0 }) }
      : filter === "sell"
        ? { amount: earned, label: t.earnedThisMonth, count: fill(t.dealsCount, { n: data?.sellCount ?? 0 }) }
        : { amount: earned, label: t.earnedThisMonth, count: fill(t.dealsCount, { n: data?.dealCount ?? 0 }) };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "sell", label: t.sell },
    { key: "buy", label: t.buy },
  ];

  return (
    <div className="flex flex-col gap-5 pt-3">
      {/* A statement header, not a hero card: the number is the point, and the label
          under it says what period it covers — the way a passbook line reads. */}
      <div className="flex items-end justify-between gap-3 border-b-2 border-primary/20 pb-3">
        <div className="flex flex-col">
          <span className="flex items-center text-3xl font-bold leading-none tabular-nums text-primary">
            <IndianRupee size={24} strokeWidth={2.5} />
            {grouped(header.amount)}
          </span>
          <span className="mt-1 text-base text-text-secondary">{header.label}</span>
        </div>
        <span className="text-base tabular-nums text-text-secondary">{header.count}</span>
      </div>

      {/* Shown only once there is something to separate — a filter over two deals is
          chrome, not a tool. */}
      {data && data.sellCount > 0 && data.buyCount > 0 && (
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={`min-h-[36px] rounded-full border px-4 text-sm font-semibold transition-colors duration-150 ${
                filter === key
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-secondary hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {data && shown.length === 0 && (
        <p className="py-8 text-center text-base text-text-secondary">{t.noDeals}</p>
      )}

      {live.length > 0 && (
        <Section title={t.liveDeals}>
          {live.map((deal) => (
            <DealCard key={deal.id} language={language} deal={deal} />
          ))}
        </Section>
      )}

      {past.length > 0 && (
        <Section title={t.pastDeals}>
          {past.map((deal) => (
            <DealCard key={deal.id} language={language} deal={deal} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-base font-semibold text-text-primary">{title}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
