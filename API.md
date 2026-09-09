# Auth API Reference

Base URL: `http://localhost:5000/api`

All request/response bodies are JSON. Send `Content-Type: application/json` on every request with a body.

## Auth model — read this first

- Signup does **not** log the user in. It creates an unverified account and emails a 6-digit OTP. The frontend must collect that OTP and call `POST /auth/verify-email` — only that call (or a normal login afterwards) returns tokens.
- `POST /auth/login` returns `403` for an account that hasn't verified its email yet. Route the user to an "enter the OTP we emailed you" screen (with a resend button hitting `POST /auth/resend-otp`) rather than the login form in that case.
- On **verify-email** and **login**, the server returns an `accessToken` in the JSON response **and** sets two cookies:
  - `accessToken` — httpOnly, short-lived (15 min default), sent on every request
  - `refreshToken` — httpOnly, long-lived (7 days default), scoped to path `/api/auth/refresh-token` only (the browser will not send it to any other route)
- You can authenticate requests **either** by relying on the `accessToken` cookie (if `credentials: 'include'` / `withCredentials: true` is set on every request) **or** by storing the returned `accessToken` yourself and sending it as `Authorization: Bearer <token>`. Pick one strategy for your app — don't mix.
- When the access token expires (401 with `"Access token is invalid or expired"`), call `POST /auth/refresh-token` to get a new one, then retry the original request. Most frontends do this automatically via an HTTP interceptor (see example below).
- `logout` invalidates the refresh token server-side, so old refresh tokens stop working immediately after logout, even if a copy was cached somewhere.
- Password reset (`forgot-password` / `reset-password`) is a separate OTP flow from email verification — the two OTPs are not interchangeable, and each request invalidates any previously issued OTP for that account.
- All OTPs are 6 digits and expire after 10 minutes (server-configurable). A wrong OTP returns `400`; an expired/already-used one also returns `400` telling the user to request a new one.

**Cross-origin cookies:** if your frontend and API are on different origins, every `fetch`/`axios` call must include credentials (`fetch(url, { credentials: 'include' })` or `axios.defaults.withCredentials = true`), and the API's `CLIENT_URL` env var must match your frontend's origin exactly (CORS is locked to that one origin).

**Bootstrapping the first admin:** `signup` can never create a `role: "admin"` account, and the admin API below itself requires being an admin already — so the very first admin has to be created outside the API, on the server: `npm run create-admin -- "Name" "email@example.com" "password"` (see `src/scripts/createAdmin.js`). It creates the account pre-verified, or promotes an existing account to `admin` if that email is already registered. Every admin after that can be created normally, either via `POST /admin/users` or by promoting an existing account with `PATCH /admin/users/:id { "role": "admin" }`.

## Response envelope

**Success:**
```json
{
  "statusCode": 200,
  "data": { "...": "..." },
  "message": "Human-readable summary",
  "success": true
}
```

**Error:**
```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "email", "message": "A valid email is required" }]
}
```
`errors` is populated (array of `{ field, message }`) for `422` validation failures; empty otherwise. In development mode the error response also includes a `stack` field — ignore it, it won't be present in production.

## Endpoints

### `POST /auth/signup`

