# Shop Registration, Shop Directory & Token Activation — API Reference

This document covers the endpoints that changed or were added in this update:

1. Shops are no longer one-per-user — a user can register **multiple shops**, each with its own location, for the same flat **Rs 1500** fee.
2. Shop directory search now supports **location-based filtering** (by city, or by "near me" coordinates).
3. Token activation (`POST /api/tokens/activate`) now correctly **debits Rs 100 from the user's main wallet** (previously it credited the company side but never took the money from the user — that was a bug, now fixed).

---

## 1. Conventions

**Base URL:** `https://<your-domain>/api`

**Auth:** All authenticated endpoints require:
```
Authorization: Bearer <accessToken>
```
`accessToken` comes from `POST /api/auth/login` (unchanged by this update — not covered here).

**Success response envelope** (every endpoint below):
```json
{
  "statusCode": 200,
  "data": { "...": "..." },
  "message": "Human readable message",
  "success": true
}
```

**Error response envelope** (any non-2xx):
```json
{
  "success": false,
  "message": "Human readable error message",
  "errors": []
}
```

**Validation error** (HTTP 422 — malformed/missing fields):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "city", "message": "city is required" },
    { "field": "lat", "message": "lat is required" }
  ]
}
```

**Category enum** (`businessCategories` / `category`), used across all shop endpoints:
```
shopping | wholesale | petrol_diesel | motorcycle_scooty | car | property | crop | self_service_saving
```

---

## 2. Register a shop

Registers a new shop for the logged-in user. Can be called repeatedly to add more shops — there is **no limit** on shop count per user, and **every call charges Rs 1500** from the user's main wallet.

```
POST /api/shopkeepers/register
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `shopName` | string | yes | max 120 chars |
| `phoneNumber` | string | yes | 7–20 chars |
| `address` | string | yes | max 300 chars, free text |
| `description` | string | no | max 1000 chars |
| `image` | string | no | max 500 chars — image URL (upload separately, e.g. via the existing Cloudinary/manual-payment upload flow, then pass the resulting URL here) |
| `categories` | string[] | yes | at least 1, values from the category enum above |
| `city` | string | yes | max 100 chars — used for exact city search |
| `lat` | number | yes | -90 to 90 — device/shop latitude |
| `lng` | number | yes | -180 to 180 — device/shop longitude |

```json
{
  "shopName": "Al-Noor Traders",
  "phoneNumber": "03001234567",
  "address": "Shop #12, Liberty Market",
  "description": "Wholesale grocery and daily essentials",
  "image": "https://res.cloudinary.com/.../shop.jpg",
  "categories": ["shopping", "wholesale"],
  "city": "Lahore",
  "lat": 31.5204,
  "lng": 74.3587
}
```

### Success response — `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "shop": {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "owner": "66f0...userid",
      "businessType": "shop",
      "shopName": "Al-Noor Traders",
      "phoneNumber": "03001234567",
      "businessAddress": "Shop #12, Liberty Market",
      "businessDescription": "Wholesale grocery and daily essentials",
      "businessImage": "https://res.cloudinary.com/.../shop.jpg",
      "businessCategories": ["shopping", "wholesale"],
      "city": "Lahore",
      "location": { "type": "Point", "coordinates": [74.3587, 31.5204] },
      "registrationFee": 1500,
      "isVerified": true,
      "isBlocked": false,
      "createdAt": "2026-09-19T10:00:00.000Z",
      "updatedAt": "2026-09-19T10:00:00.000Z"
    },
    "registrationFee": 1500
  },
  "message": "Shop registered successfully",
  "success": true
}
```

> Note: `location.coordinates` is `[lng, lat]` (GeoJSON order), not `[lat, lng]`.

### Error responses

| Status | Cause |
|---|---|
| `400` | `"Only shopper or shopkeeper accounts can register a shop"` — e.g. an admin account |
| `400` | `"Insufficient main wallet balance for the Rs 1500 shop registration fee"` |
| `422` | Validation failed (see envelope above) — missing/invalid `city`/`lat`/`lng`/etc. |
| `401` | Missing/invalid/expired access token |

---

## 3. Shop directory (search / browse)

```
GET /api/shopkeepers
```
No auth required (public directory).

### Query parameters (all optional)

| Param | Type | Behavior |
|---|---|---|
| `category` | string | filter by one category |
| `search` | string | text search across shop name, address, description, city |
| `city` | string | **exact** (case-insensitive) city match — use when the user picks a specific city, e.g. from a map/list. Shows shops in that city only. |
| `lat` + `lng` | number | **"near me"** search — shops sorted nearest-first around this point. Use the device's current GPS position here by default. |
| `radiusKm` | number | only with `lat`/`lng`; max distance in km, default `50` |
| `page` | int | default `1` |
| `limit` | int | default `20`, max `100` |

Rules:
- If `city` is given, it wins — `lat`/`lng` are ignored for that request.
- If no `city` and no `lat`/`lng` are given, results are just newest-first (no location filtering).

**Recommended default app behavior:** on screen load, get the device's current location and call with `lat`/`lng`. When the user explicitly picks/searches a city, call with `city` instead.

### Example — default (newest first)
```
GET /api/shopkeepers?page=1&limit=20
```

### Example — near current location
```
GET /api/shopkeepers?lat=31.5204&lng=74.3587&radiusKm=25
```

### Example — specific city
```
GET /api/shopkeepers?city=Lahore&category=shopping
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "shops": [
      {
        "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
        "owner": "66f0...userid",
        "businessType": "shop",
        "shopName": "Al-Noor Traders",
        "phoneNumber": "03001234567",
        "businessAddress": "Shop #12, Liberty Market",
        "businessDescription": "Wholesale grocery and daily essentials",
        "businessImage": "https://res.cloudinary.com/.../shop.jpg",
        "businessCategories": ["shopping", "wholesale"],
        "city": "Lahore",
        "location": { "type": "Point", "coordinates": [74.3587, 31.5204] },
        "isVerified": true,
        "isBlocked": false,
        "createdAt": "2026-09-19T10:00:00.000Z",
        "distanceMeters": 1284.5
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
  },
  "message": "Shops fetched successfully",
  "success": true
}
```

> `distanceMeters` is **only present** when the request used `lat`/`lng` (it's the distance from the given point, in meters). It's absent for plain/city searches.

---

## 4. My shops

Lists the logged-in user's own shops — for a "My Shops" / dashboard screen.

```
GET /api/shopkeepers/mine
Authorization: Bearer <accessToken>
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "data": {
    "shops": [
      { "_id": "66f1...", "shopName": "Al-Noor Traders", "city": "Lahore", "...": "..." },
      { "_id": "66f2...", "shopName": "Al-Noor Traders 2", "city": "Karachi", "...": "..." }
    ]
  },
  "message": "Your shops fetched successfully",
  "success": true
}
```

Shop objects have the same shape as in section 2/3. If a shop was created before this update (backfilled from the old single-shop-per-user data), `city` may be `null` and `location` may be absent — prompt the user to fill those in via the update endpoint below.

---

## 5. Update a shop

Owner-only. Use this to edit any shop field, and in particular to set/correct `city`/`lat`/`lng` on a shop that doesn't have a location yet.

```
PATCH /api/shopkeepers/:shopId
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Request body — all fields optional, send only what changed

