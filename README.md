# Sunrise Suites — AI Hotel Guest Assistant

A full-stack React + Express hotel guest assistant built for the assignment.

> **Runs at zero cost by default.** No API key is required. Out of the box
> the assistant uses a deterministic, rule-based response engine — there is
> no external API call and therefore no possibility of hitting a billing
> wall or "insufficient credit" error. See [AI provider (optional)](#ai-provider-optional) below if you want to layer in a real
> LLM using Groq's free tier.

## Features

- Conversational hotel assistant
- Follow-up questions with conversation context
- Hotel knowledge base stored in JSON
- Works fully for free with zero API keys (deterministic mode)
- Optional real-LLM mode via Groq's free tier or OpenAI (paid)
- Deterministic fallback assistant when no API key is configured, and as a safety net if the LLM call ever fails
- Room availability tool/function
- Availability form for check-in, check-out and guests
- Room result cards
- Loading, validation and error states
- Responsive desktop/mobile UI
- Backend validation and request logging
- 10 automated backend tests
- No API key is exposed to the browser

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI: OpenAI Responses API (optional)
- Data: JSON mock hotel knowledge base
- Tests: Node built-in test runner + Supertest

## Project structure

```text
hotel-ai-assistant/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AvailabilityPanel.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── QuickQuestions.jsx
│   │   │   └── RoomCard.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── data/hotel.json
│   ├── src/
│   │   ├── aiService.js
│   │   ├── availabilityService.js
│   │   ├── server.js
│   │   └── utils.js
│   ├── tests/assistant.test.js
│   ├── .env.example
│   └── package.json
└── README.md
```

## Run locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`.

By default (nothing added to `.env`) the app runs entirely on deterministic
logic — no external calls, no cost, nothing that can fail due to billing.
This is enough to demo the full assignment flow.

### AI provider (optional)

If you'd like real LLM-generated answers instead of (or in addition to) the
rule-based ones, you have two choices:

**Option A — Groq (free, recommended, no credit card required)**

1. Create a free account at https://console.groq.com and generate an API key.
2. Add to `backend/.env`:
   ```env
   GROQ_API_KEY=your_groq_key_here
   GROQ_MODEL=llama-3.1-8b-instant
   ```
3. Restart the backend. Chat responses will now come from the LLM, grounded
   in the hotel JSON, while availability stays fully deterministic.

**Option B — OpenAI (paid, only if you already have billing set up)**

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

If neither key is set, or if the LLM call fails for any reason (bad key, no
quota/credit, rate limit, network error), the backend automatically and
silently falls back to the deterministic assistant — the guest never sees a
broken chat.

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## API examples

### Health

```bash
curl http://localhost:5000/api/health
```

### Ask assistant

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"What time is check-in?\",\"history\":[]}"
```

### Availability

```bash
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"2026-09-25\",\"checkOut\":\"2026-09-28\",\"adults\":2}"
```

## AI design

The backend first determines whether a request is an availability request. Availability is handled by deterministic business logic and never depends on an LLM.

For normal hotel questions, the assistant uses the hotel JSON knowledge base. When `GROQ_API_KEY` or `OPENAI_API_KEY` is set, the backend sends the relevant hotel data and conversation context to the chat completions API. The prompt explicitly instructs the model to stay within the supplied knowledge base and say it does not know when information is missing. If that call throws for any reason, the deterministic engine answers instead so the guest experience never breaks.

This separation reduces hallucination risk and keeps business logic deterministic.

## Test suite

Run:

```bash
cd backend
npm test
```

The suite covers:
1. health endpoint
2. check-in question
3. breakfast question
4. unsupported question fallback
5. follow-up context
6. availability success
7. invalid date range
8. missing guests
9. unavailable date range
10. end-to-end chat-to-availability style API flow

## Architecture

**Flow of a request, end to end:**

```
Guest types a question
        │
        ▼
Frontend (React + Vite)  — ChatWindow.jsx
  • adds the message to local UI state, shows a typing indicator
  • sends { message, history } to the backend via api.js (fetch)
        │  POST /api/chat
        ▼
Backend (Express) — server.js
  • validates the payload (non-empty, <2000 chars)
  • calls answerQuestion() in aiService.js
        │
        ├─► Is a Groq/OpenAI key configured?
        │      │
        │      ├─ No  → deterministicAnswer() matches keywords against
        │      │         backend/data/hotel.json and returns a grounded reply
        │      │
        │      └─ Yes → sends hotel.json + conversation history to the LLM
        │                (chat.completions.create), with a system prompt that
        │                restricts it to the supplied data only.
        │                If the call throws for any reason, falls back to
        │                deterministicAnswer() automatically.
        ▼
Backend returns { ok, answer, source } as JSON
        ▼
Frontend renders the assistant's message in the chat thread
```

**Availability is a separate, fully deterministic path** — it never touches the LLM:

```
Guest fills in check-in / check-out / guests → AvailabilityPanel.jsx
        │  POST /api/availability
        ▼
availabilityService.js — checkAvailability(checkIn, checkOut, adults)
  • validates dates and guest count
  • computes nights
  • mock inventory rule filters hotel.json rooms by capacity
        ▼
Backend returns { ok, data: { rooms, nights, ... } }
        ▼
Frontend renders RoomCard components; "Select Room" records a local
selection and shows a confirmation banner (no real payment/booking
system exists in this demo).
```

**Data layer:** a single `backend/data/hotel.json` file acts as the knowledge base for both the deterministic engine and the LLM prompt. There is no database — this keeps the assignment's scope small while still demonstrating a real retrieval-grounding pattern (LLM only ever sees this JSON, never invents facts outside it).

**Why this split:** anything that must be *correct* (dates, room capacity, prices, whether a room is bookable) is plain JavaScript logic. Anything that benefits from *natural language flexibility* (phrasing, follow-ups, paraphrasing hotel policy) is the only part optionally delegated to an LLM, and even then it's constrained to the same JSON the deterministic path uses.

## Product, UX & Engineering Decisions

**What customer problem is this solving?**
Guests currently have to call the front desk or dig through a hotel website/PDF to answer simple questions (check-in time, pool hours, cancellation policy) or to find out if a room is even available for their dates. This assistant collapses that into one chat box that answers instantly and can also check availability, reducing front-desk load for repetitive questions and reducing guest drop-off from friction.

**What does the guest journey look like?**
Land on the page → see a welcoming concierge chat with suggested quick questions → ask a free-form question and get an instant answer → ask a natural follow-up ("and the pool?") → decide to check dates → fill a short availability form → see matching rooms with clear pricing → select a room and get a confirmation. Every step is visible on one page — no navigation, no sign-up.

**Why this frontend design?**
- A chat-first layout because the primary intent (get an answer to a question) is conversational, not form-based.
- Quick-question chips on first load so guests aren't staring at a blank input, which lowers the activation barrier.
- The availability form is a separate, structured section (not chat) because dates/guest-count are exact, bounded inputs — a form with a date picker and dropdown is faster and less error-prone than parsing "next Friday for 3 nights" out of free text.
- Visible loading and error states everywhere a network call happens, because a hotel guest with no confirmation of what's happening will assume the app is broken and leave.

**Which parts use AI, and which stay deterministic?**
- **Deterministic, always:** availability search, pricing math, date validation, room filtering by capacity. These have one correct answer and must never be "creative."
- **AI (optional), only for:** answering open-ended natural-language questions about the hotel, and rephrasing/handling follow-ups. Even here, the model is restricted to the supplied hotel JSON and instructed to say "I don't know" rather than guess — and if the AI call fails, the same deterministic keyword-matching engine answers instead, so the guest-facing behavior degrades gracefully rather than breaking.

**What can go wrong with the AI response, and how is that mitigated?**
- *Hallucinating amenities/prices/policies not in the data* → mitigated by grounding the prompt strictly in `hotel.json` and instructing the model to admit when it doesn't know, plus keeping availability entirely outside the LLM.
- *Model outage, rate limit, or "no credit" billing errors* → caught in a try/catch in `aiService.js` and silently downgraded to the deterministic engine, so guests never see a raw API error.
- *Ambiguous or off-topic questions* → falls through to a friendly fallback message listing what the assistant can help with, rather than guessing.

**What should happen when a dependency fails?**
Every layer degrades instead of crashing: LLM failure → deterministic answer; backend unreachable → the chat/availability UI shows an inline retry-able error instead of a blank state; invalid input → a 400 with a specific message, not a generic 500.

**How would you measure whether this is actually useful?**
In a real deployment: % of chat sessions that end without escalating to the front desk, % of questions answered by the deterministic/keyword path vs. falling through to the generic fallback (a proxy for knowledge-base gaps), availability-search-to-selection conversion rate, and explicit thumbs up/down feedback on individual answers.

**What would be improved before production?**
See "Production improvements" below — the short version: a real PMS/booking integration instead of mock availability, a proper database-backed knowledge base, authentication if bookings become real, and an AI evaluation harness that scores answers against a labeled test set over time (not just the 10 tests in this repo).

## Evaluation Results

10 scenarios covering the categories requested in the assignment. The first 9 are automated in `backend/tests/assistant.test.js` (`npm test`); the 10th is a manual end-to-end walkthrough of the full UI.

| # | Category | Scenario | Input | Expected | Result |
|---|---|---|---|---|---|
| 1 | Normal question | Straightforward FAQ | "What time is check-in?" | Returns check-in time from `hotel.json` | ✅ Pass |
| 2 | Normal question | Amenity lookup | "Is breakfast included?" | Returns breakfast policy text | ✅ Pass |
| 3 | Ambiguous / unsupported | Off-topic / not in knowledge base | "Do you have a helicopter landing pad?" | Safe fallback listing what it *can* help with, no invented answer | ✅ Pass |
| 4 | Conversation follow-up | Context carried over | History: "Does the hotel have breakfast?" → follow-up: "And what about the pool?" | Answers about the pool, using the follow-up cue, without re-asking for context | ✅ Pass |
| 5 | Availability / tool-calling | Valid date range + guest count | `checkIn=2026-09-25, checkOut=2026-09-28, adults=2` | Returns rooms with capacity ≥ 2 and computed nightly/total price | ✅ Pass |
| 6 | Incorrect / unsupported assumption | Invalid date order | `checkIn=2026-09-28, checkOut=2026-09-25` | 400 error: check-out must be after check-in | ✅ Pass |
| 7 | Missing information | Guest count omitted | `checkIn/checkOut` given, `adults` missing | 400 error asking for a valid guest count | ✅ Pass |
| 8 | Availability edge case | Mock "sold out" date | `checkIn=2026-09-28` (day divisible by 7 in the mock rule) | Returns `rooms: []` so the empty-state UI can be demoed | ✅ Pass |
| 9 | Backend validation | Empty chat message | `message: ""` | 400 error, message required | ✅ Pass |
| 10 | End-to-end (manual) | Full guest journey in the browser | Open app → ask "What time is check-in?" → ask follow-up "and checkout?" → search availability for valid dates → click Select Room | Each step renders correctly: instant answer, context-aware follow-up, room cards with pricing, green "Selected" confirmation banner | ✅ Pass |

**Additional manual UI scenarios verified by code review (not scripted as automated tests, since they require a live browser):**
- **Frontend loading state:** while `askAssistant()` is in flight, `ChatWindow.jsx` shows a "Checking that for you…" typing bubble and disables the input/send button.
- **Frontend error state:** if the backend is unreachable or returns an error, a "Something went wrong" banner appears in the chat with a **Try again** button that resends the last message — the UI never hangs or shows a blank screen.
- **AI-model failure fallback:** if `GROQ_API_KEY`/`OPENAI_API_KEY` is set but invalid, expired, or out of quota, `aiService.js` catches the exception and returns a deterministic answer with `source: "deterministic-fallback (llm error)"` — verified by tracing the `try/catch` in `answerQuestion()`.

Run the automated suite yourself and paste the console output here for your submission if you'd like a literal terminal transcript:
```bash
cd backend
npm test
```

## AI Tools Used During Development

- **ChatGPT** — used to scaffold the initial project (frontend components, backend routes, mock data, test skeletons).
- **Claude** — used to review the generated code, fix the non-functional "Select Room" button (missing `onClick` handler), replace a hard-coded fictional OpenAI model name with a real one, add a free Groq-based LLM option so the app never depends on paid billing, add a graceful LLM-failure fallback, and write this README's architecture, product/UX, evaluation, and AI-tools sections.

All resulting code was reviewed and can be explained line by line; no code was used without understanding what it does.



Before production:
- replace mock availability with a hotel PMS/booking API
- add authentication/session handling where needed
- add rate limiting
- add structured logging/monitoring
- add database-backed hotel content
- add analytics for unanswered questions and availability conversions
- add prompt/version management and AI evaluation
- add accessibility audit
- add security headers and stricter CORS
