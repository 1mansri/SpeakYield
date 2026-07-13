import { OrderStep } from "./types";

// Platform/delivery fees are a flat mock formula applied client-side to the real
// confirmed draft's price — there's no backend pricing endpoint for the prototype.
export const MOCK_FEES = {
  platformFee: 20,
  deliveryFee: 15,
};

export const ORDER_STEPS: { key: OrderStep; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "matched", label: "Matched" },
  { key: "picked-up", label: "Picked up" },
  { key: "delivered", label: "Delivered" },
];
