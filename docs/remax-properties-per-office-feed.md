# RE/MAX CCA — PropertiesPerOffice API Feed Documentation

## Endpoint

```
GET https://api.remax-cca.com/api/PropertiesPerOffice/{OfficeGUID}
```

**Example:**
```
https://api.remax-cca.com/api/PropertiesPerOffice/FEA8746D-CC1D-41B8-89F3-D04AC98274AF
```

## Overview

Returns a **JSON array** of property listing objects for a given RE/MAX office. Each element represents a single active property listing with bilingual content (English/Spanish), geographic data, pricing, property features, agent info, and image gallery URLs.

---

## Response Format

| Aspect | Detail |
|---|---|
| **Content-Type** | `application/json` |
| **Root structure** | JSON Array `[ {...}, {...}, ... ]` |
| **Bilingual fields** | Suffixed `_en` (English) and `_es` (Spanish) |
| **Image delivery** | Azure CDN (`remaxcaribbeanandcentralamerica.azureedge.net`) |
| **Currency** | Prices in USD (`CurrencyId: 4`) |
| **Coordinate system** | WGS 84 (Latitude/Longitude as strings) |

---

## Field Reference

### Listing Identification

| Field | Type | Description | Example |
|---|---|---|---|
| `ListingId` | `integer` | Internal numeric listing ID | `113149` |
| `ListingKey` | `string` | Unique alphanumeric listing key | `"400142400001"` |

### Property Classification

| Field | Type | Description | Example |
|---|---|---|---|
| `PropertyTypeName_en` | `string` | Property type in English | `"House/Villa"`, `"Lot/Land"` |
| `PropertyTypeName_es` | `string` | Property type in Spanish | `"Casa/Villa"`, `"Lote/Terreno"` |
| `ListingContractType` | `integer` | Contract type ID | `1` (Sale) |
| `ContractType_en` | `string` | Contract type label (EN) | `"Sale"` |
| `ContractType_es` | `string` | Contract type label (ES) | `"Venta"` |
| `ListingProbableuseId` | `integer` | Probable use ID | `1` = General, `2` = Commercial |
| `ProbableUse` | `string` | Probable use label | `"General"`, `"RE/MAX Commercial"` |

### Listing Content (Bilingual)

| Field | Type | Description |
|---|---|---|
| `ListingTitle_en` | `string` | Listing headline in English |
| `ListingTitle_es` | `string` | Listing headline in Spanish |
| `PublicRemarks_en` | `string` | Full property description (EN). Contains `\r\n` line breaks |
| `publicRemarks_es` | `string` | Full property description (ES). **Note:** lowercase `p` — inconsistent casing |

> [!WARNING]
> The field `publicRemarks_es` uses **lowercase** `p` while `PublicRemarks_en` uses **uppercase** `P`. Consumers must handle this casing inconsistency.

### Listing Status & Dates

| Field | Type | Description | Example |
|---|---|---|---|
| `Status` | `string` | Listing status with description | `"Active: Available for sale/lease. The public sees it."` |
| `ListingContractDate` | `string (ISO 8601)` | Date listing contract was signed | `"2025-08-09T00:00:00"` |
| `ExpirationDate` | `string (ISO 8601)` | Listing expiration date | `"2025-11-09T00:00:00"` |
| `Listingagreementyn` | `string` | Listing agreement on file (`Y`/`N`) | `"Y"` |
| `Furnishedyn` | `string` | Property is furnished (`Y`/`N`) | `"N"` |

### Location / Geography

| Field | Type | Description | Example |
|---|---|---|---|
| `CountryId` | `integer` | Country ID | `1886` (Costa Rica) |
| `Country` | `string` | Country name | `"Costa Rica"` |
| `StateDepProvId` | `integer` | State/Province ID | `15694`, `15619` |
| `StateDepProv` | `string` | State/Province name | `"San José"`, `"Puntarenas"` |
| `LocationId` | `integer` | Location/Canton ID | `9107062`, `6628417` |
| `Location` | `string` | Location/Canton name | `"Pérez Zeledón"`, `"uvita"`, `"Buenos Aires"` |
| `UnparsedAddress` | `string` | Free-text address | `"San Francisco, Cajon, Perez Zeledon."` |
| `Latitude` | `string` | GPS latitude (WGS 84) | `"9.3549572"` |
| `Longitude` | `string` | GPS longitude (WGS 84) | `"-83.6350214"` |

