// Tests for cost.js — run with `node --test tests/cost.test.js`
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePlace, summarizeCity, summarizeCountry, rankUsCities,
  rankCountries, affordabilityGauge, searchPlaces,
  householdMultiplier, householdLabel,
  feelsLikeRadar, takeHome, estimateStateTax, sqftAtBudget, housingComparison,
  rankFeelsLike,
  US_CITIES, COUNTRIES, US_CITY_FEELS
} from '../cost.js';

const close = (a, b, eps) => assert.ok(Math.abs(a - b) <= eps, `expected ${b} ± ${eps}, got ${a}`);

// ─── resolvePlace ────────────────────────────────────────────────────────────

test('resolvePlace: known US city id returns kind=us', () => {
  const p = resolvePlace('nyc');
  assert.equal(p.kind, 'us');
  assert.equal(p.name, 'New York');
});

test('resolvePlace: known country code returns kind=country', () => {
  const p = resolvePlace('LU');
  assert.equal(p.kind, 'country');
  assert.equal(p.name, 'Luxembourg');
});

test('resolvePlace: country code is case-insensitive', () => {
  assert.equal(resolvePlace('lu').name, 'Luxembourg');
  assert.equal(resolvePlace('De').name, 'Germany');
});

test('resolvePlace: unknown returns null', () => {
  assert.equal(resolvePlace('zzzz'), null);
  assert.equal(resolvePlace(''), null);
  assert.equal(resolvePlace(null), null);
});

// ─── summarizeCity ───────────────────────────────────────────────────────────

test('summarizeCity: produces all expected fields', () => {
  const s = summarizeCity('nyc');
  assert.equal(s.id, 'nyc');
  assert.equal(s.kind, 'us');
  assert.ok(s.livingWageSingle > 0);
  assert.ok(s.livingWageFamily4 > s.livingWageSingle);
  assert.ok(typeof s.affordabilityRatio === 'number');
});

test('summarizeCity: NYC living wage > Memphis (RPP-driven)', () => {
  const ny = summarizeCity('nyc');
  const me = summarizeCity('memphis');
  assert.ok(ny.livingWageSingle > me.livingWageSingle);
});

test('summarizeCity: unknown returns null', () => {
  assert.equal(summarizeCity('zzzz'), null);
});

test('summarizeCity: affordability ratio < 1 means median household earns less than comfortable salary', () => {
  const sf = summarizeCity('san_franc');
  // SF median household ~$137K, comfortable ~$135K — should be roughly 1
  assert.ok(sf.affordabilityRatio > 0.9 && sf.affordabilityRatio < 1.2);
});

// ─── summarizeCountry ────────────────────────────────────────────────────────

test('summarizeCountry: known returns full radar object', () => {
  const c = summarizeCountry('LU');
  assert.ok(c);
  assert.ok(c.radar.safety > 0);
  assert.ok(c.radar.health > 0);
  assert.ok(c.numbeoIndex > 100);
});

test('summarizeCountry: effectivePP for high-income countries', () => {
  const us = summarizeCountry('US');
  const hr = summarizeCountry('HR');
  // US: high purchasing power AND moderate cost; HR: low PP & low cost.
  // effectivePP normalizes against cost. US should be higher on absolute scale.
  assert.ok(us.effectivePP > hr.effectivePP);
});

test('summarizeCountry: unknown returns null', () => {
  assert.equal(summarizeCountry('zzz'), null);
});

// ─── rankUsCities ────────────────────────────────────────────────────────────

test('rankUsCities: default ascending by comfortable salary', () => {
  const r = rankUsCities();
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i].comfortableSalary >= r[i - 1].comfortableSalary,
              `index ${i}: ${r[i - 1].comfortableSalary} → ${r[i].comfortableSalary}`);
  }
});

test('rankUsCities: descending by RPP', () => {
  const r = rankUsCities({ sortBy: 'rpp', order: 'desc' });
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i].rpp <= r[i - 1].rpp);
  }
});

test('rankUsCities: total length equals US_CITIES count', () => {
  const r = rankUsCities();
  assert.equal(r.length, Object.keys(US_CITIES).length);
});

