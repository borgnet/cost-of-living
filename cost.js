// Pure cost-of-living math, shared between the UI and the test suite.
// All inputs are validated permissively; unknown ids return null.

import {
  US_CITIES, COUNTRIES, DATA_SOURCE, US_CITY_FEELS,
  NATIONAL_LIVING_WAGE_SINGLE, NATIONAL_MEDIAN_WAGE, NATIONAL_RENT_2BR
} from './data.js';

// Resolve a place id to either a US city object (with .kind = 'us') or a
// country object (with .kind = 'country'). Returns null if unknown.
export function resolvePlace(placeId) {
  if (!placeId) return null;
  if (US_CITIES[placeId])  return { ...US_CITIES[placeId], kind: 'us' };
  const upper = placeId.toUpperCase();
  if (COUNTRIES[upper]) return { ...COUNTRIES[upper], kind: 'country' };
  return null;
}

// Clamp helper.
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// Derive a 6-axis radar for a US city using only the data we have:
//   safety               from FBI UCR violent-crime rate (lower = safer)
//   health               from CDC life expectancy at birth
//   purchasingPower      from Census ACS median household income
//   affordability        from BEA RPP (lower RPP = more affordable)
//   commute              from Census ACS mean commute (shorter = better)
//   propertyAffordability from rent-to-income ratio (HUD FMR / Census ACS)
// Each axis is normalized to 0-100 (higher = better) so the chart shape
// is intuitively "bigger area = better".
function cityRadar(c) {
  // Safety: crime ~ 100/100k → 93; ~1500 → 7; clamp.
  const safety = clamp(100 - (c.crimeRate - 100) / 15);
  // Health: life expectancy 70 → 0, 84 → 98.
  const health = clamp((c.lifeExpectancy - 70) * 7);
  // Purchasing power: indexed against a $65K national median household, ×70 so a
  // $93K household ≈ 100. Clamp at 150 to avoid SF/SJ pushing the chart edge.
  const purchasingPower = clamp((c.medianHouseholdIncome / 65000) * 70, 0, 150);
  // Affordability: RPP 100 → 100, RPP 125 → 75, RPP 90 → 110 (clamped).
  const affordability = clamp(200 - c.rpp);
  // Commute: 15min → 100, 35min → 60, 60min → 10. Clamp.
  const commute = clamp(100 - (c.commuteMin - 15) * 2);
  // Property affordability: annual rent / median HH income. < 18% → ~100, > 50% → 0.
  const burden = (c.rent2br * 12) / c.medianHouseholdIncome;
  const propertyAffordability = clamp(100 - (burden - 0.18) * 250);
  return { safety, health, purchasingPower, affordability, commute, propertyAffordability };
}

// Household-size multiplier vs. a single adult. Calibrated to MIT Living Wage:
//   1A0C 1.00 · 2A0C 1.60 · 1A1C 1.50 · 1A2C 2.00 · 2A1C 2.10 · 2A2C 2.60
// Formula: 1 + 0.6×(adults-1) + 0.5×children, with adults ≥ 1, children ≥ 0.
// Children only scale food + healthcare + childcare, so the per-child weight
// is intentionally lower than the per-adult weight even though children
// also need housing space.
export function householdMultiplier(adults = 1, children = 0) {
  const a = Math.max(1, Math.floor(adults || 1));
  const k = Math.max(0, Math.floor(children || 0));
  return 1 + 0.6 * (a - 1) + 0.5 * k;
}

// Describe a household composition compactly (e.g. "2 adults, 1 child").
export function householdLabel(adults = 1, children = 0) {
  const a = Math.max(1, Math.floor(adults || 1));
  const k = Math.max(0, Math.floor(children || 0));
  const adultPart = a === 1 ? '1 adult' : `${a} adults`;
  if (k === 0) return adultPart;
  const childPart = k === 1 ? '1 child' : `${k} children`;
  return `${adultPart}, ${childPart}`;
}

