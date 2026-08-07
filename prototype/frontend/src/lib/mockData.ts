import { OrderStep } from "./types";

// Platform/delivery fees are a flat mock formula applied client-side to the real
// confirmed draft's price — there's no backend pricing endpoint for the prototype.
export const MOCK_FEES = {
  platformFee: 20,
  deliveryFee: 15,
};

// The fulfilment rail's order. Keys only — the wording is direction- and
// language-dependent (`statusLabel` in OrderStatusScreen), and an English label here
// would be a second source of truth that only ever drifts from it.
export const ORDER_STEPS: { key: OrderStep }[] = [
  { key: "confirmed" },
  { key: "matched" },
  { key: "picked-up" },
  { key: "delivered" },
];
