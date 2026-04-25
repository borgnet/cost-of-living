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
  taxFoundation: {
    label: 'Tax Foundation — state + average local income tax effective rates',
    vintage: '2025',
    url: 'https://taxfoundation.org/data/all/state/state-income-tax-rates/'
  },
  tplParkScore: {
    label: 'Trust for Public Land — ParkScore (top 100 US cities)',
    vintage: '2024',
    url: 'https://www.tpl.org/parkscore'
  },
  blsLaus: {
    label: 'BLS LAUS — metro unemployment rate',
    vintage: 'Mar 2026',
    url: 'https://www.bls.gov/lau/'
  },
  blsCes: {
    label: 'BLS CES — metro non-farm payroll YoY change',
    vintage: 'Mar 2026',
    url: 'https://www.bls.gov/sae/'
  },
  censusCbp: {
    label: 'Census County Business Patterns — restaurants & arts establishments per 1k residents',
    vintage: '2023',
    url: 'https://www.census.gov/programs-surveys/cbp.html'
  },
  zillow: {
    label: 'Zillow ZORI / ZHVI — typical 2BR square footage',
    vintage: 'Q1 2026',
    url: 'https://www.zillow.com/research/data/'
  },
  noaa: {
    label: 'NOAA NCEI — % of days with mean temp 50–80°F (1991–2020 normals)',
    vintage: '1991–2020 normals',
    url: 'https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals'
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
  memphis:    { id: 'memphis',    name: 'Memphis',        state: 'TN', rpp:  91.0, medianWage: 50300,  medianHouseholdIncome: 60060,  rent2br: 1340, comfortableSalary: 86450,  lifeExpectancy: 76.5, crimeRate: 2470,commuteMin: 26.0 },

  // ─── Commuter / affordable-destination cities ────────────────────────────
  // Cities people commonly relocate to from the tier-1 cohort above (Bay
  // Area → Sacramento, NYC → Albany, Boston → Worcester, Seattle → Boise,
  // Miami → Jacksonville, etc.) plus the metros they regularly include in
  // job-search comparisons. Same federal data sources, RPP-anchored.
  sacramento: { id: 'sacramento', name: 'Sacramento',     state: 'CA', rpp: 102.0, medianWage: 60110,  medianHouseholdIncome: 87837,  rent2br: 2050, comfortableSalary: 96900,  lifeExpectancy: 79.7, crimeRate: 525, commuteMin: 27.0 },
  fresno:     { id: 'fresno',     name: 'Fresno',         state: 'CA', rpp:  92.0, medianWage: 49870,  medianHouseholdIncome: 64020,  rent2br: 1530, comfortableSalary: 87400,  lifeExpectancy: 78.7, crimeRate: 642, commuteMin: 23.5 },
  stockton:   { id: 'stockton',   name: 'Stockton',       state: 'CA', rpp:  96.0, medianWage: 54620,  medianHouseholdIncome: 76015,  rent2br: 1730, comfortableSalary: 91200,  lifeExpectancy: 78.0, crimeRate: 1232,commuteMin: 33.0 },
  bakersfield:{ id: 'bakersfield',name: 'Bakersfield',    state: 'CA', rpp:  93.0, medianWage: 53870,  medianHouseholdIncome: 70390,  rent2br: 1410, comfortableSalary: 88350,  lifeExpectancy: 77.0, crimeRate: 580, commuteMin: 24.0 },
  riverside:  { id: 'riverside',  name: 'Riverside',      state: 'CA', rpp: 104.0, medianWage: 58020,  medianHouseholdIncome: 84500,  rent2br: 2050, comfortableSalary: 98800,  lifeExpectancy: 78.0, crimeRate: 405, commuteMin: 33.0 },
  reno:       { id: 'reno',       name: 'Reno',           state: 'NV', rpp:  99.0, medianWage: 55620,  medianHouseholdIncome: 77828,  rent2br: 1830, comfortableSalary: 94050,  lifeExpectancy: 78.5, crimeRate: 419, commuteMin: 22.0 },
  boise:      { id: 'boise',      name: 'Boise',          state: 'ID', rpp:  95.4, medianWage: 56050,  medianHouseholdIncome: 80375,  rent2br: 1620, comfortableSalary: 90630,  lifeExpectancy: 79.5, crimeRate: 232, commuteMin: 22.0 },
  spokane:    { id: 'spokane',    name: 'Spokane',        state: 'WA', rpp:  93.5, medianWage: 53870,  medianHouseholdIncome: 71040,  rent2br: 1410, comfortableSalary: 88825,  lifeExpectancy: 79.0, crimeRate: 530, commuteMin: 22.0 },
  tacoma:     { id: 'tacoma',     name: 'Tacoma',         state: 'WA', rpp: 106.0, medianWage: 64710,  medianHouseholdIncome: 85020,  rent2br: 1900, comfortableSalary: 100700, lifeExpectancy: 79.5, crimeRate: 614, commuteMin: 31.0 },
  san_antonio:{ id: 'san_antonio',name: 'San Antonio',    state: 'TX', rpp:  95.0, medianWage: 51020,  medianHouseholdIncome: 64525,  rent2br: 1480, comfortableSalary: 90250,  lifeExpectancy: 78.5, crimeRate: 626, commuteMin: 26.0 },
  tucson:     { id: 'tucson',     name: 'Tucson',         state: 'AZ', rpp:  95.0, medianWage: 51920,  medianHouseholdIncome: 63805,  rent2br: 1320, comfortableSalary: 90250,  lifeExpectancy: 79.0, crimeRate: 654, commuteMin: 24.0 },
  colorado_spr:{ id: 'colorado_spr',name:'Colorado Springs',state: 'CO', rpp: 99.7, medianWage: 60040,  medianHouseholdIncome: 86018,  rent2br: 1730, comfortableSalary: 94715,  lifeExpectancy: 79.0, crimeRate: 421, commuteMin: 24.5 },
  boulder:    { id: 'boulder',    name: 'Boulder',        state: 'CO', rpp: 110.0, medianWage: 70320,  medianHouseholdIncome: 99700,  rent2br: 2150, comfortableSalary: 104500, lifeExpectancy: 80.5, crimeRate: 261, commuteMin: 22.0 },
  albany:     { id: 'albany',     name: 'Albany',         state: 'NY', rpp:  98.0, medianWage: 56020,  medianHouseholdIncome: 77840,  rent2br: 1480, comfortableSalary: 93100,  lifeExpectancy: 79.0, crimeRate: 462, commuteMin: 23.0 },
  providence: { id: 'providence', name: 'Providence',     state: 'RI', rpp: 100.5, medianWage: 58220,  medianHouseholdIncome: 80250,  rent2br: 1840, comfortableSalary: 95475,  lifeExpectancy: 79.5, crimeRate: 397, commuteMin: 25.5 },
  worcester:  { id: 'worcester',  name: 'Worcester',      state: 'MA', rpp:  99.0, medianWage: 60020,  medianHouseholdIncome: 84030,  rent2br: 1700, comfortableSalary: 94050,  lifeExpectancy: 79.5, crimeRate: 587, commuteMin: 28.0 },
  richmond:   { id: 'richmond',   name: 'Richmond',       state: 'VA', rpp:  99.0, medianWage: 57220,  medianHouseholdIncome: 78010,  rent2br: 1620, comfortableSalary: 94050,  lifeExpectancy: 78.0, crimeRate: 506, commuteMin: 26.0 },
  jacksonville:{ id: 'jacksonville',name:'Jacksonville',  state: 'FL', rpp:  95.0, medianWage: 52040,  medianHouseholdIncome: 73020,  rent2br: 1660, comfortableSalary: 90250,  lifeExpectancy: 78.0, crimeRate: 718, commuteMin: 26.5 },
  ft_lauderdale:{ id: 'ft_lauderdale',name:'Fort Lauderdale',state:'FL', rpp:106.0,medianWage: 54320,  medianHouseholdIncome: 76200,  rent2br: 2270, comfortableSalary: 100700, lifeExpectancy: 80.0, crimeRate: 446, commuteMin: 27.0 },
  madison:    { id: 'madison',    name: 'Madison',        state: 'WI', rpp:  96.0, medianWage: 60020,  medianHouseholdIncome: 87000,  rent2br: 1420, comfortableSalary: 91200,  lifeExpectancy: 80.5, crimeRate: 309, commuteMin: 22.0 },
  milwaukee:  { id: 'milwaukee',  name: 'Milwaukee',      state: 'WI', rpp:  95.0, medianWage: 55020,  medianHouseholdIncome: 70030,  rent2br: 1290, comfortableSalary: 90250,  lifeExpectancy: 78.0, crimeRate: 1245,commuteMin: 23.0 }
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

// ─── Feels-like layer (US cities only, v1) ──────────────────────────────────
//
// Each entry adds the lived-experience inputs we use for the second radar:
//
//   effectiveTaxRate    Combined state + average local income tax, effective
//                       rate at the local median household earner. (Tax
//                       Foundation 2025 + state DoR resources.)
//                       0.00 means no state income tax.
//   salesTax            Combined state + average local general sales tax.
//   parkScore           Trust for Public Land ParkScore 2024 (0–100). For
//                       cities outside TPL's top 100, value is interpolated
//                       from the surrounding metro / county-level public-land
//                       share — flagged via parkScoreEstimated: true.
//   restaurantsPer1k    Restaurants + arts/entertainment establishments per
//                       1,000 residents (Census CBP 2023). A density proxy
//                       for "things to do" — not a quality score.
//   unemploymentRate    BLS LAUS most-recent metro unemployment, percent.
//   jobGrowth1y         BLS CES non-farm payroll YoY change, percent.
//   lfpRate             BLS / Census ACS labor force participation 25–54, %.
//   median2brSqft       Typical 2BR rental square footage in the metro
//                       (Zillow + HUD FMR housing characteristics tables).
//   pctComfortDays      NOAA NCEI normals: % of days with mean temp 50–80°F
//                       across the year (the "feels like spring/fall" zone).
//
// Values are 2024–2026 snapshots. Refresh script: scripts/refresh-data.py
// (each source has its own --source flag; see that file for the full list).
export const US_CITY_FEELS = {
  // Top 10 (Visual Capitalist comfort cohort)
  nyc:        { effectiveTaxRate: 0.095, salesTax: 0.0888, parkScore: 75, restaurantsPer1k: 4.4, unemploymentRate: 4.6, jobGrowth1y: 1.6, lfpRate: 79.5, median2brSqft:  840, pctComfortDays: 36 },
  san_jose:   { effectiveTaxRate: 0.066, salesTax: 0.0938, parkScore: 47, restaurantsPer1k: 3.5, unemploymentRate: 4.1, jobGrowth1y: 0.4, lfpRate: 81.4, median2brSqft: 1015, pctComfortDays: 70 },
  irvine:     { effectiveTaxRate: 0.064, salesTax: 0.0775, parkScore: 56, restaurantsPer1k: 3.8, unemploymentRate: 4.2, jobGrowth1y: 1.1, lfpRate: 81.0, median2brSqft: 1050, pctComfortDays: 68, parkScoreEstimated: true },
  boston:     { effectiveTaxRate: 0.050, salesTax: 0.0625, parkScore: 73, restaurantsPer1k: 3.7, unemploymentRate: 3.7, jobGrowth1y: 1.2, lfpRate: 83.0, median2brSqft:  900, pctComfortDays: 42 },
  san_diego:  { effectiveTaxRate: 0.063, salesTax: 0.0775, parkScore: 51, restaurantsPer1k: 3.6, unemploymentRate: 4.5, jobGrowth1y: 0.8, lfpRate: 79.7, median2brSqft: 1010, pctComfortDays: 75 },
  san_franc:  { effectiveTaxRate: 0.072, salesTax: 0.0863, parkScore: 73, restaurantsPer1k: 4.2, unemploymentRate: 4.0, jobGrowth1y: 0.2, lfpRate: 82.1, median2brSqft:  925, pctComfortDays: 71 },
  oakland:    { effectiveTaxRate: 0.066, salesTax: 0.1025, parkScore: 65, restaurantsPer1k: 3.5, unemploymentRate: 4.6, jobGrowth1y: 0.5, lfpRate: 80.9, median2brSqft: 1010, pctComfortDays: 70 },
  honolulu:   { effectiveTaxRate: 0.078, salesTax: 0.045,  parkScore: 60, restaurantsPer1k: 3.9, unemploymentRate: 3.0, jobGrowth1y: 1.0, lfpRate: 78.2, median2brSqft:  900, pctComfortDays: 23 },
  seattle:    { effectiveTaxRate: 0.000, salesTax: 0.1035, parkScore: 73, restaurantsPer1k: 4.0, unemploymentRate: 4.2, jobGrowth1y: 0.9, lfpRate: 81.5, median2brSqft:  990, pctComfortDays: 49 },
  jersey_cty: { effectiveTaxRate: 0.052, salesTax: 0.06625,parkScore: 60, restaurantsPer1k: 3.8, unemploymentRate: 4.5, jobGrowth1y: 1.4, lfpRate: 81.0, median2brSqft:  870, pctComfortDays: 38 },

  // 30 popular US metros
  los_angeles:{ effectiveTaxRate: 0.067, salesTax: 0.095,  parkScore: 53, restaurantsPer1k: 3.7, unemploymentRate: 5.2, jobGrowth1y: 0.4, lfpRate: 78.9, median2brSqft:  950, pctComfortDays: 67 },
  chicago:    { effectiveTaxRate: 0.05,  salesTax: 0.1025, parkScore: 64, restaurantsPer1k: 3.3, unemploymentRate: 4.7, jobGrowth1y: 0.6, lfpRate: 80.1, median2brSqft: 1020, pctComfortDays: 41 },
  washington: { effectiveTaxRate: 0.075, salesTax: 0.06,   parkScore: 85, restaurantsPer1k: 4.0, unemploymentRate: 3.5, jobGrowth1y: 0.8, lfpRate: 84.0, median2brSqft:  945, pctComfortDays: 47 },
  miami:      { effectiveTaxRate: 0.000, salesTax: 0.07,   parkScore: 38, restaurantsPer1k: 3.5, unemploymentRate: 3.4, jobGrowth1y: 2.4, lfpRate: 78.5, median2brSqft: 1010, pctComfortDays: 42 },
  atlanta:    { effectiveTaxRate: 0.054, salesTax: 0.089,  parkScore: 50, restaurantsPer1k: 3.2, unemploymentRate: 3.7, jobGrowth1y: 1.5, lfpRate: 81.5, median2brSqft: 1100, pctComfortDays: 49 },
  dallas:     { effectiveTaxRate: 0.000, salesTax: 0.0825, parkScore: 32, restaurantsPer1k: 2.9, unemploymentRate: 3.8, jobGrowth1y: 2.6, lfpRate: 81.3, median2brSqft: 1060, pctComfortDays: 46 },
  houston:    { effectiveTaxRate: 0.000, salesTax: 0.0825, parkScore: 38, restaurantsPer1k: 2.7, unemploymentRate: 4.1, jobGrowth1y: 2.3, lfpRate: 80.5, median2brSqft: 1080, pctComfortDays: 39 },
  austin:     { effectiveTaxRate: 0.000, salesTax: 0.0825, parkScore: 51, restaurantsPer1k: 3.4, unemploymentRate: 3.5, jobGrowth1y: 3.0, lfpRate: 82.2, median2brSqft: 1075, pctComfortDays: 47 },
  denver:     { effectiveTaxRate: 0.044, salesTax: 0.0881, parkScore: 65, restaurantsPer1k: 3.1, unemploymentRate: 3.9, jobGrowth1y: 1.4, lfpRate: 82.0, median2brSqft: 1050, pctComfortDays: 50 },
  phoenix:    { effectiveTaxRate: 0.025, salesTax: 0.082,  parkScore: 32, restaurantsPer1k: 2.7, unemploymentRate: 3.6, jobGrowth1y: 2.5, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 34 },
  las_vegas:  { effectiveTaxRate: 0.000, salesTax: 0.0838, parkScore: 35, restaurantsPer1k: 3.0, unemploymentRate: 5.4, jobGrowth1y: 1.8, lfpRate: 76.0, median2brSqft: 1050, pctComfortDays: 38 },
  portland:   { effectiveTaxRate: 0.099, salesTax: 0.000,  parkScore: 72, restaurantsPer1k: 3.6, unemploymentRate: 4.1, jobGrowth1y: 0.6, lfpRate: 81.3, median2brSqft: 1010, pctComfortDays: 53 },
  philadelphia:{ effectiveTaxRate:0.068, salesTax: 0.08,   parkScore: 70, restaurantsPer1k: 3.1, unemploymentRate: 4.4, jobGrowth1y: 0.9, lfpRate: 79.4, median2brSqft: 1020, pctComfortDays: 44 },
  minneapolis:{ effectiveTaxRate: 0.071, salesTax: 0.0888, parkScore: 83, restaurantsPer1k: 3.0, unemploymentRate: 3.4, jobGrowth1y: 0.7, lfpRate: 84.5, median2brSqft: 1080, pctComfortDays: 36 },
  detroit:    { effectiveTaxRate: 0.057, salesTax: 0.06,   parkScore: 47, restaurantsPer1k: 2.6, unemploymentRate: 5.2, jobGrowth1y: 0.0, lfpRate: 75.5, median2brSqft: 1100, pctComfortDays: 38 },
  charlotte:  { effectiveTaxRate: 0.0425,salesTax: 0.0725, parkScore: 30, restaurantsPer1k: 2.9, unemploymentRate: 3.8, jobGrowth1y: 1.9, lfpRate: 80.7, median2brSqft: 1100, pctComfortDays: 51 },
  orlando:    { effectiveTaxRate: 0.000, salesTax: 0.065,  parkScore: 35, restaurantsPer1k: 3.1, unemploymentRate: 3.5, jobGrowth1y: 2.2, lfpRate: 78.0, median2brSqft: 1090, pctComfortDays: 41 },
  tampa:      { effectiveTaxRate: 0.000, salesTax: 0.075,  parkScore: 38, restaurantsPer1k: 2.8, unemploymentRate: 3.3, jobGrowth1y: 2.5, lfpRate: 78.5, median2brSqft: 1080, pctComfortDays: 41 },
  pittsburgh: { effectiveTaxRate: 0.069, salesTax: 0.07,   parkScore: 70, restaurantsPer1k: 2.9, unemploymentRate: 4.1, jobGrowth1y: 0.4, lfpRate: 78.5, median2brSqft: 1060, pctComfortDays: 42 },
  st_louis:   { effectiveTaxRate: 0.058, salesTax: 0.0974, parkScore: 67, restaurantsPer1k: 2.8, unemploymentRate: 3.9, jobGrowth1y: 0.5, lfpRate: 79.0, median2brSqft: 1110, pctComfortDays: 44 },
  baltimore:  { effectiveTaxRate: 0.082, salesTax: 0.06,   parkScore: 60, restaurantsPer1k: 2.7, unemploymentRate: 3.7, jobGrowth1y: 0.3, lfpRate: 79.5, median2brSqft: 1040, pctComfortDays: 46 },
  cincinnati: { effectiveTaxRate: 0.057, salesTax: 0.075,  parkScore: 75, restaurantsPer1k: 2.9, unemploymentRate: 4.2, jobGrowth1y: 0.6, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 43 },
  cleveland:  { effectiveTaxRate: 0.057, salesTax: 0.08,   parkScore: 53, restaurantsPer1k: 2.7, unemploymentRate: 4.6, jobGrowth1y: 0.0, lfpRate: 76.5, median2brSqft: 1075, pctComfortDays: 41 },
  kansas_city:{ effectiveTaxRate: 0.058, salesTax: 0.0863, parkScore: 47, restaurantsPer1k: 2.8, unemploymentRate: 3.6, jobGrowth1y: 1.0, lfpRate: 80.5, median2brSqft: 1100, pctComfortDays: 43 },
  indianapolis:{ effectiveTaxRate:0.052, salesTax: 0.07,   parkScore: 35, restaurantsPer1k: 2.6, unemploymentRate: 3.7, jobGrowth1y: 0.9, lfpRate: 80.0, median2brSqft: 1090, pctComfortDays: 43 },
  columbus:   { effectiveTaxRate: 0.057, salesTax: 0.075,  parkScore: 50, restaurantsPer1k: 2.8, unemploymentRate: 3.7, jobGrowth1y: 1.3, lfpRate: 80.5, median2brSqft: 1075, pctComfortDays: 44 },
  nashville:  { effectiveTaxRate: 0.000, salesTax: 0.0925, parkScore: 35, restaurantsPer1k: 3.2, unemploymentRate: 3.0, jobGrowth1y: 2.8, lfpRate: 80.7, median2brSqft: 1080, pctComfortDays: 45 },
  raleigh:    { effectiveTaxRate: 0.0425,salesTax: 0.0725, parkScore: 38, restaurantsPer1k: 2.7, unemploymentRate: 3.4, jobGrowth1y: 1.8, lfpRate: 81.5, median2brSqft: 1110, pctComfortDays: 51 },
  salt_lake:  { effectiveTaxRate: 0.0455,salesTax: 0.0775, parkScore: 50, restaurantsPer1k: 3.0, unemploymentRate: 2.6, jobGrowth1y: 2.2, lfpRate: 84.5, median2brSqft: 1100, pctComfortDays: 41 },
  albuquerque:{ effectiveTaxRate: 0.049, salesTax: 0.0775, parkScore: 36, restaurantsPer1k: 2.7, unemploymentRate: 3.9, jobGrowth1y: 0.6, lfpRate: 76.0, median2brSqft: 1050, pctComfortDays: 50 },
  oklahoma_cy:{ effectiveTaxRate: 0.0475,salesTax: 0.0863, parkScore: 28, restaurantsPer1k: 2.5, unemploymentRate: 3.5, jobGrowth1y: 1.4, lfpRate: 78.0, median2brSqft: 1075, pctComfortDays: 45 },
  memphis:    { effectiveTaxRate: 0.000, salesTax: 0.0975, parkScore: 33, restaurantsPer1k: 2.6, unemploymentRate: 4.5, jobGrowth1y: 0.3, lfpRate: 76.5, median2brSqft: 1080, pctComfortDays: 47 },

  // Commuter / affordable-destination cities
  sacramento: { effectiveTaxRate: 0.066, salesTax: 0.0875, parkScore: 55, restaurantsPer1k: 2.7, unemploymentRate: 4.8, jobGrowth1y: 0.7, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 51 },
  fresno:     { effectiveTaxRate: 0.050, salesTax: 0.0875, parkScore: 38, restaurantsPer1k: 2.5, unemploymentRate: 6.0, jobGrowth1y: 0.5, lfpRate: 73.0, median2brSqft: 1100, pctComfortDays: 47 },
  stockton:   { effectiveTaxRate: 0.050, salesTax: 0.090,  parkScore: 30, restaurantsPer1k: 2.4, unemploymentRate: 5.5, jobGrowth1y: 0.6, lfpRate: 75.0, median2brSqft: 1100, pctComfortDays: 47 },
  bakersfield:{ effectiveTaxRate: 0.045, salesTax: 0.0825, parkScore: 28, restaurantsPer1k: 2.4, unemploymentRate: 6.5, jobGrowth1y: 0.4, lfpRate: 72.0, median2brSqft: 1100, pctComfortDays: 41 },
  riverside:  { effectiveTaxRate: 0.057, salesTax: 0.0775, parkScore: 35, restaurantsPer1k: 2.6, unemploymentRate: 4.8, jobGrowth1y: 1.1, lfpRate: 76.0, median2brSqft: 1100, pctComfortDays: 49 },
  reno:       { effectiveTaxRate: 0.000, salesTax: 0.0825, parkScore: 50, restaurantsPer1k: 2.9, unemploymentRate: 4.0, jobGrowth1y: 1.5, lfpRate: 78.0, median2brSqft: 1080, pctComfortDays: 47 },
  boise:      { effectiveTaxRate: 0.0575,salesTax: 0.060,  parkScore: 65, restaurantsPer1k: 2.9, unemploymentRate: 3.5, jobGrowth1y: 1.4, lfpRate: 81.0, median2brSqft: 1100, pctComfortDays: 49 },
  spokane:    { effectiveTaxRate: 0.000, salesTax: 0.089,  parkScore: 60, restaurantsPer1k: 2.7, unemploymentRate: 4.5, jobGrowth1y: 0.7, lfpRate: 76.0, median2brSqft: 1100, pctComfortDays: 47 },
  tacoma:     { effectiveTaxRate: 0.000, salesTax: 0.103,  parkScore: 60, restaurantsPer1k: 2.7, unemploymentRate: 4.8, jobGrowth1y: 0.8, lfpRate: 78.0, median2brSqft: 1050, pctComfortDays: 50 },
  san_antonio:{ effectiveTaxRate: 0.000, salesTax: 0.0825, parkScore: 53, restaurantsPer1k: 2.8, unemploymentRate: 3.6, jobGrowth1y: 2.0, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 47 },
  tucson:     { effectiveTaxRate: 0.025, salesTax: 0.087,  parkScore: 35, restaurantsPer1k: 2.7, unemploymentRate: 4.0, jobGrowth1y: 1.5, lfpRate: 75.0, median2brSqft: 1080, pctComfortDays: 38 },
  colorado_spr:{ effectiveTaxRate:0.044, salesTax: 0.082,  parkScore: 50, restaurantsPer1k: 2.8, unemploymentRate: 4.0, jobGrowth1y: 1.0, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 49 },
  boulder:    { effectiveTaxRate: 0.044, salesTax: 0.087,  parkScore: 70, restaurantsPer1k: 3.6, unemploymentRate: 3.4, jobGrowth1y: 1.0, lfpRate: 82.0, median2brSqft: 1080, pctComfortDays: 51 },
  albany:     { effectiveTaxRate: 0.066, salesTax: 0.080,  parkScore: 55, restaurantsPer1k: 2.7, unemploymentRate: 3.5, jobGrowth1y: 0.5, lfpRate: 78.0, median2brSqft: 1080, pctComfortDays: 41 },
  providence: { effectiveTaxRate: 0.050, salesTax: 0.070,  parkScore: 55, restaurantsPer1k: 3.0, unemploymentRate: 3.7, jobGrowth1y: 0.8, lfpRate: 79.0, median2brSqft: 1050, pctComfortDays: 42 },
  worcester:  { effectiveTaxRate: 0.050, salesTax: 0.0625, parkScore: 50, restaurantsPer1k: 2.7, unemploymentRate: 4.0, jobGrowth1y: 0.6, lfpRate: 80.0, median2brSqft: 1100, pctComfortDays: 41 },
  richmond:   { effectiveTaxRate: 0.0575,salesTax: 0.060,  parkScore: 50, restaurantsPer1k: 2.7, unemploymentRate: 3.4, jobGrowth1y: 1.0, lfpRate: 80.0, median2brSqft: 1080, pctComfortDays: 47 },
  jacksonville:{ effectiveTaxRate:0.000, salesTax: 0.075,  parkScore: 50, restaurantsPer1k: 2.7, unemploymentRate: 3.5, jobGrowth1y: 1.8, lfpRate: 79.0, median2brSqft: 1080, pctComfortDays: 41 },
  ft_lauderdale:{ effectiveTaxRate:0.000,salesTax: 0.070,  parkScore: 40, restaurantsPer1k: 3.2, unemploymentRate: 3.6, jobGrowth1y: 2.2, lfpRate: 78.0, median2brSqft: 1010, pctComfortDays: 41 },
  madison:    { effectiveTaxRate: 0.063, salesTax: 0.055,  parkScore: 70, restaurantsPer1k: 3.0, unemploymentRate: 2.7, jobGrowth1y: 1.3, lfpRate: 84.0, median2brSqft: 1080, pctComfortDays: 38 },
  milwaukee:  { effectiveTaxRate: 0.063, salesTax: 0.056,  parkScore: 55, restaurantsPer1k: 2.8, unemploymentRate: 3.5, jobGrowth1y: 0.4, lfpRate: 78.0, median2brSqft: 1080, pctComfortDays: 39 }
};

// ─── Buy layer (Zillow ZHVI Q1 2026 + ACS housing characteristics) ───────────
//
//   medianHomePrice  Zillow Home Value Index, all homes, metro level ($)
//   medianHomeSqft   Typical sale size for the metro (Census ACS housing
//                    characteristics + Zillow listings; varies wildly —
//                    NYC/SF apartment-heavy markets have much smaller
//                    typical sqft than Texas / Carolina builds.)
export const US_CITY_BUY = {
  // Tier-1 cohort
  nyc:        { medianHomePrice:  760000, medianHomeSqft:  850 },
  san_jose:   { medianHomePrice: 1500000, medianHomeSqft: 1700 },
  irvine:     { medianHomePrice: 1450000, medianHomeSqft: 2000 },
  boston:     { medianHomePrice:  730000, medianHomeSqft: 1500 },
  san_diego:  { medianHomePrice:  940000, medianHomeSqft: 1700 },
  san_franc:  { medianHomePrice: 1350000, medianHomeSqft: 1450 },
  oakland:    { medianHomePrice:  920000, medianHomeSqft: 1500 },
  honolulu:   { medianHomePrice:  890000, medianHomeSqft: 1300 },
  seattle:    { medianHomePrice:  830000, medianHomeSqft: 1750 },
  jersey_cty: { medianHomePrice:  720000, medianHomeSqft: 1400 },

  los_angeles:{ medianHomePrice:  980000, medianHomeSqft: 1700 },
  chicago:    { medianHomePrice:  315000, medianHomeSqft: 1700 },
  washington: { medianHomePrice:  620000, medianHomeSqft: 1700 },
  miami:      { medianHomePrice:  610000, medianHomeSqft: 1500 },
  atlanta:    { medianHomePrice:  390000, medianHomeSqft: 1900 },
  dallas:     { medianHomePrice:  390000, medianHomeSqft: 2000 },
  houston:    { medianHomePrice:  310000, medianHomeSqft: 1900 },
  austin:     { medianHomePrice:  570000, medianHomeSqft: 1900 },
  denver:     { medianHomePrice:  560000, medianHomeSqft: 1800 },
  phoenix:    { medianHomePrice:  440000, medianHomeSqft: 1900 },
  las_vegas:  { medianHomePrice:  430000, medianHomeSqft: 1900 },
  portland:   { medianHomePrice:  560000, medianHomeSqft: 1700 },
  philadelphia:{ medianHomePrice: 235000, medianHomeSqft: 1500 },
  minneapolis:{ medianHomePrice:  345000, medianHomeSqft: 1700 },
  detroit:    { medianHomePrice:   90000, medianHomeSqft: 1800 },
  charlotte:  { medianHomePrice:  385000, medianHomeSqft: 2000 },
  orlando:    { medianHomePrice:  390000, medianHomeSqft: 1850 },
  tampa:      { medianHomePrice:  390000, medianHomeSqft: 1800 },
  pittsburgh: { medianHomePrice:  235000, medianHomeSqft: 1500 },
  st_louis:   { medianHomePrice:  200000, medianHomeSqft: 1700 },
  baltimore:  { medianHomePrice:  215000, medianHomeSqft: 1500 },
  cincinnati: { medianHomePrice:  230000, medianHomeSqft: 1700 },
  cleveland:  { medianHomePrice:  115000, medianHomeSqft: 1500 },
  kansas_city:{ medianHomePrice:  250000, medianHomeSqft: 1700 },
  indianapolis:{ medianHomePrice: 235000, medianHomeSqft: 1700 },
  columbus:   { medianHomePrice:  245000, medianHomeSqft: 1700 },
  nashville:  { medianHomePrice:  445000, medianHomeSqft: 1900 },
  raleigh:    { medianHomePrice:  440000, medianHomeSqft: 1900 },
  salt_lake:  { medianHomePrice:  560000, medianHomeSqft: 1900 },
  albuquerque:{ medianHomePrice:  325000, medianHomeSqft: 1700 },
  oklahoma_cy:{ medianHomePrice:  215000, medianHomeSqft: 1700 },
  memphis:    { medianHomePrice:  155000, medianHomeSqft: 1800 },

  // Commuter / destination cohort
  sacramento: { medianHomePrice:  560000, medianHomeSqft: 1800 },
  fresno:     { medianHomePrice:  380000, medianHomeSqft: 1850 },
  stockton:   { medianHomePrice:  470000, medianHomeSqft: 1800 },
  bakersfield:{ medianHomePrice:  360000, medianHomeSqft: 1900 },
  riverside:  { medianHomePrice:  575000, medianHomeSqft: 1900 },
  reno:       { medianHomePrice:  555000, medianHomeSqft: 1800 },
  boise:      { medianHomePrice:  510000, medianHomeSqft: 1900 },
  spokane:    { medianHomePrice:  380000, medianHomeSqft: 1700 },
  tacoma:     { medianHomePrice:  530000, medianHomeSqft: 1800 },
  san_antonio:{ medianHomePrice:  290000, medianHomeSqft: 1900 },
  tucson:     { medianHomePrice:  350000, medianHomeSqft: 1900 },
  colorado_spr:{ medianHomePrice: 480000, medianHomeSqft: 1900 },
  boulder:    { medianHomePrice:  850000, medianHomeSqft: 1900 },
  albany:     { medianHomePrice:  285000, medianHomeSqft: 1700 },
  providence: { medianHomePrice:  450000, medianHomeSqft: 1600 },
  worcester:  { medianHomePrice:  415000, medianHomeSqft: 1700 },
  richmond:   { medianHomePrice:  360000, medianHomeSqft: 1800 },
  jacksonville:{ medianHomePrice: 320000, medianHomeSqft: 1900 },
  ft_lauderdale:{ medianHomePrice:470000, medianHomeSqft: 1700 },
  madison:    { medianHomePrice:  410000, medianHomeSqft: 1700 },
  milwaukee:  { medianHomePrice:  240000, medianHomeSqft: 1700 }
};
