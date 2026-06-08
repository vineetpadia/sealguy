import { describe, it, expect } from "vitest";
import {
  EMPTY_SPECIAL,
  rankMaterials,
  redFlags,
  type SealConditions,
} from "./scoring";
import { analyzeGeometry, EMPTY_GEOMETRY } from "./calcs";

function baseConditions(overrides: Partial<SealConditions> = {}): SealConditions {
  return {
    fluidId: "water",
    minTempC: null,
    maxTempC: null,
    pressurePsi: null,
    motion: "static",
    pressureDirection: "one-way",
    special: { ...EMPTY_SPECIAL },
    hidePoorMatches: false,
    ...overrides,
  };
}

function rankOf(results: ReturnType<typeof rankMaterials>, id: string): number {
  return results.findIndex((r) => r.material.id === id);
}

describe("material ranking", () => {
  it("ranks EPDM at the top for water", () => {
    const results = rankMaterials(baseConditions({ fluidId: "water" }));
    expect(results[0].material.id).toBe("epdm");
  });

  it("ranks NBR and FKM high but EPDM low for mineral oil", () => {
    const results = rankMaterials(baseConditions({ fluidId: "mineral_oil" }));
    const nbr = rankOf(results, "nbr");
    const fkm = rankOf(results, "fkm");
    const epdm = rankOf(results, "epdm");
    expect(nbr).toBeLessThan(epdm);
    expect(fkm).toBeLessThan(epdm);
    // EPDM is "avoid" in mineral oil -> negative fluid score -> bottom of list.
    expect(results[results.length - 1].material.id).toBe("epdm");
  });

  it("ranks EPDM high and NBR/FKM low for DOT brake fluid", () => {
    const results = rankMaterials(baseConditions({ fluidId: "dot_brake" }));
    expect(results[0].material.id).toBe("epdm");
    const epdm = rankOf(results, "epdm");
    expect(rankOf(results, "nbr")).toBeGreaterThan(epdm);
    expect(rankOf(results, "fkm")).toBeGreaterThan(epdm);
  });

  it("hides avoid-rated materials when hidePoorMatches is on", () => {
    const visible = rankMaterials(baseConditions({ fluidId: "mineral_oil", hidePoorMatches: true }));
    expect(visible.some((r) => r.material.id === "epdm")).toBe(false);
  });

  it("is deterministic for identical inputs", () => {
    const a = rankMaterials(baseConditions({ fluidId: "gasoline" }));
    const b = rankMaterials(baseConditions({ fluidId: "gasoline" }));
    expect(a.map((r) => r.material.id)).toEqual(b.map((r) => r.material.id));
  });
});

describe("red flags", () => {
  const noGeom = analyzeGeometry(EMPTY_GEOMETRY, false);

  it("creates a backup-ring warning above 1500 psi", () => {
    const flags = redFlags(baseConditions({ pressurePsi: 2000 }), noGeom);
    expect(flags.some((w) => w.level === "severe" && /backup ring/i.test(w.text))).toBe(true);
  });

  it("warns about unknown fluid and does not infer", () => {
    const flags = redFlags(baseConditions({ fluidId: "unknown" }), noGeom);
    expect(flags.some((w) => /do not infer/i.test(w.text))).toBe(true);
  });

  it("includes a geometry-not-checked flag when no dimensions are given", () => {
    const flags = redFlags(baseConditions(), noGeom);
    expect(flags.some((w) => /geometry not checked/i.test(w.text))).toBe(true);
  });

  it("flags rapid gas decompression for high-pressure gas service", () => {
    const flags = redFlags(baseConditions({ fluidId: "air", pressurePsi: 2000 }), noGeom);
    expect(flags.some((w) => /decompression/i.test(w.text))).toBe(true);
    // not raised for a liquid at the same pressure
    const liquid = redFlags(baseConditions({ fluidId: "water", pressurePsi: 2000 }), noGeom);
    expect(liquid.some((w) => /decompression/i.test(w.text))).toBe(false);
  });

  it("propagates a stretch warning from geometry into the red flags", () => {
    const geom = analyzeGeometry({ ...EMPTY_GEOMETRY, insideDiameter: 20, installedDiameter: 22 }, false);
    const flags = redFlags(baseConditions(), geom);
    expect(flags.some((w) => /stretch/i.test(w.text))).toBe(true);
  });
});