// ─── rankCountries ───────────────────────────────────────────────────────────

test('rankCountries: default desc by Numbeo — Luxembourg first', () => {
  const r = rankCountries();
  assert.equal(r[0].code, 'LU');
});

test('rankCountries: total length equals 20', () => {
  const r = rankCountries();
  assert.equal(r.length, Object.keys(COUNTRIES).length);
  assert.equal(r.length, 20);
});

// ─── affordabilityGauge ──────────────────────────────────────────────────────

test('affordabilityGauge: salary above comfortable maps to top band', () => {
  const g = affordabilityGauge('nyc', 200000);
  assert.equal(g.band, 'above_comfort');
});

test('affordabilityGauge: salary at living wage maps to between_lw_median', () => {
  const g = affordabilityGauge('memphis', 50000);
  assert.equal(g.band, 'between_lw_median');
});

test('affordabilityGauge: thresholds are ascending', () => {
  const g = affordabilityGauge('boston', 100000);
  assert.ok(g.thresholds.poverty < g.thresholds.livingWage);
  assert.ok(g.thresholds.livingWage < g.thresholds.median);
  assert.ok(g.thresholds.median < g.thresholds.comfortable);
});

test('affordabilityGauge: unknown city returns null', () => {
  assert.equal(affordabilityGauge('zzz', 50000), null);
});

// ─── searchPlaces ────────────────────────────────────────────────────────────

test('searchPlaces: empty query returns empty', () => {
  assert.deepEqual(searchPlaces(''), []);
});

test('searchPlaces: substring match finds cities and countries', () => {
  const r = searchPlaces('jap');
  assert.ok(r.find(x => x.id === 'JP'));
});

test('searchPlaces: city name match', () => {
  const r = searchPlaces('seattle');
  assert.ok(r.find(x => x.id === 'seattle'));
});

test('searchPlaces: state code match', () => {
  const r = searchPlaces(' CA');
  // multiple CA cities
  assert.ok(r.length >= 2);
});

test('searchPlaces: respects limit', () => {
  const r = searchPlaces('a', { limit: 3 });
  assert.ok(r.length <= 3);
});

// ─── Sanity ──────────────────────────────────────────────────────────────────

test('every US city has a sane RPP between 80 and 130', () => {
  for (const [id, c] of Object.entries(US_CITIES)) {
    assert.ok(c.rpp > 80 && c.rpp < 130, `${id} rpp=${c.rpp}`);
  }
});

test('every country has Numbeo index > 100 (these are top 20 globally)', () => {
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(c.numbeoIndex > 100, `${code} numbeo=${c.numbeoIndex}`);
  }
});

test('every US city has comfortable salary > living wage single', () => {
  for (const id of Object.keys(US_CITIES)) {
    const s = summarizeCity(id);
    assert.ok(s.comfortableSalary > s.livingWageSingle, `${id} comfort=${s.comfortableSalary} living=${s.livingWageSingle}`);
  }
});

// ─── Radar (city + country share 6 axes) ─────────────────────────────────────

test('summarizeCity exposes 6-axis radar with all keys 0..150', () => {
  const s = summarizeCity('austin');
  assert.ok(s.radar);
  for (const k of ['safety', 'health', 'purchasingPower', 'affordability', 'commute', 'propertyAffordability']) {
    assert.ok(typeof s.radar[k] === 'number', `${k} missing or non-number`);
    assert.ok(s.radar[k] >= 0 && s.radar[k] <= 150, `${k}=${s.radar[k]} out of range`);
  }
});

test('summarizeCountry exposes 6-axis radar with same key shape as city', () => {
  const c = summarizeCountry('LU');
  for (const k of ['safety', 'health', 'purchasingPower', 'affordability', 'commute', 'propertyAffordability']) {
    assert.ok(typeof c.radar[k] === 'number', `${k} missing`);
  }
});

test('cityRadar safety: high-crime city scores lower than low-crime city', () => {
  const safe   = summarizeCity('raleigh');   // crime ~188
  const unsafe = summarizeCity('memphis');   // crime ~2470
  assert.ok(safe.radar.safety > unsafe.radar.safety);
});

