# LogiBots Frontend

[Português (Brasil)](README.BR.MD)

React and TypeScript interface for the LogiBots educational platform. It provides programming assistance through chat, student quizzes, teaching material management, academic administration, and activity dashboards. The interface supports Brazilian Portuguese, English, and Spanish.

## Technology stack

| Layer | Technologies |
|---|---|
| Application | React, TypeScript, Vite |
| Routing | React Router |
| Server state | TanStack Query |
| API communication | Axios and Fetch with Server-Sent Events (SSE) |
| Interface | Tailwind CSS, Lucide icons |
| Content rendering | React Markdown, remark-gfm, syntax highlighting |
| Charts and export | Recharts, html-to-image |
| Internationalization | i18next, react-i18next, browser Intl APIs |
| Validation | TypeScript, ESLint, Vitest, Testing Library, Playwright, axe-core |
| Container runtime | Nginx serving the compiled single-page application |

## Interface functionality

| Module | Functionality |
|---|---|
| Authentication | Sign-in, registration with a class access code and terms consent, session restoration, logout, and password recovery/reset forms |
| Account | Name, email, and password updates; language preference; academic information associated with the account |
| Student chat | Streaming responses, conversation history, Markdown and code rendering, processing indicators, and retrieved material references |
| Student quizzes | Available quizzes, question navigation, answer selection, attempt submission, results, and history |
| Quiz management | Manual or AI-assisted creation, content language selection, question editing, publication, unpublication, and student results |
| RAG knowledge base | Class selection, PDF/TXT/DOCX uploads, processing status, reprocessing, deletion, retrieval settings, and a test chat |
| Academic administration | Universities, courses, classes, subjects, professors, class access codes, entity searches, and class/subject/professor associations |
| Dashboards | Academic filters, usage time, accuracy, topic performance, proficiency, learning progress, access sessions, effort/performance charts, AI insights, and PNG export |
| Feedback | Categorized feedback submission and an administrative feedback listing |

Navigation adapts to student, professor, course coordinator, and administrator roles. The API authorizes operations and determines the academic records available to each account. The layout includes desktop navigation, a mobile menu, keyboard-accessible controls, and dialogs with focus management.

### Main routes

| Route | Interface |
|---|---|
| `/` | Public home page |
| `/signin`, `/signup` | Authentication and registration |
| `/forgot-password`, `/reset-password?token=...` | Password recovery and reset |
| `/home` | Authenticated entry point |
| `/chat` | Student chat |
| `/quiz`, `/quiz/:id` | Student quizzes and attempts |
| `/quiz/manage` | Quiz management |
| `/rag` | Teaching materials and RAG settings |
| `/dashboard` | Activity dashboards and insights |
| `/entities/manage` | Academic entity and association management |
| `/entities/create/:entityType` | Entity creation |
| `/entities` | Entity search, editing, and deletion |
| `/profile` | Account and language settings |
| `/feedback` | Feedback submission |
| `/admin/feedbacks` | Administrative feedback listing |

Authenticated routes use a shared layout. Feature pages and API permissions determine the operations available within each route.

## Language behavior

Supported locales are `pt-BR`, `en-US`, and `es-ES`. The language selector is available on public pages, authentication screens, the authenticated menu, and the profile page.

- **Follow browser** reads `navigator.languages`, normalizes variants such as `en-GB` and `es-MX`, and falls back to `pt-BR`.
- An explicit selection made during the current session takes precedence over the account preference. Otherwise, the authenticated account preference applies; a null preference follows the browser.
- Visitors use their saved local preference or the browser language. Logout clears session precedence so another account can restore its own preference.
- Account preferences use `PATCH /account/preferences`; returning to browser detection sends `{"language":null}`. Failed saves retain the local selection and expose a retry action.
- API requests send `Accept-Language`; explicit choices also use `X-Language`. Chat generations retain the language captured when the request starts, and insight caches distinguish languages.
- Switching the interface preserves entered values, existing materials, names, questions, answers, and conversation history. New quizzes can use a content language selected independently of the interface.
- Dates, numbers, percentages, durations, and plurals follow the active locale. Known content languages are exposed through HTML `lang` attributes.

Catalogs are stored in `src/i18n/catalogs`. `npm run check:i18n` checks key and interpolation parity, preserved Portuguese text fixtures, and uncatalogued interface text. Implementation details are available in [docs/multilinguagem.md](docs/multilinguagem.md).

## Source organization

```text
src/
  app/          Application providers and routing
  assets/       Static interface assets
  components/   Shared UI primitives
  features/     Account, authentication, chat, quizzes, RAG, administration,
                academic filters, dashboards, feedback, and public pages
  i18n/         Catalogs, negotiation, persistence, and localization helpers
  services/     Shared API clients and endpoint adapters
  shared/       Layouts, dialogs, HTTP transport, hooks, and formatting
scripts/        Internationalization checks
tests/          Browser tests, API integration scenarios, and fixtures
```

