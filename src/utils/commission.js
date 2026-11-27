// Company share of each purchase amount. Unlisted/custom categories use the
// "Other (custom)" rate. Percentages, e.g. 1 means 1%.
const DEFAULT_COMPANY_RATE = 2.5;
const COMPANY_RATES = {
  shop: 2.5,
  shopping: 2.5,
  wholesale: 2.5,
  petrol_diesel: 0.5,
  car: 1,
  motorcycle_scooty: 1,
  property: 1,
  crop: 2.5,
  self_service_saving: 2.5,
  education: 2.5,
  factory: 2.5,
  foodpoint: 2.5,
  cosmetic: 2.5,
  jewelry: 2.5,
  fruit: 2.5,
  'vegetable seller': 2.5,
  other_custom: 2.5,
};

const getCompanyRate = (category) => COMPANY_RATES[category] ?? DEFAULT_COMPANY_RATE;

// A dealer's own 1% is collected directly from the buyer, outside the app.
const DEALER_OWN_RATE = 1;

module.exports = { getCompanyRate, DEALER_OWN_RATE };
