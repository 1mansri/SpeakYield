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

// Price discovery for one request: who's competing for it, and what the local mandi
// pays today — the reference point that makes an offer legible as good or bad.
export interface OptionsResult {
  options: PartnerOption[];
  mandiPrice: number | null;
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

// ---- Market dashboard --------------------------------------------------------

export interface MarketRate {
  commodity: string;
  nameHi: string;
  nameBn: string;
  unit: string;
  price: number;
  delta: number;
  emoji: string;
}

export interface DemandSummary {
  commodity: string;
  nameHi: string;
  nameBn: string;
  unit: string;
  emoji: string;
  buyers: number;
  priceMin: number;
  priceMax: number;
  mandiPrice: number;
}

export interface Market {
  rates: MarketRate[];
  demand: DemandSummary[];
}

// ---- Deals (the farmer's standing record) ------------------------------------

export interface Deal {
  id: string;
  action: Action;
  commodity: string;
  quantity: number;
  unit: string;
  price: number;
  partner: string;
  status: OrderStep;
  amount: number;
  createdAt: number;
}

export interface DealsData {
  deals: Deal[];
  earnedThisMonth: number;
  dealCount: number;
}

// Which tab of the app shell is showing. The transaction flow (listening -> review)
// takes over the whole screen and is not a tab.
export type Tab = "market" | "deals" | "rates" | "profile";

export interface User {
  id: string;
  name: string;
  role: "farmer" | "buyer";
  location: string;
  language: Language;
}
