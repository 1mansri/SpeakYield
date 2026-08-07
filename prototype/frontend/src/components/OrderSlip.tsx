"use client";

import { Draft, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { commodityEmoji, localCommodity, localUnit } from "@/lib/commodities";

/**
 * The spoken request, rendered as a mandi parchi rather than as a reply.
 *
 * This is the deliberate opposite of a chat bubble: a numbered, ruled, stamped document
 * the farmer is about to commit to. Rural commerce trust is built on paper, so the UI is
 * paper — the phone just fills it in for you.
 */
export default function OrderSlip({
  language,
  draft,
  slipNo,
}: {
  language: Language;
  draft: Draft;
  slipNo: string;
}) {
  const t = copy[language];
  // Same localisation the read-back uses, so the slip on screen and the slip spoken
  // aloud name the goods identically. The rates board already reads टमाटर; a confirm
  // slip that says "Tomato" is the one English word left in a Hindi transaction.
  const unit = localUnit(draft.unit, language);
  const item = draft.commodity ? localCommodity(draft.commodity, language) : "";

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-border bg-surface">
      <div className="flex items-center justify-between border-b-2 border-dashed border-border px-4 py-3">
        <span className="text-lg font-bold text-primary">
          {draft.action === "sell" ? t.slipSell : t.slipBuy}
        </span>
        <span className="text-sm tabular-nums text-text-secondary">
          {t.slipNo} {slipNo}
        </span>
      </div>

      <dl className="flex flex-col divide-y divide-border px-4">
        <SlipRow
          label={t.slipCommodity}
          value={item || t.notSet}
          emoji={draft.commodity ? commodityEmoji(draft.commodity, draft.action) : undefined}
          strong
        />
        <SlipRow
          label={t.slipQuantity}
          value={draft.quantity > 0 ? `${draft.quantity} ${unit}` : t.notSet}
        />
        <SlipRow
          label={t.slipRate}
          value={draft.price > 0 ? `₹${draft.price} / ${unit || "-"}` : t.marketPrice}
        />
        <SlipRow label={t.slipPlace} value={draft.location || t.notSet} />
      </dl>

      {/* The stamp is the honesty of the flow made visible: nothing has committed yet. */}
      <div className="flex items-center justify-center border-t-2 border-dashed border-border px-4 py-2.5">
        <span className="rounded-md border-2 border-accent/50 px-3 py-1 text-sm font-bold uppercase tracking-wide text-accent-dark">
          {t.slipNotFinal}
        </span>
      </div>
    </div>
  );
}

function SlipRow({
  label,
  value,
  emoji,
  strong = false,
}: {
  label: string;
  value: string;
  emoji?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-base text-text-secondary">{label}</dt>
      <dd
        className={`flex items-center gap-2 text-right tabular-nums ${
          strong ? "text-xl font-bold text-text-primary" : "text-lg font-semibold text-text-primary"
        }`}
      >
        {emoji && (
          <span aria-hidden className="text-2xl">
            {emoji}
          </span>
        )}
        {value}
      </dd>
    </div>
  );
}