Request body:
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "at-least-6-chars" }
```

Response `201` — account is created but **unverified**; no tokens yet:
```json
{
  "statusCode": 201,
  "data": { "email": "jane@example.com" },
  "message": "Account created. An OTP has been sent to your email to verify your account",
  "success": true
}
```

Errors: `409` if the email is already registered, `422` for validation failures (missing name, invalid email, password < 6 chars).

Next step: show an "enter the code we emailed you" screen that submits to `POST /auth/verify-email`.

### `POST /auth/verify-email`

Request body:
```json
{ "email": "jane@example.com", "otp": "483920" }
```

Response `200` — verifies the account **and** logs the user in (tokens issued, cookies set):
```json
{
  "statusCode": 200,
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "user", "isVerified": true, "createdAt": "...", "updatedAt": "..." },
    "accessToken": "eyJ..."
  },
  "message": "Email verified successfully",
  "success": true
}
```

Errors: `404` unknown email, `400` account already verified, `400` OTP incorrect, `400` OTP expired/missing (request a new one via resend-otp).

### `POST /auth/resend-otp`

Request body:
```json
{ "email": "jane@example.com" }
```

Sends a fresh email-verification OTP (invalidates the previous one). Response `200`: `{ "statusCode": 200, "data": null, "message": "A new OTP has been sent to your email", "success": true }`.

Errors: `404` unknown email, `400` if the account is already verified.

### `POST /auth/login`

Request body:
```json
{ "email": "jane@example.com", "password": "at-least-6-chars" }
```

Response `200`: same shape as verify-email (`{ user, accessToken }`), tokens issued and cookies set.

Errors: `401 "Invalid email or password"` for a bad combo, `403 "Please verify your email before logging in"` if the account hasn't completed OTP verification yet, `422` for validation failures.

### `POST /auth/forgot-password`

Request body:
```json
{ "email": "jane@example.com" }
```

Sends a password-reset OTP **if** the email is registered. To prevent attackers from probing which emails exist, the response is identical either way:
```json
{ "statusCode": 200, "data": null, "message": "If an account exists for this email, a password reset OTP has been sent", "success": true }
```
Never branch your UI on whether the email "exists" from this response — always show the same "check your email" message.

### `POST /auth/reset-password`

Request body:
```json
{ "email": "jane@example.com", "otp": "483920", "newPassword": "at-least-6-chars" }
```

Sets the new password and revokes any existing sessions (the user must log in again afterwards). Response `200`: `{ "statusCode": 200, "data": null, "message": "Password reset successfully, please log in", "success": true }`.

Errors: `404` unknown email, `400` OTP incorrect, `400` OTP expired/missing (request a new one via forgot-password), `422` for validation failures.

### `POST /auth/refresh-token`

No request body needed if the `refreshToken` cookie is present (default browser flow). If you're calling this from a non-browser client without cookies, you may instead send:
```json
{ "refreshToken": "eyJ..." }
```

Response `200`:
```json
{ "statusCode": 200, "data": { "accessToken": "eyJ..." }, "message": "Access token refreshed successfully", "success": true }
```

Also rotates and re-sets the `refreshToken` cookie. Errors: `401` if the refresh token is missing, expired, malformed, or was revoked (e.g. user already logged out).

### `POST /auth/logout` 🔒

Requires authentication (see below). Clears both cookies and revokes the stored refresh token.

Response `200`: `{ "statusCode": 200, "data": null, "message": "Logged out successfully", "success": true }`

### `GET /auth/me` 🔒

Requires authentication. Returns the current user's profile.

Response `200`:
```json
{ "statusCode": 200, "data": { "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "createdAt": "...", "updatedAt": "..." } }, "message": "Profile fetched successfully", "success": true }
```

## 🔒 Authenticating a request

Either:
- Rely on the `accessToken` cookie (browser sends it automatically if the request is same-origin, or cross-origin with `credentials: 'include'` and matching CORS config), **or**
- Send header: `Authorization: Bearer <accessToken>`

Missing/invalid/expired token → `401`. On `401`, call `/auth/refresh-token`, then retry once. If refresh also fails, redirect the user to login.

## Example: axios client with auto-refresh

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // send/receive the httpOnly cookies
});

let accessToken = null; // or keep in memory / state management, not localStorage

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const { data } = await api.post('/auth/refresh-token');
      accessToken = data.data.accessToken;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Roles

`signup` now accepts two optional fields:
```json
{ "name": "...", "email": "...", "password": "...", "role": "shopkeeper", "businessType": "shop" }
```
- `role`: `"shopper"` (default) or `"shopkeeper"`. (`"admin"` accounts aren't self-service — they're created directly, not via signup.)
- `businessType`: **required when `role` is `"shopkeeper"`**, one of `"shop" | "property" | "car" | "bike"` — determines what kind of purchases that account can record via `POST /purchases` (see below).

`GET /auth/me` and every endpoint below now also return `role`, `businessType`, `taxRate` (only meaningful for `businessType: "shop"` — the shopkeeper's commission-tax percentage, default `2.5`; property/car/bike dealers use a fixed 1% instead, not this field), and `hasActivatedToken` (whether a shopper has claimed their first token) on the `user` object.

## Wallets, tokens & the savings/lottery program

This is the "purchase savings" system: every shopper gets a 6-digit **token**; purchases recorded against that token build up eligibility for lottery draws. Three balances exist per user:
- **Main wallet** (`mainBalance`) — real, withdrawable money. For shoppers this grows from lottery wins, and shrinks if they use the self-automated property/car/bike option (see `POST /purchases/self`). For shopkeepers/dealers, this is the balance they top up and that gets debited a company cut on every sale/deal they record.
- **Lottery wallet** (`lotteryBalance`) — a running, non-withdrawable total of everything ever credited toward lottery eligibility. It's for display/audit; the actual eligibility state lives on the token(s) themselves.
- **Company wallet** — a single admin-only balance that collects the 2.5% shopkeeper tax and one-time token activation fees.

### `POST /tokens/activate` 🔒 (shopper only)

One-time action per shopper — pays a flat Rs 100 activation fee (see payment note below) and issues their first token.

Response `201`:
```json
{ "statusCode": 201, "data": { "token": { "tokenNumber": "574229", "unlockedLevel": 0, "pool": 0, "status": "active", "generation": 1, "...": "..." } }, "message": "Token activated successfully", "success": true }
```
Errors: `403` if called by a non-shopper, `400` if this shopper already has a token.

### `GET /tokens/me` 🔒

Lists every token (active and completed) ever issued to the current shopper, oldest first. A shopper accumulates more than one over time — see the level mechanics below.

### `POST /purchases` 🔒 (shopkeeper only — `shop` sales, and property/car/bike deals via a registered dealer)

Called by the shopkeeper/dealer (not the shopper) after a real-world, in-person sale — the shopper already paid them directly (including, for a dealer, the dealer's own cut); nothing here moves money *to* the caller, only a company cut *out of* their wallet.

Request body:
```json
{ "tokenNumber": "574229", "amount": 1500 }
```
`category` is never passed in the body — it's always derived from the caller's own `businessType`, so a `property` dealer can only ever record `property` deals, etc.

What happens on success:
1. A company cut is debited from **the caller's own main wallet** and credited to the company wallet:
   - `businessType: "shop"` → the shopkeeper's `taxRate` percent (default 2.5%) of `amount`.
   - `businessType: "property" | "car" | "bike"` → a fixed 1% of `amount` (`channel: "dealer"` on the resulting purchase). The dealer's own 1% commission is *not* modeled here at all — they already collected it directly from the buyer; `dealerCommissionAmount` on the purchase record is informational only, for the dealer's own records.
2. The full `amount` is credited to the shopper's lottery wallet.
3. The shopper's currently active token's "pool" absorbs `amount` and unlocks as many sequential levels as it can afford — level *n* requires a cumulative `n × 1000`, so levels 1–30 total exactly 465,000. Whatever doesn't fit a level carries over as leftover pool for the next purchase. Because property/car/bike purchases can be large, a single deal can unlock many levels — even complete a token — in one call.
4. If this purchase pushes the token through level 30 (465,000 total), that token is marked `completed` (it keeps its unlocked levels forever, for lottery draws) and a **new token** is issued automatically for the same shopper, seeded with any pool overflow.

Response `201`:
```json
{
  "statusCode": 201,
  "data": {
    "purchase": { "tokenNumber": "574229", "category": "property", "channel": "dealer", "amount": 100000, "taxAmount": 1000, "dealerCommissionAmount": 1000, "leveledUp": [1,2,3], "...": "..." },
    "leveledUp": [1, 2, 3],
    "tokenCompleted": false,
    "newToken": null
  },
  "message": "Purchase recorded successfully",
  "success": true
}
```
When a purchase completes a token, `tokenCompleted` is `true` and `newToken` contains the freshly issued token — surface both to the shopper's UI (e.g. "🎉 token 574229 is fully loaded! Your new token is 486133").

Errors: `400` if the caller's account has no `businessType` set, `404` unknown token number, `400` token exists but isn't active (already completed — ask the buyer for their *current* token number), `400` if the caller's wallet can't cover the company cut (tell them to top up).

### `POST /purchases/self` 🔒 (shopper only — the app's "Self Automated" option)

For a shopper buying property/car/bike **without** a registered dealer. The shopper submits it themselves, against their own current active token — no `tokenNumber` needed.

Request body:
```json
{ "category": "car", "amount": 5000 }
```
`category` must be `"property" | "car" | "bike"` — this endpoint doesn't cover `shop` purchases (those always go through a shopkeeper's `POST /purchases`).

Same mechanics as above, except: a fixed 1% company commission is debited from **the shopper's own main wallet** (no dealer involved, so no dealer commission at all — `dealerCommissionAmount` is always `0`), and the resulting purchase has `channel: "self"`, `shopkeeper: null`. The shopper needs enough main wallet balance to cover that 1% themselves (top up via `POST /wallet/topup` first).

Errors: `400` if the shopper has no active token yet (activate one first), `400` if their wallet can't cover the 1% (top up), `422` if `category` isn't one of the three allowed values.

### `GET /purchases/me` 🔒

For a shopper: purchases made *on* their tokens (via any channel — shopkeeper, dealer, or self). For a shopkeeper: purchases *they* recorded. Newest first.

### `GET /wallet/me` 🔒

Returns the current user's wallet (`mainBalance`, `lotteryBalance`).

### `POST /wallet/topup` 🔒

Request body: `{ "amount": 1000, "provider": "jazzcash" }` (`provider` is `"jazzcash"` or `"easypaisa"`, optional).

⚠️ **No real payment gateway is wired up yet.** This endpoint currently credits `mainBalance` immediately, as if payment already succeeded — it's a placeholder so the rest of the flow (shopkeeper tax deduction, etc.) is testable. Real JazzCash/EasyPaisa integration is separate, later work; don't build frontend UI that assumes this is a real charge yet.

### `GET /wallet/company` 🔒 (admin only)

Returns the company wallet's total balance (tax + activation fee revenue).

## Withdrawals

Any user (shopper or shopkeeper) can request a payout from their **main wallet**. ⚠️ **No real payout gateway is wired up yet** — this is a request/approval flow: the amount is debited from `mainBalance` the instant the request is made (so it can't be double-spent), and the request sits `pending` until an admin actually sends the money externally (bank transfer, JazzCash, EasyPaisa — done manually for now) and marks it complete, or rejects it, which refunds the amount back to the wallet.

### `POST /wallet/withdraw` 🔒

Request body:
```json
{ "amount": 500, "method": "jazzcash", "accountDetails": "03001234567" }
```
`method` is `"jazzcash" | "easypaisa" | "bank"`; `accountDetails` is free text (phone number or bank account/IBAN) — shown to the admin who processes the payout.

Response `201` with the created `withdrawal` (`status: "pending"`). Errors: `400` if `mainBalance` can't cover `amount`, `422` for validation failures.

### `GET /wallet/withdrawals/me` 🔒

The current user's own withdrawal requests, newest first, with their `status`.

### `GET /wallet/withdrawals` 🔒 (admin only)

All withdrawal requests, newest first, each with the requesting user's `name`/`email` populated. Optional `?status=pending|completed|rejected` filter.

### `POST /wallet/withdrawals/:id/complete` 🔒 (admin only)

Marks a `pending` request `completed` once the admin has actually sent the money externally. Does **not** touch the wallet — the amount already left it when the request was made. Errors: `404` unknown id, `400` if it isn't `pending` (already completed/rejected).

### `POST /wallet/withdrawals/:id/reject` 🔒 (admin only)

Request body (optional): `{ "reason": "Invalid account number" }`. Marks the request `rejected` **and refunds the amount back to the user's main wallet**. Same error cases as `complete`.

## Draws (the lottery engine)

How it works: a draw picks a random 6-digit number and checks it against every token that has **at least level 1 unlocked** (both `active` and `completed` tokens are eligible — a completed token stays eligible forever). Token numbers are globally unique, so at most one token can win any single draw. The reward is that token's **current** unlocked level × 1000 (so a token that's since progressed to level 10 wins 10,000, even if it only had level 5 unlocked when it first became eligible) — a `completed` token always pays the max, 30,000. A token with 0 levels unlocked (freshly activated, no purchases yet) can never win, even on an exact number match.

A live in-process scheduler now runs draws automatically, one every `DRAW_INTERVAL_SECONDS` (default 62s ≈ 1,400/day), starting as soon as the server boots (`ENABLE_DRAW_SCHEDULER=true`, the default). ⚠️ This is a single-process `setInterval` scheduler — fine for one server instance, but if this API is ever run as multiple replicas behind a load balancer, each replica would run its own scheduler and draws would fire N times too often. At that point, set `ENABLE_DRAW_SCHEDULER=false` on all but one replica, or move this to a dedicated worker process — not done yet.

### `POST /draws/run` 🔒 (admin only)

Request body: `{ "count": 10 }` (optional, default `1`, max `1000`) — runs that many independent draws in one call, useful for catching up or batch-testing.

A `winningNumber` field (a specific 6-digit string) can also be passed to force a specific draw's outcome instead of a random one — but this **only has any effect outside production** (checked server-side via `NODE_ENV`, not client-controlled), and only when `count` is `1`. It exists purely for deterministic testing/demos; in production the field is silently ignored and the draw is always genuinely random.

Response `201`:
```json
{ "statusCode": 201, "data": { "draws": [ { "winningNumber": "223787", "winnerToken": "...", "winnerUser": "...", "rewardLevel": 5, "rewardAmount": 5000, "...": "..." } ], "winnersCount": 1 }, "message": "1 draw(s) run", "success": true }
```
A draw with no winner has `winnerToken: null`, `winnerUser: null`, `rewardAmount: 0`.

### `GET /draws`

Public — no auth required. Lists recent draws, newest first (`?limit=` up to 200, default 50). Deliberately **omits winner identity** (no `winnerUser`); only `winningNumber`, the winning token's number (if any), `rewardLevel`, `rewardAmount`, `createdAt`. Fine to show on a public "recent draws" screen.

### `GET /draws/my-wins` 🔒

The current user's own winning draws, newest first — this is the one place a shopper can see whether *their* token won.

### `GET /draws/scheduler` 🔒 (admin only)

Live status of the automatic scheduler: `{ enabled, intervalSeconds, lastRunAt, lastError, totalRuns }`.

### `POST /draws/scheduler/start` 🔒 (admin only)

Body: `{ "intervalSeconds": 62 }` (optional, min `5`, defaults to the server's configured interval). No-op if already running (doesn't restart with new params — call `stop` first to change the interval).

### `POST /draws/scheduler/stop` 🔒 (admin only)

Pauses the automatic scheduler. Manual `POST /draws/run` calls still work while it's stopped.

## Admin dashboard API

Everything under `/admin` requires `role: "admin"` — a non-admin gets `403` on all of it. See "Bootstrapping the first admin" above for how the very first one gets created.

### `GET /admin/stats` 🔒 (admin only)

One-shot dashboard overview:
```json
{
  "statusCode": 200,
  "data": {
    "users": { "total": 42, "shoppers": 35, "shopkeepers": 6, "blocked": 1 },
    "tokens": { "total": 50, "completed": 3 },
    "purchases": { "count": 210, "totalAmount": 1250000 },
    "draws": { "total": 8000, "winners": 12 },
    "pendingWithdrawals": { "count": 4, "totalAmount": 12000 },
    "companyWalletBalance": 34500
  },
  "message": "Stats fetched successfully",
  "success": true
}
```

### `GET /admin/users` 🔒 (admin only)

Query params (all optional): `role` (`shopper|shopkeeper|admin`), `businessType` (`shop|property|car|bike`), `isVerified` (`true|false`), `isBlocked` (`true|false`), `search` (matches name or email, case-insensitive substring), `page` (default `1`), `limit` (default `20`, max `100`).

Response includes `pagination: { page, limit, total, pages }` alongside `users`.

### `GET /admin/users/:id` 🔒 (admin only)

One user's full detail, plus `wallet` (or `null` if they've never touched a wallet endpoint yet), `tokenCount`, `purchaseCount` — useful for a user-detail admin screen.

### `POST /admin/users` 🔒 (admin only)

Creates any account directly — including another admin — bypassing the email OTP flow entirely (created pre-verified). Same body shape as signup, but `role` is required and can be `"admin"`:
```json
{ "name": "...", "email": "...", "password": "...", "role": "shopkeeper", "businessType": "shop" }
```

### `PATCH /admin/users/:id` 🔒 (admin only)

Body: any of `{ "name", "role", "businessType", "taxRate" }`. This is also how you promote an existing user to admin — `{ "role": "admin" }`. Changing `role` away from `"shopkeeper"` automatically clears `businessType` to `null`; changing it *to* `"shopkeeper"` requires `businessType` in the same request (`400` otherwise). Does **not** touch `isBlocked` — use the endpoints below for that.

### `POST /admin/users/:id/block` / `POST /admin/users/:id/unblock` 🔒 (admin only)

Blocking immediately prevents that user from logging in (`403`) and invalidates any of their live sessions on their very next authenticated request (also `403`). `400` if an admin tries to block their own account.

### `DELETE /admin/users/:id` 🔒 (admin only)

Hard-deletes the user and their wallet record. `400` if an admin tries to delete their own account, or if the user has any wallet balance or any tokens on record — block them instead so financial records never get orphaned.

## Quick reference table

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | No | Create unverified account, send OTP |
| POST | `/auth/verify-email` | No | Verify OTP, receive tokens |
| POST | `/auth/resend-otp` | No | Resend the email-verification OTP |
| POST | `/auth/login` | No | Log in (verified accounts only), receive tokens |
| POST | `/auth/refresh-token` | No (needs refresh token) | Get a new access token |
| POST | `/auth/forgot-password` | No | Send a password-reset OTP |
| POST | `/auth/reset-password` | No | Verify OTP, set new password |
| POST | `/auth/logout` | Yes | Revoke refresh token, clear cookies |
| GET | `/auth/me` | Yes | Get current user's profile |
| POST | `/tokens/activate` | Yes (shopper) | Pay Rs 100, get first token |
| GET | `/tokens/me` | Yes | List my tokens |
| POST | `/purchases` | Yes (shopkeeper) | Record a shop sale, or a dealer-submitted property/car/bike deal |
| POST | `/purchases/self` | Yes (shopper) | Record my own property/car/bike deal (self-automated, no dealer) |
| GET | `/purchases/me` | Yes | List my purchases (as shopper or shopkeeper) |
| GET | `/wallet/me` | Yes | Get my wallet balances |
| POST | `/wallet/topup` | Yes | Top up main wallet (placeholder, no real gateway yet) |
| GET | `/wallet/company` | Yes (admin) | Get company wallet balance |
| POST | `/wallet/withdraw` | Yes | Request a payout from my main wallet |
| GET | `/wallet/withdrawals/me` | Yes | List my withdrawal requests |
| GET | `/wallet/withdrawals` | Yes (admin) | List all withdrawal requests |
| POST | `/wallet/withdrawals/:id/complete` | Yes (admin) | Mark a withdrawal as paid out |
| POST | `/wallet/withdrawals/:id/reject` | Yes (admin) | Reject a withdrawal and refund it |
| POST | `/draws/run` | Yes (admin) | Manually run one or more draws |
| GET | `/draws` | No | List recent draw results (no winner identity) |
| GET | `/draws/my-wins` | Yes | List my winning draws |
| GET | `/draws/scheduler` | Yes (admin) | Get automatic scheduler status |
| POST | `/draws/scheduler/start` | Yes (admin) | Start the automatic scheduler |
| POST | `/draws/scheduler/stop` | Yes (admin) | Pause the automatic scheduler |
| GET | `/admin/stats` | Yes (admin) | Dashboard overview counts |
| GET | `/admin/users` | Yes (admin) | List/search/filter users, paginated |
| GET | `/admin/users/:id` | Yes (admin) | Get one user + wallet/token/purchase counts |
| POST | `/admin/users` | Yes (admin) | Create a user directly (any role, pre-verified) |
| PATCH | `/admin/users/:id` | Yes (admin) | Update name/role/businessType/taxRate |
| POST | `/admin/users/:id/block` | Yes (admin) | Block a user (blocks login) |
| POST | `/admin/users/:id/unblock` | Yes (admin) | Unblock a user |
| DELETE | `/admin/users/:id` | Yes (admin) | Delete a user (only if no wallet/tokens) |
| GET | `/health` | No | Health check |

## Not built yet

Everything from the business spec is implemented **except** the real payment gateway, which is deliberately on hold:
- Real **JazzCash/EasyPaisa payment gateway** integration. `POST /wallet/topup` is a stub that credits the wallet immediately, as if payment already succeeded — don't build frontend UI that assumes a real charge happens. Withdrawals (above) are real business logic, not a stub, but the *payout* leg is still manual (admin-processed) rather than automated through a gateway.
