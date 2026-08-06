"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Check, IndianRupee, MapPin, Star } from "lucide-react";
import { Action, CommandResult, Draft, Language, PartnerOption, PartnerTag } from "@/lib/types";
import { copy, fill } from "@/lib/copy";
import { playText } from "@/lib/tts";
import AnswerMic from "@/components/AnswerMic";
import SpreadBar, { mandiDelta } from "@/components/SpreadBar";
import Button from "@/components/ui/Button";

// Enough completed trades on the platform to carry a verified mark.
const VERIFIED_REVIEW_COUNT = 100;

function tagLabel(tag: PartnerTag, action: Action, t: Record<string, string>): string {
  if (tag === "best_price") return action === "sell" ? t.tagBestPriceSell : t.tagBestPriceBuy;
  if (tag === "nearest") return t.tagNearest;
  return t.tagTopRated;
}

export default function OptionsScreen({
  language,
  draft,
  options,
  mandiPrice,
  onBack,
  onChoose,
}: {
  language: Language;
  draft: Draft;
  options: PartnerOption[];
  mandiPrice: number | null;
  onBack: () => void;
  onChoose: (option: PartnerOption) => void;
}) {
  const t = copy[language];
  // Backend ranks best-first, so the top option is a sensible pre-selection — a farmer
  // can just hit Continue, or tap a different card to compare and pick their own.
  const [selectedId, setSelectedId] = useState<string | null>(options[0]?.id ?? null);
  const unit = draft.unit || "unit";
  const prices = options.map((o) => o.price);
  const selectedPrice = options.find((o) => o.id === selectedId)?.price ?? prices[0] ?? 0;

  useEffect(() => {
    const speech = playText(
      draft.action === "sell" ? t.promptChooseSell : t.promptChooseBuy,
      language,
    );
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Describe each option so the parser can resolve "the cheapest", a name, or "first".
  const choiceLabels = options.map(
    (o) =>
      `${o.name} — ₹${o.price}/${unit}, ${o.distanceKm} km away, rated ${o.rating.toFixed(1)}`,
  );

  function handleAnswer(result: CommandResult) {
    if (result.intent === "back") {
      onBack();
    } else if (result.intent === "choose" && result.index >= 0 && result.index < options.length) {
      const chosen = options[result.index];
      setSelectedId(chosen.id);
      onChoose(chosen);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
      >
        <ArrowLeft size={24} />
      </button>

      <div>
        <h2 className="text-xl font-bold text-primary">
          {draft.action === "sell" ? t.chooseSell : t.chooseBuy}
        </h2>
        {/* Liquidity, stated plainly: the farmer is being competed for. */}
        <p className="mt-1 text-base font-semibold text-text-primary">
          {fill(draft.action === "sell" ? t.biddingSell : t.biddingBuy, { n: options.length })}
        </p>
        <p className="mt-0.5 text-base text-text-secondary">
          {draft.action === "sell" ? t.priceHintSell : t.priceHintBuy}
        </p>
      </div>

      {prices.length > 0 && (
        <SpreadBar
          language={language}
          min={Math.min(...prices)}
          max={Math.max(...prices)}
          selected={selectedPrice}
          mandiPrice={mandiPrice}
          unit={unit}
        />
      )}

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedId(option.id)}
              className={`rounded-2xl border-2 bg-surface p-4 text-left transition-colors duration-150 ${
                selected
                  ? "border-primary shadow-[0_2px_8px_rgba(47,107,60,0.18)]"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-primary">{option.name}</span>
                  {/* Trade volume is the trust signal a marketplace has and a stranger
                      doesn't — mark the well-reviewed counterparties. */}
                  {option.reviews >= VERIFIED_REVIEW_COUNT && (
                    <BadgeCheck size={18} className="text-primary" aria-label={t.verified} />
                  )}
                  {selected && <Check size={20} className="text-primary" />}
                </div>
                <div className="flex items-center gap-1 text-base font-semibold text-text-primary">
                  <Star size={16} className="fill-accent text-accent" />
                  {option.rating.toFixed(1)}
                  <span className="text-sm font-normal text-text-secondary">
                    ({option.reviews})
                  </span>
                </div>
              </div>

              {option.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {option.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary"
                    >
                      {tagLabel(tag, draft.action, t)}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-2 text-sm italic text-text-secondary">&ldquo;{option.review}&rdquo;</p>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-text-secondary">
                  <MapPin size={18} />
                  <span className="text-base">
                    {option.location} · {option.distanceKm} {t.kmAway}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline text-lg font-bold text-primary">
                    <IndianRupee size={16} className="self-center" />
                    {option.price}
                    <span className="ml-0.5 text-sm font-normal text-text-secondary">/{unit}</span>
                  </div>
                  {/* What this offer is worth against the local rate — the reason to use
                      the platform at all, stated per option rather than in a pitch. */}
                  {(() => {
                    const delta = mandiDelta(option.price, mandiPrice, draft.action);
                    if (!delta) return null;
                    return (
                      <span
                        className={`text-sm font-semibold tabular-nums ${
                          delta.good ? "text-success" : "text-text-secondary"
                        }`}
                      >
                        {delta.key === "atMandi"
                          ? t.atMandi
                          : fill(t[delta.key], { d: delta.amount })}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-4 pt-2">
        <AnswerMic
          language={language}
          decision="choose"
          choices={choiceLabels}
          onResult={handleAnswer}
        />
        <Button
          variant="accent"
          disabled={!selectedId}
          onClick={() => {
            const chosen = options.find((o) => o.id === selectedId);
            if (chosen) onChoose(chosen);
          }}
        >
          {t.continue}
        </Button>
      </div>
    </div>
  );
}
