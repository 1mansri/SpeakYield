"use client";

import { Globe, MapPin, User as UserIcon } from "lucide-react";
import { Language, User } from "@/lib/types";
import { copy } from "@/lib/copy";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const LANGUAGE_NAMES: Record<Language, string> = {
  hi: "हिंदी",
  bn: "বাংলা",
  en: "English",
};

export default function ProfileScreen({
  language,
  user,
  onLanguageSwitch,
}: {
  language: Language;
  user: User | null;
  onLanguageSwitch: () => void;
}) {
  const t = copy[language];

  return (
    <div className="flex flex-1 flex-col gap-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserIcon size={28} />
        </span>
        <div>
          <p className="text-xl font-bold text-text-primary">{user?.name ?? "—"}</p>
          <p className="text-base text-text-secondary">{t.roleFarmer}</p>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <Row icon={<MapPin size={20} />} label={t.profileLocation} value={user?.location ?? "—"} />
        <Row icon={<Globe size={20} />} label={t.profileLanguage} value={LANGUAGE_NAMES[language]} />
      </Card>

      <Button variant="outline" onClick={onLanguageSwitch}>
        <Globe size={20} />
        {t.changeLanguage}
      </Button>
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
    <div className="flex items-center gap-3">
      <span className="text-primary">{icon}</span>
      <span className="flex-1 text-base text-text-secondary">{label}</span>
      <span className="text-lg font-semibold text-text-primary">{value}</span>
    </div>
  );
}
