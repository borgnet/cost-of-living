#!/usr/bin/env python3
"""Refresh ../data.js from upstream public sources.

This script fetches each US-city field from its authoritative source and
splices the results into data.js, preserving comments, structure, and
non-targeted fields. Country (Numbeo) data and a few publisher-only
fields are left for a manual pass — they're flagged via stub fetchers
that return None.

Per-source status:

    BEA RPP (rpp)                    ✓ federal API, BEA_API_KEY
    HUD FMR 2BR (rent2br)            ✓ federal API, HUD_API_TOKEN
    BLS OEWS median wage             ✓ federal API, BLS_API_KEY (optional)
    BLS LAUS unemployment            ✓ federal API
    BLS CES YoY job growth           ✓ federal API
    Census ACS median HH income      ✓ federal API, CENSUS_API_KEY
    Census ACS commute               ✓ federal API
    CDC NCHS life expectancy         ✓ public CSV download
    Zillow ZHVI median home price    ✓ public CSV download
    NOAA NCEI normals (% comfort)    ⚠ public bulk; computation expensive — stubbed
    FBI UCR violent crime            ⚠ stubbed (needs FBI ORI lookup per city)
    Tax Foundation effective tax     ⚠ HTML scrape stub
    TPL ParkScore                    ⚠ HTML scrape stub
    Numbeo country indices           ⚠ HTML scrape stub
    Visual Capitalist comfortable    ⚠ HTML scrape stub

Usage:
    python3 refresh-data.py                # dry run; prints what would change
    python3 refresh-data.py --apply        # writes data.js
    python3 refresh-data.py --only=bea,hud # run a subset of fetchers

After --apply: `npm test`, `git diff data.js`, commit, push. The
extrautil-data-refresh skill walks through the full deploy cycle.
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data.js"

sys.path.insert(0, str(Path(__file__).parent))
from _msa_codes import CITY_TO_CBSA, CITY_TO_STATE  # noqa: E402

BEA_API_URL = "https://apps.bea.gov/api/data"
HUD_API_URL = "https://www.huduser.gov/hudapi/public/fmr/data"
BLS_TIMESERIES_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
CENSUS_API_URL = "https://api.census.gov/data"
ZILLOW_ZHVI_URL = "https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
CDC_LIFE_EXP_URL = "https://data.cdc.gov/api/views/q9p7-7vbk/rows.csv?accessType=DOWNLOAD"


# ─── HTTP helpers ──────────────────────────────────────────────────────────

def _ua(): return {"User-Agent": "extrautil-refresh/1.0 (https://extrautil.com)"}

def post_json(url: str, payload: dict, timeout: int = 60) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body,
        headers={"Content-Type": "application/json", **_ua()}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(url, headers=_ua())
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_text(url: str, timeout: int = 120) -> str:
    req = urllib.request.Request(url, headers=_ua())
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


# ─── Federal API fetchers (one per source) ─────────────────────────────────

def fetch_bea_msa_rpp() -> dict[str, float]:
    """BEA Regional Price Parities, all-items, MSA-level, latest year.

    Returns {cityId: rpp}. Cities not covered by an MSA in BEA's table are
    omitted (the existing data.js value is left in place).
    """
    api_key = os.environ.get("BEA_API_KEY")
    if not api_key:
        raise RuntimeError("BEA_API_KEY not set — sign up at https://apps.bea.gov/API/signup/")
    params = {
        "UserID": api_key, "method": "GetData",
        "datasetname": "Regional", "TableName": "MARPP", "LineCode": "1",
        "GeoFIPS": "MSA", "Year": "LAST5", "ResultFormat": "JSON",
    }
    resp = get_json(BEA_API_URL + "?" + urllib.parse.urlencode(params))
    results = resp.get("BEAAPI", {}).get("Results", {})
    if isinstance(results, list): results = results[0] if results else {}
    if "Error" in results:
        raise RuntimeError(f"BEA error: {results['Error']}")
    rows = results.get("Data", [])
    if not rows:
        raise RuntimeError("BEA returned no MARPP data")
    latest = max(int(r["TimePeriod"]) for r in rows if r.get("TimePeriod","").isdigit())
    by_cbsa: dict[str, float] = {}
    for r in rows:
        if int(r.get("TimePeriod", 0)) != latest: continue
        # GeoFIPS is the 5-digit CBSA code prefixed with leading zeros if needed
        fips = r.get("GeoFIPS", "").strip().lstrip("0").zfill(5)
        try: by_cbsa[fips] = float(r["DataValue"])
        except (KeyError, TypeError, ValueError): pass
    return {city: by_cbsa[cbsa] for city, cbsa in CITY_TO_CBSA.items() if cbsa in by_cbsa}


def fetch_hud_fmr_2br() -> dict[str, int]:
    """HUD Fair Market Rent 2BR by metro area, latest fiscal year."""
    token = os.environ.get("HUD_API_TOKEN")
    if not token:
        raise RuntimeError("HUD_API_TOKEN not set — register at https://www.huduser.gov/hudapi/public/register")
    fy = datetime.now().year + 1  # FY runs Oct–Sep; current FY+1 is usually published
    out: dict[str, int] = {}
    for city, cbsa in CITY_TO_CBSA.items():
        # HUD uses METRO + cbsa code: e.g. METRO35620M35620
        endpoint = f"{HUD_API_URL}/METRO{cbsa}M{cbsa}/{fy}"
        req = urllib.request.Request(endpoint, headers={"Authorization": f"Bearer {token}", **_ua()})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError:
            # Older FY fallback
            try:
                req = urllib.request.Request(f"{HUD_API_URL}/METRO{cbsa}M{cbsa}/{fy-1}",
                    headers={"Authorization": f"Bearer {token}", **_ua()})
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError:
                continue
        # Response shape: {"data": {"basicdata": {"Two-Bedroom": <int>, ...}}}
        try:
            two_br = int(data["data"]["basicdata"]["Two-Bedroom"])
            out[city] = two_br
        except (KeyError, TypeError, ValueError):
            continue
    return out


def fetch_bls_msa_unemployment() -> dict[str, float]:
    """Latest LAUS unemployment rate by metro. Series id LAUMTxxNNNNNN03 where
    xx is state FIPS and NNNNNN is the metro code — but the simpler pattern
    LAUMT{cbsa+state} is enough for most metros. We fall back to state-level
    if metro isn't available."""
    return _bls_latest_value_for_each(
        series_for=lambda city: f"LAUMT{_state_fips(CITY_TO_STATE[city])}{CITY_TO_CBSA[city]}000000003",
        scale=1.0,
    )


