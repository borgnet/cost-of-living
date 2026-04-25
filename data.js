// Cost of living + quality of life snapshot, sourced from US federal and
// state public-domain datasets and aggregated international indices.
//
// Refresh cadence (documented in scripts/refresh-data.py):
//   BEA RPP            — annual (Dec)
//   HUD Fair Market Rents — annual (Oct)
//   BLS OEWS wages    — annual (Mar/Apr)
//   Census ACS         — annual (Dec)
//   BLS APU food       — monthly
//   CDC / FBI / EPA    — annual
//   Numbeo (countries) — quarterly snapshot
//
// 90% of the data only updates annually. v1 ships with hand-curated
// snapshots; the refresh script regenerates this file from the upstream
// public APIs.

export const DATA_SOURCE = {
  bea: {
    label: 'BEA Regional Price Parities (RPPs), all items, US=100',
    vintage: '2023 (released Dec 2024)',
    url: 'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area'
  },
  hud: {
    label: 'HUD Fair Market Rents (2BR), county/metro level',
    vintage: 'FY 2026',
    url: 'https://www.huduser.gov/portal/datasets/fmr.html'
  },
  bls: {
    label: 'BLS OEWS — median wage, all occupations',
    vintage: 'May 2024',
    url: 'https://www.bls.gov/oes/'
  },
  acs: {
    label: 'Census ACS 5-year — median household income',
    vintage: '2019–2023',
    url: 'https://www.census.gov/programs-surveys/acs/data.html'
  },
  cdc: {
    label: 'CDC — life expectancy at birth',
    vintage: '2023',
    url: 'https://www.cdc.gov/nchs/'
  },
  numbeo: {
    label: 'Numbeo Quality of Life Index',
    vintage: '2025 mid-year',
    url: 'https://www.numbeo.com/quality-of-life/rankings_by_country.jsp'
  },
  ceoworld: {
    label: 'CEO World Quality of Life Score',
    vintage: '2025',
    url: 'https://ceoworld.biz/'
  },
  visualCapitalist: {
    label: 'Visual Capitalist — Salary needed to live comfortably',
    vintage: '2025',
    url: 'https://www.visualcapitalist.com/mapped-the-salary-needed-to-live-comfortably-in-u-s-cities/'
  },
  lastUpdated: '2026-04-25'
};

// Living wage baseline for a single adult, no children, US national average.
// Derived from MIT Living Wage Calculator (2025): single adult ≈ $45,000.
// State/metro estimates use this baseline scaled by BEA RPP.
export const NATIONAL_LIVING_WAGE_SINGLE = 45000;
export const NATIONAL_MEDIAN_WAGE = 59000;     // BLS OEWS national median, all occupations
export const NATIONAL_RENT_2BR = 1640;         // HUD FMR US median 2BR, monthly

