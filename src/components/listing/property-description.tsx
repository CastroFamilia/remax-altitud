"use client";

import React, { useMemo } from "react";
import {
  MapPin,
  Sparkles,
  Info,
  MessageSquare,
  DollarSign,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

interface DescriptionSection {
  title: string;
  content: string;
  items?: { label?: string; value: string }[];
}

interface ParsedDescription {
  intro: string;
  sections: DescriptionSection[];
}

interface PropertyDescriptionProps {
  description: string;
}

// Map headings to Lucide icons and styled accents
interface ThemeStyle {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  bg: string;
  border: string;
  text: string;
  iconBg: string;
  iconColor: string;
}

const SECTION_THEMES: Record<string, ThemeStyle> = {
  location: {
    icon: MapPin,
    bg: "bg-blue-50/50 dark:bg-blue-950/10",
    border: "border-blue-150 dark:border-blue-900/30",
    text: "text-blue-900 dark:text-blue-200",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-650 dark:text-blue-400",
  },
  features: {
    icon: Sparkles,
    bg: "bg-emerald-50/50 dark:bg-emerald-950/10",
    border: "border-emerald-150 dark:border-emerald-900/30",
    text: "text-emerald-900 dark:text-emerald-200",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-650 dark:text-emerald-400",
  },
  conditions: {
    icon: DollarSign,
    bg: "bg-amber-50/50 dark:bg-amber-950/10",
    border: "border-amber-150 dark:border-amber-900/30",
    text: "text-amber-900 dark:text-amber-200",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-650 dark:text-amber-450",
  },
  services: {
    icon: ShieldCheck,
    bg: "bg-teal-50/50 dark:bg-teal-950/10",
    border: "border-teal-150 dark:border-teal-900/30",
    text: "text-teal-900 dark:text-teal-200",
    iconBg: "bg-teal-100 dark:bg-teal-900/40",
    iconColor: "text-teal-650 dark:text-teal-400",
  },
  requirements: {
    icon: UserCheck,
    bg: "bg-violet-50/50 dark:bg-violet-950/10",
    border: "border-violet-150 dark:border-violet-900/30",
    text: "text-violet-900 dark:text-violet-200",
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-650 dark:text-violet-400",
  },
  contact: {
    icon: MessageSquare,
    bg: "bg-rose-50/50 dark:bg-rose-950/10",
    border: "border-rose-150 dark:border-rose-900/30",
    text: "text-rose-900 dark:text-rose-200",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
    iconColor: "text-rose-650 dark:text-rose-455",
  },
  default: {
    icon: Info,
    bg: "bg-slate-50/50 dark:bg-slate-900/10",
    border: "border-slate-150 dark:border-slate-800/30",
    text: "text-slate-905 dark:text-slate-200",
    iconBg: "bg-slate-100 dark:bg-slate-800/60",
    iconColor: "text-slate-650 dark:text-slate-400",
  },
};

/**
 * Get visual theme style based on the section heading text
 */
function getSectionTheme(title: string): ThemeStyle {
  const normalized = title.toLowerCase();
  if (
    normalized.includes("ubicación") ||
    normalized.includes("location") ||
    normalized.includes("ubicacion")
  ) {
    return SECTION_THEMES.location;
  }
  if (
    normalized.includes("características") ||
    normalized.includes("features") ||
    normalized.includes("caracteristicas") ||
    normalized.includes("sociales")
  ) {
    return SECTION_THEMES.features;
  }
  if (
    normalized.includes("condiciones") ||
    normalized.includes("price") ||
    normalized.includes("precio") ||
    normalized.includes("beneficios") ||
    normalized.includes("benefits")
  ) {
    return SECTION_THEMES.conditions;
  }
  if (normalized.includes("servicios") || normalized.includes("services")) {
    return SECTION_THEMES.services;
  }
  if (
    normalized.includes("requisitos") ||
    normalized.includes("requirements") ||
    normalized.includes("contrato")
  ) {
    return SECTION_THEMES.requirements;
  }
  if (
    normalized.includes("contacto") ||
    normalized.includes("contact") ||
    normalized.includes("agenda")
  ) {
    return SECTION_THEMES.contact;
  }
  return SECTION_THEMES.default;
}

/**
 * Robust parsing to split compressed, un-spaced WhatsApp/CRM descriptions into
 * beautiful, structured layout elements.
 */
function parseDescription(text: string): ParsedDescription {
  if (!text) return { intro: "", sections: [] };

  // 1. Clean copy-paste junk at the very start
  // e.g. [4:37 p. m., 30/5/2026] Tatiana Remax Altitud:
  let cleaned = text.replace(
    /^\[\d{1,2}:\d{2}\s*(?:p\.\s*m\.|a\.\s*m\.|[ap]\.?m\.?|AM|PM)[^\]]*\]\s*[^:]+:\s*/i,
    "",
  );

  // 2. Fix periods immediately followed by capital letters without space (common feed issue)
  cleaned = cleaned.replace(/([.!?])([A-ZÑÁÉÍÓÚÜ])/g, "$1 $2");

  // Fix lowercase/number/parenthesis immediately followed by a Capital letter that has a colon shortly after (a label).
  cleaned = cleaned.replace(
    /([a-záéíóúñü0-9)])([A-ZÑÁÉÍÓÚÜ][a-záéíóúñü\sA-Z]{1,30}:)/g,
    (match, p1, p2) => {
      return p1 + "\n" + p2;
    },
  );

  // Fix missing newline after a colon (when squished)
  cleaned = cleaned.replace(/:([A-ZÑÁÉÍÓÚÜ])/g, ":\n$1");

  // 3. Spacing repair around specific headers
  const majorHeaders = [
    "Descripción",
    "Description",
    "Ubicación Privilegiada",
    "Ubicación",
    "Location",
    "Ubicacion",
    "Características de la Propiedad",
    "Technical Features",
    "Características Técnicas",
    "Características",
    "Caracteristicas",
    "Exclusive Benefits",
    "Beneficios Exclusivos",
    "Features",
    "Condiciones del Alquiler y Beneficios",
    "Condiciones del Alquiler",
    "Condiciones",
    "Rental Conditions",
    "Servicios Incluidos",
    "Included Services",
    "Servicios",
    "Requisitos de Contrato",
    "Requisitos",
    "Requirements",
    "Depósito de Garantía",
    "Garantía",
    "Deposit",
    "Contácteme hoy mismo",
    "Contácteme",
    "Contact",
    "Contacto",
    "Contáctenos",
    "Dormitorios",
    "Bedrooms",
    "Parqueo",
    "Parking",
    "Exteriores",
    "Exterior",
    "Áreas Sociales",
    "Social Areas",
    "Precio Mensual",
    "Monthly Price",
  ];

  // Force spaces around headings that have been squashed
  // e.g. CocheraDescripción -> Cochera\n\nDescripción
  const headingRegex = new RegExp(
    `([a-zñáéíóúüA-Z0-9.!?)]\\s*)(${majorHeaders.join("|")})\\b`,
    "g",
  );
  cleaned = cleaned.replace(headingRegex, "$1\n\n$2");

  // Force newlines before sub-items (short Capitalized phrases ending in colon)
  // e.g. "this propertyU. S. Financing: Available..." -> "this property\nU. S. Financing: Available..."
  cleaned = cleaned.replace(/([a-z0-9.!?,])\s*([A-ZÑÁÉÍÓÚÜ][^:\n]{2,25}:)/g, "$1\n$2");

  // 4. Split by newlines
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let intro = "";
  const sections: DescriptionSection[] = [];
  let currentSection: DescriptionSection | null = null;

  for (const line of lines) {
    // Check if it matches a key heading or is a short line ending with a colon
    const isHeader =
      majorHeaders.some((h) => {
        const lowerLine = line.toLowerCase();
        const lowerH = h.toLowerCase();
        return lowerLine === lowerH || lowerLine === `${lowerH}:`;
      }) ||
      (line.length < 45 && line.endsWith(":"));

    if (isHeader) {
      const title = line.replace(/:$/, "").trim();
      currentSection = { title, content: "", items: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      // Check if line contains a sub-item, e.g. "Dormitorios: 3 habitaciones..."
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match && match[1].length < 25) {
        currentSection.items = currentSection.items || [];
        currentSection.items.push({
          label: match[1].trim(),
          value: match[2].trim(),
        });
      } else {
        if (currentSection.content) {
          currentSection.content += "\n" + line;
        } else {
          currentSection.content = line;
        }
      }
    } else {
      if (intro) {
        intro += "\n" + line;
      } else {
        intro = line;
      }
    }
  }

  // Fallback: If no sections were parsed but the text is long,
  // we might want to split it by sentences or paragraphs to improve readability
  if (sections.length === 0 && intro.length > 300) {
    // Split sentences into small readable paragraphs if it's a huge single block
    const paragraphs = intro.split(/(?<=[.!?])\s+(?=[A-ZÑÁÉÍÓÚÜ])/);
    if (paragraphs.length > 2) {
      intro = paragraphs.slice(0, 2).join(" ");
      const bodyContent = paragraphs.slice(2).join(" ");
      sections.push({
        title: "Detalles",
        content: bodyContent,
        items: [],
      });
    }
  }

  return { intro, sections };
}

