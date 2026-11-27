# Referral staff and commission API

## Referral attribution and earning rules

Staff accounts are created by an administrator. The API generates a unique referral code for each staff member. A new shopper or shopkeeper includes that code as `referralCode` in `POST /api/auth/signup`. Invalid or blocked staff codes are rejected; referral attribution cannot be changed by the registering member afterward.

Commission is awarded once per referred member and qualifying member type, after the qualifying fee is successfully received:

- Shopper: PKR 1,000 token activation fee.
- Shopkeeper: PKR 3,000 shop registration fee.

The admin can configure a fixed PKR reward or a percentage of the qualifying fee, separately for shoppers and shopkeepers. Global rules apply to staff assigned to global rules; custom staff rules override them. The selected rule and fee are snapshotted for each award, so later setting changes do not alter past earnings. The fee payment and commission award are committed in the same MongoDB transaction.

## Staff dashboard endpoints

All staff routes require an access token for a user with the `staff` role.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/staff/dashboard` | Staff identity, referral code, commission rules, balances, revenue and referral totals |
| `GET` | `/api/staff/referrals?page=1&limit=20` | Paginated referred-member profiles, shops and rewards |
| `GET` | `/api/staff/earnings?page=1&limit=20` | Paginated commission history and qualifying revenue totals |
| `GET` | `/api/staff/payouts?page=1&limit=20` | Paginated payment request history |
| `POST` | `/api/staff/payouts` | Request payment from the available commission balance |

Payment request body:

```json
{
  "amount": 500,
  "method": "easypaisa",
  "accountDetails": "Account holder name, 03xxxxxxxxx"
}
```

Allowed methods are `easypaisa`, `jazzcash`, and `bank`. On request, the amount moves from available to reserved commission. Admin rejection returns the reserved amount to the available balance; admin completion records the manual payout and moves it to the paid total.

## Admin endpoints

All admin endpoints below require an authenticated `admin` account.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/referral-settings` | Read global default rules |
| `PATCH` | `/api/admin/referral-settings` | Set global default shopper and shopkeeper rules |
| `GET` | `/api/admin/staff?search=&page=1&limit=20` | Search and paginate staff with balance and referral totals |
| `POST` | `/api/admin/staff` | Create a verified staff login and generated referral code |
| `GET` | `/api/admin/staff/:staffId` | Staff profile, summary, paginated referrals, commission rewards, payouts and ledger |
| `PATCH` | `/api/admin/staff/:staffId` | Change staff profile, block status, commission rules or global-rule assignment |
| `GET` | `/api/admin/staff-payouts?status=pending&page=1&limit=20` | Review payment requests across all staff |
| `POST` | `/api/admin/staff-payouts/:payoutId/process` | Complete or reject a pending payment request |

Rule values use this shape:

```json
{
  "defaultRules": {
    "shopper": { "type": "fixed", "value": 250 },
    "shopkeeper": { "type": "percentage", "value": 10 }
  }
}
```

`type` is `fixed` or `percentage`; percentage values are limited to 0–100. The staff creation request accepts the same object as `commissionRules` to set staff-specific rules; omit it to assign the current global rules.

The staff detail endpoint accepts independent page parameters `referralspage`, `rewardspage`, `payoutspage`, and `ledgerpage`, each with a matching `*limit` parameter (maximum 100). It returns complete totals independently of those pages.
