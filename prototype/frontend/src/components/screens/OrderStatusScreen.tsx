"use client";

import { useEffect, useState } from "react";
import { CheckCircle, FileText, IndianRupee, ShieldCheck } from "lucide-react";
import { CommandResult, Draft, Language, OrderStep } from "@/lib/types";
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
  const net = gross - MOCK_FEES.platformFee - MOCK_FEES.deliveryFee;

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
        <div className="flex items-center justify-between text-text-secondary">
          <span>{t.platformFee}</span>
          <span>- ₹{MOCK_FEES.platformFee}</span>
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span>{t.deliveryFee}</span>
          <span>- ₹{MOCK_FEES.deliveryFee}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-lg font-bold text-primary">
          <span>{t.netAmount}</span>
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
            label={statusLabel(step.key, language)}
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

function statusLabel(step: OrderStep, language: Language) {
  const labels: Record<Language, Record<OrderStep, string>> = {
    hi: {
      confirmed: "पुष्टि हुई",
      matched: "मिल गया",
      "picked-up": "उठाया गया",
      delivered: "पहुँचाया गया",
    },
    bn: {
      confirmed: "নিশ্চিত হয়েছে",
      matched: "মিলে গেছে",
      "picked-up": "সংগ্রহ হয়েছে",
      delivered: "পৌঁছে গেছে",
    },
    en: {
      confirmed: "Confirmed",
      matched: "Matched",
      "picked-up": "Picked up",
      delivered: "Delivered",
    },
  };
  return labels[language][step];
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