> [!NOTE]
> `Latitude` and `Longitude` are returned as **strings**, not numbers. Parse to `float` for map integrations.

### Pricing

| Field | Type | Description | Example |
|---|---|---|---|
| `ListPrice` | `float` | Asking price | `199000.00` |
| `CurrencyId` | `integer` | Currency ID | `4` (USD) |
| `CurrencyListPrice` | `string` | Currency label | `"(USD) US Dollar"` |

### Property Features

| Field | Type | Nullable | Description |
|---|---|---|---|
| `BedroomsTotal` | `integer` | ✅ | Number of bedrooms (null for land) |
| `BathroomsFull` | `integer` | ✅ | Number of full bathrooms (null for land) |
| `Stories` | `integer` | ❌ | Number of stories (`0` for land) |
| `LotSizeArea` | `float` | ❌ | Lot size value | 
| `LotSizeUnitsId` | `integer` | ❌ | Lot size unit ID (`1` = Sq Mt) |
| `LotSizeUnits` | `string` | ❌ | Lot size unit label (`"Sq Mt"`) |
| `ConstructionSizeLiving` | `float` | ❌ | Living area size (often `0.00`) |
| `ConstructionSizeUnits` | `string` | ❌ | Construction unit label (`"Sq Mt"`) |
| `ConstructionSizeTotal` | `float` | ✅ | Total construction size (always null in sample) |
| `ConstructionSize` | `float` | ✅ | Construction size in sq mt |

### Amenities (Y/N Flags)

| Field | Type | Description |
|---|---|---|
| `Garage` | `string` | Has any garage (`Y`/`N`) |
| `GarageCovered` | `string` | Has covered garage (`Y`/`N`) |
| `GarageOpen` | `string` | Has open garage/parking (`Y`/`N`) |
| `GarageSpaces` | `integer` | Number of garage spaces |
| `MaidRoom` | `string` | Has maid's room (`Y`/`N`) |
| `Cooling` | `string` | Has cooling/AC (`Y`/`N`) |
| `PoolPrivate` | `string` | Has private pool (`Y`/`N`) |
| `Viewyn` | `string` | Has notable view (`Y`/`N`) |
| `GatedCommunity` | `string` | In gated community (`Y`/`N`) |

### Association / Community

| Field | Type | Nullable | Description |
|---|---|---|---|
| `AssociationNotes` | `string` | ✅ | HOA or association notes (always null in sample) |

### Media

| Field | Type | Nullable | Description |
|---|---|---|---|
| `Images` | `string` | ❌ | Pipe-delimited (`\|`) list of image URLs |
| `Videolink` | `string` | ✅ | External video link (usually null) |
| `EmbeddedVideoCode` | `string` | ✅ | Embedded video HTML code (usually null) |

> [!IMPORTANT]
> **Images** is a single string with URLs separated by the **pipe character** (`|`). Split on `|` to obtain individual image URLs. Images are hosted on Azure CDN at `remaxcaribbeanandcentralamerica.azureedge.net`.

**Image URL Pattern:**
```
https://remaxcaribbeanandcentralamerica.azureedge.net/images/{ListingKey}/v3/hd/{filename}
```

### Agent & Office

| Field | Type | Description | Example |
|---|---|---|---|
| `AssociateId` | `integer` | Agent's associate ID | `2400` |
| `FirstName` | `string` | Agent first name | `"Emma"` |
| `LastName` | `string` | Agent last name | `"Bennett"` |
| `OfficeID` | `integer` | Office numeric ID | `218` |
| `OfficeName` | `string` | Office name | `"RE/MAX ALTITUD"` |

---

## Observed Property Types

| `PropertyTypeName_en` | `PropertyTypeName_es` | Description |
|---|---|---|
| `House/Villa` | `Casa/Villa` | Residential homes, cabins, multi-family |
| `Lot/Land` | `Lote/Terreno` | Vacant land parcels |
| `Apartment` | `Apartamento` | Apartment units |
| `Commercial` | `Comercial` | Commercial properties |

## Observed Probable Uses

| `ListingProbableuseId` | `ProbableUse` |
|---|---|
| `1` | `General` |
| `2` | `RE/MAX Commercial` |

---

## Sample Listing (Minimal)

