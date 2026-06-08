import { Fragment, useMemo, useState } from "react";
import { COST_LABELS } from "./data/materials";
import { FLUID_OPTIONS, FLUID_BY_ID } from "./data/compatibility";
import {
  analyzeGeometry,
  as568CrossSectionInch,
  cFromF,
  psiFromBar,
  type GeometryResult,
  type Warning,
} from "./lib/calcs";
import {
  EMPTY_SPECIAL,
  isDynamicMotion,
  rankMaterials,
  redFlags,
  type MaterialResult,
  type Motion,
  type PressureDirection,
  type SealConditions,
  type SpecialNeeds,
} from "./lib/scoring";

type TempUnit = "C" | "F";
type PressureUnit = "psi" | "bar";
type LenUnit = "inch" | "mm";

interface FormState {
  fluidId: string;
  fluidQuery: string;
  tempUnit: TempUnit;
  minTemp: string;
  maxTemp: string;
  pressureUnit: PressureUnit;
  pressure: string;
  motion: Motion;
  pressureDirection: PressureDirection;
  special: SpecialNeeds;
  hidePoorMatches: boolean;
  lenUnit: LenUnit;
  dash: string;
  insideDiameter: string;
  crossSection: string;
  grooveDepth: string;
  grooveWidth: string;
  installedDiameter: string;
}

const DEFAULT_FORM: FormState = {
  fluidId: "water",
  fluidQuery: "",
  tempUnit: "C",
  minTemp: "",
  maxTemp: "",
  pressureUnit: "psi",
  pressure: "",
  motion: "static",
  pressureDirection: "one-way",
  special: { ...EMPTY_SPECIAL },
  hidePoorMatches: false,
  lenUnit: "mm",
  dash: "",
  insideDiameter: "",
  crossSection: "",
  grooveDepth: "",
  grooveWidth: "",
  installedDiameter: "",
};

const MOTIONS: Motion[] = ["static", "reciprocating", "rotary", "pneumatic", "vacuum"];
const DIRECTIONS: PressureDirection[] = ["one-way", "reversing", "fluctuating", "unknown"];

const SPECIAL_FIELDS: { key: keyof SpecialNeeds; label: string }[] = [
  { key: "ozone", label: "Outdoor / ozone" },
  { key: "lowFriction", label: "Low friction" },
  { key: "lowTemp", label: "Low temperature" },
  { key: "highTemp", label: "High temperature" },
  { key: "food", label: "Food / potable water contact" },
  { key: "vacuum", label: "Low outgassing / vacuum" },
  { key: "aggressiveChemical", label: "Aggressive chemical" },
  { key: "lowCost", label: "Low cost preferred" },
];

interface Preset {
  label: string;
  apply: (f: FormState) => FormState;
}

const PRESETS: Preset[] = [
  {
    label: "Water static seal",
    apply: (f) => ({
      ...f,
      fluidId: "water",
      tempUnit: "C",
      minTemp: "5",
      maxTemp: "95",
      pressureUnit: "psi",
      pressure: "100",
      motion: "static",
      pressureDirection: "one-way",
      special: { ...EMPTY_SPECIAL },
    }),
  },
  {
    label: "Mineral oil hydraulic seal",
    apply: (f) => ({
      ...f,
      fluidId: "hydraulic_oil",
      tempUnit: "C",
      minTemp: "-20",
      maxTemp: "100",
      pressureUnit: "psi",
      pressure: "2500",
      motion: "reciprocating",
      pressureDirection: "fluctuating",
      special: { ...EMPTY_SPECIAL },
    }),
  },
  {
    label: "Gasoline fuel seal",
    apply: (f) => ({
      ...f,
      fluidId: "gasoline",
      tempUnit: "C",
      minTemp: "-30",
      maxTemp: "80",
      pressureUnit: "psi",
      pressure: "60",
      motion: "static",
      pressureDirection: "one-way",
      special: { ...EMPTY_SPECIAL },
    }),
  },
  {
    label: "DOT brake fluid seal",
    apply: (f) => ({
      ...f,
      fluidId: "dot_brake",
      tempUnit: "C",
      minTemp: "-40",
      maxTemp: "120",
      pressureUnit: "psi",
      pressure: "1500",
      motion: "reciprocating",
      pressureDirection: "fluctuating",
      special: { ...EMPTY_SPECIAL },
    }),
  },
  {
    label: "Vacuum seal",
    apply: (f) => ({
      ...f,
      fluidId: "vacuum",
      tempUnit: "C",
      minTemp: "20",
      maxTemp: "80",
      pressureUnit: "psi",
      pressure: "15",
      motion: "vacuum",
      pressureDirection: "one-way",
      special: { ...EMPTY_SPECIAL, vacuum: true },
    }),
  },
];

