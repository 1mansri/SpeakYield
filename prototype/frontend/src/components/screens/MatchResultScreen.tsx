"use client";

import { useEffect } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle,
  IndianRupee,
  MapPin,
  Smartphone,
  Star,
  Truck,
  Wheat,
} from "lucide-react";
import { CommandResult, DeliveryPartner, Draft, Language, PartnerOption } from "@/lib/types";
import { copy } from "@/lib/copy";
import { playText } from "@/lib/tts";
import AnswerMic from "@/components/AnswerMic";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function MatchResultScreen({
  language,
  draft,
  match,
  delivery,
  onBack,
  onConfirmPayment,
  onSeeCounterparty,
}: {
  language: Language;
  draft: Draft;
  match: PartnerOption;
  delivery: DeliveryPartner;
  onBack: () => void;
  onConfirmPayment: () => void;
  onSeeCounterparty: () => void;
}) {
  const t = copy[language];
  const unit = draft.unit || "unit";

  useEffect(() => {
    const speech = playText(t.promptPay, language);
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(result: CommandResult) {
    if (result.intent === "pay") onConfirmPayment();
    else if (result.intent === "back") onBack();
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="flex items-center gap-2 text-xl font-bold text-primary">
        <CheckCircle size={26} />
        {t.matched}
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-lg font-semibold">
            {match.name}
            {match.reviews >= 100 && (
              <BadgeCheck size={18} className="text-primary" aria-label={t.verified} />
            )}
          </p>
          <span className="flex items-center gap-1 text-base font-semibold text-text-primary">
            <Star size={16} className="fill-accent text-accent" />
            {match.rating.toFixed(1)}
            <span className="text-sm font-normal text-text-secondary">({match.reviews})</span>
          </span>
        </div>
        <div className="flex items-center gap-3 text-text-secondary">
          <MapPin size={20} />
          <span>
            {match.location} · {match.distanceKm} {t.kmAway}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Wheat size={20} className="text-primary" />
          <span>
            {draft.quantity ? `${draft.quantity} ${unit} ` : ""}@{" "}
            <IndianRupee size={14} className="inline" />
            {match.price}/{unit}
          </span>
        </div>
        <p className="text-sm italic text-text-secondary">&ldquo;{match.review}&rdquo;</p>
      </Card>

      <Card className="flex items-center gap-3">
        <Truck size={22} className="text-primary" />
        <div>
          <p className="text-sm text-text-secondary">{t.delivery}</p>
          <p className="text-lg font-semibold">
            {delivery.name} ({delivery.vehicle})
          </p>
        </div>
      </Card>

      {/* Demo affordance: show that this deal exists on someone else's phone too. */}
      <button
        type="button"
        onClick={onSeeCounterparty}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-base font-semibold text-text-secondary hover:border-primary hover:text-primary"
      >
        <Smartphone size={18} />
        {match.role === "buyer" ? t.seeBuyerPhone : t.seeDealerPhone}
      </button>

      <div className="mt-auto flex flex-col gap-4">
        <AnswerMic language={language} decision="pay" onResult={handleAnswer} />
        <Button variant="accent" onClick={onConfirmPayment}>
          {t.confirmPayment}
        </Button>
      </div>
    </div>
  );
}
