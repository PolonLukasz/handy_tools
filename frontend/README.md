# HandyTools Frontend

Next.js 15 frontend with TypeScript and App Router.

## Requirements

- Node.js 22 (see `.node-version`) — use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage versions
- npm (bundled with Node.js)

## Environment Setup

Copy the example env file and adjust values as needed:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (browser + SSR) | `http://localhost:8000` |
| `API_INTERNAL_URL` | Optional SSR-only override (e.g. Docker service name) | falls back to `NEXT_PUBLIC_API_URL` |
| `OPENAPI_INPUT` | Source for `npm run generate:api` — URL or file path | backend `/openapi.json` |

## Install Dependencies

```bash
npm install
```

Or via Makefile from the repo root:

```bash
make frontend-install
```

> **Never commit `node_modules/`.** Always run `npm install` after pulling changes that modify `package.json`.

## Running Locally

```bash
npm run dev
```

Or from the repo root:

```bash
make frontend-dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

```bash
npm run build
npm run start
```

Or from the repo root:

```bash
make frontend-build
```

## Running with Docker Compose

From the repo root, all services (frontend, backend, database) start together:

```bash
docker compose up --build
```

The frontend container is built using a multi-stage Docker build (`Dockerfile`) that produces a minimal Next.js [standalone](https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files) image.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |

## Linting

```bash
npm run lint
```

## API Client

The typed API client is auto-generated from the backend's OpenAPI schema using [`@hey-api/openapi-ts`](https://heyapi.dev/). See [API_CLIENT.md](./API_CLIENT.md) for the full generation workflow and env-var reference.

Quick commands:

```bash
npm run generate:api     # (re)generate client against the live backend
npm run fetch:spec       # snapshot the OpenAPI schema to openapi.json for offline builds
```
