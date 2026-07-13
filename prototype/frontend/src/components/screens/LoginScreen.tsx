"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { User } from "@/lib/types";
import { login, LoginError } from "@/lib/api";
import Button from "@/components/ui/Button";

export default function LoginScreen({
  onLoggedIn,
}: {
  onLoggedIn: (token: string, user: User) => void;
}) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
      <div className="text-center">
        <span className="text-5xl" aria-hidden>
          🌾
        </span>
        <h1 className="mt-2 text-2xl font-bold text-primary">Speak Yield</h1>
        <p className="mt-1 text-base text-text-secondary">Test login (mock users, not real auth)</p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <input
          type="text"
          placeholder="ID (e.g. farmer1)"
          value={id}
          onChange={(e) => setId(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-h-[44px] w-full rounded-xl border-2 border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border-2 border-border bg-surface px-4 text-lg text-text-primary outline-none focus:border-primary"
        />

        {error && (
          <div className="flex items-center gap-2 text-base font-medium text-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-2">
          <Button type="submit" variant="accent" disabled={loading || !id || !password}>
            {loading ? "Logging in..." : "Log in"}
          </Button>
        </div>
      </form>

      <div className="w-full rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
        <p className="mb-2 font-semibold text-text-primary">Test accounts:</p>
        <p>farmer1 / farmer123 — Ramesh Kumar (farmer, Hindi)</p>
        <p>farmer2 / farmer123 — Sita Devi (farmer, Bengali)</p>
        <p>buyer1 / buyer123 — Ramesh Traders (buyer, English)</p>
      </div>
    </div>
  );
}
