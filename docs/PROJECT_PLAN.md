# Learning Buddy — Project Understanding, Plan & Phase-Wise Checklist

**Single reference document** for the Learning Buddy application: architecture, requirements, technical decisions, and implementation checklist.

---

## 1. Project Understanding

### 1.1 Purpose

Learning Buddy helps you manage course notes from in-person classes (e.g. astrology). You upload **images, PDFs, and other supported formats** (photos of handwritten/printed notes, documents); the system extracts text, tables, and highlights and converts everything into **lesson-plan-like** structured, editable notes.

### 1.2 Functional Requirements

| # | Requirement | Detail |
|---|-------------|--------|
| FR1 | **Courses** | User can create multiple courses (e.g. “Astrology 101”). |
| FR2 | **Sessions** | For each course, user can create sessions (one per class/lecture). Notes are organised by session. |
| FR3 | **Upload content** | Per session, user can upload multiple files: images (photos of notes), PDFs, and other supported formats. All are converted into lesson-plan-like text. |
| FR4 | **Extraction** | System scans images and extracts: plain text, tables (with correct structure/values), and highlighted points. |
| FR5 | **Structured output** | Extracted content is shown in a “nice format” (paragraphs, tables, bullet lists for highlights). |
| FR6 | **Editable & save** | Content is editable; user can save and re-edit anytime. |
| FR7 | **Persistence** | Saved notes and metadata are stored in the database; uploaded files (images, PDFs, etc.) are stored on disk (e.g. under `public/`). |

### 1.3 Non-Functional & Constraints

| # | Requirement | Detail |
|---|-------------|--------|
| NFR1 | **Architecture** | Clear separation: **frontend** (all frontend code in `frontend/`), **backend** (all backend code in `backend/`), **middleware** (if any), **database**. |
| NFR2 | **Database** | PostgreSQL only. |
| NFR3 | **Development approach** | TDD from the start; all features backed by tests. |
| NFR4 | **Auth** | JWT-based login/authentication. |
| NFR5 | **File storage** | Uploaded files (images, PDFs, etc.) stored under `public/` (or a configured path under project). |
| NFR6 | **Mobile** | App must work on mobile (responsive or PWA). |
| NFR7 | **Tech stack** | React (frontend), Node.js (backend). Python only if needed for extraction (e.g. OCR/table detection). |
| NFR8 | **Build order** | Database → Backend → Frontend. |

### 1.4 LLM vs Python Libraries (Extraction)

- **Python libraries (OCR + heuristics)**  
  - **Pros:** No API cost, predictable, good for typed/printed text and clear tables (e.g. Tesseract, `pytesseract`, table-detection libraries).  
  - **Cons:** Handwriting and messy layouts are harder; “highlighted” often needs heuristics (e.g. colour/contrast) rather than true understanding.

- **LLM (vision + text)**  
  - **Pros:** Better at messy handwriting, implied structure, and “what looks like a highlight or important point.”  
  - **Cons:** Cost, latency, and dependency on external API.

**Decision:** Use **Python first** (Tesseract + table detection) for extraction; add **LLM later if required** for poor OCR or smarter structure/highlights. Extraction lives in a **separate Python service** called by the Node backend (see §2.1 Option B).
---

## 2. Architecture

### 2.1 High-Level

```
[ Mobile / Desktop Browser ]
            |
            v
[ Frontend (React) ]  <--->  [ Backend API (Node.js) ]
            |                            |
            |                            v
            |                 [ Middleware / Services ]
            |                   - Auth (JWT, in backend)
            |                   - Extraction: separate Python service (OCR, tables)
            |                            |
            |                            v
            |                 [ PostgreSQL ]
            |                 [ File storage: public/ ]
```

- **Frontend:** React app in `frontend/`. Responsive/PWA for mobile.
- **Backend:** Node.js API in `backend/`. REST (or GraphQL if you decide later). Handles users, courses, sessions, images, notes, auth.
- **Extraction:** **Option B** — a **separate Python service** (microservice) for OCR/table detection; Node backend calls it. Auth and other logic stay in the backend (no separate “middleware” layer).
- **Database:** PostgreSQL only.
- **Storage:** Uploaded files (images, PDFs, etc.) under `public/` (or e.g. `public/uploads/`).

