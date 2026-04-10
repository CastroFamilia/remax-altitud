# RE/MAX CCA API Documentation

> Last verified: 2026-04-09

## Base URL

```
https://api.remax-cca.com/api
```

## Authentication

- **None** — Public JSON endpoints, no API key required
- No rate limiting observed (but sync should still use polite delays)

---

## Office GUIDs

| Office | GUID | Location |
|--------|------|----------|
| **RE/MAX Altitud** | `FEA8746D-CC1D-41B8-89F3-D04AC98274AF` | Pérez Zeledón (mountain) |
| **RE/MAX Altitud Cero** | `4AD5AE8F-5B47-4A1A-A953-40445F2B4940` | Dominical/Uvita (coast) |

---

## Endpoints

### 1. Properties Feed

```
GET /PropertiesPerOffice/{GUID}
```

Returns a JSON array of all active property listings for the specified office.

#### Response Schema

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| `ListingId` | integer | Internal listing ID (unique) | No |
| `ListingKey` | string | External listing key (e.g., `"400142400001"`) | No |
| `PropertyTypeName_en` | string | Property type in English: `"House/Villa"`, `"Lot/Land"`, `"Condo/Apartment"` | No |
| `PropertyTypeName_es` | string | Property type in Spanish | No |
| `ListingContractType` | integer | Contract type ID (1 = Sale) | No |
| `ContractType_en` | string | `"Sale"` or `"Lease"` | No |
| `ContractType_es` | string | `"Venta"` or `"Alquiler"` | No |
| `ListingTitle_en` | string | Listing title in English | No |
| `ListingTitle_es` | string | Listing title in Spanish | Yes (can be `""`) |
| `PublicRemarks_en` | string | Full description in English (rich text with `\r\n`) | No |
| `publicRemarks_es` | string | Full description in Spanish (**note lowercase `p`**) | No |
| `ListingProbableuseId` | integer | 1 = General, 2 = RE/MAX Commercial | No |
| `ProbableUse` | string | `"General"` or `"RE/MAX Commercial"` | No |
| `Status` | string | Full status text (e.g., `"Active: Available for sale/lease..."`) | No |
| `Furnishedyn` | string | `"Y"` / `"N"` — Furnished? | No |
| `ListingContractDate` | string (ISO 8601) | Contract start date | No |
| `ExpirationDate` | string (ISO 8601) | Contract expiration date | No |
| `Listingagreementyn` | string | `"Y"` / `"N"` — Has listing agreement? | No |
| `CountryId` | integer | Country ID (1886 = Costa Rica) | No |
| `Country` | string | `"Costa Rica"` | No |
| `StateDepProvId` | integer | State/Province ID | No |
| `StateDepProv` | string | State/Province name (e.g., `"San José"`, `"Puntarenas"`) | No |
| `LocationId` | integer | Location ID | No |
| `Location` | string | Location name (e.g., `"Pérez Zeledón"`, `"uvita"`, `"Buenos Aires"`) | No |
| `Garage` | string | `"Y"` / `"N"` | No |
| `GarageCovered` | string | `"Y"` / `"N"` | No |
| `GarageOpen` | string | `"Y"` / `"N"` | No |
| `GarageSpaces` | integer | Number of garage spaces (0 if none) | No |
| `MaidRoom` | string | `"Y"` / `"N"` | No |
| `Cooling` | string | `"Y"` / `"N"` — Air conditioning? | No |
| `PoolPrivate` | string | `"Y"` / `"N"` | No |
| `Viewyn` | string | `"Y"` / `"N"` — Has a view? | No |
| `BedroomsTotal` | integer | Number of bedrooms | **Yes** (null for land) |
| `BathroomsFull` | integer | Number of full bathrooms | **Yes** (null for land) |
| `Stories` | integer | Number of stories (0 for land) | No |
| `LotSizeArea` | float | Lot size value | No |
| `LotSizeUnitsId` | integer | 1 = Sq Mt | No |
| `LotSizeUnits` | string | `"Sq Mt"` | No |
| `ConstructionSizeLiving` | float | Living area (often 0.00) | No |
| `ConstructionSizeUnits` | string | `"Sq Mt"` | No |
| `ConstructionSizeTotal` | float | Total construction area | **Yes** |
| `ConstructionSize` | float | Construction size in m² | **Yes** (null for raw land) |
| `AssociationNotes` | string | HOA/Association notes | **Yes** |
| `GatedCommunity` | string | `"Y"` / `"N"` | No |
| `ListPrice` | float | Listing price | No |
| `CurrencyId` | integer | 4 = USD | No |
| `CurrencyListPrice` | string | `"(USD) US Dollar"` | No |
| `Videolink` | string | YouTube/video link | **Yes** |
| `Latitude` | string | GPS latitude (string, not float!) | No |
| `Longitude` | string | GPS longitude (string, not float!) | No |
| `UnparsedAddress` | string | Free-text address (inconsistent formatting) | No |
| `AssociateId` | integer | ID of the listing agent | No |
| `Images` | string | Pipe-delimited (`\|`) list of image URLs on Azure CDN | No |
| `FirstName` | string | Agent first name | No |
| `LastName` | string | Agent last name | No |
| `OfficeID` | integer | Office ID (218 = Altitud, 235 = Altitud Cero) | No |
| `OfficeName` | string | `"RE/MAX ALTITUD"` or `"RE/MAX ALTITUD CERO"` | No |
| `EmbeddedVideoCode` | string | Embedded video HTML/code | **Yes** |

