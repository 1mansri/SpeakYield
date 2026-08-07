"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff, KeyRound, LogIn, UserRound } from "lucide-react";
import { User } from "@/lib/types";
import { login, LoginError } from "@/lib/api";
import Button from "@/components/ui/Button";

/** The demo logins, as tappable rows. A tester at a stall shouldn't be typing
 *  `farmer123` on a phone keyboard — one tap fills the form. */
const TEST_ACCOUNTS: { id: string; password: string; name: string; detail: string }[] = [
  { id: "farmer1", password: "farmer123", name: "Ramesh Kumar", detail: "Farmer · हिंदी" },
  { id: "farmer2", password: "farmer123", name: "Sita Devi", detail: "Farmer · বাংলা" },
  { id: "buyer1", password: "buyer123", name: "Ramesh Traders", detail: "Buyer · English" },
];

const inputClass =
  "min-h-[52px] w-full rounded-2xl border-2 border-border bg-surface pl-12 pr-4 text-lg text-text-primary outline-none transition-colors duration-150 placeholder:text-text-secondary/70 focus:border-primary";

/**
 * The door into the mandi.
 *
 * The hero is the chalk board rather than a form card, so the first thing on screen is
 * the market's own object — the same slate the rates are written on everywhere else in
 * the app — and the login reads as entering a marketplace, not signing into a chat app.
 * The gate itself stays honestly labelled as a test build (see prototype/CLAUDE.md).
 */
export default function LoginScreen({
  onLoggedIn,
}: {
  onLoggedIn: (token: string, user: User) => void;
}) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(id, password);
      onLoggedIn(token, user);
    } catch (err) {
      setError(
        err instanceof LoginError && err.message === "invalid"
          ? "Invalid ID or password."
          : "Couldn't reach the server. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  }

  function fillAccount(account: (typeof TEST_ACCOUNTS)[number]) {
    setId(account.id);
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 py-4">
      <div className="rounded-3xl bg-board px-6 py-6 text-center shadow-[0_18px_40px_-24px_rgba(28,42,34,0.9)]">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-board-raised text-2xl"
          aria-hidden
        >
          🌾
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-board-ink">Speak Yield</h1>
        <p className="mt-1.5 text-sm text-board-muted">
          Sell your produce by speaking — in Hindi, Bengali or English.
        </p>
        <span className="mt-4 inline-block rounded-full border border-board-line bg-board-raised px-3 py-1 text-xs font-semibold tracking-wide text-board-muted uppercase">
          Test build · mock accounts
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <div className="relative">
          <UserRound
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            type="text"
            placeholder="ID (e.g. farmer1)"
            aria-label="ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="username"
            className={inputClass}
          />
        </div>

        <div className="relative">
          <KeyRound
            size={20}
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            type={revealed ? "text" : "password"}
            placeholder="Password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={`${inputClass} pr-14`}
          />
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors duration-150 hover:text-text-primary"
          >
            {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-base font-medium text-error"
          >
            <AlertCircle size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-2">
          <Button type="submit" variant="accent" disabled={loading || !id || !password}>
            {!loading && <LogIn size={20} />}
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </div>
      </form>

      <div>
        <p className="mb-2 px-1 text-sm font-semibold text-text-secondary">
          Or tap a test account
        </p>
        <div className="flex flex-col gap-2">
          {TEST_ACCOUNTS.map((account) => {
            const active = id === account.id;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => fillAccount(account)}
                className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors duration-150 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface hover:border-primary"
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold text-text-primary">
                    {account.name}
                  </span>
                  <span className="block truncate text-sm text-text-secondary">
                    {account.detail}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-background px-2.5 py-1 font-mono text-sm text-text-secondary">
                  {account.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
