"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Package, TrendingUp, Truck } from "lucide-react";
import { Language, TickerItem, TickerKind } from "@/lib/types";
import { copy } from "@/lib/copy";
import { timeAgo } from "@/lib/format";

const ICONS: Record<TickerKind, typeof TrendingUp> = {
  bid: TrendingUp,
  lot: Package,
  arrival: Truck,
  settle: IndianRupee,
};

function tickerText(item: TickerItem, language: Language): string {
  if (language === "hi") return item.textHi || item.text;
  if (language === "bn") return item.textBn || item.text;
  return item.text;
}

/**
 * What other people in this mandi are doing right now, as a timeline.
 *
 * This is the single cheapest thing that makes the app feel inhabited: a farmer opening
 * it sees that bids moved and lots cleared while they weren't looking. The lines age
 * on a one-minute tick rather than freezing at whatever the load time said — a feed
 * that never re-times itself is the tell that it isn't really live.
 */
export default function MandiTicker({
  language,
  items,
  limit = 3,
}: {
  language: Language;
  items: TickerItem[];
  limit?: number;
}) {
  const t = copy[language];
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" />
        {t.mandiFeed}
      </h2>

      <ol className="relative flex flex-col gap-3 border-l-2 border-border pl-4">
        {items.slice(0, limit).map((item) => {
          const Icon = ICONS[item.kind];
          return (
            <li key={`${item.at}-${item.text}`} className="relative flex items-start gap-2.5">
              {/* Sits on the rule, not beside it — the line is the thread of the day. */}
              <span className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-text-secondary">
                <Icon size={12} />
              </span>
              <p className="flex-1 text-base leading-snug text-text-primary">
                {tickerText(item, language)}
                <span className="ml-1.5 whitespace-nowrap text-sm text-text-secondary">
                  {timeAgo(item.at, t, now)}
                </span>
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