// Compute a cost-of-living summary for a single US city.
//
// Living wage single-adult is the BLS/MIT single-adult baseline, scaled by RPP.
// Comfortable salary is what's needed to live comfortably (sourced/computed).
// Affordability ratio = medianHouseholdIncome / comfortableSalary; <1 means
// the typical household earns LESS than what's needed for comfort.
//
// Pass { adults, children } to also get household-scaled thresholds. Defaults
// preserve v1 behavior (single adult, family-of-4 reference).
export function summarizeCity(cityId, { adults = 1, children = 0 } = {}) {
  const c = US_CITIES[cityId];
  if (!c) return null;
  const livingWageSingle = NATIONAL_LIVING_WAGE_SINGLE * (c.rpp / 100);
  const livingWageFamily4 = livingWageSingle * 2.6; // MIT family-of-4 ratio
  const hhMult = householdMultiplier(adults, children);
  const livingWageHousehold = livingWageSingle * hhMult;
  const comfortableHousehold = c.comfortableSalary * hhMult;
  const affordabilityRatio = c.medianHouseholdIncome / c.comfortableSalary;
  const wagePremium = (c.medianWage / NATIONAL_MEDIAN_WAGE - 1) * 100;
  const rentPremium = (c.rent2br / NATIONAL_RENT_2BR - 1) * 100;
  return {
    id: c.id, name: c.name, state: c.state, kind: 'us',
    rpp: c.rpp,
    medianWage: c.medianWage,
    medianHouseholdIncome: c.medianHouseholdIncome,
    rent2br: c.rent2br,
    comfortableSalary: c.comfortableSalary,
    livingWageSingle,
    livingWageFamily4,
    livingWageHousehold,
    comfortableHousehold,
    householdMultiplier: hhMult,
    householdAdults: Math.max(1, Math.floor(adults || 1)),
    householdChildren: Math.max(0, Math.floor(children || 0)),
    affordabilityRatio,
    wagePremium,
    rentPremium,
    lifeExpectancy: c.lifeExpectancy,
    crimeRate: c.crimeRate,
    commuteMin: c.commuteMin,
    radar: cityRadar(c)
  };
}

// Compute a quality-of-life summary for a country.
export function summarizeCountry(code) {
  const c = COUNTRIES[code?.toUpperCase?.()];
  if (!c) return null;
  // "Effective purchasing power" — Numbeo's PP index relative to NYC=100,
  // adjusted for cost of living. >100 means residents can afford more than
  // an NYC resident with the same nominal salary.
  const effectivePP = c.purchasingPower * (100 / Math.max(c.costOfLiving, 1));
  return {
    code: c.code, name: c.name, kind: 'country',
    numbeoIndex: c.numbeoIndex,
    ceoScore: c.ceoScore,
    avgSalary: c.avgSalary,
    lifeExpectancy: c.lifeExpectancy,
    effectivePP,
    // 6-axis radar matching cityRadar's keys so the UI can compare like-for-like.
    radar: {
      safety: c.safety,
      health: c.health,
      purchasingPower: c.purchasingPower,
      // Invert costOfLiving so higher = more affordable (intuitive in radar).
      affordability: clamp(100 - c.costOfLiving + 50),
      commute: c.trafficCommute,
      propertyAffordability: c.propertyAffordability
    },
    sub: {
      safety: c.safety,
      health: c.health,
      purchasingPower: c.purchasingPower,
      pollutionCleanness: c.pollutionCleanness,
      climate: c.climate,
      costOfLiving: c.costOfLiving,
      propertyAffordability: c.propertyAffordability,
      trafficCommute: c.trafficCommute
    }
  };
}

// All US cities, sorted by a numeric field (default: comfortable salary asc).
//   sortBy: 'comfortableSalary' | 'rpp' | 'medianHouseholdIncome'
//           | 'rent2br' | 'affordabilityRatio' | 'lifeExpectancy'
//   order:  'asc' | 'desc'
export function rankUsCities({ sortBy = 'comfortableSalary', order = 'asc' } = {}) {
  const all = Object.keys(US_CITIES).map(summarizeCity);
  const cmp = (a, b) => (a[sortBy] - b[sortBy]) * (order === 'desc' ? -1 : 1);
  return all.sort(cmp);
}

