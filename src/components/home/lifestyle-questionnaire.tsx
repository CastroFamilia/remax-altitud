"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { PropertyCard } from "@/components/property/property-card";
import type { PropertySearchItem } from "@/types/search";
import { cn } from "@/lib/utils";

type Choice = "A" | "B" | "C";

interface LifestyleQuestionnaireProps {
  initialProperties: {
    A: PropertySearchItem[];
    B: PropertySearchItem[];
    C: PropertySearchItem[];
  };
  locale: string;
}

export function LifestyleQuestionnaire({ initialProperties, locale }: LifestyleQuestionnaireProps) {
  const t = useTranslations("LifestyleQuestionnaire");

  // Step 0: Welcome, Steps 1-4: Questions, Step 5: Results
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, Choice>>({});
  const [resultProfile, setResultProfile] = useState<Choice | null>(null);

  const totalQuestions = 4;

  const handleStart = () => {
    setAnswers({});
    setResultProfile(null);
    setStep(1);
  };

  const handleSelect = (choice: Choice) => {
    setAnswers((prev) => ({ ...prev, [step]: choice }));
  };

  const handleNext = () => {
    if (step < totalQuestions) {
      setStep((prev) => prev + 1);
    } else {
      // Calculate results
      const tallies = { A: 0, B: 0, C: 0 };
      Object.values(answers).forEach((ans) => {
        tallies[ans] = (tallies[ans] || 0) + 1;
      });

      // Determine profile with the highest tally (Mostly A, B, or C)
      let profile: Choice = "B"; // default/fallback
      if (tallies.A > tallies.B && tallies.A > tallies.C) {
        profile = "A";
      } else if (tallies.C > tallies.A && tallies.C > tallies.B) {
        profile = "C";
      } else if (tallies.B >= tallies.A && tallies.B >= tallies.C) {
        profile = "B";
      } else {
        // Handle ties gracefully
        if (tallies.A === tallies.B) {
          profile = "B"; // Eco-Luxury is highly desirable
        } else if (tallies.B === tallies.C) {
          profile = "B";
        } else {
          profile = "C";
        }
      }

      setResultProfile(profile);
      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      setStep(0);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResultProfile(null);
    setStep(0);
  };

  const currentSelection = answers[step];

  // Helper to check if results match a profile to return place descriptions
  const getPlacesForProfile = (profile: Choice) => {
    const key = profile.toLowerCase();
    if (profile === "C") {
      return [
        {
          name: t(`results.c.places.p1.name`),
          desc: t(`results.c.places.p1.desc`),
        },
        {
          name: t(`results.c.places.p2.name`),
          desc: t(`results.c.places.p2.desc`),
        },
      ];
    }

    return [
      {
        name: t(`results.${key}.places.p1.name`),
        desc: t(`results.${key}.places.p1.desc`),
      },
      {
        name: t(`results.${key}.places.p2.name`),
        desc: t(`results.${key}.places.p2.desc`),
      },
      {
        name: t(`results.${key}.places.p3.name`),
        desc: t(`results.${key}.places.p3.desc`),
      },
    ];
  };

  return (
    <section className="relative mx-auto my-8 max-w-3xl overflow-hidden rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-navy/95 to-brand-navy/90 p-5 text-white shadow-2xl md:p-6">
      {/* Subtle gold decorative glows */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-gold/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-gold/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-5 text-center">
          <span className="inline-block rounded-full bg-brand-gold/20 px-3 py-0.5 text-[9px] font-bold tracking-wider text-brand-gold uppercase">
            {t("title")}
          </span>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-white md:text-xl lg:text-2xl">
            &ldquo;{t("tagline")}&rdquo;
          </h2>
        </div>

        {/* STEP 0: Welcome Slide */}
        {step === 0 && (
          <div className="flex flex-col items-center text-center space-y-3 animate-fade-in">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md md:p-4">
              <h3 className="text-base font-semibold text-brand-gold md:text-lg">
                {t("welcome.heading")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-white/80 md:text-sm">
                {t("welcome.description")}
              </p>
              <p className="mt-2 text-[11px] font-medium text-brand-gold/90">
                {t("welcome.timeEstimate")}
              </p>
            </div>
            <button
              onClick={handleStart}
              className="group relative flex min-h-8 items-center rounded-lg bg-brand-gold px-5 py-2 text-xs font-semibold text-brand-navy shadow-lg transition-all duration-300 hover:scale-105 hover:bg-brand-gold-dark cursor-pointer"
            >
              {t("welcome.start")}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          </div>
        )}

        {/* STEPS 1-4: Questions */}
        {step >= 1 && step <= 4 && (
          <div className="space-y-4 animate-fade-in">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>
                {t("question")} {step} {t("of")} {totalQuestions}
              </span>
              <span className="font-semibold text-brand-gold">
                {Math.round((step / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10">
              <div
                className="h-1 rounded-full bg-brand-gold transition-all duration-500 ease-out"
                style={{ width: `${(step / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-brand-gold md:text-base">
                {t(`questions.q${step}.title`)}
              </h3>
              <p className="text-xs text-white/80">{t(`questions.q${step}.subtitle`)}</p>
            </div>

            {/* Choices Grid */}
            <div className="grid gap-2.5 mt-3">
              {(["A", "B", "C"] as Choice[]).map((opt) => {
                const isSelected = currentSelection === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex items-start text-left gap-2.5 rounded-lg border p-2.5 transition-all duration-200 backdrop-blur-sm cursor-pointer",
                      isSelected
                        ? "border-brand-gold bg-brand-gold/15 shadow-[0_0_12px_rgba(194,166,97,0.15)]"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold transition-all",
                        isSelected
                          ? "border-brand-gold bg-brand-gold text-brand-navy"
                          : "border-white/30 text-white/60",
                      )}
                    >
                      {opt}
                    </span>
                    <span className="text-xs font-medium leading-relaxed text-white/90">
                      {t(`questions.q${step}.${opt.toLowerCase()}`)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 mt-6 border-t border-white/10">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                {t("back")}
              </button>
              <button
                onClick={handleNext}
                disabled={!currentSelection}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold shadow-md transition-all duration-200",
                  currentSelection
                    ? "bg-brand-gold text-brand-navy hover:scale-102 hover:bg-brand-gold-dark cursor-pointer"
                    : "bg-white/10 text-white/40 cursor-not-allowed",
                )}
              >
                {step === totalQuestions ? t("seeResults") : t("next")}
                {step < totalQuestions && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Results Slide */}
        {step === 5 && resultProfile && (
          <div className="space-y-6 animate-fade-in">
            {/* Vibe & Profile Card */}
            <div className="rounded-xl border border-brand-gold/30 bg-white/5 p-4 backdrop-blur-md md:p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                Your Perfect Regional Match
              </span>
              <h3 className="mt-0.5 text-lg font-bold text-white md:text-xl">
                {t(`results.${resultProfile.toLowerCase()}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {t(`results.${resultProfile.toLowerCase()}.vibe`)}
              </p>

              {/* Best Matches Details */}
              <div className="mt-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold border-b border-white/10 pb-1.5">
                  {t(`results.${resultProfile.toLowerCase()}.matches`)}
                </h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getPlacesForProfile(resultProfile).map((place, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/5 bg-white/5 p-3 hover:border-white/10"
                    >
                      <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                        {place.name}
                      </h5>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/60">{place.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Property Recommendations */}
            <div className="space-y-3">
              <h4 className="text-center text-base font-bold text-brand-gold uppercase tracking-wider">
                {t("recommendedListings")}
              </h4>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {initialProperties[resultProfile]?.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-xl bg-card text-text-main shadow-md overflow-hidden"
                  >
                    <PropertyCard property={property} locale={locale} />
                  </div>
                ))}
              </div>
            </div>

            {/* Retake Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleRetake}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                {t("retake")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
