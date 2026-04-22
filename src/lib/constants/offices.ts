/**
 * Office location data for Footer component.
 * TODO: Populate with real addresses/phones from client once available.
 */

export interface Office {
  name: string;
  location: string;
  address: string;
  phone: string;
  mapUrl?: string;
}

export const offices: Office[] = [
  {
    name: "RE/MAX Altitud",
    location: "Pérez Zeledón",
    address: "San Isidro de El General, Pérez Zeledón, San José",
    phone: "+506 2771-0000",
  },
  {
    name: "RE/MAX Altitud Cero",
    location: "Dominical / Uvita",
    address: "Dominical, Osa, Puntarenas",
    phone: "+506 2787-0000",
  },
];