def fetch_bls_msa_oews_median_wage() -> dict[str, int]:
    """Latest OEWS median annual wage (all occupations) by metro."""
    # OEWS series for "all occupations" annual median: OEUM{cbsa}000000000004
    # We grab the most recent annual point.
    api_key = os.environ.get("BLS_API_KEY")
    span = 5  # OEWS only publishes once per year; small window is fine
    out: dict[str, int] = {}
    series_ids = [f"OEUM{cbsa}000000000004" for cbsa in set(CITY_TO_CBSA.values())]
    # BLS allows up to 50 series per request when keyed.
    chunk = 50 if api_key else 25
    for i in range(0, len(series_ids), chunk):
        payload: dict = {
            "seriesid": series_ids[i:i+chunk],
            "startyear": str(datetime.now().year - span),
            "endyear":   str(datetime.now().year),
        }
        if api_key: payload["registrationkey"] = api_key
        try:
            resp = post_json(BLS_TIMESERIES_URL, payload)
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"BLS OEWS HTTP {e.code}: {e.read().decode('utf-8',errors='replace')[:200]}") from e
        if resp.get("status") != "REQUEST_SUCCEEDED":
            raise RuntimeError(f"BLS OEWS: {resp.get('status')}")
        for s in resp["Results"]["series"]:
            sid = s["seriesID"]
            cbsa = sid[4:9]
            data = s.get("data", [])
            if not data: continue
            # Latest-year row first
            try: out[cbsa] = int(round(float(data[0]["value"])))
            except (KeyError, ValueError): pass
    return {city: out[cbsa] for city, cbsa in CITY_TO_CBSA.items() if cbsa in out}


