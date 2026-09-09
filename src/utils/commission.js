// Fixed company-wide rates for the property/car/bike programs (distinct from
// a shopkeeper's own configurable `taxRate`, which only applies to `shop`
// purchases). Percentages, e.g. 1 means 1%.

// Via a registered dealer: 2% total commission, split 1% company / 1% dealer.
// Only the company's 1% ever moves through the app (debited from the
// dealer's wallet, credited to the company wallet) — the dealer's own 1% is
// commission they already collected directly from the buyer, outside the app.
const DEALER_COMPANY_RATE = 1;
const DEALER_OWN_RATE = 1;

// Via the app's "Self Automated" option (no dealer): 1% straight to the
// company, debited from the shopper's own wallet.
const SELF_AUTOMATED_COMPANY_RATE = 1;

module.exports = { DEALER_COMPANY_RATE, DEALER_OWN_RATE, SELF_AUTOMATED_COMPANY_RATE };