function parseNum(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function toCondition(f: FormState): SealConditions {
  const min = parseNum(f.minTemp);
  const max = parseNum(f.maxTemp);
  const pressure = parseNum(f.pressure);
  return {
    fluidId: f.fluidId,
    minTempC: min === null ? null : f.tempUnit === "C" ? min : cFromF(min),
    maxTempC: max === null ? null : f.tempUnit === "C" ? max : cFromF(max),
    pressurePsi: pressure === null ? null : f.pressureUnit === "psi" ? pressure : psiFromBar(pressure),
    motion: f.motion,
    pressureDirection: f.pressureDirection,
    special: f.special,
    hidePoorMatches: f.hidePoorMatches,
  };
}

function toGeometryResult(f: FormState): GeometryResult {
  // Squeeze/fill/stretch are dimensionless ratios, so the chosen length unit
  // cancels as long as every field uses the same unit (the panel enforces this).
  return analyzeGeometry(
    {
      insideDiameter: parseNum(f.insideDiameter),
      crossSection: parseNum(f.crossSection),
      grooveDepth: parseNum(f.grooveDepth),
      grooveWidth: parseNum(f.grooveWidth),
      installedDiameter: parseNum(f.installedDiameter),
    },
    isDynamicMotion(f.motion),
  );
}

function RatingChip({ rating }: { rating?: string }) {
  if (!rating) return <span className="chip chip-unknown">n/a</span>;
  return <span className={`chip chip-${rating}`}>{rating}</span>;
}

function WarnList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return <span className="muted">none</span>;
  return (
    <ul className="warn-list">
      {warnings.map((w, i) => (
        <li key={i} className={`warn warn-${w.level}`}>
          <span className="warn-tag">{w.level === "severe" ? "SEVERE" : "warn"}</span> {w.text}
        </li>
      ))}
    </ul>
  );
}

function buildSummary(
  f: FormState,
  results: MaterialResult[],
  flags: Warning[],
  geom: GeometryResult,
): string {
  const lines: string[] = [];
  lines.push("SealGuy summary (candidate guidance only — verify against datasheets and test).");
  lines.push("");
  lines.push("Conditions:");
  lines.push(`  Fluid: ${FLUID_BY_ID[f.fluidId]?.label ?? f.fluidId}`);
  lines.push(
    `  Temperature: ${f.minTemp || "?"} to ${f.maxTemp || "?"} ${f.tempUnit}`,
  );
  lines.push(`  Pressure: ${f.pressure || "?"} ${f.pressureUnit}`);
  lines.push(`  Motion: ${f.motion}`);
  lines.push(`  Pressure direction: ${f.pressureDirection}`);
  const specials = SPECIAL_FIELDS.filter((s) => f.special[s.key]).map((s) => s.label);
  lines.push(`  Special needs: ${specials.length ? specials.join(", ") : "none"}`);
  lines.push("");
  if (geom.entered) {
    lines.push("Geometry:");
    lines.push(`  Squeeze: ${geom.squeeze !== null ? geom.squeeze.toFixed(1) + "%" : "n/a"}`);
    lines.push(`  Gland fill: ${geom.glandFill !== null ? geom.glandFill.toFixed(1) + "%" : "n/a"}`);
    lines.push(`  Stretch: ${geom.stretch !== null ? geom.stretch.toFixed(1) + "%" : "n/a"}`);
    lines.push("");
  }
  lines.push("Top matches:");
  results.slice(0, 5).forEach((r, i) => {
    lines.push(
      `  ${i + 1}. ${r.material.name} — score ${r.score}, fluid ${r.fluidRating}, cost ${COST_LABELS[r.material.costTier]}`,
    );
  });
  lines.push("");
  lines.push("Check before using:");
  if (flags.length === 0) lines.push("  (no red flags)");
  flags.forEach((w) => lines.push(`  - [${w.level}] ${w.text}`));
  return lines.join("\n");
}