// All countries, sorted by a numeric field (default: numbeo index desc).
//   sortBy: 'numbeoIndex' | 'ceoScore' | 'avgSalary' | 'effectivePP'
//           | 'lifeExpectancy'
export function rankCountries({ sortBy = 'numbeoIndex', order = 'desc' } = {}) {
  const all = Object.keys(COUNTRIES).map(summarizeCountry);
  const cmp = (a, b) => (a[sortBy] - b[sortBy]) * (order === 'desc' ? -1 : 1);
  return all.sort(cmp);
}

// Affordability gauge: maps the user's salary against three thresholds
// (minimum living wage, median, comfortable). Returns the position 0-3 for
// drawing the bullet chart, plus the threshold values themselves.
//
// Pass { adults, children } to scale the living-wage and comfortable
// thresholds for the household; the median threshold is always the local
// median household income (Census ACS already reflects mixed household
// sizes). Default behavior is unchanged (single adult).
export function affordabilityGauge(cityId, userSalary, { adults = 1, children = 0 } = {}) {
  const c = summarizeCity(cityId, { adults, children });
  if (!c) return null;
  const thresholds = {
    poverty: c.livingWageHousehold * 0.6,
    livingWage: c.livingWageHousehold,
    median: c.medianHouseholdIncome,
    comfortable: c.comfortableHousehold
  };
  let band;
  if (!isFinite(userSalary)) band = null;
  else if (userSalary < thresholds.livingWage) band = 'below_living';
  else if (userSalary < thresholds.median) band = 'between_lw_median';
  else if (userSalary < thresholds.comfortable) band = 'between_median_comfort';
  else band = 'above_comfort';
  return { city: c, thresholds, band, userSalary };
}

// ─── Feels-like layer ──────────────────────────────────────────────────────
//
// All inputs are public-data snapshots; see DATA_SOURCE for citations and
// US_CITY_FEELS in data.js for the per-city values.

// Estimate state + average local income tax owed at a given salary in a city.
// Uses the effective rate at the local median earner as a proxy — accurate
// within ~1pp for typical salaries, and cleanly handles flat-tax and no-tax
// states. Returns 0 for unknown cities (rather than throwing).
export function estimateStateTax(cityId, salary) {
  const f = US_CITY_FEELS[cityId];
  if (!f || !isFinite(salary) || salary <= 0) return 0;
  return salary * f.effectiveTaxRate;
}

// Take-home = salary − estimated state/local income tax. Federal tax is
// excluded on purpose — federal rates don't vary by metro, so they cancel
// out for relocation comparisons (which is the use case here).
export function takeHome(cityId, salary) {
  if (!isFinite(salary) || salary <= 0) return 0;
  return Math.max(0, salary - estimateStateTax(cityId, salary));
}

// Square footage you can rent for `monthlyBudget` in a given city, using the
// metro's median 2BR rent and median 2BR square footage as the price-per-sqft
// reference point. Returns 0 for unknown cities.
export function sqftAtBudget(cityId, monthlyBudget) {
  const c = US_CITIES[cityId];
  const f = US_CITY_FEELS[cityId];
  if (!c || !f || !isFinite(monthlyBudget) || monthlyBudget <= 0) return 0;
  const sqftPerDollar = f.median2brSqft / c.rent2br;
  return Math.round(sqftPerDollar * monthlyBudget);
}

// Side-by-side housing comparison: same monthly budget, two cities.
// Returns null if either city is unknown.
export function housingComparison(cityIdA, cityIdB, monthlyBudget) {
  if (!US_CITIES[cityIdA] || !US_CITIES[cityIdB]) return null;
  if (!isFinite(monthlyBudget) || monthlyBudget <= 0) return null;
  const a = sqftAtBudget(cityIdA, monthlyBudget);
  const b = sqftAtBudget(cityIdB, monthlyBudget);
  return {
    a: { id: cityIdA, name: US_CITIES[cityIdA].name, sqft: a },
    b: { id: cityIdB, name: US_CITIES[cityIdB].name, sqft: b },
    monthlyBudget,
    delta: b - a,
    deltaPct: a > 0 ? ((b - a) / a) * 100 : 0
  };
}

