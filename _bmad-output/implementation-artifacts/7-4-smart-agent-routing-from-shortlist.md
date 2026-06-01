# Story 7.4: Smart Agent Routing from Shortlist

Status: done

## Story

As a **visitor**,
I want to contact one agent about all my saved properties through an intelligent routing system,
so that I get a single point of contact who coordinates all viewings — even for properties listed by different agents.

## Acceptance Criteria

1. **Given** the "Ask about these" CTA on the shortlist page
   **When** all shortlisted properties belong to 1 agent
   **Then** WhatsApp opens directly to that agent with a pre-populated message listing ALL property refs (titles + reference IDs/apiIds) (FR26, FR27).

2. **Given** a shortlist where a majority (2+) of properties belong to 1 agent
   **When** "Ask about these" is tapped
   **Then** the system auto-suggests that agent with messaging: `"{name} specializes in the areas you're exploring. She can show you all {N} properties."` (in English or Spanish) with a primary CTA to contact that agent and a secondary CTA to "Choose a different agent" (FR26).

3. **Given** a shortlist where properties are evenly distributed across agents (or tied)
   **When** "Ask about these" is tapped
   **Then** an `AgentSelectionModal` appears with agent cards showing: photo, name, languages spoken, listing count. Agents are auto-sorted by language match to the user's detected locale. An education interstitial reads: `"🏠 One agent, all your visits — your chosen agent will coordinate visits to all your saved properties, even those listed by other agents."` (FR26).

4. **Given** an agent is selected (any routing path)
   **When** WhatsApp opens
   **Then** the pre-populated message includes ALL shortlisted property references (titles + refs/apiIds) in a single message, regardless of how many are saved (FR27).

5. **Given** a shortlist lead is created
   **When** the lead record is stored in the database
   **Then** it includes: `assigned_agent_id`, `shortlist_property_ids[]` (all saved property IDs), `source = "whatsapp_click"` (or `"contact_form"` if email alternative is chosen), `intent = "buy"` or `"invest"`, UTM/referrer data, and the user's language (FR28, FR54).

6. **Given** the admin lead view requirements (FR57)
   **When** querying a shortlist lead
   **Then** the backend provides grouping logic showing which properties belong to the assigned agent and which belong to other agents (e.g., `"Hans → Agent: Emma • Emma's listings: #123, #456 • Gustavo's listings: #321, #654"`).

7. **Given** the `AgentSelectionModal` bundle
   **When** the shortlist page is loaded
   **Then** the modal is lazy-loaded asynchronously (~5KB) and only fetched when the user triggers the modal to open (AR performance budget, AR25).

8. **Given** the routing screen or modal
   **When** a user prefers not to use WhatsApp
   **Then** an email CTA is available as an alternative to WhatsApp, which triggers lead capture and opens a `mailto:` link with pre-populated subject and body.

---

## Tasks / Subtasks