export default function App() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const toggleSpecial = (key: keyof SpecialNeeds) =>
    setForm((f) => ({ ...f, special: { ...f.special, [key]: !f.special[key] } }));

  const condition = useMemo(() => toCondition(form), [form]);
  const geometry = useMemo(() => toGeometryResult(form), [form]);
  const results = useMemo(() => rankMaterials(condition), [condition]);
  const flags = useMemo(() => redFlags(condition, geometry), [condition, geometry]);

  const filteredFluids = useMemo(() => {
    const q = form.fluidQuery.trim().toLowerCase();
    if (!q) return FLUID_OPTIONS;
    return FLUID_OPTIONS.filter(
      (o) => o.label.toLowerCase().includes(q) || o.id.includes(q),
    );
  }, [form.fluidQuery]);

  const applyAs568 = () => {
    const cs = as568CrossSectionInch(form.dash);
    if (cs === null) return;
    const value = form.lenUnit === "inch" ? cs : Number((cs * 25.4).toFixed(3));
    update({ crossSection: String(value) });
  };

  const as568Preview = as568CrossSectionInch(form.dash);

  const handleCopy = async () => {
    const text = buildSummary(form, results, flags, geometry);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked (e.g. non-secure context); fail quietly.
      setCopied(false);
    }
  };

  const dynamicNote = form.motion === "rotary" || form.motion === "reciprocating";
  const tempPlaceholder = form.tempUnit === "C" ? "C" : "F";

  return (
    <div className="app">
      <header className="header">
        <h1>SealGuy</h1>
        <p className="subtitle">O-ring material selector and gland sanity checker</p>
        <p className="disclaimer">
          Candidate guidance only. Verify against manufacturer datasheets and test in your actual
          application.
        </p>
        <div className="chips-row">
          <span className="chips-label">Examples:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="example-chip"
              onClick={() => setForm((f) => p.apply(f))}
            >
              {p.label}
            </button>
          ))}
          <button type="button" className="reset-btn" onClick={() => setForm(DEFAULT_FORM)}>
            Reset
          </button>
        </div>
      </header>

      <main className="layout">
        {/* ---------- Seal conditions ---------- */}
        <section className="panel">
          <h2>Seal conditions</h2>

          <label className="field">
            <span>Fluid / media</span>
            <input
              type="text"
              placeholder="Search fluids..."
              value={form.fluidQuery}
              onChange={(e) => update({ fluidQuery: e.target.value })}
            />
            <select
              size={Math.min(8, Math.max(4, filteredFluids.length))}
              value={form.fluidId}
              onChange={(e) => update({ fluidId: e.target.value })}
            >
              {filteredFluids.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>
              Temperature ({form.tempUnit})
              <button
                type="button"
                className="unit-toggle"
                onClick={() => update({ tempUnit: form.tempUnit === "C" ? "F" : "C" })}
              >
                switch to {form.tempUnit === "C" ? "F" : "C"}
              </button>
            </span>
            <div className="row">
              <input
                type="number"
                placeholder={`min ${tempPlaceholder}`}
                value={form.minTemp}
                onChange={(e) => update({ minTemp: e.target.value })}
              />
              <input
                type="number"
                placeholder={`max ${tempPlaceholder}`}
                value={form.maxTemp}
                onChange={(e) => update({ maxTemp: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <span>
              Pressure ({form.pressureUnit})
              <button
                type="button"
                className="unit-toggle"
                onClick={() =>
                  update({ pressureUnit: form.pressureUnit === "psi" ? "bar" : "psi" })
                }
              >
                switch to {form.pressureUnit === "psi" ? "bar" : "psi"}
              </button>
            </span>
            <input
              type="number"
              placeholder={form.pressureUnit}
              value={form.pressure}
              onChange={(e) => update({ pressure: e.target.value })}
            />
          </div>

          <label className="field">
            <span>Seal motion</span>
            <select value={form.motion} onChange={(e) => update({ motion: e.target.value as Motion })}>
              {MOTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Pressure direction</span>
            <select
              value={form.pressureDirection}
              onChange={(e) => update({ pressureDirection: e.target.value as PressureDirection })}
            >
              {DIRECTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="field special">
            <legend>Special needs</legend>
            {SPECIAL_FIELDS.map((s) => (
              <label key={s.key} className="check">
                <input
                  type="checkbox"
                  checked={form.special[s.key]}
                  onChange={() => toggleSpecial(s.key)}
                />
                {s.label}
              </label>
            ))}
          </fieldset>
        </section>

        {/* ---------- Geometry ---------- */}
        <section className="panel">
          <h2>Geometry (optional)</h2>

          <div className="field">
            <span>
              Units ({form.lenUnit})
              <button
                type="button"
                className="unit-toggle"
                onClick={() => update({ lenUnit: form.lenUnit === "inch" ? "mm" : "inch" })}
              >
                switch to {form.lenUnit === "inch" ? "mm" : "inch"}
              </button>
            </span>
          </div>

          <label className="field">
            <span>AS568 dash number (optional)</span>
            <div className="row">
              <input
                type="text"
                placeholder="e.g. 214 or 2-214"
                value={form.dash}
                onChange={(e) => update({ dash: e.target.value })}
              />
              <button
                type="button"
                className="apply-btn"
                disabled={as568Preview === null}
                onClick={applyAs568}
              >
                Apply CS
              </button>
            </div>
            {form.dash.trim() !== "" && (
              <small className="hint">
                {as568Preview !== null
                  ? `AS568 cross-section ${as568Preview}" (${(as568Preview * 25.4).toFixed(2)} mm). Enter the inside diameter yourself.`
                  : "Dash number not in the seeded AS568 cross-section table; enter dimensions manually."}
              </small>
            )}
          </label>

          <label className="field">
            <span>O-ring inside diameter ({form.lenUnit})</span>
            <input
              type="number"
              value={form.insideDiameter}
              onChange={(e) => update({ insideDiameter: e.target.value })}
            />
          </label>

          <label className="field">
            <span>O-ring cross-section ({form.lenUnit})</span>
            <input
              type="number"
              value={form.crossSection}
              onChange={(e) => update({ crossSection: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Groove depth ({form.lenUnit})</span>
            <input
              type="number"
              value={form.grooveDepth}
              onChange={(e) => update({ grooveDepth: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Groove width ({form.lenUnit})</span>
            <input
              type="number"
              value={form.grooveWidth}
              onChange={(e) => update({ grooveWidth: e.target.value })}
            />
          </label>

          <label className="field">
            <span>Installed diameter (optional, {form.lenUnit})</span>
            <input
              type="number"
              value={form.installedDiameter}
              onChange={(e) => update({ installedDiameter: e.target.value })}
            />
          </label>

          {dynamicNote && (
            <p className="hint note">
              v1 gives warnings only; dynamic seal design needs detailed review.
            </p>
          )}

          <div className="geom-readout">
            <div>
              <strong>Squeeze</strong>
              <span>{geometry.squeeze !== null ? `${geometry.squeeze.toFixed(1)}%` : "—"}</span>
            </div>
            <div>
              <strong>Gland fill</strong>
              <span>{geometry.glandFill !== null ? `${geometry.glandFill.toFixed(1)}%` : "—"}</span>
            </div>
            <div>
              <strong>Stretch</strong>
              <span>{geometry.stretch !== null ? `${geometry.stretch.toFixed(1)}%` : "—"}</span>
            </div>
          </div>
        </section>

        {/* ---------- Matches ---------- */}
        <section className="panel matches">
          <div className="matches-head">
            <h2>Matches</h2>
            <div className="matches-actions">
              <label className="check inline">
                <input
                  type="checkbox"
                  checked={form.hidePoorMatches}
                  onChange={(e) => update({ hidePoorMatches: e.target.checked })}
                />
                Hide poor matches
              </label>
              <button type="button" className="copy-btn" onClick={handleCopy}>
                {copied ? "Copied" : "Copy summary"}
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table className="results">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Material family</th>
                  <th>Temp fit</th>
                  <th>Fluid fit</th>
                  <th>Motion fit</th>
                  <th>Pressure fit</th>
                  <th>Cost</th>
                  <th>Why matched</th>
                  <th>Warnings</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr>
                    <td colSpan={9} className="muted">
                      No matches to show (all hidden by "hide poor matches").
                    </td>
                  </tr>
                )}
                {results.map((r) => {
                  const isOpen = expanded === r.material.id;
                  return (
                    <Fragment key={r.material.id}>
                      <tr
                        className={`result-row ${isOpen ? "open" : ""}`}
                        onClick={() => setExpanded(isOpen ? null : r.material.id)}
                      >
                        <td className="score">{r.score}</td>
                        <td>
                          <span className="mat-name">{r.material.name}</span>
                          <span className="expand-hint">{isOpen ? "▾" : "▸"}</span>
                        </td>
                        <td>{r.temp.label}</td>
                        <td>
                          <RatingChip rating={r.fluid.rating} />
                        </td>
                        <td>{r.motion.label}</td>
                        <td>{r.pressure.label}</td>
                        <td>{COST_LABELS[r.material.costTier]}</td>
                        <td className="why">{r.whyMatched[0]}</td>
                        <td>
                          {r.warnings.length === 0 ? (
                            <span className="muted">none</span>
                          ) : (
                            <span className="warn-count">
                              {r.warnings.filter((w) => w.level === "severe").length > 0
                                ? `${r.warnings.length} (severe)`
                                : `${r.warnings.length}`}
                            </span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="detail-row">
                          <td colSpan={9}>
                            <div className="detail-grid">
                              <div>
                                <h4>Good uses</h4>
                                <ul>
                                  {r.material.strengths.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4>Avoid when</h4>
                                <ul>
                                  {r.material.weaknesses.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4>Notes</h4>
                                <ul>
                                  {r.material.notes.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4>Why this score</h4>
                                <ul>
                                  {r.whyMatched.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4>Warnings</h4>
                                <WarnList warnings={r.warnings} />
                              </div>
                              <div>
                                <h4>Source status</h4>
                                <p className="source-status">{r.material.sourceStatus}</p>
                                <h4>Data gaps</h4>
                                <ul>
                                  {r.dataGaps.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="redflags">
            <h3>Check before using</h3>
            <WarnList warnings={flags} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          SealGuy is a deterministic, data-backed starting point for choosing an O-ring elastomer
          family. It does not recommend exact commercial compounds or part numbers, and it is not a
          certification, approval, or final engineering validation. Always verify against
          manufacturer datasheets and test in your actual application.
        </p>
      </footer>
    </div>
  );
}