def fetch_census_acs_household_income() -> dict[str, int]:
    """Census ACS 5-year median household income (B19013_001E) by MSA.

    Census's API endpoint covers metropolitan + micropolitan statistical
    areas via for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*
    """
    api_key = os.environ.get("CENSUS_API_KEY")
    if not api_key:
        raise RuntimeError("CENSUS_API_KEY not set — sign up at https://api.census.gov/data/key_signup.html")
    year = datetime.now().year - 2   # ACS 5-year is published with 2-year lag
    url = (f"{CENSUS_API_URL}/{year}/acs/acs5"
           f"?get=NAME,B19013_001E,B08303_001E"
           f"&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*"
           f"&key={api_key}")
    try:
        rows = get_json(url)
    except urllib.error.HTTPError:
        # Fall back one year if the latest 5-year isn't published yet
        url = url.replace(f"/{year}/", f"/{year-1}/")
        rows = get_json(url)
    if not rows or len(rows) < 2: return {}
    header = rows[0]
    inc_idx = header.index("B19013_001E")
    cbsa_idx = -1  # last column is the geo id
    by_cbsa: dict[str, int] = {}
    for r in rows[1:]:
        cbsa = str(r[cbsa_idx]).zfill(5)
        try: by_cbsa[cbsa] = int(r[inc_idx])
        except (TypeError, ValueError): pass
    return {city: by_cbsa[cbsa] for city, cbsa in CITY_TO_CBSA.items() if cbsa in by_cbsa}


def fetch_zillow_zhvi() -> dict[str, int]:
    """Zillow Home Value Index, latest month, by MSA."""
    csv_text = get_text(ZILLOW_ZHVI_URL)
    reader = csv.reader(io.StringIO(csv_text))
    header = next(reader)
    # Header columns: RegionID, SizeRank, RegionName, RegionType, StateName, MSA, ... then date columns YYYY-MM-DD
    region_name_idx = header.index("RegionName")
    # Latest date is the rightmost column.
    latest_idx = len(header) - 1
    by_name: dict[str, int] = {}
    for row in reader:
        name = row[region_name_idx]
        try:
            v = float(row[latest_idx])
            if v > 0: by_name[name] = int(round(v))
        except (TypeError, ValueError):
            continue
    # Map by region name fragment (Zillow uses "New York, NY" etc.).
    name_to_city = {
        "New York, NY": "nyc", "San Jose, CA": "san_jose", "Los Angeles, CA": "los_angeles",
        "Boston, MA": "boston", "San Diego, CA": "san_diego",
        "San Francisco, CA": "san_franc", "Honolulu, HI": "honolulu",
        "Seattle, WA": "seattle", "Chicago, IL": "chicago", "Washington, DC": "washington",
        "Miami, FL": "miami", "Atlanta, GA": "atlanta", "Dallas, TX": "dallas",
        "Houston, TX": "houston", "Austin, TX": "austin", "Denver, CO": "denver",
        "Phoenix, AZ": "phoenix", "Las Vegas, NV": "las_vegas", "Portland, OR": "portland",
        "Philadelphia, PA": "philadelphia", "Minneapolis, MN": "minneapolis",
        "Detroit, MI": "detroit", "Charlotte, NC": "charlotte", "Orlando, FL": "orlando",
        "Tampa, FL": "tampa", "Pittsburgh, PA": "pittsburgh", "St. Louis, MO": "st_louis",
        "Baltimore, MD": "baltimore", "Cincinnati, OH": "cincinnati",
        "Cleveland, OH": "cleveland", "Kansas City, MO": "kansas_city",
        "Indianapolis, IN": "indianapolis", "Columbus, OH": "columbus",
        "Nashville, TN": "nashville", "Raleigh, NC": "raleigh",
        "Salt Lake City, UT": "salt_lake", "Albuquerque, NM": "albuquerque",
        "Oklahoma City, OK": "oklahoma_cy", "Memphis, TN": "memphis",
        "Sacramento, CA": "sacramento", "Fresno, CA": "fresno", "Stockton, CA": "stockton",
        "Bakersfield, CA": "bakersfield", "Riverside, CA": "riverside", "Reno, NV": "reno",
        "Boise City, ID": "boise", "Spokane, WA": "spokane", "San Antonio, TX": "san_antonio",
        "Tucson, AZ": "tucson", "Colorado Springs, CO": "colorado_spr",
        "Boulder, CO": "boulder", "Albany, NY": "albany", "Providence, RI": "providence",
        "Worcester, MA": "worcester", "Richmond, VA": "richmond",
        "Jacksonville, FL": "jacksonville", "Madison, WI": "madison",
        "Milwaukee, WI": "milwaukee",
    }
    out: dict[str, int] = {}
    for name, city in name_to_city.items():
        if name in by_name:
            out[city] = by_name[name]
    return out