Feature modules group their pages, components, API adapters, hooks, and types. TanStack Query handles remote data and caching. Authenticated HTTP requests use API session cookies; chat streaming uses Fetch/SSE.

## Configuration

Copy the environment template and set values for the target API:

```bash
cp .env.example .env
```

| Variable | Purpose | Default / example |
|---|---|---|
| `VITE_API_BASE_URL` | Browser API base URL; `/api` uses the Nginx proxy | `/api` |
| `VITE_API_KEY` | API key expected by the backend | Set to the backend `API_KEY` |
| `FRONTEND_PORT` | Host port published on the loopback interface | `5173` |
| `API_UPSTREAM` | Backend URL reachable from the Nginx container | `http://backend:43187` |
| `API_DOCKER_NETWORK` | Existing Docker network shared with the backend | `logibot_backend_default` |
| `E2E_ADMIN_EMAIL` | Administrative account for local API integration tests | Set in the local test environment |
| `E2E_ADMIN_PASSWORD` | Password for that test account | Set in the local test environment |
| `LOCAL_UID`, `LOCAL_GID` | Browser test container ownership for generated artifacts | `1000`, `1000` |

`VITE_*` values are embedded in the public browser bundle at build time. Rebuild the frontend after changing them. Provider credentials and session secrets belong to the backend. `API_UPSTREAM` is substituted when Nginx starts. `E2E_*` credentials are passed only to the API integration test service.

The `.env` file is excluded from Git and the Docker build context. The build receives only its declared arguments.

## Run with Docker

Requirements: Docker Engine, Docker Compose, a running compatible API, and the external network specified by `API_DOCKER_NETWORK`. API generation, material processing, and retrieval also require the backend worker, model provider, Embedding service, and ChromaDB to be configured in their own services.

```bash
docker compose up -d --build --wait --wait-timeout 120
docker compose ps
```

Open [http://localhost:5173](http://localhost:5173), or the port configured through `FRONTEND_PORT`. The API must allow the browser origin and support the required session cookies.

The container serves the compiled application on port `5190`, published as `127.0.0.1:FRONTEND_PORT`. Nginx provides an SPA route fallback and a `/health` endpoint. With `VITE_API_BASE_URL=/api`, requests under `/api/` are forwarded to `API_UPSTREAM` with that prefix removed. The proxy supports session cookies, uploads, and unbuffered SSE responses.

The final runtime image contains compiled assets and Nginx configuration. Node.js, build tools, and browser test dependencies remain in build/test images. Host-side Node.js, npm, and browser installations are unnecessary for this workflow.

```bash
docker compose down
```

This stops the frontend project. The external API network and backend services remain managed by their own projects.

## Validation

`docker-compose.yml` defines only `frontend`. Test services are defined separately in `docker-compose.test.yml`, using the Compose project name `logibot-frontend-tests`. Run the suites sequentially to limit resource contention with the application services.

### Build, catalogs, unit tests, and lint

```bash
docker compose -f docker-compose.test.yml --profile test run --build --rm tests sh -c 'npm run build && npm run check:i18n && npm test && npm run lint'
```

This checks TypeScript, the Vite bundle, locale catalogs, Vitest tests, and ESLint with zero warnings allowed. Dependencies are installed with `npm ci` inside the image.

### Browser interface tests

Start the frontend before running:

```bash
docker compose -f docker-compose.test.yml --profile browser run --build --rm browser-tests
```

Playwright runs Chromium desktop and mobile emulation against controlled API responses. Coverage includes language switching, retained input, request contracts, role-based navigation, profile scrolling, low-height dialogs, dropdown placement, charts, PNG export, and axe accessibility checks.

The browser test services use Linux host networking to access the frontend port. Artifacts are written to `test-results/artifacts`; `LOCAL_UID` and `LOCAL_GID` control file ownership.

### Local API integration tests

Configure `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD`, and start the application and its API dependencies:

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests sh -c 'npm exec tsc -- -p tsconfig.e2e.json && npm run test:e2e:real'
```

This suite accepts only `localhost` or `127.0.0.1`. It creates uniquely prefixed academic records and accounts, exercises account changes, feedback, academic CRUD, coordinator permissions, and quiz publication/attempt/results workflows across all three languages on desktop and mobile. Cleanup runs in `finally` and restores the original administrator language preference; forcibly terminating the container may interrupt cleanup.

The desktop-only `generation.provider.spec.ts` also uploads and reprocesses a TXT document, generates a quiz with retrieved sources, receives chat streaming, requests an AI insight, exports PNG, and deletes the material. These scenarios call the backend's configured provider and consume its normal API quota.

To run only workflows without AI generation:

```bash
docker compose -f docker-compose.test.yml --profile real run --build --rm real-tests npm run test:e2e:real -- account.spec.ts academic.spec.ts entities.spec.ts quiz.spec.ts
```

Integration artifacts are written to `test-results/real` and `test-results/real-report.json`. Test outputs are excluded from Git.
