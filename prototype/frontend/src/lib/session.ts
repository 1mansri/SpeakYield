import { Language, User } from "./types";

const KEY = "speakyield.session";

export interface Session {
  token: string;
  user: User;
  language: Language;
}

/**
 * The signed-in session, kept across reloads.
 *
 * Not a security measure — the prototype's auth is mock — but an authenticity one: real
 * apps do not forget who you are when the page refreshes, and a demo that drops back to
 * a login form on every reload reads as a slide deck. Storage is wrapped because
 * private-browsing modes throw on access rather than returning null.
 */
export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    // Anything short of a whole session is treated as no session — a half-restored user
    // would surface as blank names and a dashboard querying `undefined`.
    if (!parsed.token || !parsed.user?.id || !parsed.language) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable — the app still works, it just won't survive a reload.
  }
}

/** Patch the stored session in place, e.g. after the farmer switches language. */
export function updateSession(patch: Partial<Session>): void {
  const current = loadSession();
  if (current) saveSession({ ...current, ...patch });
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
