"use client";

import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { DealsData, Language } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { getDeals } from "@/lib/api";
import { grouped } from "@/lib/format";
import DealCard from "@/components/DealCard";

/**
 * The farmer's standing record. This tab is the single clearest answer to "is this a
 * marketplace or a chatbot?" — a conversation has nothing to show here.
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

  const live = data?.deals.filter((d) => d.status !== "delivered") ?? [];
  const past = data?.deals.filter((d) => d.status === "delivered") ?? [];

  return (
    <div className="flex flex-col gap-5 pt-3">
      {/* A statement header, not a hero card: the number is the point, and the label
          under it says what period it covers — the way a passbook line reads. */}
      <div className="flex items-end justify-between gap-3 border-b-2 border-primary/20 pb-3">
        <div className="flex flex-col">
          <span className="flex items-center text-3xl font-bold leading-none tabular-nums text-primary">
            <IndianRupee size={24} strokeWidth={2.5} />
            {grouped(data?.earnedThisMonth ?? 0)}
          </span>
          <span className="mt-1 text-base text-text-secondary">{t.earnedThisMonth}</span>
        </div>
        <span className="text-base tabular-nums text-text-secondary">
          {fill(t.dealsCount, { n: data?.dealCount ?? 0 })}
        </span>
      </div>

      {data && data.deals.length === 0 && (
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
