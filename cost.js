// Pure cost-of-living math, shared between the UI and the test suite.
// All inputs are validated permissively; unknown ids return null.

import {
  US_CITIES, COUNTRIES, DATA_SOURCE,
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

// Compute a cost-of-living summary for a single US city.
//
// Living wage single-adult is the BLS/MIT single-adult baseline, scaled by RPP.
// Comfortable salary is what's needed to live comfortably (sourced/computed).
// Affordability ratio = medianHouseholdIncome / comfortableSalary; <1 means
// the typical household earns LESS than what's needed for comfort.
export function summarizeCity(cityId) {
  const c = US_CITIES[cityId];
  if (!c) return null;
  const livingWageSingle = NATIONAL_LIVING_WAGE_SINGLE * (c.rpp / 100);
  const livingWageFamily4 = livingWageSingle * 2.6; // MIT family-of-4 ratio
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
    affordabilityRatio,
    wagePremium,
    rentPremium,
    lifeExpectancy: c.lifeExpectancy,
    crimeRate: c.crimeRate,
    commuteMin: c.commuteMin
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
    radar: {
      safety: c.safety,
      health: c.health,
      purchasingPower: c.purchasingPower,
      pollutionCleanness: c.pollutionCleanness,
      climate: c.climate,
      // Invert costOfLiving so higher = more affordable (intuitive in radar)
      affordability: Math.max(0, 100 - c.costOfLiving + 50),
      propertyAffordability: c.propertyAffordability,
      trafficCommute: c.trafficCommute
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
export function affordabilityGauge(cityId, userSalary) {
  const c = summarizeCity(cityId);
  if (!c) return null;
  const thresholds = {
    poverty: c.livingWageSingle * 0.6,
    livingWage: c.livingWageSingle,
    median: c.medianHouseholdIncome,
    comfortable: c.comfortableSalary
  };
  let band;
  if (!isFinite(userSalary)) band = null;
  else if (userSalary < thresholds.livingWage) band = 'below_living';
  else if (userSalary < thresholds.median) band = 'between_lw_median';
  else if (userSalary < thresholds.comfortable) band = 'between_median_comfort';
  else band = 'above_comfort';
  return { city: c, thresholds, band, userSalary };
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

export { DATA_SOURCE, US_CITIES, COUNTRIES, NATIONAL_LIVING_WAGE_SINGLE, NATIONAL_MEDIAN_WAGE, NATIONAL_RENT_2BR };
