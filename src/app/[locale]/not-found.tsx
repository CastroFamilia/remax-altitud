import { getLocale, getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BalloonIcon } from "@/components/ui/balloon-icon";
import { Button } from "@/components/ui/button";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  setRequestLocale(locale);

  const t = await getTranslations("NotFound");

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <BalloonIcon size={80} className="mb-6" />

      <p
        className="mb-4 text-[8rem] font-extrabold leading-none text-brand-navy/10"
        aria-hidden="true"
      >
        {t("code")}
      </p>

      <h1 className="mb-3 text-3xl font-bold text-brand-navy md:text-4xl">{t("title")}</h1>

      <p className="mb-8 max-w-md text-muted-foreground">{t("description")}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">{t("backHome")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          {/* TODO: change to /search when Epic 3 is implemented */}
          <Link href="/">{t("browseProperties")}</Link>
        </Button>
      </div>
    </div>
  );
}