export function PropertyDescription({ description }: PropertyDescriptionProps) {
  const parsed = useMemo(() => parseDescription(description), [description]);

  if (!description) return null;

  return (
    <div className="space-y-6">
      {/* Intro Summary Banner */}
      {parsed.intro && (
        <div className="mb-12 space-y-6">
          {parsed.intro
            .replace(/\.\s+(?=[A-ZÑÁÉÍÓÚÜ])/g, ".\n")
            .split("\n")
            .filter((p) => p.trim().length > 0)
            .map((paragraph, idx) => (
              <p
                key={idx}
                className="text-lg md:text-xl font-light leading-relaxed tracking-wide text-slate-800 dark:text-slate-200"
              >
                {paragraph.trim()}
              </p>
            ))}
        </div>
      )}

      {/* Styled Responsive Sections Grid */}
      <div className="flex flex-col">
        {parsed.sections
          .filter((section) => {
            const lowerTitle = section.title.toLowerCase();
            return (
              !lowerTitle.includes("exclusive benefits") &&
              !lowerTitle.includes("beneficios exclusivos")
            );
          })
          .map((section, idx) => {
            const theme = getSectionTheme(section.title);
            const Icon = theme.icon;

            return (
              <div
                key={idx}
                className="group py-8 border-t border-slate-200 dark:border-slate-800 first:border-0 first:pt-0"
              >
                {/* Section Header */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 transition-transform duration-500 group-hover:scale-105">
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </span>
                  <h3 className="text-2xl font-light tracking-wide text-slate-900 dark:text-slate-100">
                    {section.title}
                  </h3>
                </div>

                {/* Section Items / Specifications Grid */}
                {section.items && section.items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-start gap-4 py-3 border-b border-slate-100 dark:border-slate-800/50"
                      >
                        <div className="space-y-1">
                          <span className="block text-xs font-medium uppercase tracking-widest text-slate-400">
                            {item.label}
                          </span>
                          <span className="block text-base font-light text-slate-800 dark:text-slate-200">
                            {item.value}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Section Body Text */}
                {section.content && (
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {section.content.split("\n").map((para, paraIdx) => (
                      <p
                        key={paraIdx}
                        className="mb-6 last:mb-0 text-base md:text-lg font-light leading-relaxed text-slate-600 dark:text-slate-300"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default PropertyDescription;
