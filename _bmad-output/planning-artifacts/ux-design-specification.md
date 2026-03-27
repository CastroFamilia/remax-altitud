---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/product-brief/product-brief-2026-03-22.md'
  - '_bmad-output/market-research/market-research-2026-03-22.md'
  - '_bmad-output/domain-research/domain-research-2026-03-22.md'
documentCounts:
  prd: 1
  briefs: 1
  research: 2
  wireframes: 0
  projectContext: 0
---

# UX Design Specification — RE/MAX Altitud

**Author:** Sebicas
**Date:** 2026-03-27

---

## Executive Summary

### Project Vision

RE/MAX Altitud is building a multilingual, map-first real estate platform for Costa Rica's Southern Zone — replacing a limited WordPress site with a Next.js application that unifies the Pérez Zeledón (mountain) and Dominical/Uvita (coast) offices. The platform converts curiosity into trust and trust into qualified leads — across buyers, sellers, and investors, in up to 6 languages.

The UX must make unfamiliar geography visually accessible, surface legal property status (ZMT/titled) as trust signals, and collapse the traditional lead funnel into one-tap WhatsApp conversations — all while performing flawlessly on $150 Android phones and iPads alike.

### Target Users

The platform serves 8 personas organized into **design priority tiers**:

**Tier 1 — Design Drivers** (these personas shape every navigation, CTA, and mobile interaction decision):

- 🇺🇸 **Maria** (International Buyer) — 62, retired teacher, iPad, no Spanish. Needs map-first visual discovery, English UX, area guides, and one-tap WhatsApp to an English-speaking agent. Represents the **Explore mode** entry path — emotional, visual, discovery-driven.
- 🇨🇷 **Carlos** (Local Seller) — 48, farmer, $150 Android, Spanish only. Needs "Vende tu propiedad" visible immediately, a seller form completable in 90 seconds, phone/WhatsApp contact. Represents the **Execute mode** entry path — practical, transactional, efficiency-driven.

**Tier 2 — Design Validators** (validate decisions against specific filter/display needs):

- 🇨🇷 **Andrés** (Local Buyer) — 35, Android, Spanish. Knows the geography — skips the map, uses grid view with price/type filters. Title status critical for mortgage qualification.
- 🇩🇪 **Hans** (Investor) — 55, analytical, metric units. Investment filters, price/m², titled status. English fallback until Phase 2 German support.

