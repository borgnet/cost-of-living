#!/usr/bin/env python3
"""Regenerate ../data.js from upstream public sources.

This is the documented data-refresh procedure for the Cost of Living &
Quality of Life tool. The site is fully static (no runtime API calls) and
the dataset is baked in at deploy time, so freshness depends on running
this script periodically.

Refresh cadence per source (most data updates annually):

  BEA Regional Price Parities      annual (Dec release)
  HUD Fair Market Rents            annual (Oct release)
  BLS OEWS median wage             annual (Mar/Apr release)
  Census ACS 5-year                annual (Dec release)
  CDC NCHS life expectancy         annual
  FBI UCR crime                    annual
  Numbeo Quality of Life           continuous (snapshot quarterly)

This script is a documented PROCEDURE — it lays out what to fetch from each
source and where to drop the resulting numbers in ../data.js. Several of
these APIs require registration keys or do not expose machine-readable
endpoints, so the v1 implementation is partly manual.

Usage:
    python3 refresh-data.py          # dry run, prints fetch URLs
    python3 refresh-data.py --apply  # writes new data.js (when fully wired)

Future automation: a GitHub Action can run this on a quarterly cron and
push the regenerated data.js + trigger Vercel redeploy via a deploy hook.
That work is tracked separately.
"""
from __future__ import annotations
import argparse
import sys
import textwrap

SOURCES = [
    {
        "id": "bea_rpp",
        "label": "BEA Regional Price Parities (state + metro, all items)",
        "url": "https://apps.bea.gov/api/data?UserID={KEY}&method=GetData&datasetname=Regional&TableName=MARPP&LineCode=1&GeoFIPS=MSA&Year=LAST5",
        "key_env": "BEA_API_KEY",  # free key from https://apps.bea.gov/API/signup/
        "field_in_data_js": "US_CITIES[*].rpp",
        "vintage_note": "DATA_SOURCE.bea.vintage in data.js",
        "manual_url": "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area",
    },
    {
        "id": "hud_fmr",
        "label": "HUD Fair Market Rents (2BR, FY)",
        "url": "https://www.huduser.gov/hudapi/public/fmr/data/{FY}/{geo_id}",
        "key_env": "HUD_API_TOKEN",  # free at https://www.huduser.gov/hudapi/public/register
        "field_in_data_js": "US_CITIES[*].rent2br",
        "vintage_note": "DATA_SOURCE.hud.vintage in data.js",
        "manual_url": "https://www.huduser.gov/portal/datasets/fmr.html",
    },
    {
        "id": "bls_oews",
        "label": "BLS OEWS median wage, all occupations, by metro/state",
        "url": "https://data.bls.gov/cew/data/api/{year}/a/area/{areaCode}.csv",
        "key_env": "BLS_API_KEY",  # free at https://data.bls.gov/registrationEngine/
        "field_in_data_js": "US_CITIES[*].medianWage",
        "vintage_note": "DATA_SOURCE.bls.vintage in data.js",
        "manual_url": "https://www.bls.gov/oes/tables.htm",
    },
    {
        "id": "census_acs",
        "label": "Census ACS 5-year (median household income, commute, population)",
        "url": "https://api.census.gov/data/{year}/acs/acs5?get=B19013_001E,B08303_001E&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*&key={KEY}",
        "key_env": "CENSUS_API_KEY",  # free at https://api.census.gov/data/key_signup.html
        "field_in_data_js": "US_CITIES[*].medianHouseholdIncome, .commuteMin",
        "vintage_note": "DATA_SOURCE.acs.vintage in data.js",
        "manual_url": "https://www.census.gov/programs-surveys/acs/data.html",
    },
    {
        "id": "cdc_life_exp",
        "label": "CDC NCHS life expectancy at birth (county-level)",
        "url": "https://data.cdc.gov/api/views/q9p7-7vbk/rows.csv",  # public, no key
        "key_env": None,
        "field_in_data_js": "US_CITIES[*].lifeExpectancy",
        "vintage_note": "DATA_SOURCE.cdc.vintage in data.js",
        "manual_url": "https://www.cdc.gov/nchs/data-visualization/life-expectancy/",
    },
    {
        "id": "fbi_ucr",
        "label": "FBI UCR / Crime Data Explorer (violent crime per 100k)",
        "url": "https://api.usa.gov/crime/fbi/cde/summarized/agencies/{ori}/violent-crime",
        "key_env": "FBI_API_KEY",  # free at https://api.data.gov/signup
        "field_in_data_js": "US_CITIES[*].crimeRate",
        "vintage_note": "(no explicit field; cite year in commit message)",
        "manual_url": "https://crime-data-explorer.fr.cloud.gov/",
    },
    {
        "id": "numbeo_qol",
        "label": "Numbeo Quality of Life Index by country (top 20)",
        "url": "https://www.numbeo.com/api/indices_explained?api_key={KEY}",
        "key_env": "NUMBEO_API_KEY",  # paid; for v1 we manually scrape the public ranking page
        "field_in_data_js": "COUNTRIES[*].numbeoIndex + .safety/.health/.purchasingPower/...",
        "vintage_note": "DATA_SOURCE.numbeo.vintage in data.js",
        "manual_url": "https://www.numbeo.com/quality-of-life/rankings_by_country.jsp",
    },
]


def print_procedure() -> None:
    print("Refresh procedure for cost-of-living data.js\n" + "=" * 50)
    for src in SOURCES:
        key = src["key_env"]
        key_line = f"requires env {key}" if key else "no key needed (public)"
        print(textwrap.dedent(f"""
            ▸ {src['label']}
              ID:        {src['id']}
              {key_line}
              Endpoint:  {src['url']}
              Manual:    {src['manual_url']}
              Updates:   {src['field_in_data_js']}
              Vintage:   {src['vintage_note']}
        """).rstrip())
    print("\nWhen ready, supply the credentials and add fetch+parse code in the")
    print("matching section of this script. Run with --apply to write data.js")
    print("after diffing against the previous version. Always run `npm test`")
    print("after applying.")


def apply_changes() -> int:
    # NOTE: Implementation deferred. Each upstream API has its own auth and
    # response format; wiring them all up is a follow-up task. For v1 the
    # data.js values were curated manually from the published reports.
    print("--apply not yet implemented; manual edit of data.js is the v1 path.",
          file=sys.stderr)
    print("See SOURCES table above for each upstream and its manual page.",
          file=sys.stderr)
    return 1


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--apply", action="store_true", help="Write data.js (not yet implemented)")
    args = p.parse_args()
    if args.apply:
        return apply_changes()
    print_procedure()
    return 0


if __name__ == "__main__":
    sys.exit(main())