- [ ] **Task 1: Add Bilingual Localization Keys** (AC: #2, #3, #8)
  - [ ] 1.1 Verify/Add the following keys to `src/messages/en.json` in the `Shortlist` or new `ShortlistRouting` namespace:
    ```json
    "ShortlistRouting": {
      "autoSuggestText": "{name} specializes in the areas you're exploring. They can show you all {count} properties.",
      "contactAgent": "Contact {name}",
      "chooseDifferent": "Choose a different agent",
      "modalTitle": "Select Your Coordinator Agent",
      "educationInterstitial": "🏠 One agent, all your visits — your chosen agent will coordinate visits to all your saved properties, even those listed by other agents.",
      "languages": "Languages Spoken:",
      "listings": "listings",
      "contactWhatsApp": "Contact via WhatsApp",
      "contactEmail": "Contact via Email",
      "whatsappMessageIntro": "Hi {agentName}, I'm interested in these properties from my shortlist:",
      "whatsappMessageOutro": "Could we coordinate a visit? Thank you.",
      "emailSubject": "Inquiry about property shortlist from ALT-ALTITUD",
      "emailBody": "Hi {agentName},\n\nI am interested in viewing the following saved properties from my shortlist:\n\n{list}\n\nCould you coordinate these visits for me?\n\nThank you!"
    }
    ```
  - [ ] 1.2 Verify/Add the equivalent keys to `src/messages/es.json`:
    ```json
    "ShortlistRouting": {
      "autoSuggestText": "{name} se especializa en las zonas que estás explorando. Puede mostrarte las {count} propiedades.",
      "contactAgent": "Contactar a {name}",
      "chooseDifferent": "Elegir un agente diferente",
      "modalTitle": "Selecciona tu Agente Coordinador",
      "educationInterstitial": "🏠 Un solo agente, todas tus visitas — el agente que elijas coordinará las visitas a todas tus propiedades guardadas, incluso las listadas por otros agentes.",
      "languages": "Idiomas hablados:",
      "listings": "propiedades",
      "contactWhatsApp": "Contactar por WhatsApp",
      "contactEmail": "Contactar por Correo",
      "whatsappMessageIntro": "Hola {agentName}, me interesan estas propiedades de mi lista de favoritos:",
      "whatsappMessageOutro": "¿Podríamos coordinar una visita? Gracias.",
      "emailSubject": "Consulta sobre lista de propiedades guardadas de ALT-ALTITUD",
      "emailBody": "Hola {agentName},\n\nMe interesa visitar las siguientes propiedades de mi lista de favoritos:\n\n{list}\n\n¿Podríamos coordinar estas visitas?\n\n¡Gracias!"
    }
    ```

- [ ] **Task 2: Modify POST `/api/leads` and Zod Schema** (AC: #5)
  - [ ] 2.1 Open `src/app/api/leads/route.ts`.
  - [ ] 2.2 Extend `leadInputSchema` to accept:
    - `assignedAgentId: z.string().uuid().optional().nullable()`
    - `shortlistPropertyIds: z.array(z.string().uuid()).optional().default([])`
  - [ ] 2.3 Update lead routing logic in the handler:
    - If `data.assignedAgentId` is provided, skip `matchAgentByCoordinates()` and assign `assignedAgentId = data.assignedAgentId` directly.
    - If `data.shortlistPropertyIds` has items, pass them directly to the `createLead` function. Ensure they are mapped into the Drizzle insert block as `shortlistPropertyIds: data.shortlistPropertyIds`.

- [ ] **Task 3: Implement Server Action to Retrieve Properties Joined with Agent Details** (AC: #1, #2, #3, #4)
  - [ ] 3.1 Open `src/app/actions/shortlist-actions.ts`.
  - [ ] 3.2 Implement `getShortlistPropertiesWithAgents(ids: string[])`:
    - Use Drizzle to fetch properties from `properties` joined with `agents` (`leftJoin(agents, eq(properties.agentId, agents.id))`).
    - Select property fields: `id`, `apiId` (needed as property ref), `slug`, `titleEn`, `titleEs`, `priceUsd`, `latitude`, `longitude`, `images`, and `agentId`.
    - Select agent fields: `id`, `name`, `photoUrl`, `photoOptimizedUrl`, `email`, `phone`, `whatsapp`, `languages`, and `listingCount`.
    - Normalize images using `normalizePropertyImages`.
    - Return `PropertyWithAgent[]` format.

- [ ] **Task 4: Create Lazy-Loaded `AgentSelectionModal` Component** (AC: #3, #7, #8)
  - [ ] 4.1 Create `src/components/shortlist/agent-selection-modal.tsx`:
    - Ensure it is a client component.
    - Receives props: `isOpen: boolean`, `onClose: () => void`, `agents: Agent[]`, `onSelect: (agent: Agent, channel: 'whatsapp' | 'email') => void`, `locale: string`.
    - Render a clean, accessible dialog/modal container using tailwind styling.
    - Include the **educational interstitial**: `"🏠 One agent, all your visits — your chosen agent will coordinate visits to all your saved properties, even those listed by other agents."` in the user's language.
    - **Language Auto-Sorting Pattern**:
      - Sort agents so that agents who speak the user's active locale language (e.g., `"es"` or `"en"`) appear first.
    - Render a responsive list/grid of agent cards displaying: photo (optimized photo fallback or placeholder), name, languages spoken (joined as readable string), and active listing count.
    - Each card has a direct "Select" CTA or individual triggers for WhatsApp and Email alternatives.
  - [ ] 4.2 Set up dynamic lazy loading in `src/components/shortlist/shortlist-page-client.tsx`:
    ```typescript
    import dynamic from "next/dynamic";
    const AgentSelectionModal = dynamic(
      () => import("./agent-selection-modal").then((mod) => mod.AgentSelectionModal),
      { ssr: false, loading: () => <ModalShimmer /> }
    );
    ```
    This satisfies the AR budget by only pulling the modal code when the user clicks the routing trigger.

- [ ] **Task 5: Implement Smart Agent Routing Algorithm & Lead Capture Trigger** (AC: #1, #2, #3, #4, #5, #8)
  - [ ] 5.1 Open `src/components/shortlist/shortlist-page-client.tsx`.
  - [ ] 5.2 Integrate the routing logic when the user clicks **"Ask about these"**:
    - **Single Agent Case (100% of properties belong to 1 agent)**:
      - Auto-routes immediately.
      - Triggers `fetch("/api/leads")` in the background with `source: "whatsapp_click"`, `assignedAgentId`, `shortlistPropertyIds`.
      - Opens wa.me link with pre-populated message of ALL property refs (Title + Ref/apiId).
    - **Majority Agent Case (2+ properties belong to Agent X, which is a majority)**:
      - Display auto-suggest alert/panel: `"{name} specializes in the areas you're exploring..."`
      - Primary CTA contact details triggers background lead creation and WhatsApp open.
      - Secondary CTA opens `AgentSelectionModal`.
    - **Tie / Even Distribution Case**:
      - Directly open `AgentSelectionModal`.
  - [ ] 5.3 Implement background lead capture trigger:
    - Send `name: "Shortlist Lead"`, `phone: "0000000"` (satisfies Zod min 7 placeholder rule), `source: "whatsapp_click"` or `"contact_form"`, `intent: "buy"`, `assignedAgentId`, `shortlistPropertyIds`, locale, and UTM/referrer parameters.
  - [ ] 5.4 Formulate the WhatsApp pre-populated message builder:
    - Build exact layout:
      `[Intro Headline]\n- [PropertyTitle1] (Ref: [apiId1])\n- [PropertyTitle2] (Ref: [apiId2])\n\n[Outro text]`

- [ ] **Task 6: Create Grouping Query Helper for Admin View Support** (AC: #6)
  - [ ] 6.1 Open `src/lib/db/queries/leads.ts`.
  - [ ] 6.2 Implement `getShortlistLeadDetails(leadId: string)`:
    - Fetch the lead matching `leadId` (decrypting phone/email).
    - Fetch all properties listed in the lead's `shortlistPropertyIds`.
    - Join with agents to resolve listing agent details for each property.
    - Construct a grouped JSON/object structure:
      - `assignedAgent`: details of the assigned coordinator agent.
      - `properties`: list of properties, each with an indicator `isAssignedAgentListing` (true/false) and the property's listing agent name.
      - This completely fulfills FR57 / AC #6 requirements ready for Epic 8.

- [ ] **Task 7: Add Unit and Integration Tests** (AC: #1, #2, #3, #4, #5, #7, #8)
  - [ ] 7.1 Create `tests/unit/shortlist/smart-routing.spec.tsx` to assert:
    - Routing algorithm detects Single Agent, Majority Agent, and Ties correctly.
    - Pre-populated WhatsApp and Email messages are generated with all properties and refs.
    - Background POST `/api/leads` is triggered with correct fields (`shortlistPropertyIds`, `assignedAgentId`, UTM params).
  - [ ] 7.2 Create `tests/unit/actions/shortlist-agent-actions.spec.ts` to assert:
    - `getShortlistPropertiesWithAgents` Server Action joins tables and retrieves details correctly.
  - [ ] 7.3 Create endpoint tests inside `tests/unit/leads/route.spec.ts` or `tests/unit/actions/leads.spec.ts` to verify the modified Zod validation schema successfully handles the new UUID list and assigned agent input.

### Review Findings

- [x] [Review][Patch] Escape Key Modal Dismissal & Backdrop Accessibility [src/components/shortlist/agent-selection-modal.tsx:L25]
- [x] [Review][Patch] Broken Image Fallback in Selection List [src/components/shortlist/agent-selection-modal.tsx:L114]
- [x] [Review][Patch] Shortlist Lead Capture Payload Name Alignment [src/components/shortlist/shortlist-page-client.tsx:L181]

---

## Dev Notes

### Key Architecture Guidelines & Constraints

1. **Lazy Loading Modals**:
   - The dynamic import `dynamic(() => import(...), { ssr: false })` MUST be used for the selection modal to comply with AR performance metrics.
2. **Unified Lead Handling**:
   - All lead storage operations must route through `/api/leads` to ensure that rate limiting, PII encryption (AES-256-GCM), and idempotency deduplication are systematically applied. Do NOT create custom standalone db inserts for shortlist leads.
3. **No Hardcoded Links**:
   - WhatsApp wa.me links must strip non-digit characters defensively using the standard `replace(/\D/g, "")` pattern from `src/lib/utils/whatsapp.ts`.
4. **Zod Characters Sanitization**:
   - Safe input sanitization must be applied on the API route to block any injection vulnerabilities on UTM inputs (regex pattern: `/^[a-zA-Z0-9_\-./ ]*$/`).

### Project Structure Notes

- **Translations**: `src/messages/en.json` and `src/messages/es.json`.
- **Database Schema**: `src/lib/db/schema/leads.ts`, `src/lib/db/schema/properties.ts`, `src/lib/db/schema/agents.ts`.
- **Server Actions**: `src/app/actions/shortlist-actions.ts`.
- **API Handler**: `src/app/api/leads/route.ts`.
- **Components**: `src/components/shortlist/shortlist-page-client.tsx`, `src/components/shortlist/agent-selection-modal.tsx`.

---

## References

- **Epic 7 Requirements**: [planning-artifacts/epics.md](file:///Users/alejandracastro/Desktop/remax-altitud/_bmad-output/planning-artifacts/epics.md#L2013-L2049) (FR26, FR27, FR28).
- **Leads Endpoint Specs**: [leads/route.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/api/leads/route.ts).
- **WhatsApp Message Utilities**: [utils/whatsapp.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/lib/utils/whatsapp.ts).
- **Shortlist Actions**: [actions/shortlist-actions.ts](file:///Users/alejandracastro/Desktop/remax-altitud/src/app/actions/shortlist-actions.ts).

---

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Completion Notes List

- Created the ultimate Story 7.4 specification file defining complete guidelines, specific acceptance criteria, structured tasks, architectural rules, and test plan details.
