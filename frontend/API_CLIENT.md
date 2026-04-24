# Typed API Client

The frontend consumes the FastAPI backend through a **typed, auto-generated client** produced by [`@hey-api/openapi-ts`](https://heyapi.dev/). You should never hand-edit the client — regenerate it whenever the backend's OpenAPI schema changes.

## Layout

```
frontend/
├── openapi-ts.config.ts         # generator config (input, output, plugins)
├── src/api/
│   ├── index.ts                 # barrel re-export: `import { ... } from "@/api"`
│   ├── runtime-config.ts        # resolves baseUrl from env at runtime
│   └── generated/               # GENERATED — do not edit, gitignored
│       ├── client.gen.ts        # fetch client instance
│       ├── sdk.gen.ts           # typed SDK functions (one per endpoint)
│       ├── types.gen.ts         # request/response types
│       └── schemas.gen.ts       # JSON schemas
```

## Environment Variables

| Variable | Scope | Description | Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser + SSR | Backend URL exposed to the client bundle | `http://localhost:8000` |
| `API_INTERNAL_URL` | SSR only | Optional override for server-side fetches (e.g. Docker service name) | falls back to `NEXT_PUBLIC_API_URL` |
| `OPENAPI_INPUT` | dev tooling | Source for `generate:api` — URL or local file path | `http://localhost:8000/openapi.json` |

Copy `.env.example` to `.env.local` and adjust as needed. The runtime base URL is resolved in `src/api/runtime-config.ts`:

- In the **browser**, `NEXT_PUBLIC_API_URL` is the only option (other env vars aren't exposed to the bundle).
- During **SSR**, `API_INTERNAL_URL` wins if set — useful in Docker where the browser talks to `http://localhost:8000` but the Next.js server talks to `http://backend:8000`.

## Generating the Client

### First-time setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Start the backend so its OpenAPI schema is reachable:
   ```bash
   cd ../backend && uv run uvicorn app.main:app --reload
   ```
3. Generate the client:
   ```bash
   cd frontend && npm run generate:api
   ```

Files land in `src/api/generated/`. You can now import the SDK:

```ts
import { listDocuments, uploadDocument } from "@/api";

const { data, error } = await listDocuments();
```

### Regenerating after backend changes

Any time the backend adds/removes/changes an endpoint or schema:

```bash
npm run generate:api
```

Commit the updated code together with the backend change in the same PR, since runtime behavior depends on both being in sync.

### Offline generation (CI / Docker builds)

The default `input` hits the live backend, which isn't available in most CI environments. Use a committed OpenAPI snapshot instead:

```bash
# One-time (or whenever the API changes): fetch and commit a snapshot
npm run fetch:spec                   # writes ./openapi.json

# Anywhere, no backend needed:
OPENAPI_INPUT=./openapi.json npm run generate:api
```

`openapi.json` is gitignored by default — remove it from `.gitignore` if you want to commit the snapshot and run offline generation in CI.

### Alternative backend URL

```bash
OPENAPI_URL=https://staging.example.com npm run fetch:spec
# or directly
OPENAPI_INPUT=https://staging.example.com/openapi.json npm run generate:api
```

## How the Generator Is Configured

`openapi-ts.config.ts` drives generation. Key points:

- **`input`** — defaults to the localhost backend but honors `OPENAPI_INPUT`.
- **`output.path`** — `src/api/generated` (gitignored).
- **`output.format: "prettier"`** and **`lint: "eslint"`** — generated code follows the project's existing code style.
- **`plugins`**:
  - `@hey-api/client-fetch` — the runtime fetch client, wired to `src/api/runtime-config.ts` so the base URL comes from env vars.
  - `@hey-api/sdk` — one typed function per endpoint (e.g. `listDocuments`, `uploadDocument`).
  - `@hey-api/typescript` — request/response types.
  - `@hey-api/schemas` — runtime JSON schemas (useful for validation).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module "./generated/client.gen"` | Client hasn't been generated yet | `npm run generate:api` |
| `ECONNREFUSED http://localhost:8000/openapi.json` | Backend isn't running | Start it, or use `OPENAPI_INPUT=./openapi.json` with a snapshot |
| Requests go to `http://localhost:8000` in production | `NEXT_PUBLIC_API_URL` not set at build time | Remember Next.js inlines `NEXT_PUBLIC_*` vars at build — rebuild after changing them |
| SSR requests fail in Docker but browser requests work | Server-side can't reach public URL | Set `API_INTERNAL_URL=http://backend:8000` for the Next.js container |
