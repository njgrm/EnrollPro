# Subsystem API Quick Start (ATLAS, AIMS, SMART)

This guide is for teammate systems that need to fetch data from EnrollPro.

It gives one shared setup flow for ATLAS, AIMS, and SMART.

## One Important Rule

EnrollPro API must be ready first before your subsystem fetch starts.

If your teammate runs one of these commands on their own machine:

- `pnpm dev`
- `npm run dev`
- `npm run serve`

their app should wait for EnrollPro API health before any fetch job runs.

## 1. Required Values

Set these values in your subsystem environment file.

```env
ENROLLPRO_BASE_URL="http://100.120.169.123:5000"
ENROLLPRO_INTEGRATION_BASE_URL="http://100.120.169.123:5000/api/integration/v1"
```

Notes:

- Use Tailnet DNS if your team prefers hostname.

## 2. Start Order (Must Follow)

### Step A: Start EnrollPro API first (host machine)

From EnrollPro root:

```bash
pnpm run dev
```

or API only:

```bash
pnpm run dev:server
```

### Step B: Start your subsystem app (your machine)

Use your project command:

```bash
pnpm dev
```

or

```bash
npm run dev
```

or

```bash
npm run serve
```

### Step B.1: Enforce API-first inside your scripts (recommended)

If you want automatic protection, add a pre-check script.

Example `package.json` script pattern:

```json
{
  "scripts": {
    "predev": "node scripts/wait-for-enrollpro-api.mjs",
    "dev": "your-dev-command",
    "preserve": "node scripts/wait-for-enrollpro-api.mjs",
    "serve": "your-serve-command"
  }
}
```

Example `scripts/wait-for-enrollpro-api.mjs`:

```js
const base = process.env.ENROLLPRO_BASE_URL || "http://100.120.169.123:5000";

async function wait(url, headers = {}) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`API check failed: ${url}`);
}

await wait(`${base}/api/health`);
await wait(`${base}/api/integration/v1/health`);

console.log("EnrollPro API is ready.");
```

### Step C: Run health checks before first fetch

Run these checks from your machine.

#### Public health check

```bash
curl http://100.120.169.123:5000/api/health
```

Expected:

```json
{ "ok": true }
```

#### Integration health check (public)

```bash
curl http://100.120.169.123:5000/api/integration/v1/health
```

Expected `data.status` is `ok`.

#### Sample endpoint check (keyless)

```bash
curl http://100.120.169.123:5000/api/integration/v1/sample/teachers
```

Expected HTTP 200.

## 3. Add API-First Guard in Your Startup

Use a simple wait loop in your subsystem app boot code.

```js
async function waitForEnrollPro(url, headers = {}) {
  const tries = 30;

  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.ok) return true;
    } catch {}

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("EnrollPro API is not ready");
}

async function boot() {
  const base = process.env.ENROLLPRO_BASE_URL;

  await waitForEnrollPro(`${base}/api/health`);
  await waitForEnrollPro(`${base}/api/integration/v1/health`);

  // Start your app fetch jobs only after checks pass.
  startSubsystemSync();
}

boot();
```

## 4. Shared Endpoint Map

Public default feeds:

- ATLAS: `GET /api/integration/v1/default/atlas/faculty`
- AIMS: `GET /api/integration/v1/default/aims/context`
- SMART: `GET /api/integration/v1/default/smart/students`

Shared support feed (public):

- Staff list: `GET /api/integration/v1/staff`

Sample feeds (keyless, for demo/testing):

- `GET /api/integration/v1/sample/teachers`
- `GET /api/integration/v1/sample/staff`
- `GET /api/integration/v1/sample/students`

## 5. Common Error Meanings

- `400`: Bad query value (for example wrong `schoolYearId`).
- `404`: Scoped data not found.
- `503`: Sample feeds disabled in production mode or API degraded.

## 6. Troubleshooting

1. API health fails:

- Confirm EnrollPro server is running.
- Confirm port `5000` is open.

2. Integration health fails:

- Confirm EnrollPro API process is running.

3. Sample feeds fail with 503 in production:

- Ask host to enable `INTEGRATION_PUBLIC_SAMPLE_ENABLED=true`.

4. Works in browser but fails in app:

- Add startup wait logic before your first fetch.
- Do not start sync jobs at import time.

## 7. Next Guides

- [ATLAS API Guide](./ATLAS_API_GUIDE.md)
- [AIMS API Guide](./AIMS_API_GUIDE.md)
- [SMART API Guide](./SMART_API_GUIDE.md)
- [Integration API v1 Spec](./INTEGRATION_API_V1.md)
