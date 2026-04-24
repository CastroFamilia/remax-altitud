"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BalloonIcon } from "@/components/ui/balloon-icon";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <BalloonIcon size={80} className="mb-6" />

      <h1 className="mb-3 text-3xl font-bold text-brand-navy md:text-4xl">{t("title")}</h1>

      <p className="mb-8 max-w-md text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} size="lg">
          {t("tryAgain")}
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
