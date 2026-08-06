"use client";

import { BadgeCheck, Globe, LogOut, MapPin, User as UserIcon, Wallet } from "lucide-react";
import { Language, User } from "@/lib/types";
import { copy } from "@/lib/copy";
import Button from "@/components/ui/Button";

const LANGUAGE_NAMES: Record<Language, string> = {
  hi: "हिंदी",
  bn: "বাংলা",
  en: "English",
};

export default function ProfileScreen({
  language,
  user,
  onLanguageSwitch,
  onLogout,
}: {
  language: Language;
  user: User | null;
  onLanguageSwitch: () => void;
  onLogout: () => void;
}) {
  const t = copy[language];

  return (
    <div className="flex flex-col gap-5 pt-3">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserIcon size={28} />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xl font-bold text-text-primary">
            <span className="truncate">{user?.name ?? "—"}</span>
            {/* A verified counterparty is the thing a marketplace sells; the farmer's own
                badge is the same claim pointed inward. */}
            <BadgeCheck size={18} className="shrink-0 text-primary" />
          </p>
          <p className="text-base text-text-secondary">
            {t.roleFarmer} · {user?.id ?? "—"}
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        <Row icon={<MapPin size={19} />} label={t.profileLocation} value={user?.location ?? "—"} />
        <Row icon={<Globe size={19} />} label={t.profileLanguage} value={LANGUAGE_NAMES[language]} />
        <Row icon={<Wallet size={19} />} label={t.profilePayment} value={t.paymentUpi} />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button variant="outline" onClick={onLanguageSwitch}>
          <Globe size={20} />
          {t.changeLanguage}
        </Button>
        <Button variant="ghost" onClick={onLogout}>
          <LogOut size={19} />
          {t.logout}
        </Button>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-text-secondary">{icon}</span>
      <span className="flex-1 text-base text-text-secondary">{label}</span>
      <span className="truncate text-base font-semibold text-text-primary">{value}</span>
    </div>
  );
}
