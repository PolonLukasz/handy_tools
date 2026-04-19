# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Python 3.13 FastAPI backend, managed with `uv`. No frontend yet.

## Development Setup

```bash
make create_virtualenv   # create .venv in backend/
make requirements-install  # uv sync --frozen
```

Copy `backend/.env.example` to `backend/.env` before running locally.

## Running the Backend

```bash
cd backend && uv run uvicorn app.main:app --reload
```

Or via Docker:

```bash
docker compose up --build
```

## Linting

```bash
cd backend && uv run ruff check .
cd backend && uv run ruff format .
```

## Testing

```bash
cd backend && uv run pytest              # all tests
cd backend && uv run pytest tests/test_hello.py  # single file
```

## Architecture

All application code lives under `backend/app/`:

- `main.py` — creates the FastAPI app, mounts routers under `/api/v1`
- `config.py` — `pydantic-settings` Settings class; reads from `.env`
- `routers/` — one file per feature; each exports an `APIRouter` included in `main.py`
- `schemas/` — Pydantic request/response models, one file per feature matching router name

New features follow the pattern: add a schema in `schemas/`, a router in `routers/`, and include the router in `main.py`.
