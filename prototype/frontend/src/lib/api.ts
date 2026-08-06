import {
  Action,
  CommandResult,
  Decision,
  Draft,
  DealsData,
  DeliveryPartner,
  Market,
  OptionsResult,
  PartnerOption,
  OrderStep,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class LoginError extends Error {}
export class ApiError extends Error {}

export async function login(id: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });

  if (!res.ok) {
    throw new LoginError(res.status === 401 ? "invalid" : "unavailable");
  }

  return res.json();
}

export async function transcribe(
  audio: Blob,
  language: string,
): Promise<{ transcript: string; language: string }> {
  const form = new FormData();
  form.append("audio", audio, "recording.webm");
  form.append("language", language);

  const res = await fetch(`${API_URL}/api/voice/transcribe`, { method: "POST", body: form });
  if (!res.ok) throw new ApiError("Transcription failed");
  return res.json();
}

export async function extractIntent(transcript: string, language: string): Promise<Draft> {
  const res = await fetch(`${API_URL}/api/voice/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, language }),
  });
  if (!res.ok) throw new ApiError("Intent extraction failed");
  return res.json();
}

// Map a farmer's spoken answer on a decision screen to a structured intent. `choices`
// (option labels) is only used for the "choose" decision so the model can resolve
// "the cheapest one" / a partner name to an index.
export async function parseCommand(
  transcript: string,
  language: string,
  decision: Decision,
  choices?: string[],
): Promise<CommandResult> {
  const res = await fetch(`${API_URL}/api/voice/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript, language, decision, choices: choices ?? [] }),
  });
  if (!res.ok) throw new ApiError("Command parsing failed");
  return res.json();
}

export async function speak(text: string, language: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/voice/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new ApiError("Read-back failed");
  return res.blob();
}

interface BackendRate {
  commodity: string;
  name_hi: string;
  name_bn: string;
  unit: string;
  price: number;
  delta: number;
  emoji: string;
}

interface BackendDemand extends Omit<BackendRate, "price" | "delta"> {
  buyers: number;
  price_min: number;
  price_max: number;
  mandi_price: number;
}

// The market dashboard — today's rates plus live demand. One call, because it's the
// first paint of the app and a second round trip is a visible stall on a slow phone.
export async function getMarket(): Promise<Market> {
  const res = await fetch(`${API_URL}/api/market`);
  if (!res.ok) throw new ApiError("Could not load the market");
  const data: { rates: BackendRate[]; demand: BackendDemand[] } = await res.json();
  return {
    rates: data.rates.map((r) => ({
      commodity: r.commodity,
      nameHi: r.name_hi,
      nameBn: r.name_bn,
      unit: r.unit,
      price: r.price,
      delta: r.delta,
      emoji: r.emoji,
    })),
    demand: data.demand.map((d) => ({
      commodity: d.commodity,
      nameHi: d.name_hi,
      nameBn: d.name_bn,
      unit: d.unit,
      emoji: d.emoji,
      buyers: d.buyers,
      priceMin: d.price_min,
      priceMax: d.price_max,
      mandiPrice: d.mandi_price,
    })),
  };
}

interface BackendDeal {
  id: string;
  action: Action;
  commodity: string;
  quantity: number;
  unit: string;
  price: number;
  partner: string;
  status: OrderStep;
  amount: number;
  created_at: number;
}

// The farmer's standing record — live and completed deals, plus earnings. What makes
// the app a place they have a history in rather than a session that resets.
export async function getDeals(userId?: string): Promise<DealsData> {
  const query = userId ? `?user=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${API_URL}/api/deals${query}`);
  if (!res.ok) throw new ApiError("Could not load deals");
  const data: {
    deals: BackendDeal[];
    earned_this_month: number;
    deal_count: number;
  } = await res.json();
  return {
    deals: data.deals.map((d) => ({
      id: d.id,
      action: d.action,
      commodity: d.commodity,
      quantity: d.quantity,
      unit: d.unit,
      price: d.price,
      partner: d.partner,
      status: d.status,
      amount: d.amount,
      createdAt: d.created_at,
    })),
    earnedThisMonth: data.earned_this_month,
    dealCount: data.deal_count,
  };
}

interface BackendPartnerOption {
  id: string;
  name: string;
  role: "buyer" | "dealer";
  price: number;
  distance_km: number;
  rating: number;
  reviews: number;
  review: string;
  location: string;
  tags: PartnerOption["tags"];
}

interface BackendMatchResponse {
  id: string;
  match: BackendPartnerOption;
  delivery: { name: string; vehicle: string };
}

interface MatchAndDelivery {
  id: string;
  match: PartnerOption;
  delivery: DeliveryPartner;
}

function toOption(o: BackendPartnerOption): PartnerOption {
  return {
    id: o.id,
    name: o.name,
    role: o.role,
    price: o.price,
    distanceKm: o.distance_km,
    rating: o.rating,
    reviews: o.reviews,
    review: o.review,
    location: o.location,
    tags: o.tags,
  };
}

function toMatchAndDelivery(res: BackendMatchResponse): MatchAndDelivery {
  return { id: res.id, match: toOption(res.match), delivery: res.delivery };
}

const kindFor = (action: Action) => (action === "sell" ? "listings" : "orders");

// Price-discovery: who is buying/selling this, ranked, so the farmer picks rather than
// being auto-matched. `listings` -> buyers to sell to; `orders` -> dealers to buy from.
export async function getOptions(draft: Draft): Promise<OptionsResult> {
  const res = await fetch(`${API_URL}/api/${kindFor(draft.action)}/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new ApiError("Could not load options");
  const data: { options: BackendPartnerOption[]; mandi_price: number | null } = await res.json();
  return { options: data.options.map(toOption), mandiPrice: data.mandi_price };
}

export async function createMatch(
  draft: Draft,
  partnerId: string,
  userId?: string,
): Promise<MatchAndDelivery> {
  const res = await fetch(`${API_URL}/api/${kindFor(draft.action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, partner_id: partnerId, user_id: userId ?? null }),
  });
  if (!res.ok) throw new ApiError("Could not create match");
  return toMatchAndDelivery(await res.json());
}

export async function submitReview(
  recordId: string,
  rating: number,
  comment: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record_id: recordId, rating, comment }),
  });
  if (!res.ok) throw new ApiError("Could not submit review");
}

export async function getStatus(
  kind: "listings" | "orders",
  id: string,
): Promise<{ status: OrderStep; match: PartnerOption; delivery: DeliveryPartner }> {
  const res = await fetch(`${API_URL}/api/${kind}/${id}`);
  if (!res.ok) throw new ApiError("Could not fetch status");
  const data: BackendMatchResponse & { status: OrderStep } = await res.json();
  return { status: data.status, match: toOption(data.match), delivery: data.delivery };
}
