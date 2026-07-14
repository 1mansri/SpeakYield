"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import LoginScreen from "@/components/screens/LoginScreen";
import WelcomeScreen from "@/components/screens/WelcomeScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import ListeningScreen from "@/components/screens/ListeningScreen";
import LoadingScreen from "@/components/screens/LoadingScreen";
import ConfirmDraftScreen from "@/components/screens/ConfirmDraftScreen";
import OptionsScreen from "@/components/screens/OptionsScreen";
import MatchResultScreen from "@/components/screens/MatchResultScreen";
import OrderStatusScreen from "@/components/screens/OrderStatusScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import Button from "@/components/ui/Button";
import { Action, DeliveryPartner, Draft, Language, PartnerOption, User } from "@/lib/types";
import { createMatch, extractIntent, getOptions, submitReview, transcribe } from "@/lib/api";
import { normalizeLanguage } from "@/lib/language";

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
  | "order"
  | "review"
  | "error";

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [previousScreen, setPreviousScreen] = useState<Screen>("home");
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [mode, setMode] = useState<Action>("sell");

  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [options, setOptions] = useState<PartnerOption[]>([]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [match, setMatch] = useState<PartnerOption | null>(null);
  const [delivery, setDelivery] = useState<DeliveryPartner | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const activeLanguage = language ?? "hi";

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

  function resetToHome() {
    setDraft(null);
    setOptions([]);
    setRecordId(null);
    setMatch(null);
    setDelivery(null);
    setTranscript("");
    setScreen("home");
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
      setOptions(loaded);
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
      const result = await createMatch(pricedDraft, option.id);
      setRecordId(result.id);
      setMatch(result.match);
      setDelivery(result.delivery);
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
      {screen === "login" && <LoginScreen onLoggedIn={handleLoggedIn} />}

      {screen === "welcome" && (
        <WelcomeScreen
          selected={language}
          onSelect={setLanguage}
          onContinue={() => setScreen("home")}
        />
      )}

      {screen === "home" && (
        <HomeScreen
          language={activeLanguage}
          userName={user?.name}
          mode={mode}
          onModeChange={setMode}
          onMicPress={() => setScreen("listening")}
          onLanguageSwitch={() => setScreen("welcome")}
        />
      )}

      {screen === "listening" && (
        <ListeningScreen
          language={activeLanguage}
          onCancel={() => setScreen("home")}
          onRecorded={handleRecorded}
        />
      )}

      {screen === "processing" && <LoadingScreen text="Understanding what you said..." />}

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

      {screen === "finding-options" && <LoadingScreen text="Finding your options..." />}

      {screen === "options" && draft && (
        <OptionsScreen
          language={activeLanguage}
          draft={draft}
          options={options}
          onBack={() => setScreen("confirm")}
          onChoose={handleChoose}
        />
      )}

      {screen === "matching" && <LoadingScreen text="Confirming..." />}

      {screen === "match" && draft && match && delivery && (
        <MatchResultScreen
          language={activeLanguage}
          draft={draft}
          match={match}
          delivery={delivery}
          onBack={() => setScreen("options")}
          onConfirmPayment={() => setScreen("order")}
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
            Try again
          </Button>
        </div>
      )}
    </Layout>
  );
}
