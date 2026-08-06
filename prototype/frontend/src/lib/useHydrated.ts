"use client";

import { useSyncExternalStore } from "react";

// The "store" here never changes — it flips once, from the server snapshot to the
// client one, at hydration. So there is nothing to subscribe to.
const noop = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False during the server render and the hydrating pass, true afterwards.
 *
 * The gate for anything read out of the browser — `localStorage`, `navigator` — which
 * the server has no answer for. Reading those behind this flag lets the value be
 * *derived during render* instead of synced in through an effect, so there's no
 * cascading re-render and no frame where the UI shows the wrong default.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, onClient, onServer);
}