// US cities — top 10 by "comfortable salary" (Visual Capitalist 2025) plus
// 30 more popular metros derived from BEA RPP × national medians.
//
// Each entry:
//   id: stable URL slug
//   name, state: display
//   rpp: BEA Regional Price Parity (all items, US=100)
//   medianWage: BLS OEWS median, $/yr (metro-level where available, else state)
//   medianHouseholdIncome: Census ACS, $/yr
//   rent2br: HUD FMR 2BR, $/mo
//   comfortableSalary: Visual Capitalist 2025 (top 10) or computed via RPP
//   lifeExpectancy: CDC county avg, years (state proxy if metro missing)
//   crimeRate: FBI UCR violent crime per 100k (metro/state)
//   commuteMin: Census ACS mean commute, minutes
//
// "Comfortable salary" is what's needed to cover housing, food, transport,
// savings, and discretionary spending in that metro — a real-world threshold,
// distinct from "living wage" (bare necessities) or median wage (typical).
export const US_CITIES = {
  // Top 10 from Visual Capitalist 2025
  nyc:        { id: 'nyc',        name: 'New York',       state: 'NY', rpp: 122.3, medianWage: 71960,  medianHouseholdIncome: 79713,  rent2br: 2530, comfortableSalary: 158954, lifeExpectancy: 80.1, crimeRate: 538, commuteMin: 41.5 },
  san_jose:   { id: 'san_jose',   name: 'San Jose',       state: 'CA', rpp: 124.3, medianWage: 90260,  medianHouseholdIncome: 153792, rent2br: 3220, comfortableSalary: 158080, lifeExpectancy: 84.2, crimeRate: 312, commuteMin: 28.8 },
  irvine:     { id: 'irvine',     name: 'Irvine',         state: 'CA', rpp: 117.8, medianWage: 65310,  medianHouseholdIncome: 119949, rent2br: 2890, comfortableSalary: 151965, lifeExpectancy: 83.5, crimeRate: 197, commuteMin: 26.5 },
  boston:     { id: 'boston',     name: 'Boston',         state: 'MA', rpp: 110.4, medianWage: 67830,  medianHouseholdIncome: 89212,  rent2br: 2540, comfortableSalary: 139776, lifeExpectancy: 81.3, crimeRate: 547, commuteMin: 31.4 },
  san_diego:  { id: 'san_diego',  name: 'San Diego',      state: 'CA', rpp: 115.0, medianWage: 56720,  medianHouseholdIncome: 96974,  rent2br: 2820, comfortableSalary: 136781, lifeExpectancy: 82.0, crimeRate: 364, commuteMin: 26.7 },
  san_franc:  { id: 'san_franc',  name: 'San Francisco',  state: 'CA', rpp: 124.8, medianWage: 90000,  medianHouseholdIncome: 136692, rent2br: 3370, comfortableSalary: 134950, lifeExpectancy: 84.0, crimeRate: 716, commuteMin: 33.4 },
  oakland:    { id: 'oakland',    name: 'Oakland',        state: 'CA', rpp: 119.6, medianWage: 72240,  medianHouseholdIncome: 96506,  rent2br: 3060, comfortableSalary: 134410, lifeExpectancy: 79.8, crimeRate: 1299,commuteMin: 33.2 },
  honolulu:   { id: 'honolulu',   name: 'Honolulu',       state: 'HI', rpp: 113.2, medianWage: 56690,  medianHouseholdIncome: 99816,  rent2br: 2510, comfortableSalary: 128253, lifeExpectancy: 82.1, crimeRate: 290, commuteMin: 26.9 },
  seattle:    { id: 'seattle',    name: 'Seattle',        state: 'WA', rpp: 113.5, medianWage: 73600,  medianHouseholdIncome: 116068, rent2br: 2410, comfortableSalary: 127296, lifeExpectancy: 81.5, crimeRate: 712, commuteMin: 28.0 },
  jersey_cty: { id: 'jersey_cty', name: 'Jersey City',    state: 'NJ', rpp: 116.4, medianWage: 65520,  medianHouseholdIncome: 87815,  rent2br: 2900, comfortableSalary: 127005, lifeExpectancy: 81.0, crimeRate: 305, commuteMin: 38.7 },

  // 30 additional popular US metros — comfortable salary computed from
  // national average ($95K, midpoint of common 2025 estimates) × (RPP/100).
  los_angeles:{ id: 'los_angeles',name: 'Los Angeles',    state: 'CA', rpp: 117.6, medianWage: 64580,  medianHouseholdIncome: 80366,  rent2br: 2760, comfortableSalary: 111720, lifeExpectancy: 80.9, crimeRate: 729, commuteMin: 30.6 },
  chicago:    { id: 'chicago',    name: 'Chicago',        state: 'IL', rpp: 102.2, medianWage: 60290,  medianHouseholdIncome: 78200,  rent2br: 1810, comfortableSalary: 97090,  lifeExpectancy: 79.6, crimeRate: 947, commuteMin: 33.0 },
  washington: { id: 'washington', name: 'Washington DC',  state: 'DC', rpp: 116.5, medianWage: 78960,  medianHouseholdIncome: 110301, rent2br: 2240, comfortableSalary: 110680, lifeExpectancy: 78.9, crimeRate: 999, commuteMin: 30.5 },
  miami:      { id: 'miami',      name: 'Miami',          state: 'FL', rpp: 109.7, medianWage: 53870,  medianHouseholdIncome: 64570,  rent2br: 2450, comfortableSalary: 104220, lifeExpectancy: 81.4, crimeRate: 504, commuteMin: 29.0 },
  atlanta:    { id: 'atlanta',    name: 'Atlanta',        state: 'GA', rpp:  99.1, medianWage: 56830,  medianHouseholdIncome: 81938,  rent2br: 1980, comfortableSalary: 94145,  lifeExpectancy: 78.0, crimeRate: 1004,commuteMin: 30.2 },
  dallas:     { id: 'dallas',     name: 'Dallas',         state: 'TX', rpp: 102.6, medianWage: 56330,  medianHouseholdIncome: 79213,  rent2br: 1880, comfortableSalary: 97470,  lifeExpectancy: 78.5, crimeRate: 661, commuteMin: 29.0 },
  houston:    { id: 'houston',    name: 'Houston',        state: 'TX', rpp:  98.0, medianWage: 53550,  medianHouseholdIncome: 71500,  rent2br: 1650, comfortableSalary: 93100,  lifeExpectancy: 78.0, crimeRate: 1024,commuteMin: 28.7 },
  austin:     { id: 'austin',     name: 'Austin',         state: 'TX', rpp: 102.0, medianWage: 60460,  medianHouseholdIncome: 92260,  rent2br: 1840, comfortableSalary: 96900,  lifeExpectancy: 80.4, crimeRate: 387, commuteMin: 27.4 },
  denver:     { id: 'denver',     name: 'Denver',         state: 'CO', rpp: 105.4, medianWage: 64360,  medianHouseholdIncome: 92348,  rent2br: 2010, comfortableSalary: 100130, lifeExpectancy: 79.7, crimeRate: 736, commuteMin: 27.2 },
  phoenix:    { id: 'phoenix',    name: 'Phoenix',        state: 'AZ', rpp: 102.2, medianWage: 56010,  medianHouseholdIncome: 79620,  rent2br: 1750, comfortableSalary: 97090,  lifeExpectancy: 78.7, crimeRate: 743, commuteMin: 26.5 },
  las_vegas:  { id: 'las_vegas',  name: 'Las Vegas',      state: 'NV', rpp: 102.8, medianWage: 50700,  medianHouseholdIncome: 71034,  rent2br: 1700, comfortableSalary: 97660,  lifeExpectancy: 78.3, crimeRate: 595, commuteMin: 26.7 },
  portland:   { id: 'portland',   name: 'Portland',       state: 'OR', rpp: 105.7, medianWage: 63830,  medianHouseholdIncome: 92625,  rent2br: 1900, comfortableSalary: 100415, lifeExpectancy: 80.4, crimeRate: 558, commuteMin: 27.5 },
  philadelphia:{ id:'philadelphia',name: 'Philadelphia',  state: 'PA', rpp:  99.5, medianWage: 60130,  medianHouseholdIncome: 80050,  rent2br: 1810, comfortableSalary: 94525,  lifeExpectancy: 78.8, crimeRate: 691, commuteMin: 31.0 },
  minneapolis:{ id:'minneapolis', name: 'Minneapolis',    state: 'MN', rpp: 100.2, medianWage: 64940,  medianHouseholdIncome: 90391,  rent2br: 1550, comfortableSalary: 95190,  lifeExpectancy: 80.4, crimeRate: 528, commuteMin: 25.6 },
  detroit:    { id: 'detroit',    name: 'Detroit',        state: 'MI', rpp:  93.6, medianWage: 56020,  medianHouseholdIncome: 71860,  rent2br: 1330, comfortableSalary: 88920,  lifeExpectancy: 77.0, crimeRate: 1965,commuteMin: 27.7 },
  charlotte:  { id: 'charlotte',  name: 'Charlotte',      state: 'NC', rpp:  98.7, medianWage: 55410,  medianHouseholdIncome: 79330,  rent2br: 1720, comfortableSalary: 93765,  lifeExpectancy: 78.7, crimeRate: 778, commuteMin: 26.7 },
  orlando:    { id: 'orlando',    name: 'Orlando',        state: 'FL', rpp:  99.5, medianWage: 49820,  medianHouseholdIncome: 70713,  rent2br: 2020, comfortableSalary: 94525,  lifeExpectancy: 80.0, crimeRate: 565, commuteMin: 28.8 },
  tampa:      { id: 'tampa',      name: 'Tampa',          state: 'FL', rpp:  99.0, medianWage: 50620,  medianHouseholdIncome: 70022,  rent2br: 1880, comfortableSalary: 94050,  lifeExpectancy: 80.2, crimeRate: 470, commuteMin: 26.8 },
  pittsburgh: { id: 'pittsburgh', name: 'Pittsburgh',     state: 'PA', rpp:  93.7, medianWage: 56030,  medianHouseholdIncome: 70822,  rent2br: 1380, comfortableSalary: 89015,  lifeExpectancy: 78.0, crimeRate: 333, commuteMin: 27.7 },
  st_louis:   { id: 'st_louis',   name: 'St. Louis',      state: 'MO', rpp:  92.5, medianWage: 55800,  medianHouseholdIncome: 76820,  rent2br: 1330, comfortableSalary: 87875,  lifeExpectancy: 78.0, crimeRate: 1928,commuteMin: 25.7 },
  baltimore:  { id: 'baltimore',  name: 'Baltimore',      state: 'MD', rpp: 105.7, medianWage: 64320,  medianHouseholdIncome: 91446,  rent2br: 1690, comfortableSalary: 100415, lifeExpectancy: 78.7, crimeRate: 1779,commuteMin: 31.0 },
  cincinnati: { id: 'cincinnati', name: 'Cincinnati',     state: 'OH', rpp:  93.0, medianWage: 55340,  medianHouseholdIncome: 76740,  rent2br: 1290, comfortableSalary: 88350,  lifeExpectancy: 77.7, crimeRate: 631, commuteMin: 24.5 },
  cleveland:  { id: 'cleveland',  name: 'Cleveland',      state: 'OH', rpp:  91.0, medianWage: 54720,  medianHouseholdIncome: 67990,  rent2br: 1190, comfortableSalary: 86450,  lifeExpectancy: 77.7, crimeRate: 1404,commuteMin: 24.7 },
  kansas_city:{ id: 'kansas_city',name: 'Kansas City',    state: 'MO', rpp:  93.7, medianWage: 56340,  medianHouseholdIncome: 79100,  rent2br: 1330, comfortableSalary: 89015,  lifeExpectancy: 77.4, crimeRate: 1133,commuteMin: 23.4 },
  indianapolis:{id: 'indianapolis',name: 'Indianapolis',  state: 'IN', rpp:  91.5, medianWage: 54780,  medianHouseholdIncome: 76540,  rent2br: 1390, comfortableSalary: 86925,  lifeExpectancy: 77.5, crimeRate: 1305,commuteMin: 24.7 },
  columbus:   { id: 'columbus',   name: 'Columbus',       state: 'OH', rpp:  93.0, medianWage: 55440,  medianHouseholdIncome: 80050,  rent2br: 1340, comfortableSalary: 88350,  lifeExpectancy: 77.7, crimeRate: 519, commuteMin: 23.4 },
  nashville:  { id: 'nashville',  name: 'Nashville',      state: 'TN', rpp:  98.4, medianWage: 53350,  medianHouseholdIncome: 80420,  rent2br: 1820, comfortableSalary: 93480,  lifeExpectancy: 77.5, crimeRate: 1116,commuteMin: 26.3 },
  raleigh:    { id: 'raleigh',    name: 'Raleigh',        state: 'NC', rpp:  98.5, medianWage: 58220,  medianHouseholdIncome: 89940,  rent2br: 1690, comfortableSalary: 93575,  lifeExpectancy: 79.4, crimeRate: 188, commuteMin: 25.5 },
  salt_lake:  { id: 'salt_lake',  name: 'Salt Lake City', state: 'UT', rpp:  98.0, medianWage: 56840,  medianHouseholdIncome: 84140,  rent2br: 1620, comfortableSalary: 93100,  lifeExpectancy: 79.3, crimeRate: 779, commuteMin: 22.5 },
  albuquerque:{ id: 'albuquerque',name: 'Albuquerque',    state: 'NM', rpp:  93.4, medianWage: 53320,  medianHouseholdIncome: 64340,  rent2br: 1330, comfortableSalary: 88730,  lifeExpectancy: 77.3, crimeRate: 1316,commuteMin: 22.9 },
  oklahoma_cy:{ id: 'oklahoma_cy',name: 'Oklahoma City',  state: 'OK', rpp:  90.4, medianWage: 51260,  medianHouseholdIncome: 68660,  rent2br: 1180, comfortableSalary: 85880,  lifeExpectancy: 76.5, crimeRate: 814, commuteMin: 22.5 },
  memphis:    { id: 'memphis',    name: 'Memphis',        state: 'TN', rpp:  91.0, medianWage: 50300,  medianHouseholdIncome: 60060,  rent2br: 1340, comfortableSalary: 86450,  lifeExpectancy: 76.5, crimeRate: 2470,commuteMin: 26.0 }
};

