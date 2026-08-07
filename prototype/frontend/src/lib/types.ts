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
  /** Today's session low and high — the range the price actually traded in. */
  low: number;
  high: number;
  /** Quintals arrived at the mandi today; volume is what makes a rate credible. */
  arrivalsQtl: number;
  /** Last 7 closes, oldest first — drives the sparkline. */
  trend: number[];
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

/**
 * The buy side's mirror of DemandSummary: who stocks one farm input, at what band, and
 * how far the nearest one is.
 *
 * There is no board rate for urea the way there is for tomato, so this carries
 * `nearestKm`/`nearestPrice` where DemandSummary carries `mandiPrice` — buying, the
 * question is "cheapest nearby, and how far", not "how far above the mandi".
 */
export interface SupplySummary {
  commodity: string;
  nameHi: string;
  nameBn: string;
  unit: string;
  emoji: string;
  dealers: number;
  priceMin: number;
  priceMax: number;
  nearestKm: number;
  nearestPrice: number;
}

/** The physical market the board belongs to, and the hours it trades. */
export interface MandiInfo {
  name: string;
  nameHi: string;
  nameBn: string;
  /** Regulated-market licence number, printed small on the board like the real thing. */
  code: string;
  opens: string;
  closes: string;
}

export type TickerKind = "bid" | "lot" | "arrival" | "settle";

/** One line of the live market feed: a bid moving, a lot clearing, arrivals landing. */
export interface TickerItem {
  kind: TickerKind;
  text: string;
  textHi: string;
  textBn: string;
  /** Epoch seconds, so the client can age the line as it sits on screen. */
  at: number;
}

export interface Market {
  rates: MarketRate[];
  /** Both directions, fetched together so the home screen's Sell/Buy switch is instant. */
  demand: DemandSummary[];
  supply: SupplySummary[];
  mandi: MandiInfo;
  ticker: TickerItem[];
  /** When the board was last chalked up (epoch seconds). */
  updatedAt: number;
  session: "open" | "closed";
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
  /** Settled this month in each direction — money in from crop, money out for inputs. */
  earnedThisMonth: number;
  spentThisMonth: number;
  dealCount: number;
  sellCount: number;
  buyCount: number;
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
