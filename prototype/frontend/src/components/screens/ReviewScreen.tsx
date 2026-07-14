"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { CommandResult, Language } from "@/lib/types";
import { copy } from "@/lib/copy";
import { playText } from "@/lib/tts";
import AnswerMic from "@/components/AnswerMic";
import Button from "@/components/ui/Button";

export default function ReviewScreen({
  language,
  partnerName,
  onSubmit,
  onSkip,
}: {
  language: Language;
  partnerName: string;
  onSubmit: (rating: number, comment: string) => void;
  onSkip: () => void;
}) {
  const t = copy[language];
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const speech = playText(t.promptReview, language);
    return () => speech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswer(result: CommandResult) {
    if (result.intent === "skip") {
      onSkip();
      return;
    }
    if (result.intent === "submit") {
      const stars = result.rating >= 1 && result.rating <= 5 ? result.rating : rating;
      const note = result.comment || comment;
      // Reflect what we heard, then submit — but only if we have a rating to send.
      if (stars >= 1) {
        setRating(stars);
        setComment(note);
        onSubmit(stars, note);
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div>
        <h2 className="text-xl font-bold text-primary">{t.reviewTitle}</h2>
        <p className="mt-1 text-base text-text-secondary">
          {partnerName} {t.reviewSubtitle}
        </p>
      </div>

      <div className="flex justify-center gap-2 py-2" role="radiogroup" aria-label={t.reviewTitle}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value}`}
            onClick={() => setRating(value)}
            className="p-1 transition-transform duration-100 active:scale-90"
          >
            <Star
              size={44}
              className={value <= rating ? "fill-accent text-accent" : "text-border"}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.reviewCommentHint}
        rows={3}
        className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-base text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
      />

      <div className="mt-auto flex flex-col gap-4">
        <AnswerMic language={language} decision="review" onResult={handleAnswer} />
        <Button variant="accent" disabled={rating === 0} onClick={() => onSubmit(rating, comment)}>
          {t.submitReview}
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          {t.skip}
        </Button>
      </div>
    </div>
  );
}