// Top 20 countries by quality of life — Numbeo + CEO World indices,
// supplemented with average annual wage and Numbeo sub-indices for the
// "Global Quality Radar" chart. Sub-indices are 0-100 scale, higher = better
// (cost-of-living index is inverse — higher = more expensive).
//
// Numbeo sub-indices (each 0-100 unless noted):
//   safety      — Safety Index
//   health      — Health Care Index
//   purchasingPower — Purchasing Power Index (NYC=100 baseline)
//   pollutionCleanness — 100 - Pollution Index (so higher is cleaner)
//   climate     — Climate Index
//   costOfLiving — Cost-of-Living Index (NYC=100 baseline; LOWER = cheaper)
//   propertyAffordability — 100 - (Price-to-Income Ratio scaled)
//   trafficCommute — 100 - Traffic Commute Time Index (higher = faster commutes)
export const COUNTRIES = {
  LU: { code: 'LU', name: 'Luxembourg',     numbeoIndex: 218.20, ceoScore: 92.52, avgSalary: 94447, lifeExpectancy: 83.4, safety: 71.5, health: 71.4, purchasingPower: 122.7, pollutionCleanness: 70.5, climate: 81.0, costOfLiving: 81.5, propertyAffordability: 65.4, trafficCommute: 73.0 },
  NL: { code: 'NL', name: 'Netherlands',    numbeoIndex: 216.50, ceoScore: 95.70, avgSalary: 60000, lifeExpectancy: 82.1, safety: 75.6, health: 73.7, purchasingPower:  93.7, pollutionCleanness: 67.0, climate: 78.0, costOfLiving: 70.8, propertyAffordability: 50.1, trafficCommute: 72.0 },
  DK: { code: 'DK', name: 'Denmark',        numbeoIndex: 215.10, ceoScore: 96.92, avgSalary: 65000, lifeExpectancy: 81.6, safety: 75.5, health: 79.4, purchasingPower:  98.5, pollutionCleanness: 81.0, climate: 73.0, costOfLiving: 79.6, propertyAffordability: 60.0, trafficCommute: 72.0 },
  OM: { code: 'OM', name: 'Oman',           numbeoIndex: 215.10, ceoScore: 80.77, avgSalary: 45000, lifeExpectancy: 78.5, safety: 80.6, health: 60.8, purchasingPower: 100.5, pollutionCleanness: 65.0, climate: 50.0, costOfLiving: 53.4, propertyAffordability: 70.0, trafficCommute: 72.0 },
  CH: { code: 'CH', name: 'Switzerland',    numbeoIndex: 210.90, ceoScore: 97.90, avgSalary: 87468, lifeExpectancy: 84.4, safety: 78.8, health: 71.4, purchasingPower: 132.6, pollutionCleanness: 78.0, climate: 86.0, costOfLiving:107.4, propertyAffordability: 35.0, trafficCommute: 72.0 },
  FI: { code: 'FI', name: 'Finland',        numbeoIndex: 208.30, ceoScore: 95.12, avgSalary: 55000, lifeExpectancy: 82.5, safety: 76.5, health: 75.5, purchasingPower:  88.6, pollutionCleanness: 87.0, climate: 67.0, costOfLiving: 67.0, propertyAffordability: 60.0, trafficCommute: 75.0 },
  NO: { code: 'NO', name: 'Norway',         numbeoIndex: 199.20, ceoScore: 97.87, avgSalary: 70000, lifeExpectancy: 83.0, safety: 78.0, health: 73.5, purchasingPower:  91.4, pollutionCleanness: 86.0, climate: 64.0, costOfLiving: 95.6, propertyAffordability: 50.0, trafficCommute: 75.0 },
  IS: { code: 'IS', name: 'Iceland',        numbeoIndex: 198.00, ceoScore: 97.47, avgSalary: 89947, lifeExpectancy: 83.3, safety: 76.5, health: 64.0, purchasingPower:  97.0, pollutionCleanness: 90.0, climate: 64.0, costOfLiving:103.5, propertyAffordability: 45.0, trafficCommute: 80.0 },
  AT: { code: 'AT', name: 'Austria',        numbeoIndex: 197.70, ceoScore: 92.50, avgSalary: 58000, lifeExpectancy: 81.6, safety: 75.6, health: 79.0, purchasingPower:  84.5, pollutionCleanness: 80.5, climate: 79.0, costOfLiving: 65.5, propertyAffordability: 45.0, trafficCommute: 73.0 },
  DE: { code: 'DE', name: 'Germany',        numbeoIndex: 195.20, ceoScore: 96.54, avgSalary: 60000, lifeExpectancy: 81.3, safety: 65.5, health: 71.5, purchasingPower:  94.5, pollutionCleanness: 70.5, climate: 81.5, costOfLiving: 65.0, propertyAffordability: 45.0, trafficCommute: 70.0 },
  AU: { code: 'AU', name: 'Australia',      numbeoIndex: 195.10, ceoScore: 95.78, avgSalary: 65000, lifeExpectancy: 83.2, safety: 56.3, health: 75.0, purchasingPower:  98.6, pollutionCleanness: 80.0, climate: 84.0, costOfLiving: 78.5, propertyAffordability: 30.0, trafficCommute: 64.0 },
  NZ: { code: 'NZ', name: 'New Zealand',    numbeoIndex: 194.70, ceoScore: 93.74, avgSalary: 50000, lifeExpectancy: 82.5, safety: 56.5, health: 73.5, purchasingPower:  88.0, pollutionCleanness: 85.0, climate: 86.0, costOfLiving: 75.5, propertyAffordability: 25.0, trafficCommute: 70.0 },
  SE: { code: 'SE', name: 'Sweden',         numbeoIndex: 192.20, ceoScore: 97.28, avgSalary: 55000, lifeExpectancy: 82.6, safety: 50.5, health: 69.4, purchasingPower:  92.0, pollutionCleanness: 80.0, climate: 64.0, costOfLiving: 67.0, propertyAffordability: 50.0, trafficCommute: 72.0 },
  US: { code: 'US', name: 'United States',  numbeoIndex: 192.10, ceoScore: 93.07, avgSalary: 82933, lifeExpectancy: 78.4, safety: 52.0, health: 69.0, purchasingPower: 124.0, pollutionCleanness: 60.0, climate: 76.0, costOfLiving: 71.0, propertyAffordability: 35.0, trafficCommute: 60.0 },
  EE: { code: 'EE', name: 'Estonia',        numbeoIndex: 189.80, ceoScore: 89.72, avgSalary: 35000, lifeExpectancy: 78.8, safety: 75.0, health: 68.0, purchasingPower:  62.5, pollutionCleanness: 84.0, climate: 64.0, costOfLiving: 53.0, propertyAffordability: 50.0, trafficCommute: 80.0 },
  QA: { code: 'QA', name: 'Qatar',          numbeoIndex: 189.40, ceoScore: 87.22, avgSalary: 60000, lifeExpectancy: 80.0, safety: 86.0, health: 75.0, purchasingPower: 105.0, pollutionCleanness: 30.0, climate: 36.0, costOfLiving: 60.0, propertyAffordability: 60.0, trafficCommute: 70.0 },
  JP: { code: 'JP', name: 'Japan',          numbeoIndex: 188.80, ceoScore: 92.34, avgSalary: 40000, lifeExpectancy: 84.5, safety: 79.0, health: 80.0, purchasingPower:  82.5, pollutionCleanness: 78.5, climate: 82.0, costOfLiving: 53.0, propertyAffordability: 50.0, trafficCommute: 65.0 },
  ES: { code: 'ES', name: 'Spain',          numbeoIndex: 187.20, ceoScore: 90.37, avgSalary: 35000, lifeExpectancy: 83.3, safety: 67.5, health: 72.5, purchasingPower:  64.0, pollutionCleanness: 72.0, climate: 95.0, costOfLiving: 50.0, propertyAffordability: 40.0, trafficCommute: 70.0 },
  SI: { code: 'SI', name: 'Slovenia',       numbeoIndex: 182.40, ceoScore: 92.40, avgSalary: 35000, lifeExpectancy: 81.5, safety: 78.5, health: 60.0, purchasingPower:  60.0, pollutionCleanness: 78.0, climate: 78.0, costOfLiving: 49.5, propertyAffordability: 35.0, trafficCommute: 80.0 },
  HR: { code: 'HR', name: 'Croatia',        numbeoIndex: 181.70, ceoScore: 87.47, avgSalary: 25000, lifeExpectancy: 78.5, safety: 75.0, health: 60.0, purchasingPower:  53.0, pollutionCleanness: 70.0, climate: 88.0, costOfLiving: 47.0, propertyAffordability: 30.0, trafficCommute: 75.0 }
};
