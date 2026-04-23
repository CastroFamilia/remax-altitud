// TODO: Verify real email and WhatsApp numbers with client before production launch.
// Placeholder emails and phone-derived WhatsApp numbers are in use until client confirms.

export interface Office {
  name: string;
  location: string;
  address: string;
  phone: string; // Human-readable, e.g. "+506 2771-0000"
  email: string; // e.g. "pz@remax-altitud.cr"
  whatsapp: string; // E.164 digits only for wa.me URLs, e.g. "50627710000"
  mapUrl?: string; // Google Maps share URL (optional)
}

export const offices: Office[] = [
  {
    name: "RE/MAX Altitud",
    location: "Pérez Zeledón",
    address: "San Isidro de El General, Pérez Zeledón, San José",
    phone: "+506 2771-0000",
    email: "pz@remax-altitud.cr",
    whatsapp: "50627710000",
  },
  {
    name: "RE/MAX Altitud Cero",
    location: "Dominical / Uvita",
    address: "Dominical, Osa, Puntarenas",
    phone: "+506 2787-0000",
    email: "dominical@remax-altitud.cr",
    whatsapp: "50627870000",
  },
];

export function buildWhatsAppUrl(office: Office, message?: string): string {
  if (!office.whatsapp) {
    return `tel:${office.phone.replace(/\s|-/g, "")}`;
  }
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${office.whatsapp}${text}`;
}
