# Infrastructure

PostgreSQL for local development (requires Docker Desktop):

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

If you cannot install Docker, use a free hosted database (Neon) and set `DATABASE_URL` in `apps/api/.env`. See the root README.

Default local connection string:

```text
postgresql://surfguard:surfguard@localhost:5432/surfguard?schema=public
```
