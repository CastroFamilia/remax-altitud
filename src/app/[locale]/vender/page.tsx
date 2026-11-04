import { redirect } from "@/i18n/navigation";

/** /vender era el preview de la landing; ahora vive en /sell. */
export default async function VenderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/sell", locale });
}