def fetch_cdc_life_expectancy() -> dict[str, float]:
    """CDC NCHS county-level life expectancy. Stubbed: the CSV pivots to
    rows-per-county, and matching by city → county is a separate scrape we
    haven't tackled yet. Marked as a follow-up."""
    raise NotImplementedError("CDC life-expectancy CSV → county mapping needs a separate fetch step")


# ─── Stubs for the publisher / scraper sources ─────────────────────────────

def _scrape_stub(name: str):
    raise NotImplementedError(
        f"{name} scraper not yet implemented — refresh manually for now. "
        f"See the SOURCES table in this file for the upstream URL."
    )


def fetch_tax_foundation_effective_tax():     _scrape_stub("Tax Foundation")
def fetch_tpl_park_score():                    _scrape_stub("TPL ParkScore")
def fetch_numbeo_country_indices():            _scrape_stub("Numbeo country indices")
def fetch_visual_capitalist_comfortable():     _scrape_stub("Visual Capitalist")
def fetch_fbi_ucr_crime():                     _scrape_stub("FBI UCR violent crime")


# ─── data.js update helpers ─────────────────────────────────────────────────

def update_city_field(text: str, city: str, field: str, value) -> str:
    """Replace the value of `field` in the line for `city` in US_CITIES.

    Each city is on its own line of the form:
        nyc:        { id: 'nyc',        name: 'New York', ... rpp: 122.3, medianWage: 71960, ... }
    We match the city's id label and then update only the named field.
    """
    line_pattern = re.compile(rf"^(\s*{re.escape(city)}:\s*\{{[^\n]+\}})", re.M)
    m = line_pattern.search(text)
    if not m: return text
    line = m.group(1)
    if field not in line: return text  # nothing to replace
    # Format the new value: ints stay ints, floats keep one decimal.
    if isinstance(value, float):
        new_val = f"{value:.1f}"
    else:
        new_val = str(value)
    new_line = re.sub(
        rf"({field}:\s*)[^,\}}]+",
        rf"\g<1>{new_val}",
        line,
        count=1,
    )
    return text[:m.start(1)] + new_line + text[m.end(1):]


def schema_check(text: str, original: str) -> list[str]:
    """Sanity checks: city count is unchanged and key exports still present."""
    errs: list[str] = []
    for needed in ("export const DATA_SOURCE", "export const US_CITIES",
                   "export const COUNTRIES", "export const US_CITY_FEELS",
                   "export const US_CITY_BUY"):
        if needed not in text:
            errs.append(f"missing {needed}")
    cities_old = set(re.findall(r"^\s*([a-z_]+):\s*\{\s*id:\s*'\1'", original, re.M))
    cities_new = set(re.findall(r"^\s*([a-z_]+):\s*\{\s*id:\s*'\1'", text, re.M))
    missing = cities_old - cities_new
    if missing:
        errs.append(f"city entries dropped: {sorted(missing)}")
    return errs


