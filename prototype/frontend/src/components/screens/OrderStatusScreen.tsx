"use client";

import { useEffect, useState } from "react";
import { CheckCircle, IndianRupee } from "lucide-react";
import { Draft, Language, OrderStep } from "@/lib/types";
import { copy } from "@/lib/copy";
import { MOCK_FEES, ORDER_STEPS } from "@/lib/mockData";
import { getStatus } from "@/lib/api";
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

  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === status);
  const gross = draft.quantity * draft.price;
  const net = gross - MOCK_FEES.platformFee - MOCK_FEES.deliveryFee;

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center gap-2 text-xl font-bold text-primary">
        <CheckCircle size={26} />
        {t.paymentDone}
      </div>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-lg">
          <span>
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
          <span className="flex items-center">
            <IndianRupee size={18} />
            {net}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        {ORDER_STEPS.map((step, i) => (
          <StatusRow
            key={step.key}
            label={statusLabel(step.key, language)}
            active={i <= currentStepIndex}
          />
        ))}
      </Card>

      <div className="mt-auto">
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

function StatusRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-3 w-3 rounded-full transition-colors duration-300 ${
          active ? "bg-primary" : "bg-border"
        }`}
      />
      <span className={`text-lg ${active ? "text-text-primary font-semibold" : "text-text-secondary"}`}>
        {label}
      </span>
    </div>
  );
}
