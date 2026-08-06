"use client";

import { Clock } from "lucide-react";
import { Language, Market, MarketRate } from "@/lib/types";
import { commodityName, copy, fill } from "@/lib/copy";
import { boardDate, clockTime, grouped, sessionTime } from "@/lib/format";
import Sparkline from "@/components/Sparkline";

/**
 * The mandi's price board.
 *
 * Modelled on the slate a regulated market actually chalks its rates on: one dark
 * object on a paper-coloured page, dense tabular rows, a licence number in the
 * footer. It is deliberately the *only* dark surface in the app — that's what stops
 * the home screen from reading as another stack of identical rounded cards, and it's
 * why the rates land as a market's numbers rather than an app's content.
 *
 * Every column here is a column a physical board carries: rate, the week's direction,
 * change on yesterday, the day's traded range, and arrivals. A price with no range and
 * no volume behind it is a number; these are a quote.
 */
export default function MandiBoard({
  language,
  market,
}: {
  language: Language;
  market: Market;
}) {
  const t = copy[language];
  const open = market.session === "open";

  return (
    <section className="overflow-hidden rounded-xl bg-board text-board-ink shadow-[0_2px_16px_rgba(28,42,34,0.22)]">
      <header className="flex items-start justify-between gap-3 border-b border-board-line px-4 pb-3 pt-3.5">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-lg font-bold leading-tight">{t.todayRates}</h2>
          <span className="text-sm text-board-muted">
            {boardDate(market.updatedAt, language)}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold ${
              open ? "text-up" : "text-board-muted"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${open ? "live-dot bg-up" : "bg-board-muted"}`}
            />
            {open
              ? fill(t.sessionOpen, { time: sessionTime(market.mandi.closes, language) })
              : fill(t.sessionClosed, { time: sessionTime(market.mandi.opens, language) })}
          </span>
          {/* The clock face carries the meaning, so the time needs no label beside it —
              which is what keeps this column from crowding the title. */}
          <span
            className="flex items-center gap-1 whitespace-nowrap text-xs tabular-nums text-board-muted"
            title={fill(t.boardUpdated, { time: clockTime(market.updatedAt, language) })}
          >
            <Clock size={11} />
            {clockTime(market.updatedAt, language)}
          </span>
        </div>
      </header>

      {/* Column heads, in the board's own small hand. Labelling the columns is what
          makes the numbers below scannable instead of decorative. */}
      <div className="flex items-center gap-2 px-4 pb-1.5 pt-2.5 text-xs uppercase tracking-wider text-board-muted">
        <span className="flex-1">{t.slipCommodity}</span>
        <span className="w-[66px] text-right">{t.colRate}</span>
        <span className="w-[40px] text-center">{t.weekTrend}</span>
        <span className="w-[44px] text-right">{t.colChange}</span>
      </div>

      <div className="divide-y divide-board-line/70">
        {market.rates.map((rate) => (
          <BoardRow key={rate.commodity} language={language} rate={rate} />
        ))}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-board-line px-4 py-2.5 text-xs text-board-muted">
        <span className="truncate">
          {language === "hi"
            ? market.mandi.nameHi
            : language === "bn"
              ? market.mandi.nameBn
              : market.mandi.name}
        </span>
        <span className="shrink-0 tabular-nums tracking-wide">{market.mandi.code}</span>
      </footer>
    </section>
  );
}

function BoardRow({ language, rate }: { language: Language; rate: MarketRate }) {
  const t = copy[language];
  const up = rate.delta > 0;
  const flat = rate.delta === 0;
  const tone = flat ? "var(--color-board-muted)" : up ? "var(--color-up)" : "var(--color-down)";

  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 text-base font-semibold leading-tight">
          {/* The emoji is a marker to find the row by, not the row's headline — kept
              small and muted so the numbers stay the loudest thing on the board. */}
          <span aria-hidden className="text-sm opacity-70">
            {rate.emoji}
          </span>
          <span className="truncate">{commodityName(rate, language)}</span>
        </span>
        {/* Range and volume on one line, clipped rather than wrapped: a board row that
            reflows to two lines stops being a row you can run your eye down. */}
        <span className="truncate text-xs tabular-nums text-board-muted">
          ₹{rate.low}–{rate.high}
          {rate.arrivalsQtl > 0 && (
            <> · {fill(t.arrivalsQtl, { n: grouped(rate.arrivalsQtl) })}</>
          )}
        </span>
      </div>

      <span className="w-[66px] shrink-0 text-right text-lg font-bold leading-none tabular-nums">
        ₹{rate.price}
        <span className="text-xs font-normal text-board-muted">/{rate.unit}</span>
      </span>

      <span className="flex w-[40px] shrink-0 justify-center">
        <Sparkline values={rate.trend} color={tone} width={38} height={18} />
      </span>

      <span
        className="w-[44px] shrink-0 text-right text-sm font-semibold tabular-nums"
        style={{ color: tone }}
      >
        {flat ? "—" : `${up ? "+" : "−"}₹${Math.abs(rate.delta)}`}
      </span>
    </div>
  );
}