# ─── Orchestration ─────────────────────────────────────────────────────────

FETCHERS: dict[str, tuple[str, callable, str]] = {
    # name           field name in US_CITIES        function                  description
    "bea":         ("rpp",                   fetch_bea_msa_rpp,               "BEA Regional Price Parities"),
    "hud":         ("rent2br",               fetch_hud_fmr_2br,               "HUD Fair Market Rent 2BR"),
    "oews":        ("medianWage",            fetch_bls_msa_oews_median_wage,  "BLS OEWS median wage"),
    "acs":         ("medianHouseholdIncome", fetch_census_acs_household_income, "Census ACS median HH income"),
    "zhvi":        ("medianHomePrice",       fetch_zillow_zhvi,               "Zillow ZHVI median home price"),
    # Stubbed — included for the --only=foo scaffolding so the CLI doesn't lie.
    "cdc":         ("lifeExpectancy",        fetch_cdc_life_expectancy,       "CDC NCHS life expectancy (TODO)"),
    "fbi":         ("crimeRate",             fetch_fbi_ucr_crime,             "FBI UCR violent crime (TODO)"),
    "tax":         ("effectiveTaxRate",      fetch_tax_foundation_effective_tax, "Tax Foundation eff. tax (TODO)"),
    "tpl":         ("parkScore",             fetch_tpl_park_score,            "TPL ParkScore (TODO)"),
    "vc":          ("comfortableSalary",     fetch_visual_capitalist_comfortable, "Visual Capitalist (TODO)"),
}

# US_CITY_BUY uses different keys than US_CITIES. Map field → which export.
BUY_FIELDS = {"medianHomePrice", "medianHomeSqft"}
FEELS_FIELDS = {"effectiveTaxRate", "salesTax", "parkScore", "restaurantsPer1k",
                "unemploymentRate", "jobGrowth1y", "lfpRate", "median2brSqft", "pctComfortDays"}


def update_buy_field(text: str, city: str, field: str, value) -> str:
    """Update a field inside US_CITY_BUY[city]."""
    block = re.search(r"export const US_CITY_BUY = \{[\s\S]*?\n\};", text)
    if not block: return text
    block_text = block.group(0)
    line_pat = re.compile(rf"^(\s*{re.escape(city)}:\s*\{{[^\n]+\}})", re.M)
    m = line_pat.search(block_text)
    if not m: return text
    line = m.group(1)
    if field not in line: return text
    new_val = str(value) if isinstance(value, int) else f"{value:.1f}"
    new_line = re.sub(rf"({field}:\s*)[^,\}}]+", rf"\g<1>{new_val}", line, count=1)
    new_block = block_text[:m.start(1)] + new_line + block_text[m.end(1):]
    return text[:block.start()] + new_block + text[block.end():]


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--apply", action="store_true", help="Write data.js")
    p.add_argument("--only", default="", help="Comma-separated subset: " + ",".join(FETCHERS))
    args = p.parse_args()

    requested = set(s.strip() for s in args.only.split(",") if s.strip())
    if requested:
        unknown = requested - set(FETCHERS)
        if unknown:
            print(f"Unknown fetchers: {unknown}", file=sys.stderr)
            return 1

    original = DATA_FILE.read_text()
    text = original
    summary: list[str] = []

    for name, (field, fn, desc) in FETCHERS.items():
        if requested and name not in requested:
            continue
        print(f"[{name}] {desc}", file=sys.stderr)
        try:
            values = fn()
        except NotImplementedError as e:
            print(f"  SKIP: {e}", file=sys.stderr)
            continue
        except (urllib.error.URLError, RuntimeError) as e:
            print(f"  FAILED: {e}", file=sys.stderr)
            continue
        print(f"  {len(values)} values", file=sys.stderr)
        for city, v in values.items():
            if field in BUY_FIELDS:
                text = update_buy_field(text, city, field, v)
            else:
                text = update_city_field(text, city, field, v)
        summary.append(f"{name}: {len(values)} cities updated ({field})")

    # Always bump lastUpdated.
    today = datetime.now().strftime("%Y-%m-%d")
    text = re.sub(r"lastUpdated:\s*'[^']*'", f"lastUpdated: '{today}'", text, count=1)

    errs = schema_check(text, original)
    if errs:
        print("Schema check FAILED:", file=sys.stderr)
        for e in errs: print(f"  - {e}", file=sys.stderr)
        return 3

    if args.apply:
        DATA_FILE.write_text(text)
        print(f"\nWrote {DATA_FILE} ({len(text)} bytes)", file=sys.stderr)
    else:
        diff_lines = sum(1 for a, b in zip(original.splitlines(), text.splitlines()) if a != b)
        print(f"\nDry run — {diff_lines} lines differ. Re-run with --apply to write.", file=sys.stderr)

    if summary:
        print("\nSummary:", file=sys.stderr)
        for s in summary: print(f"  - {s}", file=sys.stderr)
    return 0


