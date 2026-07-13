import { Draft, DeliveryPartner, MatchPartner, OrderStep, User } from "./types";

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

export async function speak(text: string, language: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/voice/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new ApiError("Read-back failed");
  return res.blob();
}

interface BackendMatchResponse {
  id: string;
  match: { name: string; role: string; distance_km: number };
  delivery: { name: string; vehicle: string };
}

interface MatchAndDelivery {
  id: string;
  match: MatchPartner;
  delivery: DeliveryPartner;
}

function toMatchAndDelivery(res: BackendMatchResponse): MatchAndDelivery {
  return {
    id: res.id,
    match: { name: res.match.name, role: res.match.role, distanceKm: res.match.distance_km },
    delivery: res.delivery,
  };
}

export async function createListing(draft: Draft): Promise<MatchAndDelivery> {
  const res = await fetch(`${API_URL}/api/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new ApiError("Could not create listing");
  return toMatchAndDelivery(await res.json());
}

export async function createOrder(draft: Draft): Promise<MatchAndDelivery> {
  const res = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  if (!res.ok) throw new ApiError("Could not create order");
  return toMatchAndDelivery(await res.json());
}

export async function getStatus(
  kind: "listings" | "orders",
  id: string,
): Promise<{ status: OrderStep; match: MatchPartner; delivery: DeliveryPartner }> {
  const res = await fetch(`${API_URL}/api/${kind}/${id}`);
  if (!res.ok) throw new ApiError("Could not fetch status");
  const data: BackendMatchResponse & { status: OrderStep } = await res.json();
  return {
    status: data.status,
    match: { name: data.match.name, role: data.match.role, distanceKm: data.match.distance_km },
    delivery: data.delivery,
  };
}
