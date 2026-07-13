import { Draft, Language } from "./types";

export function readBackText(draft: Draft, language: Language): string {
  const templates: Record<Language, string> = {
    hi: `आपने कहा: ${draft.quantity} ${draft.unit} ${draft.commodity}, ₹${draft.price} प्रति ${draft.unit}`,
    bn: `আপনি বলেছেন: ${draft.quantity} ${draft.unit} ${draft.commodity}, ₹${draft.price} প্রতি ${draft.unit}`,
    en: `You said: ${draft.quantity} ${draft.unit} ${draft.commodity}, ₹${draft.price} per ${draft.unit}`,
  };
  return templates[language];
}