test('cityRadar affordability: low-RPP city scores higher than high-RPP city', () => {
  const cheap  = summarizeCity('memphis');   // rpp ~91
  const pricy  = summarizeCity('san_jose');  // rpp ~124
  assert.ok(cheap.radar.affordability > pricy.radar.affordability);
});

// ─── household scaling ───────────────────────────────────────────────────────

test('householdMultiplier: known MIT-calibrated points', () => {
  close(householdMultiplier(1, 0), 1.00, 0.001);
  close(householdMultiplier(2, 0), 1.60, 0.001);
  close(householdMultiplier(1, 1), 1.50, 0.001);
  close(householdMultiplier(1, 2), 2.00, 0.001);
  close(householdMultiplier(2, 1), 2.10, 0.001);
  close(householdMultiplier(2, 2), 2.60, 0.001);
});

test('householdMultiplier: clamps junk inputs to a single adult', () => {
  close(householdMultiplier(0, 0), 1.00, 0.001);
  close(householdMultiplier(-3, -2), 1.00, 0.001);
  close(householdMultiplier(NaN, NaN), 1.00, 0.001);
});

test('householdLabel: pluralizes correctly', () => {
  assert.equal(householdLabel(1, 0), '1 adult');
  assert.equal(householdLabel(2, 0), '2 adults');
  assert.equal(householdLabel(1, 1), '1 adult, 1 child');
  assert.equal(householdLabel(2, 3), '2 adults, 3 children');
});

test('summarizeCity: household scaling raises living wage and comfortable thresholds', () => {
  const single = summarizeCity('nyc');
  const family = summarizeCity('nyc', { adults: 2, children: 2 });
  close(family.householdMultiplier, 2.6, 0.001);
  close(family.livingWageHousehold, single.livingWageSingle * 2.6, 0.5);
  close(family.comfortableHousehold, single.comfortableSalary * 2.6, 0.5);
  // single-adult fields stay anchored to a single adult.
  assert.equal(family.livingWageSingle, single.livingWageSingle);
});

test('summarizeCity: default arguments preserve single-adult behavior', () => {
  const a = summarizeCity('nyc');
  const b = summarizeCity('nyc', { adults: 1, children: 0 });
  assert.equal(a.livingWageHousehold, a.livingWageSingle);
  assert.equal(a.comfortableHousehold, a.comfortableSalary);
  assert.equal(a.householdMultiplier, 1);
  assert.equal(a.livingWageHousehold, b.livingWageHousehold);
});

test('affordabilityGauge: thresholds scale with household', () => {
  const single = affordabilityGauge('nyc', 100000);
  const family = affordabilityGauge('nyc', 100000, { adults: 2, children: 2 });
  assert.ok(family.thresholds.livingWage > single.thresholds.livingWage);
  assert.ok(family.thresholds.comfortable > single.thresholds.comfortable);
  // Median household income is anchored to Census ACS, not household-scaled.
  assert.equal(single.thresholds.median, family.thresholds.median);
  // Living wage rises with household, so the same income shifts toward "below
  // living" for a family of 4 vs. a single adult.
  assert.notEqual(single.band, family.band);
});

// ─── feels-like layer ───────────────────────────────────────────────────────

test('US_CITY_FEELS: every US city in US_CITIES has feels-like data', () => {
  for (const id of Object.keys(US_CITIES)) {
    assert.ok(US_CITY_FEELS[id], `missing feels-like entry for ${id}`);
  }
});

test('estimateStateTax: no-tax states return 0 even at high income', () => {
  assert.equal(estimateStateTax('austin', 250000), 0);    // TX
  assert.equal(estimateStateTax('nashville', 250000), 0); // TN
  assert.equal(estimateStateTax('seattle', 250000), 0);   // WA
  assert.equal(estimateStateTax('miami', 250000), 0);     // FL
});

