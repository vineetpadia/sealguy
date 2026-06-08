import { describe, it, expect } from "vitest";
import {
  analyzeGeometry,
  cFromF,
  glandFillPercent,
  squeezePercent,
  stretchPercent,
} from "./calcs";
import {
  as568CrossSectionInch,
  as568Size,
  maxDiametralClearanceIn,
  normalizeDash,
} from "../data/as568";

describe("geometry formulas", () => {
  it("computes squeeze percent", () => {
    // cross-section 2.0, groove depth 1.7 -> (0.3 / 2.0) * 100 = 15%
    expect(squeezePercent(2.0, 1.7)).toBeCloseTo(15, 5);
  });

  it("computes gland fill percent", () => {
    // ring area = pi * (1)^2 = 3.14159...; groove 4 x 1.7 = 6.8 -> ~46.2%
    expect(glandFillPercent(2.0, 4.0, 1.7)).toBeCloseTo(46.19, 1);
  });

  it("computes stretch percent", () => {
    // free ID 20, installed 21 -> 5%
    expect(stretchPercent(20, 21)).toBeCloseTo(5, 5);
  });

  it("converts Fahrenheit to Celsius", () => {
    expect(cFromF(32)).toBeCloseTo(0, 5);
    expect(cFromF(212)).toBeCloseTo(100, 5);
  });

  it("looks up real AS568 sizes from the Parker tables", () => {
    // -214: ID 0.984", CS 0.139"
    expect(as568Size("214")?.idIn).toBeCloseTo(0.984, 5);
    expect(as568CrossSectionInch("214")).toBeCloseTo(0.139, 5);
    // accepts AS568-/2-/-/bare forms
    expect(normalizeDash("AS568-214")).toBe("214");
    expect(normalizeDash("2-214")).toBe("214");
    expect(normalizeDash("-001")).toBe("001");
    expect(as568Size("2-001")?.csIn).toBeCloseTo(0.04, 5);
    // unknown dash
    expect(as568Size("999")).toBeNull();
  });

  it("returns the AS5857 max diametral clearance by cross-section", () => {
    expect(maxDiametralClearanceIn(0.139)).toBeCloseTo(0.008, 5);
    expect(maxDiametralClearanceIn(0.07)).toBeCloseTo(0.005, 5);
    expect(maxDiametralClearanceIn(0.5)).toBeNull(); // non-standard cross-section
  });
});

describe("analyzeGeometry warnings", () => {
  it("reports nothing entered when empty", () => {
    const r = analyzeGeometry(
      {
        insideDiameter: null,
        crossSection: null,
        grooveDepth: null,
        grooveWidth: null,
        installedDiameter: null,
      },
      false,
    );
    expect(r.entered).toBe(false);
    expect(r.warnings).toHaveLength(0);
  });

  it("warns on stretch over 5%", () => {
    const r = analyzeGeometry(
      {
        insideDiameter: 20,
        crossSection: null,
        grooveDepth: null,
        grooveWidth: null,
        installedDiameter: 22, // 10% stretch
      },
      false,
    );
    expect(r.stretch).toBeCloseTo(10, 5);
    expect(r.warnings.some((w) => /stretch/i.test(w.text))).toBe(true);
  });

  it("flags dynamic squeeze over 16% as severe", () => {
    const r = analyzeGeometry(
      { insideDiameter: null, crossSection: 2.0, grooveDepth: 1.6, grooveWidth: null, installedDiameter: null },
      true, // dynamic -> 20% squeeze
    );
    expect(r.squeeze).toBeCloseTo(20, 5);
    expect(r.warnings.some((w) => w.level === "severe")).toBe(true);
  });

  it("flags gland fill over 90% as severe", () => {
    const r = analyzeGeometry(
      { insideDiameter: null, crossSection: 2.0, grooveDepth: 1.8, grooveWidth: 1.9, installedDiameter: null },
      false,
    );
    expect(r.glandFill).not.toBeNull();
    expect(r.glandFill!).toBeGreaterThan(90);
    expect(r.warnings.some((w) => w.level === "severe" && /gland fill/i.test(w.text))).toBe(true);
  });
});