**Tier 3 — Verify Only** (confirm the platform works for them; don't design around them):

- 👩‍💼 **Laura** (Active Agent) — shareable profile page, lead notifications, professional presence.
- 👩 **Sofia** (Recruit) — "Join Our Team" page, agent profiles as proof points.
- 🏢 **Nico** (Admin) — sync monitoring, lead management via Supabase dashboard.
- 🇺🇸 **Jennifer** (Expat Seller) — remote seller flow validates the same form Carlos uses.

### Primary UX Architecture: Two Entry Paths

The platform resolves its multi-persona, multi-intent complexity through **two primary entry paths**:

| Mode | Users | Behavior | UX Priority |
|------|-------|----------|-------------|
| **Explore** | Maria, Hans | Visual discovery, map-first, lifestyle tags, area browsing, emotional engagement | Inspiring imagery, 3D terrain, storytelling through geography |
| **Execute** | Carlos, Andrés, Jennifer | Direct search, filters, forms, WhatsApp contact, transactional efficiency | Speed, simplicity, mobile-first forms, immediate CTA visibility |

The homepage must telegraph both modes within 3 seconds: **"Dream here"** (hero imagery, area showcase, lifestyle discovery) + **"Act here"** (search bar, "Vende tu propiedad" CTA, agent contact).

### Key Design Challenges

1. **Dual audience tech spectrum** — Serving iPad retirees and $150 Android farmers with equal quality requires progressive enhancement and ruthless performance optimization.

2. **Emotional range design** — Maria is dreaming at 10 PM on her iPad; Carlos is solving a practical problem at noon on a basic phone. The same platform must inspire dreamers AND serve pragmatists — this goes beyond responsive design into intent-aware UX.

3. **Map-first vs. grid-first** — Desktop: split-view default (Zillow-style) with full-map and full-grid toggles. Mobile: map-first with a **pull-up sheet pattern** (Google Maps/Airbnb) for listings — a proven mobile pattern users already know.

4. **Three intents, one interface** — Buy, Sell, and Invest CTAs must coexist without cognitive overload. **Seller intent must be visually separated** in the navigation — "Vende tu propiedad" / "List with us" must be immediately visible without navigating a search engine.

5. **Trust through clarity** — ZMT badges, titled property indicators, agent language matching, and RE/MAX branding are conversion-critical trust signals in a market where foreigners are buying property in an unfamiliar legal system.

6. **Mobile-dominant (60-70% traffic)** — Every interaction (gallery, map, forms, WhatsApp CTAs) must be touch-optimized with LCP < 2.5s on 4G.

7. **Multilingual graceful degradation** — EN/ES at MVP; 4 more languages in Phase 2. Language detection with fallback must feel intentional, not broken.

8. **No-results as core flow** — With ~300-400 listings across two offices, 15-25% of searches will return zero results. This is not an edge case — it's a quarter of traffic. Every no-result state must offer alternative suggestions and a WhatsApp CTA with forwarded search criteria to convert dead ends into leads.

9. **Two loading profiles** — The search/map page (CSR) and listing detail pages (SSG/ISR) have fundamentally different performance characteristics. Search needs loading skeletons that prevent CLS during Mapbox/filter bootstrap. Listing pages should feel instant (pre-rendered at the edge). The UX must account for this asymmetry.

### Design Opportunities

1. **Map as storytelling** — 3D terrain makes unfamiliar geography emotionally accessible (mountain ridges, ocean proximity, hospital markers). The map sells the lifestyle, not just the location.

2. **Lifestyle tags as discovery** — "Retirement Paradise," "Investment Property," "Rental Potential" transcend traditional filters — a UX innovation unmatched by competitors.

3. **WhatsApp as primary CTA** — Pre-populated messages with property/search context collapse the lead funnel into one tap. In Costa Rica, WhatsApp IS how real estate works.

4. **Agent profiles as mini-sites** — Shareable landing pages that function as personal brand tools. Laura shares her profile on Instagram → it works as a professional portfolio with listings, languages, and one-tap contact.

5. **Smart no-results states** — Zero-result searches become leads via alternative area/filter suggestions + WhatsApp CTA with forwarded search criteria.

6. **Mobile pull-up sheet** — Proven map-search pattern (Google Maps, Airbnb) where listings appear as a draggable sheet over the map. Users already know this interaction — zero learning curve.

7. **Homepage as dual-mode gateway** — "Dream here" (hero, areas, lifestyle) + "Act here" (search, sell CTA, contact) within 3 seconds of landing.

## Core User Experience

### Defining Experience

The core user loop is **Discover → Evaluate → Connect**:

- **Discover** — Map pins, lifestyle tags, area guides, smart search presets
- **Evaluate** — Photo gallery, specs, ZMT/title status, area context, localized units
- **Connect** — WhatsApp with pre-populated message referencing the property, in the user's language

The defining interaction: three taps from discovery to agent conversation (map pin → preview card → WhatsApp CTA). If this flow feels effortless, the platform succeeds. If it has friction, leads die.

### Platform Strategy

| Dimension | Decision | Rationale |
|-----------|----------|----------|
| **Primary platform** | Mobile web (responsive) | 60-70% mobile traffic; no native app for MVP |
| **Input modality** | Touch-first, mouse-compatible | Mobile dominant; map must work with touch gestures |
| **Offline** | Not required | Listings need fresh data |
| **Performance floor** | $150 Android, 2GB RAM, 4G connection | Carlos persona defines the minimum viable device |
| **Performance targets** | LCP < 2.5s, CLS < 0.1, map + pins in 3s on 4G | NFRs from PRD |
| **Rendering split** | SSG/ISR for listings/agents (instant), CSR for search/map (loading states) | Two different performance profiles requiring two UX strategies |

### Effortless Interactions

1. **Auto-language detection** — Site loads in your language with no pop-up or manual selection. Graceful fallback (German user → English + "More languages coming soon") feels intentional.
2. **Map → Listing → WhatsApp** — Three taps from discovery to agent conversation. Pin tap → preview card → WhatsApp with pre-populated message in user's language.
3. **Zero-config localization** — Units (m²/acres/hectares), currency (USD/EUR), and language adapt automatically based on browser locale. Nobody configures anything.
4. **90-second seller form** — Name, WhatsApp, property type, location. No email required, no account creation. Completable under 90 seconds on basic Android.
5. **Smart presets** — "Beach homes under $300K" is one tap, not 4 filter adjustments. Pre-configured lifestyle tag + filter combinations surface common search intents.

### Critical Success Moments

| Moment | What Happens | Why It's Critical |
|--------|-------------|-------------------|
| **"I get it"** (Maria) | Map loads with 3D terrain — mountains, coast, hospital, roads visible. Unfamiliar geography becomes accessible in 5 seconds | If international buyers can't orient themselves, they bounce. The map IS the product |
| **"This is for me"** (Carlos) | Homepage loads in Spanish. "Vende tu propiedad" visible without scrolling. Form is simple | Sellers who see an English-first or complex interface leave immediately |
| **"I trust this"** (Hans) | "Titled Property ✓" badge + price/m² + area appreciation context | Investment buyers need data credibility. ZMT/title status is the trust differentiator |
| **"I can talk to someone"** (everyone) | WhatsApp CTA with pre-populated message in their language. One tap | Friction between interest and conversation kills leads |
| **"Dead end → lead"** (25% of searches) | No results → smart suggestions + "Tell an agent what you're looking for" with forwarded criteria | Smart no-results states convert dead ends into qualified leads |

### Experience Principles

1. **Geography first, filters second** — The map tells the story. International buyers need to SEE where things are before they can filter. The map is not a feature — it's the product.
2. **One tap to human** — Every screen, every state, every dead end has a path to WhatsApp with context. The platform bridges users to agents, not replaces them.
3. **Two modes, one interface** — Explore mode (visual, emotional, discovery) and Execute mode (search, filter, act) coexist. The homepage telegraphs both within 3 seconds.
4. **Trust through transparency** — ZMT badges, title status, agent languages, RE/MAX branding, and localized legal terms build confidence. Don't hide complexity — make it simple.
5. **Performance is UX** — If the seller form stutters on a $150 Android, it's a UX failure. LCP < 2.5s on 4G is a design constraint, not an engineering afterthought.
6. **Zero-configuration localization** — Language, units, and currency adapt automatically. The user never configures their locale. The site works in their world.

## Desired Emotional Response

### Primary Emotional Goals

The platform must create distinct emotional outcomes mapped to user intent:

| Intent | Primary Emotion | What Triggers It | User Says... |
|--------|----------------|-----------------|-------------|
| **Buy (International)** | **Confidence in the unfamiliar** | Map clarity, ZMT badges, agent language match, area context | *"I understand this place. I trust these people. I can do this."* |
| **Buy (Local)** | **Efficiency with dignity** | Full Spanish UX, fast filters, familiar neighborhoods, title status | *"This is for me too, not just gringos."* |
| **Sell** | **Pride and validation** | Professional listing presentation, bilingual display, social shareability | *"My property looks important. My nephew saw it in English!"* |
| **Invest** | **Informed assurance** | Data presentation (price/m², titled status), metric units, professional tone | *"This platform respects my intelligence. The data checks out."* |
| **Shared link recipient** | **Instant credibility** | Professional listing page, full context, agent CTA — no prior site experience needed | *"This looks real and trustworthy even though I've never heard of this site."* |

The single emotional thread connecting all personas: **"This platform was made for someone like me."** — whether you're a retiree in Oregon, a farmer in Pérez Zeledón, or an engineer in Munich.

### Emotional Journey Mapping

#### First Contact (0-5 seconds)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Maria | *"Is this in my language?"* → **Relief** | Auto-language detection, English loads instantly |
| Carlos | *"Is this for ticos too?"* → **Belonging** | Full Spanish UX, "Vende tu propiedad" visible immediately |
| Hans | *"Is this professional?"* → **Respect** | Clean data presentation, metric units, investment filters visible |
| Shared link recipient | *"Is this legit?"* → **Instant credibility** | Professional gallery, RE/MAX branding, full property context, agent photo + WhatsApp CTA — trust established without prior site exploration |

#### Discovery (5-60 seconds)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Maria | *"Where IS this place?"* → **Clarity** | 3D terrain map, hospital/road markers, area labels |
| Andrés | *"Show me what I can afford"* → **Control** | Grid view, price/type filters, familiar neighborhoods |
| Hans | *"What's the ROI story?"* → **Competence** | Investment tags, price/m² sorting, titled status |

#### Evaluation (listing detail)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Maria | *"Is this safe to buy?"* → **Trust** | "Titled Property ✓" badge, area context, agent with photo |
| Carlos | *"Will my land look good?"* → **Pride** | Professional gallery, bilingual description, RE/MAX brand |
| Hans | *"What am I actually getting?"* → **Precision** | m²/hectare display, ZMT classification, lot dimensions |

#### Connection (CTA moment)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Everyone | *"Can I talk to a real person NOW?"* → **Immediacy** | WhatsApp CTA, pre-populated message, one tap |
| Maria | *"Will they understand me?"* → **Comfort** | Agent language badges, "Speaks: English" on profile |
| Carlos | *"Are they local?"* → **Familiarity** | Agent photo, office affiliation, RE/MAX local presence |

#### Return Visit (repeat users)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Maria | *"Anything new since last time?"* → **Progress** | Recent/new listing badges; local storage remembers last search filters |
| Andrés | *"Is that house still available?"* → **Continuity** | Filter memory via local storage — no account needed. "It remembers me" |
| Hans | *"Did prices change?"* → **Currency** | Same investment filters pre-loaded from previous session |

#### Sharing Moment (social validation)

| Persona | Emotional Need | Design Response |
|---------|---------------|----------------|
| Maria | *"My daughter needs to see this"* → **Excitement sharing** | Standalone listing URL with full gallery, area context, and agent CTA — shareable and self-contained |
| Carlos | *"My nephew saw my land in English!"* → **Social validation** | Bilingual listing display; seller form confirmation could preview how listing will appear |
| Laura | *"My clients need to see my portfolio"* → **Professional pride** | Agent profile URL functions as shareable mini-site with all listings |

> **Business context:** Referral traffic typically accounts for 15-25% of qualified real estate leads. The emotional experience of the shared-link recipient is a direct conversion lever.

#### Failure States (errors, no results, slow loads)

| Situation | Emotional Risk | Design Response |
|-----------|---------------|----------------|
| No search results | **Frustration** → abandonment | Smart suggestions + "Tell an agent" CTA → **Redirect to hope** |
| Slow map load | **Impatience** → bounce | Skeleton loader with area preview image → **Anticipation** |
| Form error | **Confusion** → abandonment | Inline validation, clear Spanish/English error messages → **Guidance** |
| Listing removed | **Disappointment** → exit | "No longer available" + similar properties → **Recovery** |

### Micro-Emotions

**Critical micro-emotion pairs the UX must manage:**

1. **Confidence ↔ Anxiety** — The #1 emotional axis. Every ZMT badge, every "Titled Property ✓," every agent language indicator tips the scale from anxiety toward confidence. The platform's core emotional job is converting foreign-market anxiety into actionable confidence.

2. **Belonging ↔ Exclusion** — Carlos and Andrés must feel the site is FOR them, not that they're on a gringo platform. Full Spanish UX, local neighborhood names, and culturally appropriate CTAs signal belonging. An English-first impression signals exclusion.

3. **Legitimacy ↔ Placeholder** — The Dominical/Uvita office is brand new digitally. Office-specific content must convey established presence — agent count, listing count, local knowledge signals — even though the digital presence is new. The emotion: *"This isn't new — I just didn't know about it yet."*

4. **Excitement ↔ Overwhelm** — Maria is excited about Costa Rica but could be overwhelmed by 300+ listings in unfamiliar places. Lifestyle tags and smart presets channel excitement into manageable discovery. Too many filters = overwhelm.

5. **Trust ↔ Skepticism** — RE/MAX branding, agent photos, listing counts, and professional presentation build trust. Generic stock photos, broken translations, or missing property data trigger skepticism.

6. **Pride ↔ Invisibility** — Sellers (Carlos, Jennifer) need to see their property presented professionally. Agents (Laura) need profiles they're proud to share. Social validation moments (sharing links, seeing bilingual listings) amplify pride and create organic advocacy.

7. **Progress ↔ Stagnation** — Return visitors need signals that the platform is alive and that their search is progressing. Filter memory via local storage and new-listing indicators create a sense of forward motion without requiring accounts.

### Design Implications

| Emotional Goal | UX Design Approach |
|---------------|-------------------|
| **Confidence in unfamiliar** | ZMT/title badges prominent on every listing card AND detail page. Area context mini-guides attached to listings. Agent language badges. RE/MAX balloon logo as trust anchor |
| **Belonging for locals** | Language detection loads Spanish first for CR visitors. "Vende tu propiedad" in primary nav. Neighborhood names from formal hierarchy. No forced English terminology |
| **Legitimacy for new office** | Dominical/Uvita pages show agent count, listing count, and area expertise signals. Office pages feel established, not "coming soon" |
| **Controlled excitement** | Lifestyle tags curate discovery — "Retirement Paradise" shows 8 properties, not 300. Smart presets reduce cognitive load. Area guides tell a story before showing listings |
| **Immediacy** | WhatsApp CTA is green, prominent, always visible on listing pages (sticky on mobile). Pre-populated message eliminates typing friction. No "schedule a call" forms — instant connection |
| **Pride in presentation** | Photo galleries are hero-sized and high-quality. Bilingual descriptions show professionalism. Agent profiles display listing count and languages as achievement badges |
| **Shared link credibility** | Standalone listing pages are self-contained landing pages — full gallery, area context, agent profile, WhatsApp CTA. No prior site experience required for trust |
| **Return visit continuity** | Local storage remembers last search filters. New/recent listing badges. No re-onboarding friction for returning users |
| **Recovery from failure** | Every error state has a forward path. No dead ends. No-results → suggestions + agent CTA. Removed listings → similar properties |

### Emotional Design Principles

1. **Confidence is the product** — We're not selling properties; we're selling confidence in a foreign country. Every pixel must reduce uncertainty and increase trust.

2. **Belonging before features** — Before a user evaluates a single property, they must feel "this is for me." Language, cultural cues, and CTA language must signal belonging within the first 3 seconds.

3. **Channel excitement, don't amplify it** — Users arrive excited. Our job isn't to hype — it's to channel that excitement into productive discovery through lifestyle tags, area guides, and smart presets.

4. **Make failure feel helpful** — No dead ends. Every no-result search, every removed listing, every slow load must offer a forward path that feels like the platform is helping, not blocking.

5. **Pride flows both ways** — Sellers see their property presented beautifully. Agents see a profile worth sharing. Social validation moments (sharing links, seeing bilingual listings) amplify pride and create organic advocacy.

6. **Respect the user's time** — No splash screens, no newsletter modals on first visit, no cookie consent blocking content (cookieless analytics for MVP), no forced language selection pop-ups. Every unnecessary interaction is a violation of trust. Carlos has 5 minutes. Honor them.
