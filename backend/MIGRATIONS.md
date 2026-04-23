# Database Migrations

Alembic manages schema migrations. All commands run from the `backend/` directory.

## Prerequisites

Ensure dependencies are installed and `.env` is configured:

```bash
make requirements-install
cp .env.example .env  # if not done yet
```

## Adding SQLAlchemy Models

Before generating auto-migrations, define your models and register their metadata in `alembic/env.py`:

```python
# alembic/env.py
from app.models import Base          # your declarative Base
target_metadata = Base.metadata      # replace the current `None`
```

Without this, `--autogenerate` produces empty migrations. You can still write migrations manually regardless.

## Creating a Migration

### Auto-generate from model changes (recommended)

```bash
cd backend
uv run alembic revision --autogenerate -m "describe what changed"
```

Review the generated file under `alembic/versions/` before applying it.

### Write a migration manually

```bash
cd backend
uv run alembic revision -m "describe what changed"
```

Edit the generated file and implement `upgrade()` / `downgrade()` by hand using `op.*` helpers.

## Applying Migrations

```bash
cd backend
uv run alembic upgrade head      # apply all pending migrations
uv run alembic upgrade +1        # apply the next migration only
```

## Rolling Back

```bash
cd backend
uv run alembic downgrade -1      # undo the last migration
uv run alembic downgrade base    # undo all migrations
```

## Checking Status

```bash
cd backend
uv run alembic current           # show current revision in the database
uv run alembic history --verbose # list all revisions
```

## Running in Docker

Pass the database URL via the environment if needed, then exec into the container:

```bash
docker compose exec backend uv run alembic upgrade head
```
