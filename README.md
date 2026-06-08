# SealGuy

**O-ring material selector and gland sanity checker.**

SealGuy is a small, fast, deterministic, data-backed tool in the spirit of GlueGuy.
You enter the conditions an O-ring will see, and it ranks candidate **elastomer
families**, explains *why* each one matched or failed, and checks your groove
geometry for obvious mistakes. It runs entirely in the browser — no backend, no
accounts, no runtime scraping.

> **Disclaimer:** Recommendations are **candidates only**. They are conservative,
> general, family-level starting points — not certifications, approvals, or final
> engineering validation. Always verify against manufacturer datasheets and test
> in your actual application.

## What SealGuy does

- Ranks O-ring **elastomer families** (NBR, EPDM, FKM, HNBR, silicone,
  fluorosilicone, FFKM, neoprene, PTFE special case) for your conditions.
- Shows a transparent score breakdown: fluid fit, temperature fit, motion fit,
  pressure fit, and special-needs fit.
- Surfaces per-material warnings and a global **"Check before using"** red-flag
  panel that cannot be hidden.
- Computes basic geometry checks when you enter dimensions, shown with their
  OK target band and color-coded green/amber/red:
  - **Squeeze %** = `((crossSection - grooveDepth) / crossSection) * 100`
  - **Gland fill %** = `(π·(crossSection/2)² / (grooveWidth · grooveDepth)) * 100`
  - **Stretch %** = `((installedId - freeId) / freeId) * 100`
- Optional **diametral clearance** check against the SAE AS5857 max for the
  cross-section (Parker ORD-5700 Design Chart 4-1): flags extrusion / back-up
  ring need. Also flags rapid gas (explosive) decompression for high-pressure
  gas service.
- Reports unknown data as **unknown** — it never upgrades a gap to a guess.

## What SealGuy does NOT do

- It does **not** recommend exact commercial O-rings, compounds, or part numbers
  (unless a future row is explicitly `source-backed`).
- It does **not** design dynamic (reciprocating/rotary) seals — it only warns.
- It is **O-rings only**. No gaskets, lip/shaft/face seals, custom gland design,
  FEA, inventory, pricing, or supplier ordering.
- It makes **no** certification/approval claims (FDA/NSF/USP/etc.).

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173/)
npm test          # run the unit tests (Vitest)
npm run build     # type-check + production build into dist/
npm run preview   # preview the production build locally
```

## Deploy (GitHub Pages)

This is a static site. A workflow at `.github/workflows/deploy.yml` builds it and
publishes `dist/` to GitHub Pages on every push to `main`.

1. Push the repo to GitHub.
2. In **Settings → Pages**, set **Source = GitHub Actions**.
3. The site publishes at `https://<user>.github.io/sealguy/`.

The Vite `base` is set to `/sealguy/` for production builds (see `vite.config.ts`).
If you fork under a different repo name, update `base` to match.

## Data model

Two seed-data files and two pure-logic files drive everything:

| File | Purpose |
| --- | --- |
| `src/data/materials.ts` | `MaterialFamily` records: temp range, cost tier, dynamic/abrasion/ozone/vacuum ratings, strengths, weaknesses, notes, `sourceStatus`. |
| `src/data/compatibility.ts` | `FluidCompatibility` records: per-fluid `rating` + `note` for each material. Missing pairs are treated as `unknown`. |
| `src/data/as568.ts` | AS568 dash → inside-diameter + cross-section table (auto-generated from the Parker handbook), plus the dash-number lookup/normalizer. |
| `src/lib/scoring.ts` | Deterministic scoring, ranking, and the global red-flag list. |
| `src/lib/calcs.ts` | Unit conversions, squeeze/fill/stretch formulas, geometry warnings. |

### Data provenance

Quantitative data is sourced from the **Parker O-Ring Handbook (ORD 5700)**:

- **Temperature ranges** in `materials.ts` are Parker's common-service ranges
  (handbook p.162; PTFE from the back-up-ring guidance), so those families are
  marked `source-backed`. Their *qualitative* ratings (dynamic/abrasion/ozone/
  vacuum) and prose remain general guidance.
- **Fluid ratings** in `compatibility.ts` for the well-defined fluids (water,
  steam, mineral/hydraulic oil, gasoline, diesel, ethanol-blend fuel, DOT 3/4,
  silicone oil) are derived from Parker's Section VII tables, mapping Parker's
  `1/2/3/4/X` legend to SealGuy's `good/fair/avoid/unknown` (rating `3 doubtful`
  is treated conservatively as `avoid`). The original page and numeric rating are
  cited in each note. Broad categories (acids, bases, solvents, refrigerant)
  stay conservative/general — look the exact chemical up in the handbook.
- AS568 sizes in `as568.ts` come from handbook Tables 9-1/9-2.

> The Parker handbook PDF and its OCR text are **copyrighted** and are **not** in
> this repository (they are git-ignored). Notes cite the handbook rather than
> reproducing its tables verbatim.

```ts
type Rating = "good" | "fair" | "avoid" | "unknown";

interface MaterialFamily {
  id: string;
  name: string;
  aliases: string[];
  tempMinC: number;
  tempMaxC: number;
  costTier: 1 | 2 | 3 | 4 | 5;
  dynamicSuitability: Rating;
  abrasionResistance: Rating;
  ozoneResistance: Rating;
  vacuumSuitability: Rating;
  strengths: string[];
  weaknesses: string[];
  notes: string[];
  sourceStatus: "seeded-general" | "source-backed" | "needs-source";
}

interface FluidCompatibility {
  fluidId: string;
  label: string;
  synonyms: string[];
  ratings: Record<string, { rating: Rating; note: string }>;
}
```

### Scoring at a glance

Score = fluid fit (0–40) + temperature fit (0–25) + motion fit (0–15) +
pressure fit (0–10) + special-needs fit (0–10). Ties break alphabetically by
name so results are fully deterministic. `avoid` fluid ratings score `-40` and,
when **Hide poor matches** is on, are removed from the table.

## How to add source-backed data

The whole point is to grow from seeded guesses toward source-backed records.

**Add / refine a material family** — edit `src/data/materials.ts`:

1. Add a new object to `MATERIALS` (or edit an existing one). Keep `id` unique
   and lowercase.
2. Use real datasheet values for `tempMinC` / `tempMaxC` and the ratings.
3. When the values come from a real source, set
   `sourceStatus: "source-backed"`. Until then leave `"seeded-general"` (or use
   `"needs-source"` to flag a known gap). The UI shows this status and lists data
   gaps in each material's expandable detail.

**Add / refine a fluid compatibility row** — edit `src/data/compatibility.ts`:

1. If the fluid is new, add it to `FLUID_OPTIONS` (drives the searchable select)
   and add a `compat(...)` entry to `FLUIDS`.
2. In the `compat(...)` ratings map, add `materialId: ["good"|"fair"|"avoid", "note"]`
   pairs. **Only list pairs you have data for** — anything omitted is reported as
   `unknown` and never assumed compatible.
3. Put the source/justification in the `note` string. Do **not** add compound
   numbers, approvals, or part numbers.

No other code changes are needed — scoring, ranking, and warnings update
automatically from the data.

## License

Internal/prototype. Use the guidance as a starting point only, and verify
everything against manufacturer datasheets and real-world testing.