```json
{
  "ListingId": 113149,
  "ListingKey": "400142400001",
  "PropertyTypeName_en": "Lot/Land",
  "PropertyTypeName_es": "Lote/Terreno ",
  "ListingContractType": 1,
  "ContractType_en": "Sale",
  "ContractType_es": "Venta",
  "ListingTitle_en": "Mountain View Land for Sale...",
  "ListingTitle_es": "Terreno en Venta...",
  "PublicRemarks_en": "Are you searching for...",
  "publicRemarks_es": "¿Buscas un terreno...",
  "ListingProbableuseId": 1,
  "ProbableUse": "General",
  "Status": "Active: Available for sale/lease. The public sees it.",
  "Furnishedyn": "N",
  "ListingContractDate": "2025-08-09T00:00:00",
  "ExpirationDate": "2025-11-09T00:00:00",
  "Listingagreementyn": "Y",
  "CountryId": 1886,
  "Country": "Costa Rica",
  "StateDepProvId": 15694,
  "StateDepProv": "San José",
  "LocationId": 9107062,
  "Location": "Pérez Zeledón",
  "Garage": "N",
  "GarageCovered": "N",
  "GarageOpen": "Y",
  "GarageSpaces": 0,
  "MaidRoom": "N",
  "Cooling": "N",
  "PoolPrivate": "N",
  "Viewyn": "Y",
  "BedroomsTotal": null,
  "BathroomsFull": null,
  "Stories": 0,
  "LotSizeArea": 14757.00,
  "LotSizeUnitsId": 1,
  "LotSizeUnits": "Sq Mt",
  "ConstructionSizeLiving": 0.00,
  "ConstructionSizeUnits": "Sq Mt",
  "ConstructionSizeTotal": null,
  "ConstructionSize": null,
  "AssociationNotes": null,
  "GatedCommunity": "N",
  "ListPrice": 199000.00,
  "CurrencyId": 4,
  "CurrencyListPrice": "(USD) US Dollar",
  "Videolink": null,
  "Latitude": "9.3549572",
  "Longitude": "-83.6350214",
  "UnparsedAddress": "San Francisco, Cajon, Perez Zeledon.",
  "AssociateId": 2400,
  "Images": "https://...png|https://...png|...",
  "FirstName": "Emma",
  "LastName": "Bennett",
  "OfficeID": 218,
  "OfficeName": "RE/MAX ALTITUD",
  "EmbeddedVideoCode": null
}
```

---

## Data Quality Notes

| Issue | Detail |
|---|---|
| **Casing inconsistency** | `publicRemarks_es` vs `PublicRemarks_en` — lowercase vs PascalCase |
| **Trailing spaces** | `PropertyTypeName_es` values may have trailing whitespace (e.g., `"Lote/Terreno "`) |
| **Lat/Lng as strings** | Coordinates are strings, not numbers; some have extra decimal precision |
| **Null residential fields on land** | `BedroomsTotal`, `BathroomsFull`, `ConstructionSize` are null for `Lot/Land` types |
| **ConstructionSizeLiving** | Almost always `0.00` — use `ConstructionSize` instead for actual build area |
| **ConstructionSizeTotal** | Always null in sample data — may be unused |
| **GarageOpen always "Y"** | Even properties with `Garage: "N"` have `GarageOpen: "Y"` — may indicate open parking rather than enclosed |
| **Image filenames** | Contain spaces and special characters (e.g., `_1_.jpeg`, `(2).jpeg`) — URL-encode when using |
| **Status field** | Contains both a code and description in a single string — requires parsing if filtering |

---

## Integration Recommendations

1. **Parse images:** Split the `Images` string on `|` to get an array of URLs. URL-encode filenames with spaces.
2. **Handle nulls:** `BedroomsTotal`, `BathroomsFull`, `ConstructionSize`, `Videolink`, `EmbeddedVideoCode`, `AssociationNotes`, and `ConstructionSizeTotal` can all be `null`.
3. **Normalize casing:** Map `publicRemarks_es` → `PublicRemarks_es` internally for consistency.
4. **Coordinate parsing:** Convert `Latitude`/`Longitude` strings to `float`/`double` for map plotting.
5. **Date handling:** All dates are ISO 8601 with `T00:00:00` (no timezone) — treat as local Costa Rica time (UTC-6).
6. **Price display:** Always pair `ListPrice` with `CurrencyListPrice` for correct currency rendering.
7. **Status filtering:** If you need to filter by status, parse the string before the colon (e.g., `"Active"`).
