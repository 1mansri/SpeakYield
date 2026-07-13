"use client";

import { ArrowLeft, CheckCircle, IndianRupee, MapPin, Truck, Wheat } from "lucide-react";
import { DeliveryPartner, Draft, Language, MatchPartner } from "@/lib/types";
import { copy } from "@/lib/copy";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function MatchResultScreen({
  language,
  draft,
  match,
  delivery,
  onBack,
  onConfirmPayment,
}: {
  language: Language;
  draft: Draft;
  match: MatchPartner;
  delivery: DeliveryPartner;
  onBack: () => void;
  onConfirmPayment: () => void;
}) {
  const t = copy[language];

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
        <p className="text-lg font-semibold">{match.name}</p>
        <div className="flex items-center gap-3 text-text-secondary">
          <MapPin size={20} />
          <span>{match.distanceKm} km</span>
        </div>
        <div className="flex items-center gap-3">
          <Wheat size={20} className="text-primary" />
          <span>
            {draft.quantity} {draft.unit} @ <IndianRupee size={14} className="inline" />
            {draft.price}/{draft.unit}
          </span>
        </div>
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

      <div className="mt-auto">
        <Button variant="accent" onClick={onConfirmPayment}>
          {t.confirmPayment}
        </Button>
      </div>
    </div>
  );
}
