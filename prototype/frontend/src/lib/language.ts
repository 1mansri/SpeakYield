import { Language } from "./types";

export function normalizeLanguage(code: string, fallback: Language): Language {
  const prefix = code.split("-")[0]?.toLowerCase();
  if (prefix === "hi" || prefix === "bn" || prefix === "en") return prefix;
  return fallback;
}
