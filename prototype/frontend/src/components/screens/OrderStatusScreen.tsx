"use client";

import { useEffect, useState } from "react";
import { CheckCircle, FileText, IndianRupee, ShieldCheck } from "lucide-react";
import { Action, CommandResult, Draft, Language, OrderStep } from "@/lib/types";
import { copy } from "@/lib/copy";
import { commodityEmoji } from "@/lib/commodities";
import { MOCK_FEES, ORDER_STEPS } from "@/lib/mockData";
import { getStatus } from "@/lib/api";
import { playText } from "@/lib/tts";
import AnswerMic from "@/components/AnswerMic";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const POLL_INTERVAL_MS = 1500;

export default function OrderStatusScreen({
  language,
  draft,
  recordId,
  kind,
  onDone,
}: {
  language: Language;
  draft: Draft;
  recordId: string;
  kind: "listings" | "orders";
  onDone: () => void;
}) {
  const t = copy[language];
  const [status, setStatus] = useState<OrderStep>("confirmed");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const result = await getStatus(kind, recordId);
        if (!cancelled) setStatus(result.status);
      } catch {
        // Transient network hiccup — the next poll tick will retry.
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [kind, recordId]);

  useEffect(() => {
    const speech = playText(t.promptDone, language);
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(result: CommandResult) {
    if (result.intent === "done") onDone();
  }

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === status);
  const gross = draft.quantity * draft.price;
  // Mirrors the backend's `_deal_amount`, which is what the deals tab shows. Two things
  // this receipt used to get wrong: on a *buy* the fees are paid by the farmer, so they
  // add rather than subtract; and on a small sell the flat fees can exceed the gross, so
  // the total is floored — a receipt reading "net −₹13" says the farmer owes money for
  // selling their crop.
  const selling = draft.action === "sell";
  const net = selling
    ? Math.max(0, gross - MOCK_FEES.platformFee - MOCK_FEES.deliveryFee)
    : gross + MOCK_FEES.platformFee + MOCK_FEES.deliveryFee;

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xl font-bold text-primary">
          <CheckCircle size={26} />
          {t.paymentDone}
        </div>
        {/* A deal has a number. Paperwork is how rural commerce establishes trust. */}
        <span className="text-sm tabular-nums text-text-secondary">
          {t.orderNo} {recordId.toUpperCase()}
        </span>
      </div>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              {commodityEmoji(draft.commodity, draft.action)}
            </span>
            {draft.commodity} · {draft.quantity} {draft.unit}
          </span>
          <span className="flex items-center font-semibold">
            <IndianRupee size={16} />
            {gross}
          </span>
        </div>
        {/* Signs follow the direction of the trade, so the arithmetic on screen actually
            adds up to the total below it. */}
        <div className="flex items-center justify-between text-text-secondary">
          <span>{t.platformFee}</span>
          <span>
            {selling ? "−" : "+"} ₹{MOCK_FEES.platformFee}
          </span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>{t.deliveryFee}</span>
          <span>
            {selling ? "−" : "+"} ₹{MOCK_FEES.deliveryFee}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-primary">
          <span>{selling ? t.netAmount : t.totalValue}</span>
          <span className="flex items-center tabular-nums">
            <IndianRupee size={18} />
            {net}
          </span>
        </div>

        {/* Settlement and invoicing, stated plainly — the paperwork a real trade produces. */}
        <div className="mt-1 flex flex-col gap-1 border-t border-border pt-2 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-primary" />
            {t.settledUpi}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText size={16} className="text-primary" />
            {t.gstNote}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col">
        {ORDER_STEPS.map((step, i) => (
          <StatusRow
            key={step.key}
            label={statusLabel(step.key, language, draft.action)}
            active={i <= currentStepIndex}
            current={i === currentStepIndex}
            last={i === ORDER_STEPS.length - 1}
          />
        ))}
      </Card>

      <div className="mt-auto flex flex-col gap-4">
        <AnswerMic language={language} decision="done" onResult={handleAnswer} />
        <Button variant="primary" onClick={onDone}>
          {t.done}
        </Button>
      </div>
    </div>
  );
}

/**
 * The fulfilment rail reads in the direction the goods actually move.
 *
 * Selling, the crop leaves the farm: it is picked *up* from them and delivered onward.
 * Buying, the goods come the other way: the dealer dispatches and it arrives at the
 * farm. The two middle steps are the same backend states — only the farmer's vantage
 * point differs, and a buy that says "picked up" is narrating someone else's day.
 */
function statusLabel(step: OrderStep, language: Language, action: Action) {
  const labels: Record<Language, Record<Action, Record<OrderStep, string>>> = {
    hi: {
      sell: {
        confirmed: "पुष्टि हुई",
        matched: "खरीदार मिल गया",
        "picked-up": "खेत से उठाया गया",
        delivered: "पहुँचा दिया गया",
      },
      buy: {
        confirmed: "पुष्टि हुई",
        matched: "दुकान मिल गई",
        "picked-up": "दुकान से रवाना",
        delivered: "आपके पास पहुँचा",
      },
    },
    bn: {
      sell: {
        confirmed: "নিশ্চিত হয়েছে",
        matched: "ক্রেতা মিলে গেছে",
        "picked-up": "খেত থেকে সংগ্রহ হয়েছে",
        delivered: "পৌঁছে দেওয়া হয়েছে",
      },
      buy: {
        confirmed: "নিশ্চিত হয়েছে",
        matched: "দোকান মিলে গেছে",
        "picked-up": "দোকান থেকে রওনা",
        delivered: "আপনার কাছে পৌঁছেছে",
      },
    },
    en: {
      sell: {
        confirmed: "Confirmed",
        matched: "Buyer matched",
        "picked-up": "Picked up from the farm",
        delivered: "Delivered",
      },
      buy: {
        confirmed: "Confirmed",
        matched: "Dealer matched",
        "picked-up": "Dispatched from the shop",
        delivered: "Arrived at your farm",
      },
    },
  };
  return labels[language][action][step];
}

/** One step of the fulfilment rail. The connecting line makes the sequence read as
 *  physical progress — goods moving — rather than as a list of messages. */
function StatusRow({
  label,
  active,
  current,
  last,
}: {
  label: string;
  active: boolean;
  current: boolean;
  last: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className={`h-3.5 w-3.5 rounded-full transition-colors duration-300 ${
            active ? "bg-primary" : "bg-border"
          } ${current && !last ? "animate-pulse ring-4 ring-primary/20" : ""}`}
        />
        {!last && (
          <span
            className={`w-0.5 flex-1 transition-colors duration-300 ${
              active ? "bg-primary" : "bg-border"
            }`}
          />
        )}
      </div>
      <span
        className={`pb-5 text-lg ${
          active ? "font-semibold text-text-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
