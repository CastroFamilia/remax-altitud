import "server-only";
import { z } from "zod";
import { normalizeCostaRicaPhone } from "../utils/phone";

/**
 * Zod schema for a single record in the RE/MAX CCA `AgentsPerOffice` feed.
 * Accepts the published fields; `Birthday` is intentionally stripped from the
 * output via the chained `.transform(...)` so API9 is enforced at the type
 * and runtime surface (it remains only inside `apiRaw` for downstream opt-in).
 */

const rawAgentApiSchemaBase = z
  .object({
    AssociateID: z.union([z.number(), z.string()]).transform((v) => String(v)),
    FirstName: z.string(),
    LastName: z.string(),
    REMAXID: z.string().nullish(),
    Mobile: z.string().nullish(),
    DirectPhone: z.string().nullish(),
    RemaxEmail: z.string().nullish(),
    NonRemaxEmail: z.string().nullish(),
    // Accepted so Zod doesn't reject, then never referenced in the transform output.
    Birthday: z.string().nullish(),
    StartDate: z.string().nullish(),
    AssociateStatus_en: z.string().nullish(),
    UrlImg: z.string().nullish(),
    Title: z.string().nullish(),
    Gender: z.string().nullish(),
    Lang: z.string().nullish(),
    OfficeID: z.number(),
    CountryID: z.number().nullish(),
    OfficeName: z.string().nullish(),
    TitleEs: z.string().nullish(),
  })
  .passthrough();

export const rawAgentApiSchema = rawAgentApiSchemaBase.transform((a) => {
  const name = `${a.FirstName} ${a.LastName}`.trim();
  const email = a.RemaxEmail && a.RemaxEmail.trim().length > 0 ? a.RemaxEmail.trim() : null;
  const phoneRaw = a.DirectPhone && a.DirectPhone.trim().length > 0 ? a.DirectPhone.trim() : null;
  const whatsapp = normalizeCostaRicaPhone(phoneRaw);

  let primaryLang: "en" | "es" | null = null;
  if (a.Lang === "English") primaryLang = "en";
  else if (a.Lang === "Spanish") primaryLang = "es";

  const role: "owner" | "associate" = a.Title === "Owner" ? "owner" : "associate";

  return {
    apiId: a.AssociateID,
    name,
    email,
    phone: phoneRaw,
    whatsapp,
    photoUrl: a.UrlImg && a.UrlImg.trim().length > 0 ? a.UrlImg.trim() : null,
    primaryLang,
    officeApiId: a.OfficeID,
    role,
  };
});

type RawAgentSchemaOutput = z.infer<typeof rawAgentApiSchema>;

/**
 * Normalized, privacy-safe shape of a RE/MAX agent record. `Birthday` is
 * intentionally absent — API9 forbids exposing it, and the schema's transform
 * never assigns it. `apiRaw` carries the original input for downstream JSONB
 * storage and is supplied by the parser.
 */
export type RawAgent = RawAgentSchemaOutput & { apiRaw: unknown };
