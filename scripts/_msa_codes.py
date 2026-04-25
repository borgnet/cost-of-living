"""City id → CBSA (Core-Based Statistical Area) code mapping.

CBSA codes are the federal standard for MSA-level data — BEA RPP, BLS LAUS,
BLS CES, BLS OEWS, HUD FMR, and Census ACS all key on these. The list below
matches the cities defined in ../data.js. When you add a new city to data.js,
add its CBSA code here too.

Source: Census Bureau OMB Bulletin 23-01 (current CBSA delineations).
"""
CITY_TO_CBSA: dict[str, str] = {
    # Tier-1 / VC comfort cohort
    "nyc":          "35620",  # New York-Newark-Jersey City NY-NJ-PA
    "san_jose":     "41940",  # San Jose-Sunnyvale-Santa Clara CA
    "irvine":       "31080",  # Los Angeles-Long Beach-Anaheim CA (includes Orange Co.)
    "boston":       "14460",  # Boston-Cambridge-Newton MA-NH
    "san_diego":    "41740",  # San Diego-Chula Vista-Carlsbad CA
    "san_franc":    "41860",  # San Francisco-Oakland-Berkeley CA
    "oakland":      "41860",  # same MSA as SF
    "honolulu":     "26980",  # Urban Honolulu HI
    "seattle":      "42660",  # Seattle-Tacoma-Bellevue WA
    "jersey_cty":   "35620",  # NYC MSA
    # Major US metros
    "los_angeles":  "31080",
    "chicago":      "16980",  # Chicago-Naperville-Elgin IL-IN-WI
    "washington":   "47900",  # Washington-Arlington-Alexandria DC-VA-MD-WV
    "miami":        "33100",  # Miami-Fort Lauderdale-Pompano Beach FL
    "atlanta":      "12060",  # Atlanta-Sandy Springs-Alpharetta GA
    "dallas":       "19100",  # Dallas-Fort Worth-Arlington TX
    "houston":      "26420",  # Houston-Pasadena-The Woodlands TX
    "austin":       "12420",  # Austin-Round Rock-San Marcos TX
    "denver":       "19740",  # Denver-Aurora-Centennial CO
    "phoenix":      "38060",  # Phoenix-Mesa-Chandler AZ
    "las_vegas":    "29820",  # Las Vegas-Henderson-North Las Vegas NV
    "portland":     "38900",  # Portland-Vancouver-Hillsboro OR-WA
    "philadelphia": "37980",  # Philadelphia-Camden-Wilmington PA-NJ-DE-MD
    "minneapolis":  "33460",  # Minneapolis-St. Paul-Bloomington MN-WI
    "detroit":      "19820",  # Detroit-Warren-Dearborn MI
    "charlotte":    "16740",  # Charlotte-Concord-Gastonia NC-SC
    "orlando":      "36740",  # Orlando-Kissimmee-Sanford FL
    "tampa":        "45300",  # Tampa-St. Petersburg-Clearwater FL
    "pittsburgh":   "38300",  # Pittsburgh PA
    "st_louis":     "41180",  # St. Louis MO-IL
    "baltimore":    "12580",  # Baltimore-Columbia-Towson MD
    "cincinnati":   "17140",  # Cincinnati OH-KY-IN
    "cleveland":    "17460",  # Cleveland-Elyria OH
    "kansas_city":  "28140",  # Kansas City MO-KS
    "indianapolis": "26900",  # Indianapolis-Carmel-Anderson IN
    "columbus":     "18140",  # Columbus OH
    "nashville":    "34980",  # Nashville-Davidson-Murfreesboro-Franklin TN
    "raleigh":      "39580",  # Raleigh-Cary NC
    "salt_lake":    "41620",  # Salt Lake City UT
    "albuquerque":  "10740",  # Albuquerque NM
    "oklahoma_cy":  "36420",  # Oklahoma City OK
    "memphis":      "32820",  # Memphis TN-MS-AR
    # Commuter / affordable destinations
    "sacramento":   "40900",  # Sacramento-Roseville-Folsom CA
    "fresno":       "23420",  # Fresno CA
    "stockton":     "44700",  # Stockton CA
    "bakersfield":  "12540",  # Bakersfield CA
    "riverside":    "40140",  # Riverside-San Bernardino-Ontario CA
    "reno":         "39900",  # Reno NV
    "boise":        "14260",  # Boise City ID
    "spokane":      "44060",  # Spokane-Spokane Valley WA
    "tacoma":       "42660",  # part of Seattle MSA
    "san_antonio":  "41700",  # San Antonio-New Braunfels TX
    "tucson":       "46060",  # Tucson AZ
    "colorado_spr": "17820",  # Colorado Springs CO
    "boulder":      "14500",  # Boulder CO
    "albany":       "10580",  # Albany-Schenectady-Troy NY
    "providence":   "39300",  # Providence-Warwick RI-MA
    "worcester":    "49340",  # Worcester MA-CT
    "richmond":     "40060",  # Richmond VA
    "jacksonville": "27260",  # Jacksonville FL
    "ft_lauderdale": "33100", # Miami MSA
    "madison":      "31540",  # Madison WI
    "milwaukee":    "33340",  # Milwaukee-Waukesha WI
}

# State the city sits in (used for state-level fallbacks where MSA data is missing).
CITY_TO_STATE: dict[str, str] = {
    "nyc": "NY", "san_jose": "CA", "irvine": "CA", "boston": "MA",
    "san_diego": "CA", "san_franc": "CA", "oakland": "CA", "honolulu": "HI",
    "seattle": "WA", "jersey_cty": "NJ",
    "los_angeles": "CA", "chicago": "IL", "washington": "DC", "miami": "FL",
    "atlanta": "GA", "dallas": "TX", "houston": "TX", "austin": "TX",
    "denver": "CO", "phoenix": "AZ", "las_vegas": "NV", "portland": "OR",
    "philadelphia": "PA", "minneapolis": "MN", "detroit": "MI", "charlotte": "NC",
    "orlando": "FL", "tampa": "FL", "pittsburgh": "PA", "st_louis": "MO",
    "baltimore": "MD", "cincinnati": "OH", "cleveland": "OH", "kansas_city": "MO",
    "indianapolis": "IN", "columbus": "OH", "nashville": "TN", "raleigh": "NC",
    "salt_lake": "UT", "albuquerque": "NM", "oklahoma_cy": "OK", "memphis": "TN",
    "sacramento": "CA", "fresno": "CA", "stockton": "CA", "bakersfield": "CA",
    "riverside": "CA", "reno": "NV", "boise": "ID", "spokane": "WA",
    "tacoma": "WA", "san_antonio": "TX", "tucson": "AZ", "colorado_spr": "CO",
    "boulder": "CO", "albany": "NY", "providence": "RI", "worcester": "MA",
    "richmond": "VA", "jacksonville": "FL", "ft_lauderdale": "FL", "madison": "WI",
    "milwaukee": "WI",
}
