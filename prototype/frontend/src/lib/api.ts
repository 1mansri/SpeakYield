import {
  Action,
  CommandResult,
  Decision,
  Draft,
  DeliveryPartner,
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
export async function getOptions(draft: Draft): Promise<PartnerOption[]> {
  const res = await fetch(`${API_URL}/api/${kindFor(draft.action)}/options`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new ApiError("Could not load options");
  const data: { options: BackendPartnerOption[] } = await res.json();
  return data.options.map(toOption);
}

export async function createMatch(draft: Draft, partnerId: string): Promise<MatchAndDelivery> {
  const res = await fetch(`${API_URL}/api/${kindFor(draft.action)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft, partner_id: partnerId }),
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
