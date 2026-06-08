// Deterministic scoring for O-ring material families.
//
// Same inputs always produce the same ranking. Unknown data is reported as
// "unknown" and given a small, neutral score; it is never upgraded to a guess.

import {
  MATERIALS,
  MATERIAL_BY_ID,
  type MaterialFamily,
  type Rating,
} from "../data/materials";
import { FLUID_BY_ID } from "../data/compatibility";
import type { GeometryResult, Warning } from "./calcs";

export type Motion = "static" | "reciprocating" | "rotary" | "pneumatic" | "vacuum";

export type PressureDirection = "one-way" | "reversing" | "fluctuating" | "unknown";

export interface SpecialNeeds {
  ozone: boolean; // outdoor / ozone
  lowFriction: boolean;
  lowTemp: boolean;
  highTemp: boolean;
  food: boolean; // food / potable water contact
  vacuum: boolean; // low outgassing / vacuum
  aggressiveChemical: boolean;
  lowCost: boolean;
}

export const EMPTY_SPECIAL: SpecialNeeds = {
  ozone: false,
  lowFriction: false,
  lowTemp: false,
  highTemp: false,
  food: false,
  vacuum: false,
  aggressiveChemical: false,
  lowCost: false,
};

export interface SealConditions {
  fluidId: string;
  minTempC: number | null;
  maxTempC: number | null;
  pressurePsi: number | null;
  motion: Motion;
  pressureDirection: PressureDirection;
  special: SpecialNeeds;
  hidePoorMatches: boolean;
}

export interface ComponentScore {
  value: number;
  label: string;
  rating?: Rating;
}

export interface MaterialResult {
  material: MaterialFamily;
  score: number;
  fluidRating: Rating;
  fluid: ComponentScore;
  temp: ComponentScore;
  motion: ComponentScore;
  pressure: ComponentScore;
  special: ComponentScore;
  whyMatched: string[];
  warnings: Warning[];
  dataGaps: string[];
  excluded: boolean;
}

const FLUID_POINTS: Record<Rating, number> = {
  good: 40,
  fair: 22,
  unknown: 8,
  avoid: -40,
};

const DYNAMIC_POINTS: Record<Rating, number> = {
  good: 15,
  fair: 9,
  avoid: 2,
  unknown: 6,
};

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function getFluidRating(fluidId: string, materialId: string): { rating: Rating; note: string } {
  const fluid = FLUID_BY_ID[fluidId];
  if (!fluid) {
    return { rating: "unknown", note: "No seeded compatibility data for this fluid." };
  }
  const entry = fluid.ratings[materialId];
  if (!entry) {
    return {
      rating: "unknown",
      note: "No seeded data for this material/fluid pair. Do not infer compatibility.",
    };
  }
  return entry;
}

function tempFit(m: MaterialFamily, cond: SealConditions): ComponentScore & { warnings: Warning[] } {
  if (cond.minTempC === null && cond.maxTempC === null) {
    return { value: 12, label: "not specified", warnings: [] };
  }
  const userMin = cond.minTempC ?? cond.maxTempC!;
  const userMax = cond.maxTempC ?? cond.minTempC!;
  const lowExceed = m.tempMinC - userMin; // > 0: too cold for the material
  const highExceed = userMax - m.tempMaxC; // > 0: too hot for the material
  const exceed = Math.max(lowExceed, highExceed, 0);
  const range = `${m.tempMinC} to ${m.tempMaxC} C`;

  if (exceed > 20) {
    return {
      value: -40,
      label: "outside range",
      warnings: [
        {
          level: "severe",
          text: `Temperature exceeds the ${m.name} range (${range}) by ~${Math.round(exceed)} C. Exclude.`,
        },
      ],
    };
  }
  if (exceed > 10) {
    return {
      value: -20,
      label: "outside range",
      warnings: [
        {
          level: "severe",
          text: `Temperature exceeds the ${m.name} range (${range}) by ~${Math.round(exceed)} C.`,
        },
      ],
    };
  }
  if (exceed > 0) {
    return {
      value: 6,
      label: "marginal",
      warnings: [
        {
          level: "warning",
          text: `Temperature is within ~${Math.round(exceed)} C of the ${m.name} limit (${range}).`,
        },
      ],
    };
  }
  const margin = Math.min(userMin - m.tempMinC, m.tempMaxC - userMax);
  if (margin > 20) {
    return { value: 25, label: "good margin", warnings: [] };
  }
  return { value: 18, label: "within range", warnings: [] };
}