#### Data Quality Notes

> [!WARNING]
> **These require handling in the sync pipeline:**

1. **`ListingTitle_es` can be empty** — Some listings have only an English title
2. **`Latitude`/`Longitude` are strings** — Must parse to float; some have trailing decimals like `-83.63484299999999`
3. **`UnparsedAddress` is inconsistent** — No standard format; ranges from `"Rivas"` to `"San Francisco, Cajon, Perez Zeledon."`
4. **`Location` casing varies** — e.g., `"Pérez Zeledón"` vs `"uvita"` (lowercase)
5. **`publicRemarks_es` has lowercase `p`** — While `PublicRemarks_en` has uppercase `P` (inconsistent key casing!)
6. **`Images` is a pipe-delimited string** — Not a JSON array; URLs may contain spaces
7. **`ConstructionSize` vs `ConstructionSizeLiving`** — `ConstructionSizeLiving` is always 0.00; actual value is in `ConstructionSize`
8. **`ExpirationDate` may be in the past** — Some listings are technically expired but still returned as active
9. **`LotSizeArea`** — Units claim to be in `Sq Mt` but for one listing shows `31478` which is described as "31 hectares" (should be ~310,000 m²) — validate against descriptions

---

### 2. Agents Feed

```
GET /AgentsPerOffice/{GUID}
```

Returns a JSON array of all active agents for the specified office.

#### Response Schema

| Field | Type | Description | Nullable |
|-------|------|-------------|----------|
| `AssociateID` | integer | Unique agent ID | No |
| `FirstName` | string | First name | No |
| `LastName` | string | Last name | No |
| `REMAXID` | string | RE/MAX global ID | No |
| `Mobile` | string | Mobile phone | Yes (can be `""`) |
| `DirectPhone` | string | Direct phone (format: `"506 XXXXXXXX"`) | No |
| `RemaxEmail` | string | RE/MAX email (e.g., `emma@remax-altitud.cr`) | No |
| `NonRemaxEmail` | string | Personal email | **Yes** |
| `Birthday` | string (ISO 8601) | Date of birth | No |
| `StartDate` | string (ISO 8601) | Date joined RE/MAX | No |
| `AssociateStatus_en` | string | `"Active"` | No |
| `UrlImg` | string | Profile photo URL (hosted on `balloon.remax-cca.com`) | No |
| `Title` | string | Role: `"Associate"`, `"Owner"` | No |
| `Gender` | string | `"M"` / `"F"` | No |
| `Lang` | string | Primary language: `"English"` / `"Spanish"` | No |
| `OfficeID` | integer | Office ID (218 = Altitud, 235 = Altitud Cero) | No |
| `CountryID` | integer | Country ID (1886 = Costa Rica) | No |
| `OfficeName` | string | `"RE/MAX ALTITUD"` or `"RE/MAX ALTITUD CERO"` | No |
| `TitleEs` | string | Role in Spanish: `"Agente asociado"`, `"Dueño de Oficina"` | No |

#### Agent Data Observations

> [!NOTE]
> - `Mobile` is often empty; `DirectPhone` is the reliable phone field
> - Phone format is `"506 XXXXXXXX"` (CR country code + number with a space)
> - `Lang` field indicates what language profile the agent set — NOT all languages they speak
> - `Birthday` is included but should NOT be displayed publicly (privacy)
> - Agent photos are hosted on `balloon.remax-cca.com`, a different CDN than property images

---

## Current Data Summary (as of 2026-04-09)

### RE/MAX Altitud (Pérez Zeledón)

| Metric | Value |
|--------|-------|
| **Active Properties** | 28+ listings |
| **Active Agents** | 14 agents |
| **Property Types** | House/Villa, Lot/Land |
| **Price Range** | $38,000 – $4,203,000 USD |
| **Locations** | Pérez Zeledón, Uvita, Buenos Aires, El General |
| **All currency** | USD |
| **All listings by** | Emma Bennett (AssociateId: 2400) |

### RE/MAX Altitud Cero (Dominical/Uvita)

| Metric | Value |
|--------|-------|
| **Active Properties** | 0 (empty array — new office, no listings yet) |
| **Active Agents** | 2 agents (Kristel Sanchez, Ralff Abarca) |
| **Office started** | 2026-04-06 (agents just onboarded) |

> [!IMPORTANT]
> The Altitud Cero office was just created (agents started 2026-04-06). It currently has **zero listings** in the API feed. This is expected — listings will populate as the office begins operations. The sync pipeline should handle empty arrays gracefully.

---

## Image CDN

- **Property images**: `remaxcaribbeanandcentralamerica.azureedge.net`
  - Pattern: `/images/{ListingKey}/v3/hd/{filename}`
  - Filenames contain spaces and special characters — URL encoding needed
  - Formats: `.jpeg`, `.jpg`, `.JPG`, `.png`, `.PNG`

- **Agent photos**: `balloon.remax-cca.com`
  - Pattern: `/userfiles/{owner-slug}/image/{filename}` or `/userfiles/{owner-slug}/profile_{hash}.jpg`

---

## Environment Variables

```bash
# .env.local (DO NOT COMMIT)
REMAX_API_BASE_URL=https://api.remax-cca.com/api
PZ_OFFICE_GUID=FEA8746D-CC1D-41B8-89F3-D04AC98274AF
DOM_OFFICE_GUID=4AD5AE8F-5B47-4A1A-A953-40445F2B4940
```
