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

export interface User {
  id: string;
  name: string;
  role: "farmer" | "buyer";
  location: string;
  language: Language;
}
