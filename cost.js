// Pure cost-of-living math, shared between the UI and the test suite.
// All inputs are validated permissively; unknown ids return null.

import {
  US_CITIES, COUNTRIES, DATA_SOURCE, US_CITY_FEELS, US_CITY_BUY,
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

// Square footage your purchase budget would buy at the metro median, using
// Zillow ZHVI median home price + median home sqft as the $/sqft reference.
// Returns 0 for cities without buy-layer data.
export function sqftAtBuyBudget(cityId, totalPrice) {
  const b = US_CITY_BUY[cityId];
  if (!b || !isFinite(totalPrice) || totalPrice <= 0) return 0;
  const sqftPerDollar = b.medianHomeSqft / b.medianHomePrice;
  return Math.round(sqftPerDollar * totalPrice);
}

// Side-by-side housing comparison. Mode = 'rent' (monthly rent budget, default)
// or 'buy' (total purchase price). Returns null if either city is unknown
// or — for buy mode — lacks buy-layer data.
export function housingComparison(cityIdA, cityIdB, budget, { mode = 'rent' } = {}) {
  if (!US_CITIES[cityIdA] || !US_CITIES[cityIdB]) return null;
  if (!isFinite(budget) || budget <= 0) return null;
  let a, b;
  if (mode === 'buy') {
    if (!US_CITY_BUY[cityIdA] || !US_CITY_BUY[cityIdB]) return null;
    a = sqftAtBuyBudget(cityIdA, budget);
    b = sqftAtBuyBudget(cityIdB, budget);
  } else {
    a = sqftAtBudget(cityIdA, budget);
    b = sqftAtBudget(cityIdB, budget);
  }
  return {
    mode,
    a: { id: cityIdA, name: US_CITIES[cityIdA].name, sqft: a },
    b: { id: cityIdB, name: US_CITIES[cityIdB].name, sqft: b },
    budget,
    delta: b - a,
    deltaPct: a > 0 ? ((b - a) / a) * 100 : 0
  };
}

// 2025 federal income tax brackets + standard deduction.
// Used to compute realistic take-home for the savings/leftover calculation.
const FED_BRACKETS_SINGLE = [
  [0,       0.10],
  [11925,   0.12],
  [48475,   0.22],
  [103350,  0.24],
  [197300,  0.32],
  [250525,  0.35],
  [626350,  0.37]
];
const FED_BRACKETS_MFJ = [
  [0,       0.10],
  [23850,   0.12],
  [96950,   0.22],
  [206700,  0.24],
  [394600,  0.32],
  [501050,  0.35],
  [751600,  0.37]
];
const STD_DED_SINGLE = 15000;
const STD_DED_MFJ    = 30000;
// FICA = Social Security 6.2% + Medicare 1.45% (employee portion only;
// SS wage base $168,600 for 2025 — most readers stay below it, so we
// model the flat 7.65% for clarity).
const FICA_RATE = 0.0765;

// Federal income tax owed on a gross salary, using 2025 brackets and
// standard deduction. `status` is 'single' (default) or 'mfj'.
export function federalIncomeTax(income, status = 'single') {
  if (!isFinite(income) || income <= 0) return 0;
  const brackets = status === 'mfj' ? FED_BRACKETS_MFJ : FED_BRACKETS_SINGLE;
  const stdDed = status === 'mfj' ? STD_DED_MFJ : STD_DED_SINGLE;
  const taxable = Math.max(0, income - stdDed);
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lower = brackets[i][0];
    const rate  = brackets[i][1];
    const upper = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (taxable <= lower) break;
    const slice = Math.min(taxable, upper) - lower;
    tax += slice * rate;
  }
  return tax;
}