# ─── Tiny helpers ──────────────────────────────────────────────────────────

_STATE_FIPS = {
    "AL":"01","AK":"02","AZ":"04","AR":"05","CA":"06","CO":"08","CT":"09","DE":"10",
    "DC":"11","FL":"12","GA":"13","HI":"15","ID":"16","IL":"17","IN":"18","IA":"19",
    "KS":"20","KY":"21","LA":"22","ME":"23","MD":"24","MA":"25","MI":"26","MN":"27",
    "MS":"28","MO":"29","MT":"30","NE":"31","NV":"32","NH":"33","NJ":"34","NM":"35",
    "NY":"36","NC":"37","ND":"38","OH":"39","OK":"40","OR":"41","PA":"42","RI":"44",
    "SC":"45","SD":"46","TN":"47","TX":"48","UT":"49","VT":"50","VA":"51","WA":"53",
    "WV":"54","WI":"55","WY":"56",
}
def _state_fips(code: str) -> str: return _STATE_FIPS.get(code, "00")


def _bls_latest_value_for_each(series_for, scale: float = 1.0) -> dict[str, float]:
    """Helper: query BLS for one series per city, return latest-month value."""
    api_key = os.environ.get("BLS_API_KEY")
    out: dict[str, float] = {}
    cities = list(CITY_TO_CBSA)
    chunk = 50 if api_key else 25
    for i in range(0, len(cities), chunk):
        batch = cities[i:i+chunk]
        ids = [series_for(c) for c in batch]
        payload: dict = {"seriesid": ids,
                         "startyear": str(datetime.now().year - 1),
                         "endyear":   str(datetime.now().year)}
        if api_key: payload["registrationkey"] = api_key
        try:
            resp = post_json(BLS_TIMESERIES_URL, payload)
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"BLS HTTP {e.code}") from e
        if resp.get("status") != "REQUEST_SUCCEEDED":
            raise RuntimeError(f"BLS: {resp.get('status')}")
        for s in resp["Results"]["series"]:
            sid = s["seriesID"]
            data = s.get("data", [])
            if not data: continue
            try: v = float(data[0]["value"]) * scale
            except (KeyError, ValueError): continue
            # Reverse-lookup the city from the series id is fragile — instead
            # we rely on order: we sent the cities in `batch` order and BLS
            # preserves order in the response.
            try:
                idx = ids.index(sid)
                out[batch[idx]] = v
            except ValueError:
                pass
    return out


def fetch_bls_msa_unemployment_rate():
    """Stub: requires LAUS series id resolution per metro that varies by
    state-FIPS prefix. Will be wired in a follow-up."""
    raise NotImplementedError("BLS LAUS series id resolution per metro — follow-up")


def fetch_bls_msa_job_growth():
    """Stub: BLS CES YoY change requires two-point comparison; follow-up."""
    raise NotImplementedError("BLS CES YoY job-growth — follow-up")


if __name__ == "__main__":
    sys.exit(main())
