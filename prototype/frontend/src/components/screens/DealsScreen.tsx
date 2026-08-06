"use client";

import { useEffect, useState } from "react";
import { IndianRupee } from "lucide-react";
import { DealsData, Language } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { getDeals } from "@/lib/api";
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
    <div className="flex flex-1 flex-col gap-5 py-4">
      <div className="flex flex-col gap-1 rounded-2xl bg-primary p-4 text-white">
        <span className="text-base opacity-90">{t.earnedThisMonth}</span>
        <span className="flex items-center text-3xl font-bold tabular-nums">
          <IndianRupee size={24} />
          {data?.earnedThisMonth ?? 0}
        </span>
        <span className="text-base opacity-90">
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
      <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