// Money left after federal + state/local + FICA taxes and household-scaled
// essential costs.
//
// Without a salary argument, uses the local BLS OEWS median individual wage
// as the reference earner. With a salary, models that specific income.
//
// What gets subtracted:
//   federalTax       2025 brackets + standard deduction; status defaults to
//                    'mfj' when adults >= 2 (so a household with two earners
//                    is roughly modeled), else 'single'.
//   stateTax         effective state + average local income tax rate at the
//                    local median earner (Tax Foundation 2025).
//   ficaTax          7.65% Social Security + Medicare (employee share).
//   essentialCosts   single-adult living wage (MIT × BEA RPP) scaled by the
//                    household multiplier (adults + children).
//
// What this is NOT modeling: itemized deductions, retirement plan
// contributions (which would reduce taxable income), child tax credit,
// EITC, mortgage interest deduction, property tax, sales tax, healthcare
// premium tax credits. Those vary too much by individual situation; the
// goal is a realistic floor.
//
// Returns null for unknown cities; otherwise an object with the full
// breakdown.
export function savingsCapacity(cityId, salary, opts = {}) {
  const c = US_CITIES[cityId];
  const f = US_CITY_FEELS[cityId];
  if (!c || !f) return null;
  const adults = Math.max(1, Math.floor(opts.adults || 1));
  const children = Math.max(0, Math.floor(opts.children || 0));
  const status = opts.filingStatus || (adults >= 2 ? 'mfj' : 'single');
  const isUser = isFinite(salary) && salary > 0;
  const grossSalary = isUser ? salary : c.medianWage;

  const federalTaxOwed = federalIncomeTax(grossSalary, status);
  const stateTaxOwed   = grossSalary * f.effectiveTaxRate;
  const ficaTaxOwed    = grossSalary * FICA_RATE;
  const afterTax = Math.max(0, grossSalary - federalTaxOwed - stateTaxOwed - ficaTaxOwed);

  const livingWageSingle = NATIONAL_LIVING_WAGE_SINGLE * (c.rpp / 100);
  const essentialCosts   = livingWageSingle * householdMultiplier(adults, children);

  const annualLeftover = afterTax - essentialCosts;
  const ratePct = afterTax > 0 ? (annualLeftover / afterTax) * 100 : 0;

  return {
    grossSalary:    Math.round(grossSalary),
    federalTax:     Math.round(federalTaxOwed),
    stateTax:       Math.round(stateTaxOwed),
    ficaTax:        Math.round(ficaTaxOwed),
    afterTax:       Math.round(afterTax),
    essentialCosts: Math.round(essentialCosts),
    annualDollars:  Math.round(annualLeftover),
    monthlyDollars: Math.round(annualLeftover / 12),
    ratePct,
    basis: isUser ? 'user-salary' : 'median-wage',
    filingStatus: status,
    adults,
    children,
    livingWageSingle: Math.round(livingWageSingle)
  };
}

// Seven-axis "feels-like" radar for a US city. Each axis is normalized to
// 0..100 (higher = better) so the chart shape matches the existing radar's
// "bigger area = better" convention.
//
//   afterTaxPower   purchasing power AFTER state+local tax, vs. national
//                   median household. ~70 = national, ~120 = doubly comfortable.
//   savingsCap      ability to save: median-wage take-home minus the local
//                   single-adult living wage, scaled. ~0% rate → 0, 40%+ → 100.
//   housingValue    sqft per $1 of monthly rent at the local median, scaled
//                   so a national-average market lands around 60.
//   cultural        restaurants + arts establishments per 1k residents, ×20
//                   (so a typical big-city density ~3.5 → 70).
//   greenSpace      Trust for Public Land ParkScore, used directly.
//   jobMarket       composite of (low) unemployment + 1-yr job growth + LFP.
//   climateComfort  % of days with mean temp 50–80°F, scaled ×1.4 so the
//                   best US metros (San Diego, coastal CA) land near 100.
//
// Pass { salary } to swap the savingsCap axis from the median-wage default
// to the user's actual salary — useful for "would I be able to save here?"
// scenarios. Other axes don't depend on salary.
export function feelsLikeRadar(cityId, { salary } = {}) {
  const c = US_CITIES[cityId];
  const f = US_CITY_FEELS[cityId];
  if (!c || !f) return null;

  const afterTaxIncome = c.medianHouseholdIncome * (1 - f.effectiveTaxRate);
  const afterTaxPower = clamp((afterTaxIncome / 65000) * 70, 0, 150);

  const sav = savingsCapacity(cityId, salary);
  // After full taxes (fed + state + FICA) and household-scaled costs, even
  // strong-saving metros land near 25% rate. Tune the axis so 0% → 0 and
  // 25%+ → 100. Negative rates clamp to 0.
  const savingsCap = clamp(sav.ratePct * 4, 0, 100);

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
    savingsCap,
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
      const score = r ? (r.afterTaxPower + r.savingsCap + r.housingValue +
                         r.cultural + r.greenSpace + r.jobMarket +
                         r.climateComfort) / 7 : 0;
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

export { DATA_SOURCE, US_CITIES, COUNTRIES, US_CITY_FEELS, US_CITY_BUY, NATIONAL_LIVING_WAGE_SINGLE, NATIONAL_MEDIAN_WAGE, NATIONAL_RENT_2BR };
