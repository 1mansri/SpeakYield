/**
 * Commodity imagery, keyed by the English catalog name the intent extractor returns.
 *
 * Text-and-icons-only screens read as chat; goods read as commerce. Emoji are used
 * deliberately over illustrations here — they render at any size, need no assets, and
 * survive a low-bandwidth phone, which is the device this product is designed for.
 */
const COMMODITY_EMOJI: Record<string, string> = {
  tomato: "🍅",
  potato: "🥔",
  onion: "🧅",
  rice: "🌾",
  wheat: "🌾",
  urea: "🧪",
  fertiliser: "🧪",
  fertilizer: "🧪",
  dap: "🧪",
  pesticide: "🧴",
  seeds: "🌱",
  seed: "🌱",
};

const FALLBACK_SELL = "🌾";
const FALLBACK_BUY = "📦";

/** Best-effort emoji for a commodity; falls back by action so nothing renders blank. */
export function commodityEmoji(commodity: string, action: "sell" | "buy" = "sell"): string {
  const needle = commodity.trim().toLowerCase();
  if (!needle) return action === "sell" ? FALLBACK_SELL : FALLBACK_BUY;

  for (const [key, emoji] of Object.entries(COMMODITY_EMOJI)) {
    if (needle.includes(key)) return emoji;
  }
  return action === "sell" ? FALLBACK_SELL : FALLBACK_BUY;
}