### 2.2 Folder Structure (Target)

```
learning_buddy/
├── frontend/           # React app
├── backend/            # Node.js API
├── docs/               # Optional: API spec, DB schema notes
├── initial_requirements
├── PROJECT_PLAN.md     # This document
└── .env                # Not committed; DB URL, JWT secret, etc.
```

No separate middleware layer: auth and API logic live in `backend/`. Extraction is the only separate component (Python service). Optional: `backend/services/` for internal service modules if needed.

### 2.3 Data Model (Conceptual)

- **Users** — id, email, password hash, created_at, etc.
- **Courses** — id, user_id, name, created_at, etc.
- **Sessions** — id, course_id, title, session_date (or order), created_at, etc.
- **Images / Uploads** — id, session_id, file_path (under public/), original_filename, file_type (image/pdf/etc.), created_at, etc.
- **Notes / Extracted content** — id, session_id (or image_id, depending on design), content (e.g. JSON or rich text), table_data (JSON), highlights (JSON), updated_at, etc.

Exact schema and normalisation will be defined in Phase 1 (database).

---

## 3. Technical Plan

### 3.1 Stack Summary

| Layer      | Choice        | Notes |
|-----------|----------------|--------|
| Frontend  | React          | Responsive; consider PWA for mobile. |
| Backend   | Node.js        | Express/Fastify; JWT auth. |
| DB        | PostgreSQL     | Migrations (e.g. node-pg + migration tool). |
| Auth      | JWT            | Login returns JWT; API protects routes with middleware. |
| Extraction| Python (separate service) | Tesseract + table detection; LLM later if required. |
| Tests     | TDD                       | Unit, integration, e2e; ≥90% coverage; see §3.3. |

### 3.2 Build Order

1. **Database** — Schema, migrations, seeds (if any). Tests for schema/constraints or repo behaviour.
2. **Backend** — API, auth, CRUD for courses/sessions/images/notes, upload to `public/`, orchestration of extraction. All TDD.
3. **Frontend** — React app: auth, courses, sessions, upload, view/edit/save notes. TDD for components and flows.

### 3.3 TDD & Quality Gates (Mandatory)

- **TDD is mandatory:** Write tests first (or alongside) for both technical and functional behaviour.
- **Test types:** Unit tests, integration tests, and e2e tests as appropriate per layer.
- **Coverage:** Test coverage must be **≥ 90%** for the scope of each phase.
- **Quality gate:** Do **not** move to the next step or phase until **all tests for the current phase pass (100% pass rate)** and coverage target is met.

---

## 4. Phase-Wise Checklist

### Phase 1 — Database

- [x] **1.1** Set up PostgreSQL (local/dev) and connection config (e.g. env).
- [x] **1.2** Choose migration approach (e.g. `node-pg` + `node-pg-migrate`, or Knex, or Prisma migrations).
- [x] **1.3** Define and implement schema (TDD where applicable: e.g. tests that expect tables/constraints or test repository layer):
  - [x] `users` (id, email, password_hash, created_at, etc.)
  - [x] `courses` (id, user_id, name, created_at)
  - [x] `sessions` (id, course_id, title, session_date/order, created_at)
  - [x] `images` or `uploads` (id, session_id, file_path, original_filename, file_type, created_at)
  - [x] `notes` or `extracted_content` (id, session_id and/or image_id, content, table_data, highlights, updated_at)
- [x] **1.4** Add foreign keys, indexes (e.g. user_id, course_id, session_id).
- [x] **1.5** Document schema (in this doc or in `docs/schema.md`).
- [x] **1.6** Optional: seed data for dev; script to reset DB.

**Exit criteria:** Migrations run cleanly; schema matches plan; all DB/repo tests pass; ≥90% coverage; unit + integration (and e2e where applicable) per §3.3. Do not proceed to Phase 2 until 100% pass.

---

### Phase 2 — Backend