Same field names/limits as registration (section 2), minus `categories` also being optional here. Example — just updating location:

```json
{
  "city": "Karachi",
  "lat": 24.8607,
  "lng": 67.0011
}
```

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "data": { "shop": { "_id": "66f1a2b3c4d5e6f7a8b9c0d1", "city": "Karachi", "...": "..." } },
  "message": "Shop updated successfully",
  "success": true
}
```

### Error responses

| Status | Cause |
|---|---|
| `404` | Shop not found |
| `403` | `"You do not own this shop"` — trying to edit someone else's shop |
| `422` | Validation failed |

---

## 6. Delete a shop

Owner-only. Permanently removes the shop from the directory. **The Rs 1500 registration fee is not refunded.**

```
DELETE /api/shopkeepers/:shopId
Authorization: Bearer <accessToken>
```

No request body.

### Success response — `200 OK`

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Shop deleted successfully",
  "success": true
}
```

### Error responses

| Status | Cause |
|---|---|
| `404` | Shop not found |
| `403` | `"You do not own this shop"` — trying to delete someone else's shop |
| `422` | `shopId` is not a valid id |

---

## 7. Token activation (bug fix — now deducts wallet balance)

```
POST /api/tokens/activate
Authorization: Bearer <accessToken>
```

No request body.

**What changed:** this endpoint now debits **Rs 100 from the user's main wallet** before issuing the token (previously it issued the token without taking any money from the user — that was a bug). If the app was showing/assuming a wallet deduction already, no client-side change should be needed; just be aware the balance will now actually drop after a successful call, and the call can now fail with an insufficient-balance error it never returned before.

### Success response — `201 Created`

```json
{
  "statusCode": 201,
  "data": {
    "token": {
      "_id": "66f3...",
      "tokenNumber": "YT-000123",
      "owner": "66f0...userid",
      "generation": 1,
      "unlockedLevel": 0,
      "pool": 0,
      "status": "active",
      "completedAt": null,
      "createdAt": "2026-09-19T10:00:00.000Z"
    }
  },
  "message": "Token activated successfully",
  "success": true
}
```

### Error responses

| Status | Cause |
|---|---|
| `403` | `"Only shopper accounts can activate a token"` |
| `400` | `"Your account already has an active token"` |
| `400` | **New:** `"Insufficient main wallet balance for the Rs 100 activation fee"` — show a top-up prompt here |

To check balance before calling this (e.g. to disable the button / show a top-up CTA proactively), use the existing wallet endpoint:
```
GET /api/wallet/me
Authorization: Bearer <accessToken>
```
```json
{
  "statusCode": 200,
  "data": {
    "wallet": {
      "_id": "66f4...",
      "user": "66f0...userid",
      "mainBalance": 250,
      "lotteryBalance": 0
    }
  },
  "message": "Wallet fetched successfully",
  "success": true
}
```
`mainBalance` is what both the Rs 1500 shop registration fee and the Rs 100 activation fee are debited from.
