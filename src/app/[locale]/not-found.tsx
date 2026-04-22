import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold text-brand-navy">{t("title")}</h1>
      <p className="mb-8 max-w-md text-muted-foreground">{t("description")}</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-brand-navy-light"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