function motionFit(m: MaterialFamily, cond: SealConditions): ComponentScore & { warnings: Warning[] } {
  if (cond.motion === "static" || cond.motion === "vacuum") {
    return { value: 15, label: "static ok", warnings: [] };
  }
  if (cond.motion === "rotary") {
    const base = Math.min(DYNAMIC_POINTS[m.dynamicSuitability], 10);
    return {
      value: base,
      label: "rotary (warn)",
      rating: m.dynamicSuitability,
      warnings: [
        {
          level: "warning",
          text: "Rotary O-ring sealing is a special case; v1 gives warnings only and cannot design it.",
        },
      ],
    };
  }
  // reciprocating or pneumatic
  const base = DYNAMIC_POINTS[m.dynamicSuitability];
  const warnings: Warning[] = [];
  if (m.dynamicSuitability === "avoid") {
    warnings.push({
      level: "warning",
      text: `${m.name} has poor dynamic wear/tear resistance; prefer static use.`,
    });
  } else if (m.dynamicSuitability === "fair") {
    warnings.push({
      level: "warning",
      text: `${m.name} has limited dynamic durability; review wear and friction.`,
    });
  }
  return { value: base, label: `dynamic ${m.dynamicSuitability}`, rating: m.dynamicSuitability, warnings };
}

function pressureFit(m: MaterialFamily, cond: SealConditions): ComponentScore & { warnings: Warning[] } {
  const p = cond.pressurePsi;
  if (p === null) return { value: 10, label: "not specified", warnings: [] };
  if (p <= 1500) return { value: 10, label: "moderate", warnings: [] };

  const soft = m.id === "vmq" || m.id === "fvmq";
  if (soft) {
    return {
      value: 2,
      label: "high (soft material)",
      warnings: [
        {
          level: "warning",
          text: `${m.name} is low-strength; extrusion risk is high above 1500 psi without backup rings.`,
        },
      ],
    };
  }
  return { value: 8, label: "high pressure", warnings: [] };
}

function specialFit(m: MaterialFamily, cond: SealConditions): ComponentScore {
  let v = 5; // neutral baseline
  const s = cond.special;

  if (s.ozone) {
    v += m.ozoneResistance === "good" ? 3 : m.ozoneResistance === "avoid" ? -3 : 0;
  }
  if (s.lowCost) {
    v +=
      m.costTier === 1 ? 3 : m.costTier === 2 ? 1 : m.costTier === 4 ? -2 : m.costTier === 5 ? -3 : 0;
  }
  if (s.vacuum) {
    v += m.vacuumSuitability === "good" ? 3 : m.vacuumSuitability === "avoid" ? -3 : 0;
  }
  if (s.lowTemp) {
    v += m.tempMinC <= -50 ? 3 : m.tempMinC <= -40 ? 1 : m.tempMinC > -25 ? -2 : 0;
  }
  if (s.highTemp) {
    v += m.tempMaxC >= 200 ? 3 : m.tempMaxC >= 150 ? 1 : m.tempMaxC < 120 ? -2 : 0;
  }
  if (s.lowFriction) {
    v += m.id === "ptfe" ? 3 : m.id === "fkm" ? 1 : 0;
  }
  if (s.food) {
    v += m.id === "epdm" || m.id === "vmq" || m.id === "fkm" || m.id === "ffkm" ? 1 : 0;
  }
  if (s.aggressiveChemical) {
    v +=
      m.id === "ffkm"
        ? 3
        : m.id === "ptfe"
          ? 2
          : m.id === "fkm"
            ? 1
            : m.id === "nbr" || m.id === "cr"
              ? -1
              : 0;
  }

  v = Math.max(0, Math.min(10, v));
  return { value: v, label: "special needs" };
}