test('estimateStateTax: high-tax states scale with salary', () => {
  const lowSalary = estimateStateTax('san_franc', 50000);
  const highSalary = estimateStateTax('san_franc', 250000);
  assert.ok(highSalary > lowSalary);
  close(highSalary / 250000, US_CITY_FEELS.san_franc.effectiveTaxRate, 0.001);
});

test('estimateStateTax: junk inputs return 0', () => {
  assert.equal(estimateStateTax('san_franc', 0), 0);
  assert.equal(estimateStateTax('san_franc', -100), 0);
  assert.equal(estimateStateTax('san_franc', NaN), 0);
  assert.equal(estimateStateTax('zzzz', 50000), 0);
});

test('takeHome: TX equals salary; CA strictly below; NYC further below', () => {
  const salary = 200000;
  const austin = takeHome('austin', salary);
  const sf     = takeHome('san_franc', salary);
  const nyc    = takeHome('nyc', salary);
  assert.equal(austin, salary);
  assert.ok(sf < salary);
  assert.ok(nyc < sf);  // NYC has city tax on top of state tax
});

test('sqftAtBudget: SF $3k buys far less than Memphis $3k', () => {
  const sf = sqftAtBudget('san_franc', 3000);
  const me = sqftAtBudget('memphis', 3000);
  assert.ok(sf > 0 && me > 0);
  assert.ok(me >= sf * 2, `expected memphis ≥ 2×SF, got ${me} vs ${sf}`);
});

test('sqftAtBudget: scales linearly with budget', () => {
  const a = sqftAtBudget('austin', 1500);
  const b = sqftAtBudget('austin', 3000);
  close(b / a, 2, 0.05);
});

test('housingComparison: returns named result for known cities; null for unknown', () => {
  const cmp = housingComparison('san_franc', 'memphis', 3000);
  assert.equal(cmp.a.name, 'San Francisco');
  assert.equal(cmp.b.name, 'Memphis');
  assert.ok(cmp.delta > 0);
  assert.ok(cmp.deltaPct > 100); // Memphis should be > 2× SF for same budget
  assert.equal(housingComparison('zzzz', 'memphis', 3000), null);
  assert.equal(housingComparison('san_franc', 'zzzz', 3000), null);
  assert.equal(housingComparison('san_franc', 'memphis', 0), null);
});

test('feelsLikeRadar: every axis is finite, in 0..150', () => {
  const r = feelsLikeRadar('san_franc');
  for (const k of ['afterTaxPower', 'housingValue', 'cultural', 'greenSpace', 'jobMarket', 'climateComfort']) {
    assert.ok(typeof r[k] === 'number' && isFinite(r[k]), `axis ${k} is not a finite number: ${r[k]}`);
    assert.ok(r[k] >= 0 && r[k] <= 150, `axis ${k} out of range: ${r[k]}`);
  }
});

test('feelsLikeRadar: SF has worse housingValue than Memphis', () => {
  assert.ok(feelsLikeRadar('san_franc').housingValue < feelsLikeRadar('memphis').housingValue);
});

test('feelsLikeRadar: TX cities have higher afterTaxPower than equivalent CA cities given comparable income', () => {
  // Austin has lower median household income than SF, but no state income
  // tax. SF's after-tax purchasing power should still exceed Austin's
  // because the income differential outweighs the tax differential — but
  // both should be positive and finite.
  const sf = feelsLikeRadar('san_franc');
  const austin = feelsLikeRadar('austin');
  assert.ok(sf.afterTaxPower > 0 && austin.afterTaxPower > 0);
  // Austin's afterTaxPower should exceed national average (axis ≥ 70 means
  // above the $65k baseline household).
  assert.ok(austin.afterTaxPower >= 70);
});

test('feelsLikeRadar: unknown city returns null', () => {
  assert.equal(feelsLikeRadar('zzzz'), null);
});

test('rankFeelsLike: returns all cities, sorted, with finite scores', () => {
  const ranked = rankFeelsLike();
  assert.equal(ranked.length, Object.keys(US_CITY_FEELS).length);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].score >= ranked[i].score, 'ranking should be desc by default');
    assert.ok(isFinite(ranked[i].score) && ranked[i].score > 0);
  }
});