// Six-axis "feels-like" radar for a US city. Each axis is normalized to
// 0..100 (higher = better) so the chart shape matches the existing radar's
// "bigger area = better" convention.
//
//   afterTaxPower   purchasing power AFTER state+local tax, vs. national
//                   median household. ~70 = national, ~120 = doubly comfortable.
//   housingValue    sqft per $1 of monthly rent at the local median, scaled
//                   so a national-average market lands around 60.
//   cultural        restaurants + arts establishments per 1k residents, ×20
//                   (so a typical big-city density ~3.5 → 70).
//   greenSpace      Trust for Public Land ParkScore, used directly.
//   jobMarket       composite of (low) unemployment + 1-yr job growth + LFP.
//   climateComfort  % of days with mean temp 50–80°F, scaled ×1.4 so the
//                   best US metros (San Diego, coastal CA) land near 100.
export function feelsLikeRadar(cityId) {
  const c = US_CITIES[cityId];
  const f = US_CITY_FEELS[cityId];
  if (!c || !f) return null;

  const afterTaxIncome = c.medianHouseholdIncome * (1 - f.effectiveTaxRate);
  const afterTaxPower = clamp((afterTaxIncome / 65000) * 70, 0, 150);

  const sqftPerDollar = f.median2brSqft / c.rent2br;
  // National average 2BR ≈ 1050 sqft / $1640 = 0.64 → land at 60.
  const housingValue = clamp((sqftPerDollar / 0.64) * 60);

  const cultural = clamp(f.restaurantsPer1k * 20);
  const greenSpace = clamp(f.parkScore);

  // Job market composite. Each component already ~0-100 friendly:
  //   unemploymentScore: 2% → 100, 6% → 20, 8% → 0
  //   growthScore: -2% → 0, 0% → 50, 3% → 95
  //   lfpScore: linearly 60% → 0, 90% → 100
  const unemploymentScore = clamp(100 - (f.unemploymentRate - 2) * 20);
  const growthScore = clamp(50 + f.jobGrowth1y * 15);
  const lfpScore = clamp((f.lfpRate - 60) * (100 / 30));
  const jobMarket = clamp((unemploymentScore + growthScore + lfpScore) / 3);

  const climateComfort = clamp(f.pctComfortDays * 1.4);

  return {
    afterTaxPower,
    housingValue,
    cultural,
    greenSpace,
    jobMarket,
    climateComfort
  };
}

// All cities with feels-like data, ranked by a composite "feels-like" score
// (mean of the six radar axes). Useful for the ranking table fallback.
export function rankFeelsLike({ order = 'desc' } = {}) {
  return Object.keys(US_CITY_FEELS)
    .map(id => {
      const r = feelsLikeRadar(id);
      const c = US_CITIES[id];
      const score = r ? (r.afterTaxPower + r.housingValue + r.cultural +
                         r.greenSpace + r.jobMarket + r.climateComfort) / 6 : 0;
      return { id, name: c.name, state: c.state, radar: r, score };
    })
    .sort((a, b) => (a.score - b.score) * (order === 'asc' ? 1 : -1));
}

// Search: prefix/substring match against city/state name OR country name/code.
// Returns up to `limit` results with kind ('us' | 'country') for the suggester.
export function searchPlaces(query, { limit = 10 } = {}) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const out = [];
  for (const c of Object.values(US_CITIES)) {
    const hay = `${c.name} ${c.state}`.toLowerCase();
    if (hay.includes(q)) out.push({ kind: 'us', id: c.id, label: `${c.name}, ${c.state}` });
  }
  for (const c of Object.values(COUNTRIES)) {
    const hay = `${c.name} ${c.code}`.toLowerCase();
    if (hay.includes(q)) out.push({ kind: 'country', id: c.code, label: c.name });
  }
  return out.slice(0, limit);
}

export { DATA_SOURCE, US_CITIES, COUNTRIES, US_CITY_FEELS, NATIONAL_LIVING_WAGE_SINGLE, NATIONAL_MEDIAN_WAGE, NATIONAL_RENT_2BR };
