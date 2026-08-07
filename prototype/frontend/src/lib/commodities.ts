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

/**
 * Commodity and unit names in the farmer's language.
 *
 * The intent extractor returns canonical English ("Tomato", "kg") so the backend can
 * match it against the catalog. That's right for matching and wrong for reading aloud:
 * a Hindi slip that says "Tomato" — and a Hindi voice that pronounces it — is the app
 * speaking past the person it's for. The rates board already shows टमाटर, so the slip
 * and the read-back should too.
 *
 * Matching is substring-based like the emoji lookup above, so "Urea fertiliser" resolves.
 * Order matters: the more specific key must come first ("urea" before "fertiliser").
 */
const COMMODITY_NAMES: Record<string, { hi: string; bn: string }> = {
  tomato: { hi: "टमाटर", bn: "টমেটো" },
  potato: { hi: "आलू", bn: "আলু" },
  onion: { hi: "प्याज़", bn: "পেঁয়াজ" },
  rice: { hi: "चावल", bn: "চাল" },
  wheat: { hi: "गेहूँ", bn: "গম" },
  urea: { hi: "यूरिया", bn: "ইউরিয়া" },
  dap: { hi: "डीएपी", bn: "ডিএপি" },
  fertiliser: { hi: "खाद", bn: "সার" },
  fertilizer: { hi: "खाद", bn: "সার" },
  pesticide: { hi: "कीटनाशक", bn: "কীটনাশক" },
  seeds: { hi: "बीज", bn: "বীজ" },
  seed: { hi: "बीज", bn: "বীজ" },
};

// Units are short exact tokens, so these match whole rather than by substring — "l"
// inside "litre" (or any other word) must not win.
const UNIT_NAMES: Record<string, { hi: string; bn: string }> = {
  kg: { hi: "किलो", bn: "কেজি" },
  kilo: { hi: "किलो", bn: "কেজি" },
  quintal: { hi: "क्विंटल", bn: "কুইন্টাল" },
  ton: { hi: "टन", bn: "টন" },
  tonne: { hi: "टन", bn: "টন" },
  bag: { hi: "बोरी", bn: "বস্তা" },
  litre: { hi: "लीटर", bn: "লিটার" },
  liter: { hi: "लीटर", bn: "লিটার" },
  piece: { hi: "नग", bn: "পিস" },
};

/** The commodity in the farmer's language, falling back to whatever was extracted. */
export function localCommodity(commodity: string, language: "hi" | "bn" | "en"): string {
  const needle = commodity.trim().toLowerCase();
  if (!needle || language === "en") return commodity;

  for (const [key, names] of Object.entries(COMMODITY_NAMES)) {
    if (needle.includes(key)) return names[language];
  }
  return commodity;
}

/** The unit in the farmer's language, falling back to whatever was extracted. */
export function localUnit(unit: string, language: "hi" | "bn" | "en"): string {
  const needle = unit.trim().toLowerCase();
  if (!needle || language === "en") return unit;
  return UNIT_NAMES[needle]?.[language] ?? unit;
}

/** Best-effort emoji for a commodity; falls back by action so nothing renders blank. */
export function commodityEmoji(commodity: string, action: "sell" | "buy" = "sell"): string {
  const needle = commodity.trim().toLowerCase();
  if (!needle) return action === "sell" ? FALLBACK_SELL : FALLBACK_BUY;

  for (const [key, emoji] of Object.entries(COMMODITY_EMOJI)) {
    if (needle.includes(key)) return emoji;
  }
  return action === "sell" ? FALLBACK_SELL : FALLBACK_BUY;
}
