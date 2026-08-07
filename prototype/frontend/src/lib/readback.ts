import { localCommodity, localUnit } from "./commodities";
import { copy } from "./copy";
import { Draft, Language } from "./types";

/**
 * The slip, spoken.
 *
 * This must say exactly what `OrderSlip` shows — including where a field is *missing*.
 * Farmers routinely don't state a price, and the extractor is instructed to return 0
 * rather than invent one, so a template that interpolates the raw draft reads "zero
 * rupees per kilo" aloud while the screen beside it says "market price". The farmer
 * hears the app quoting them a price of nothing on their own crop.
 *
 * So every field is guarded the same way the slip guards it, and the same copy strings
 * (`marketPrice`, `notSet`) carry the gaps — screen and speech cannot drift apart.
 */
export function readBackText(draft: Draft, language: Language): string {
  const t = copy[language];

  // Lead with the direction of the trade. The old template omitted it entirely, which is
  // the one word that decides whether the farmer is about to be paid or to pay.
  const head = draft.action === "sell" ? t.slipSell : t.slipBuy;

  // Spoken in the farmer's language, not the extractor's canonical English — a Hindi
  // voice pronouncing "Tomato" and "kg" is the app talking past the person it's for.
  const item = draft.commodity ? localCommodity(draft.commodity, language) : t.notSet;
  const unit = localUnit(draft.unit, language);
  const goods =
    draft.quantity > 0 ? `${draft.quantity} ${unit} ${item}`.replace(/\s+/g, " ") : item;

  const rate =
    draft.price > 0
      ? unit
        ? fillRate(t.ratePerUnit, draft.price, unit)
        : `₹${draft.price}`
      : t.marketPrice;

  return `${head}: ${goods}, ${rate}`;
}

function fillRate(template: string, price: number, unit: string): string {
  return template.replace("{price}", String(price)).replace("{unit}", unit);
}
