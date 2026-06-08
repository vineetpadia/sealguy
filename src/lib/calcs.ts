// Deterministic unit conversions and O-ring geometry sanity checks.
//
// The squeeze, gland-fill, and stretch formulas are dimensionless ratios, so
// they are valid for any single consistent unit. The caller is responsible for
// passing all four geometry values in the SAME unit (the UI enforces this with
// one inch/mm toggle for the whole geometry panel).

export type WarnLevel = "warning" | "severe";

export interface Warning {
  level: WarnLevel;
  text: string;
}

// ----- unit conversion helpers -----

export function mmFromInch(value: number): number {
  return value * 25.4;
}

export function inchFromMm(value: number): number {
  return value / 25.4;
}

export function cFromF(f: number): number {
  return ((f - 32) * 5) / 9;
}

export function fFromC(c: number): number {
  return (c * 9) / 5 + 32;
}

export function psiFromBar(bar: number): number {
  return bar * 14.5037738;
}

export function barFromPsi(psi: number): number {
  return psi / 14.5037738;
}

// ----- core geometry formulas -----

export function squeezePercent(crossSection: number, grooveDepth: number): number {
  return ((crossSection - grooveDepth) / crossSection) * 100;
}

export function glandFillPercent(
  crossSection: number,
  grooveWidth: number,
  grooveDepth: number,
): number {
  const ringArea = Math.PI * Math.pow(crossSection / 2, 2);
  return (ringArea / (grooveWidth * grooveDepth)) * 100;
}

export function stretchPercent(freeId: number, installedId: number): number {
  return ((installedId - freeId) / freeId) * 100;
}

// ----- AS568 cross-section lookup -----
//
// AS568 standardizes the nominal cross-section by dash-number series. We only
// fill in the cross-section (which we are confident about) and leave the inside
// diameter for the user, so no inside-diameter numbers are invented.
export function as568CrossSectionInch(dash: string): number | null {
  const cleaned = dash.trim().toLowerCase().replace(/^as568[a-z]?/, "").replace(/^2?-/, "").trim();
  const n = parseInt(cleaned, 10);
  if (!Number.isFinite(n)) return null;
  if (n >= 6 && n <= 50) return 0.07;
  if (n >= 102 && n <= 178) return 0.103;
  if (n >= 201 && n <= 284) return 0.139;
  if (n >= 309 && n <= 395) return 0.21;
  if (n >= 425 && n <= 475) return 0.275;
  return null;
}

// ----- geometry analysis -----

export interface GeometryInput {
  insideDiameter: number | null; // O-ring free inside diameter
  crossSection: number | null;
  grooveDepth: number | null;
  grooveWidth: number | null;
  installedDiameter: number | null;
}

export interface GeometryResult {
  entered: boolean;
  squeeze: number | null;
  glandFill: number | null;
  stretch: number | null;
  warnings: Warning[];
}

export const EMPTY_GEOMETRY: GeometryInput = {
  insideDiameter: null,
  crossSection: null,
  grooveDepth: null,
  grooveWidth: null,
  installedDiameter: null,
};

function isPos(v: number | null): v is number {
  return v !== null && Number.isFinite(v) && v > 0;
}

export function analyzeGeometry(g: GeometryInput, isDynamic: boolean): GeometryResult {
  const warnings: Warning[] = [];
  const entered =
    g.insideDiameter !== null ||
    g.crossSection !== null ||
    g.grooveDepth !== null ||
    g.grooveWidth !== null ||
    g.installedDiameter !== null;

  let squeeze: number | null = null;
  let glandFill: number | null = null;
  let stretch: number | null = null;

  if (isPos(g.crossSection) && g.grooveDepth !== null && Number.isFinite(g.grooveDepth)) {
    squeeze = squeezePercent(g.crossSection, g.grooveDepth);
    if (isDynamic) {
      if (squeeze > 16) {
        warnings.push({
          level: "severe",
          text: `Dynamic squeeze ${squeeze.toFixed(1)}% is over 16%: high friction, heat, and wear risk.`,
        });
      } else if (squeeze < 8) {
        warnings.push({
          level: "warning",
          text: `Dynamic squeeze ${squeeze.toFixed(1)}% is under 8%: leakage risk.`,
        });
      }
    } else {
      if (squeeze > 30) {
        warnings.push({
          level: "warning",
          text: `Static squeeze ${squeeze.toFixed(1)}% is over 30%: over-compression risk.`,
        });
      } else if (squeeze < 7) {
        warnings.push({
          level: "warning",
          text: `Static squeeze ${squeeze.toFixed(1)}% is under 7%: leakage risk.`,
        });
      }
    }
  }

  if (isPos(g.crossSection) && isPos(g.grooveWidth) && isPos(g.grooveDepth)) {
    glandFill = glandFillPercent(g.crossSection, g.grooveWidth, g.grooveDepth);
    if (glandFill > 90) {
      warnings.push({
        level: "severe",
        text: `Gland fill ${glandFill.toFixed(1)}% is over 90%: no room for thermal/chemical swell.`,
      });
    } else if (glandFill > 85) {
      warnings.push({
        level: "warning",
        text: `Gland fill ${glandFill.toFixed(1)}% is over 85%: limited room for swell.`,
      });
    } else if (glandFill < 60) {
      warnings.push({
        level: "warning",
        text: `Gland fill ${glandFill.toFixed(1)}% is under 60%: groove may be under-filled.`,
      });
    }
  }

  if (isPos(g.insideDiameter) && g.installedDiameter !== null && Number.isFinite(g.installedDiameter)) {
    stretch = stretchPercent(g.insideDiameter, g.installedDiameter);
    if (stretch > 5) {
      warnings.push({
        level: "warning",
        text: `Stretch ${stretch.toFixed(1)}% is over 5%: reduced cross-section and accelerated aging.`,
      });
    } else if (stretch < 0) {
      warnings.push({
        level: "warning",
        text: `Negative stretch ${stretch.toFixed(1)}%: installed diameter is smaller than the O-ring ID (check fit).`,
      });
    }
  }

  return { entered, squeeze, glandFill, stretch, warnings };
}
