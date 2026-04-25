# Cost of Living & Quality of Life

Live at **https://cost.extrautil.com/** — part of [extrautil](https://extrautil.com).

A static, single-page tool that compares 40 major US cities and 20 top global
countries on cost of living, wages, and quality of life. Built on US federal
public-domain datasets (BEA, BLS, HUD, Census, CDC, FBI, EPA) plus aggregated
international indices (Numbeo, CEO World, OECD).

## Local preview

```bash
python3 -m http.server 8878
# open http://127.0.0.1:8878/
```

## Tests

```bash
npm test
# or directly:
node --test tests/cost.test.js
```

## URL parameters

All controls are URL-shareable:

| param  | values                                   | default |
| ------ | ---------------------------------------- | ------- |
| `p`    | US city slug or 2-letter country code    | `nyc`   |
| `s`    | user salary in USD/yr                    | (none)  |
| `r`    | ranking table mode: `us` / `country`     | `us`    |
| `theme`| `light` / `dark`                         | system  |
| `embed`| `1` to render in embed mode              | off     |

## Data freshness

The dataset in `data.js` is baked in at deploy time (no runtime API calls).
`scripts/refresh-data.py` documents the regeneration procedure for each
upstream source. 90% of the data only updates annually; a quarterly refresh
covers the remainder.

To regenerate locally:

```bash
python3 scripts/refresh-data.py
# inspect the diff in data.js, run npm test, commit, deploy
```

A future automation iteration can wrap this in a GitHub Action on a
quarterly cron — see the in-script comments for the API-key requirements
per source.

## Files

- `index.html` — full UI (vanilla, single page, Chart.js for radar)
- `data.js` — snapshot data + source vintages
- `cost.js` — pure math layer (importable as ES module)
- `tests/cost.test.js` — Node `--test` suite, 28 tests
- `scripts/refresh-data.py` — documented data regeneration procedure
- `llms.txt` — agent-friendly docs
