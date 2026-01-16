# Docker Deployment

## Build + run

From repo root:

```powershell
docker compose up --build -d
docker compose ps
```

## Logs

```powershell
docker compose logs -f api
```

## Health

```powershell
Invoke-RestMethod http://localhost:8000/v1/health
```

## Stop

```powershell
docker compose down
```
