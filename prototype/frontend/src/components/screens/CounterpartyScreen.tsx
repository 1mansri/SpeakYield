"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  IndianRupee,
  MapPin,
  Smartphone,
  Star,
  Wheat,
} from "lucide-react";
import { Draft, Language, PartnerOption } from "@/lib/types";
import { copy } from "@/lib/copy";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

/**
 * The same deal, on the counterparty's phone.
 *
 * This screen exists to answer one question a jury asks about a voice product: *is this a
 * marketplace, or an assistant?* An assistant cannot show you the other side, because
 * there isn't one. Here the farmer's request appears as an incoming offer in the buyer's
 * (or dealer's) inbox, priced and located, with accept/decline — the network made visible.
 *
 * It is explicitly framed as a demo view of another device, never disguised as the
 * farmer's own app.
 */
export default function CounterpartyScreen({
  language,
  draft,
  match,
  farmerName,
  onBack,
}: {
  language: Language;
  draft: Draft;
  match: PartnerOption;
  farmerName: string;
  onBack: () => void;
}) {
  const t = copy[language];
  const [accepted, setAccepted] = useState(false);
  const unit = draft.unit || "unit";
  const isBuyer = match.role === "buyer";
  const total = Math.round(draft.quantity * match.price);

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

      {/* Never let this be mistaken for the farmer's own screen. */}
      <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-accent/60 bg-accent/10 p-3">
        <Smartphone size={20} className="shrink-0 text-accent-dark" />
        <span className="text-base font-semibold text-accent-dark">
          {isBuyer ? t.buyerPhoneBanner : t.dealerPhoneBanner}
        </span>
      </div>

      {/* The counterparty's app identity — same platform, different side of the trade. */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <p className="text-lg font-bold text-primary">{t.buyerAppName}</p>
          <p className="text-sm text-text-secondary">{match.name}</p>
        </div>
        <span className="flex items-center gap-1 text-base font-semibold">
          <Star size={16} className="fill-accent text-accent" />
          {match.rating.toFixed(1)}
        </span>
      </div>

      <h2 className="text-xl font-bold text-text-primary">{t.newOffer}</h2>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Wheat size={22} className="text-primary" />
          <span className="text-xl font-bold">
            {draft.commodity} · {draft.quantity} {unit}
          </span>
        </div>

        <div className="flex items-center gap-3 text-text-secondary">
          <MapPin size={20} />
          <span className="text-base">
            {draft.location || match.location} · {match.distanceKm} {t.kmAway}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-base text-text-secondary">
            {t.fromFarmer}: {farmerName}
          </span>
          <span className="text-base tabular-nums text-text-secondary">
            ₹{match.price}/{unit}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">{t.totalValue}</span>
          <span className="flex items-center text-2xl font-bold tabular-nums text-primary">
            <IndianRupee size={20} />
            {total}
          </span>
        </div>
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        {accepted ? (
          <>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-4 text-lg font-bold text-primary">
              <CheckCircle size={22} />
              {t.offerAccepted}
            </div>
            <Button variant="accent" onClick={onBack}>
              {t.backToFarmer}
            </Button>
          </>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack}>
              {t.declineOffer}
            </Button>
            <Button variant="primary" onClick={() => setAccepted(true)}>
              <CheckCircle size={20} />
              {t.acceptOffer}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
