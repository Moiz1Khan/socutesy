# Deploy SoCutesy (Railway + Docker)

One **Docker** image runs the **Vite build**, **Express API**, and serves the shop from the same URL (good for `/api`, cookies, and `/admin`).

## Prerequisites

- GitHub (or GitLab) repo with this project pushed
- [Railway](https://railway.app) account

## 1. Create project

1. Railway → **New Project** → **Deploy from GitHub** → select the repo.
2. Railway should detect the **Dockerfile** at the repo root (`railway.toml` sets `builder = DOCKERFILE`).
3. **Do not** set the service root to `server` only — the Dockerfile must build from the **repository root**.

### Build failed with exit code 137?

That often means the **build ran out of memory** while `npm` was installing (Linux may send **SIGKILL**, exit **128+9=137**). Try: redeploy with the latest Dockerfile (lower npm concurrency + npm cache mounts), or increase the **builder** resources in Railway if your plan allows. Logs that say **context canceled** can also mean the build was stopped manually or timed out.

## 2. Docker build arguments (required)

In the service → **Settings** → **Build** → **Docker Build Args** (name varies):

| Name | Value |
|------|--------|
| `VITE_WHATSAPP_NUMBER` | Digits only, country code included (e.g. `923227784397`) |

Leave **`VITE_API_URL`** unset (empty) so the browser uses the **same origin** for `/api`.

Redeploy after changing build args.

## 3. Persistent volume (required)

SQLite and uploads must survive deploys.

1. Service → **Settings** → **Volumes** → **Add volume**
2. **Mount path:** `/data`
3. **Variables** (same service):

| Name | Value |
|------|--------|
| `DATA_DIR` | `/data` |

## 4. Runtime environment variables

| Name | Notes |
|------|--------|
| `NODE_ENV` | `production` (HTTPS session cookies) |
| `ADMIN_PASSWORD` | Strong password for `/admin` |
| `SESSION_SECRET` | Long random string |
| `CORS_ORIGIN` | Your public site URL, e.g. `https://your-app.up.railway.app` (comma-separated if multiple) |

Optional: `PORT` is set by Railway automatically.

## 5. Domain

**Settings** → **Networking** → **Generate domain** (or attach a custom domain).

## 6. Verify

- Open `https://your-url/` — shop loads.
- `GET https://your-url/api/health` → `{"ok":true,"orderIdScheme":"short8",...}`
- `/admin` — sign in with `ADMIN_PASSWORD`.

## Local Docker (optional)

```bash
docker build -t socutesy --build-arg VITE_WHATSAPP_NUMBER=923000000000 .
docker run --rm -p 3000:3000 -e ADMIN_PASSWORD=test -e SESSION_SECRET=dev-secret -e DATA_DIR=/data socutesy
```

(Add `-v socutesy-data:/data` for a persistent volume.)

## Vercel (frontend only)

The repo root includes **`vercel.json`** so you can import the **whole repo** (do not set “Root Directory” to `frontend` unless you remove the root config).

1. **Environment variables** (Production): `VITE_WHATSAPP_NUMBER`, and **`VITE_API_URL`** = your API base URL (e.g. Railway), **no trailing slash**.
2. Redeploy after changing env vars.

## Split deploy (optional)

- **Vercel + Railway API:** `VITE_API_URL` on Vercel points to Railway. Set **`CORS_ORIGIN`** on Railway to your Vercel URL(s). Admin/session across two origins may need extra cookie/CORS tuning; **single Docker deploy** on Railway avoids that.