- [x] **2.1** Backend project in `backend/`: package.json, env (DB URL, JWT secret), lint, test runner.
- [x] **2.2** TDD: Health or ping route (e.g. `GET /health`).
- [x] **2.3** TDD: User registration (e.g. `POST /auth/register`) — hash password, insert user.
- [x] **2.4** TDD: Login (e.g. `POST /auth/login`) — validate credentials, return JWT.
- [x] **2.5** TDD: Auth middleware — verify JWT on protected routes; return 401 when invalid.
- [x] **2.6** TDD: Courses CRUD (create, list, get, update, delete) — all scoped by `user_id` from JWT.
- [x] **2.7** TDD: Sessions CRUD — scoped by course and user.
- [x] **2.8** TDD: File upload — accept images, PDFs, and other supported formats; store under `public/` (or `public/uploads/`), save metadata in DB (e.g. `images`/`uploads` table).
- [x] **2.9** TDD: Notes/extracted content — create or update per session (or per image); return structured content (text, tables, highlights).
- [x] **2.10** Extraction pipeline (initially stub or simple):
  - [x] Stub: notes created/updated via PUT /notes/sessions/:sessionId; no automatic extraction on upload yet (Phase 4).
  - [ ] Later: call Python OCR service or run script; parse tables/highlights; save to DB.
- [x] **2.11** TDD: GET endpoints for session notes (with images and extracted content).
- [x] **2.12** API documentation (e.g. OpenAPI/Swagger or a short doc in `docs/`) and CORS for frontend.

**Exit criteria:** All backend tests pass (unit + integration + e2e); ≥90% coverage per §3.3; can register, login, create courses/sessions, upload files, create/update notes via API. Do not proceed to Phase 3 until 100% pass.

---

### Phase 3 — Frontend

- [x] **3.1** React app in `frontend/`: create-react-app or Vite, router, basic layout (responsive).
- [x] **3.2** TDD: Auth — login/register forms, store JWT (e.g. memory or httpOnly cookie), redirect when unauthenticated.
- [x] **3.3** TDD: Course list and create course.
- [x] **3.4** TDD: Course detail → list sessions; create session.
- [x] **3.5** TDD: Session detail → upload multiple files (images, PDFs, etc.); show list of uploads.
- [x] **3.6** TDD: Trigger extraction (or show “processing” then refreshed content).
- [x] **3.7** TDD: View extracted notes — text, tables, highlights in a “nice format.”
- [x] **3.8** TDD: Edit content (inline or form) and save; re-edit anytime.
- [x] **3.9** Mobile: responsive layout and touch-friendly controls; optional PWA.
- [x] **3.10** Error handling and loading states; use backend base URL from env.

**Exit criteria:** User can sign up, log in, manage courses/sessions, upload files, see and edit saved notes on desktop and mobile. All frontend tests pass (unit + integration + e2e); ≥90% coverage per §3.3. Do not proceed to Phase 4 until 100% pass.

---

### Phase 4 — Extraction (Enhancement)

- [x] **4.1** Design extraction API (backend calls Python or internal module).
- [x] **4.2** TDD: Python (or Node) OCR — extract text from image (e.g. Tesseract).
- [x] **4.3** Table detection — detect tables in image, output structure (e.g. JSON grid).
- [x] **4.4** Highlights — heuristic (e.g. colour/contrast) or optional LLM pass.
- [x] **4.5** Wire to backend upload/processing flow; save results to `notes`/extracted_content.
- [x] **4.6** Frontend: show “Processing…” and refresh when extraction completes (poll or webhook later).

**Exit criteria:** Extraction pipeline works for images (and PDFs as scoped); all extraction-service and integration tests pass; ≥90% coverage per §3.3. Do not consider phase complete until 100% pass.

---

## 5. Document Control

- **Single source of truth:** This document (`PROJECT_PLAN.md`) holds the full project understanding, architecture, and phase checklist.
- **Updates:** When requirements or architecture change, update this file and keep the checklist in sync with actual work (e.g. tick items when done).
- **References:** `initial_requirements` in the project root is the original input; this plan is the elaborated version.

---



*End of document.*
