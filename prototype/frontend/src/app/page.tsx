"use client";

import { useState } from "react";
import Layout, { FlowFrame } from "@/components/Layout";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/screens/LoginScreen";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import MarketScreen from "@/components/screens/MarketScreen";
import DealsScreen from "@/components/screens/DealsScreen";
import RatesScreen from "@/components/screens/RatesScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import ListeningScreen from "@/components/screens/ListeningScreen";
import LoadingScreen from "@/components/screens/LoadingScreen";
import ConfirmDraftScreen from "@/components/screens/ConfirmDraftScreen";
import OptionsScreen from "@/components/screens/OptionsScreen";
import MatchResultScreen from "@/components/screens/MatchResultScreen";
import CounterpartyScreen from "@/components/screens/CounterpartyScreen";
import OrderStatusScreen from "@/components/screens/OrderStatusScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import Button from "@/components/ui/Button";
import { Action, DeliveryPartner, Draft, Language, PartnerOption, Tab, User } from "@/lib/types";
import { createMatch, extractIntent, getOptions, submitReview, transcribe } from "@/lib/api";
import { normalizeLanguage } from "@/lib/language";
import { copy } from "@/lib/copy";

// "home" is the tabbed app shell; `tab` selects which surface it shows. Everything else
// is a step of the single-focus transaction flow, which renders outside the shell.
type Screen =
  | "login"
  | "welcome"
  | "home"
  | "listening"
  | "processing"
  | "confirm"
  | "finding-options"
  | "options"
  | "matching"
  | "match"
  | "counterparty"
  | "order"
  | "review"
  | "error";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [previousScreen, setPreviousScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Tab>("market");
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [mode, setMode] = useState<Action>("sell");

  const [transcript, setTranscript] = useState("");
  // Set when the farmer enters the flow by tapping a demand card rather than the mic.
  const [pendingCommodity, setPendingCommodity] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [options, setOptions] = useState<PartnerOption[]>([]);
  const [mandiPrice, setMandiPrice] = useState<number | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [match, setMatch] = useState<PartnerOption | null>(null);
  const [delivery, setDelivery] = useState<DeliveryPartner | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  // Bumped whenever a deal is created or completed, so the market dashboard and the
  // deals tab both re-read the farmer's record instead of showing a stale one.
  const [dealsVersion, setDealsVersion] = useState(0);

  const activeLanguage = language ?? "hi";
  const t = copy[activeLanguage];

  function handleLoggedIn(_token: string, loggedInUser: User) {
    setUser(loggedInUser);
    setLanguage(loggedInUser.language);
    setScreen("welcome");
  }

  function goToError(message: string, backTo: Screen) {
    setErrorMessage(message);
    setPreviousScreen(backTo);
    setScreen("error");
  }

  // Clears the in-flight transaction, not the farmer's record: the deal they just made
  // is now part of their history, so land on the market with the deals refreshed rather
  // than wiping the screen back to a blank slate.
  function resetToHome() {
    setDraft(null);
    setOptions([]);
    setMandiPrice(null);
    setRecordId(null);
    setMatch(null);
    setDelivery(null);
    setTranscript("");
    setPendingCommodity(null);
    setDealsVersion((v) => v + 1);
    setTab("market");
    setScreen("home");
  }

  // Browsing into the flow: tapping a demand card on the dashboard starts a sell for that
  // commodity. Entering the market by seeing an opportunity — not only by speaking into an
  // empty screen — is what separates a marketplace from an assistant.
  function handleSellCommodity(commodityLabel: string) {
    setMode("sell");
    setPendingCommodity(commodityLabel);
    setScreen("listening");
  }

  async function handleRecorded(audio: Blob) {
    setScreen("processing");
    try {
      const { transcript: rawTranscript, language: detectedLanguage } = await transcribe(
        audio,
        activeLanguage,
      );
      setTranscript(rawTranscript);
      const normalized = normalizeLanguage(detectedLanguage, activeLanguage);
      setLanguage(normalized);

      const extracted = await extractIntent(rawTranscript, normalized);
      setDraft(extracted);
      setMode(extracted.action); // speech-detected intent wins; the Home chip was only a hint
      setScreen("confirm");
    } catch {
      goToError("Couldn't process that recording. Check your connection and try again.", "home");
    }
  }

  // Confirm -> price-discovery: fetch who's buying/selling this, then let the farmer choose.
  async function handleConfirm() {
    if (!draft) return;
    setScreen("finding-options");
    try {
      const loaded = await getOptions(draft);
      setOptions(loaded.options);
      setMandiPrice(loaded.mandiPrice);
      setScreen("options");
    } catch {
      goToError("Couldn't load options right now. Try again.", "confirm");
    }
  }

  // Farmer picked a partner -> lock in their price and create the record against them.
  async function handleChoose(option: PartnerOption) {
    if (!draft) return;
    const pricedDraft = { ...draft, price: option.price };
    setDraft(pricedDraft);
    setScreen("matching");
    try {
      const result = await createMatch(pricedDraft, option.id, user?.id);
      setRecordId(result.id);
      setMatch(result.match);
      setDelivery(result.delivery);
      setDealsVersion((v) => v + 1);
      setScreen("match");
    } catch {
      goToError("Couldn't confirm that choice. Try again.", "options");
    }
  }

  async function handleReviewSubmit(rating: number, comment: string) {
    if (recordId) {
      try {
        await submitReview(recordId, rating, comment);
      } catch {
        // Review is a nice-to-have — never block the farmer's return home on it.
      }
    }
    resetToHome();
  }

  return (
    <Layout>
      {screen === "home" ? (
        <AppShell
          language={activeLanguage}
          location={user?.location ?? "Kharagpur"}
          tab={tab}
          onTabChange={setTab}
          onLanguageSwitch={() => setScreen("welcome")}
        >
          {tab === "market" && (
            <MarketScreen
              language={activeLanguage}
              userName={user?.name}
              userId={user?.id}
              refreshKey={dealsVersion}
              mode={mode}
              onModeChange={setMode}
              onMicPress={() => setScreen("listening")}
              onSellCommodity={handleSellCommodity}
            />
          )}
          {tab === "deals" && (
            <DealsScreen
              language={activeLanguage}
              userId={user?.id}
              refreshKey={dealsVersion}
            />
          )}
          {tab === "rates" && <RatesScreen language={activeLanguage} />}
          {tab === "profile" && (
            <ProfileScreen
              language={activeLanguage}
              user={user}
              onLanguageSwitch={() => setScreen("welcome")}
            />
          )}
        </AppShell>
      ) : (
        <FlowFrame>
          {screen === "login" && <LoginScreen onLoggedIn={handleLoggedIn} />}

          {screen === "welcome" && (
            <WelcomeScreen
              selected={language}
              onSelect={setLanguage}
              onContinue={() => setScreen("home")}
            />
          )}

          {screen === "listening" && (
            <ListeningScreen
              language={activeLanguage}
              hint={pendingCommodity ?? undefined}
              onCancel={() => {
                setPendingCommodity(null);
                setScreen("home");
              }}
              onRecorded={handleRecorded}
            />
          )}

          {screen === "processing" && <LoadingScreen text={t.loadingDraft} />}

          {screen === "confirm" && draft && (
            <ConfirmDraftScreen
              language={activeLanguage}
              transcript={transcript}
              draft={draft}
              onBack={() => setScreen("home")}
              onRetry={() => setScreen("listening")}
              onConfirm={handleConfirm}
            />
          )}

          {screen === "finding-options" && <LoadingScreen text={t.loadingBuyers} />}

          {screen === "options" && draft && (
            <OptionsScreen
              language={activeLanguage}
              draft={draft}
              options={options}
              mandiPrice={mandiPrice}
              onBack={() => setScreen("confirm")}
              onChoose={handleChoose}
            />
          )}

          {screen === "matching" && <LoadingScreen text={t.loadingConfirming} />}

          {screen === "match" && draft && match && delivery && (
            <MatchResultScreen
              language={activeLanguage}
              draft={draft}
              match={match}
              delivery={delivery}
              onBack={() => setScreen("options")}
              onConfirmPayment={() => setScreen("order")}
              onSeeCounterparty={() => setScreen("counterparty")}
            />
          )}

          {screen === "counterparty" && draft && match && (
            <CounterpartyScreen
              language={activeLanguage}
              draft={draft}
              match={match}
              farmerName={user?.name ?? ""}
              onBack={() => setScreen("match")}
            />
          )}

          {screen === "order" && draft && recordId && (
            <OrderStatusScreen
              language={activeLanguage}
              draft={draft}
              recordId={recordId}
              kind={draft.action === "sell" ? "listings" : "orders"}
              onDone={() => setScreen("review")}
            />
          )}

          {screen === "review" && match && (
            <ReviewScreen
              language={activeLanguage}
              partnerName={match.name}
              onSubmit={handleReviewSubmit}
              onSkip={resetToHome}
            />
          )}

          {screen === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
              <p className="text-lg font-semibold text-error">{errorMessage}</p>
              <Button variant="accent" onClick={() => setScreen(previousScreen)}>
                {t.retry}
              </Button>
            </div>
          )}
        </FlowFrame>
      )}
    </Layout>
  );
}
