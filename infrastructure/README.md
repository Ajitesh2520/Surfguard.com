# Infrastructure

PostgreSQL for local development:

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

Default connection string:

```text
postgresql://surfguard:surfguard@localhost:5432/surfguard?schema=public
```