export function scoreMaterial(m: MaterialFamily, cond: SealConditions): MaterialResult {
  const fluid = getFluidRating(cond.fluidId, m.id);
  const fluidValue = FLUID_POINTS[fluid.rating];
  const t = tempFit(m, cond);
  const mo = motionFit(m, cond);
  const pr = pressureFit(m, cond);
  const sp = specialFit(m, cond);

  const warnings: Warning[] = [...t.warnings, ...mo.warnings, ...pr.warnings];

  const dataGaps: string[] = [];
  if (fluid.rating === "unknown") {
    dataGaps.push("No seeded fluid compatibility for this pair; do not infer.");
  }
  if (m.sourceStatus !== "source-backed") {
    dataGaps.push("Material data is seeded/general, not source-backed; verify against datasheets.");
  }

  const score = fluidValue + t.value + mo.value + pr.value + sp.value;

  const whyMatched: string[] = [
    `Fluid: ${fluid.rating} (${signed(fluidValue)}). ${fluid.note}`,
    `Temperature: ${t.label} (${signed(t.value)}).`,
    `Motion: ${mo.label} (${signed(mo.value)}).`,
    `Pressure: ${pr.label} (${signed(pr.value)}).`,
  ];
  if (sp.value !== 5) {
    whyMatched.push(`Special needs: ${signed(sp.value - 5)} vs neutral (${sp.value}/10).`);
  }

  const excluded = cond.hidePoorMatches && fluid.rating === "avoid";

  return {
    material: m,
    score,
    fluidRating: fluid.rating,
    fluid: { value: fluidValue, label: fluid.rating, rating: fluid.rating },
    temp: { value: t.value, label: t.label },
    motion: { value: mo.value, label: mo.label, rating: mo.rating },
    pressure: { value: pr.value, label: pr.label },
    special: sp,
    whyMatched,
    warnings,
    dataGaps,
    excluded,
  };
}

export function rankMaterials(cond: SealConditions): MaterialResult[] {
  const results = MATERIALS.map((m) => scoreMaterial(m, cond));
  return results
    .filter((r) => !r.excluded)
    .sort((a, b) => b.score - a.score || a.material.name.localeCompare(b.material.name));
}

export function isDynamicMotion(motion: Motion): boolean {
  return motion === "reciprocating" || motion === "rotary" || motion === "pneumatic";
}

// ----- global red flags (always visible, never hidden by "hide poor matches") -----

export function redFlags(cond: SealConditions, geom: GeometryResult): Warning[] {
  const flags: Warning[] = [];

  if (cond.fluidId === "unknown") {
    flags.push({ level: "severe", text: "Unknown fluid: no fluid compatibility data. Do not infer." });
  } else {
    flags.push({
      level: "warning",
      text: "If multiple fluids, cleaners, or lubricants contact the seal, check every one.",
    });
  }

  if (cond.pressurePsi !== null && cond.pressurePsi > 1500) {
    flags.push({
      level: "severe",
      text: "Pressure over 1500 psi: backup rings and extrusion-gap review required.",
    });
  }

  if (cond.pressureDirection === "fluctuating") {
    flags.push({ level: "warning", text: "Fluctuating/pulsing pressure: check extrusion and nibbling risk." });
  }

  if (cond.motion === "reciprocating" || cond.motion === "rotary") {
    flags.push({
      level: "warning",
      text: "Dynamic seal: design needs friction, lubrication, surface finish, and wear review.",
    });
  }

  if (cond.motion === "vacuum" || cond.special.vacuum) {
    flags.push({
      level: "warning",
      text: "Vacuum: check permeability, outgassing, surface finish, and grease compatibility.",
    });
  }

  if (cond.special.food) {
    flags.push({
      level: "warning",
      text: "Food/potable water: do not claim FDA/NSF/USP compliance without compound-specific documentation.",
    });
  }

  if (cond.special.aggressiveChemical) {
    flags.push({ level: "warning", text: "Aggressive chemical: use source-backed compound data and test." });
  }

  if (cond.minTempC !== null || cond.maxTempC !== null) {
    const userMin = cond.minTempC ?? cond.maxTempC!;
    const userMax = cond.maxTempC ?? cond.minTempC!;
    const covered = MATERIALS.some((m) => m.tempMinC <= userMin && m.tempMaxC >= userMax);
    if (!covered) {
      flags.push({
        level: "severe",
        text: "Temperature range is outside every seeded material range. Exclude or treat as a severe warning.",
      });
    }
  }

  if (!geom.entered) {
    flags.push({ level: "warning", text: "Geometry not checked. Cannot check squeeze, fill, or stretch." });
  }
  flags.push(...geom.warnings);

  return flags;
}

export { MATERIAL_BY_ID };
