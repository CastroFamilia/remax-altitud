"use client";

/**
 * VipBookingSection — Tabbed booking section for the VIP Buyer page.
 *
 * Renders two prominent tabs:
 *   1. Schedule a Call — Calendly iframe
 *   2. Send Us a Message — VipInquiryForm
 *
 * The second tab is made visually prominent with a hint badge
 * so visitors immediately see there's a low-friction alternative.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, MessageSquareText } from "lucide-react";
import { VipInquiryForm } from "@/components/lead/vip-inquiry-form";

type Tab = "schedule" | "form";

export function VipBookingSection() {
  const t = useTranslations("VipBuyerPage.booking");
  const [activeTab, setActiveTab] = useState<Tab>("schedule");

  return (
    <section id="call" className="bg-brand-navy py-20 text-white md:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">{t("heading")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/90">{t("subtitle")}</p>
        </div>

        {/* Tab Switcher */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="relative flex rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-sm">
            {/* Animated background slider */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-white/15 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                left: activeTab === "schedule" ? "6px" : "50%",
                width: "calc(50% - 6px)",
              }}
            />

            {/* Schedule Tab */}
            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "schedule" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
              aria-selected={activeTab === "schedule"}
              role="tab"
            >
              <CalendarDays className="h-4.5 w-4.5" />
              <span>{t("tabSchedule")}</span>
            </button>

            {/* Form Tab — with hint badge */}
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === "form" ? "text-white" : "text-white/50 hover:text-white/70"
              }`}
              aria-selected={activeTab === "form"}
              role="tab"
            >
              <MessageSquareText className="h-4.5 w-4.5" />
              <span>{t("tabForm")}</span>
              {/* Pulsing dot to draw attention */}
              {activeTab !== "form" && (
                <span className="relative ml-1 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-gold" />
                </span>
              )}
            </button>
          </div>

          {/* Hint text below tabs — only visible when Calendly is active */}
          {activeTab === "schedule" && (
            <p className="mt-3 text-center text-xs font-medium text-white/50 transition-opacity">
              💬 {t("tabFormHint")}
            </p>
          )}
        </div>

        {/* Tab Content */}
        <div className="mt-10">
          {activeTab === "schedule" ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
              <iframe
                src="https://calendly.com/acastro-remax-altitud/buyers-calendar?embed_domain=remax-altitud.cr&embed_type=Inline&primary_color=458ad0"
                width="100%"
                height="700px"
                style={{ border: 0 }}
                allowFullScreen
                title="Calendly Scheduler"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-sm sm:p-10">
              <VipInquiryForm />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
