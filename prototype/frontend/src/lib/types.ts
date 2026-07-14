export type Language = "hi" | "bn" | "en";

export type Action = "sell" | "buy";

export interface Draft {
  action: Action;
  commodity: string;
  quantity: number;
  unit: string;
  price: number;
  location: string;
  confidence: number;
}

export type PartnerTag = "best_price" | "nearest" | "top_rated";

// A buyer (when selling) or dealer (when buying) the farmer can choose between —
// the unit shown on the options / price-discovery screen.
export interface PartnerOption {
  id: string;
  name: string;
  role: "buyer" | "dealer";
  price: number;
  distanceKm: number;
  rating: number;
  reviews: number;
  review: string;
  location: string;
  tags: PartnerTag[];
}

export interface MatchPartner {
  name: string;
  distanceKm: number;
  role: string;
}

export interface DeliveryPartner {
  name: string;
  vehicle: string;
}

export type OrderStep = "confirmed" | "matched" | "picked-up" | "delivered";

// A voice-answered decision on a screen. `decision` selects which intents the backend
// may return; `AnswerMic` records the answer and hands back the parsed CommandResult.
export type Decision = "confirm" | "choose" | "pay" | "done" | "review" | "language";

export interface CommandResult {
  intent: string;
  index: number;
  rating: number;
  comment: string;
  language: string;
  confidence: number;
}

export interface User {
  id: string;
  name: string;
  role: "farmer" | "buyer";
  location: string;
  language: Language;
}
