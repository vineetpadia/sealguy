// Fluid <-> material-family compatibility data for SealGuy.
//
// The well-defined fluids (water, steam, mineral oil, petroleum hydraulic oil,
// gasoline, diesel, ethanol-blend fuel, DOT 3/4 brake fluid, silicone oil) use
// ratings derived from the Parker O-Ring Handbook ORD-5700 fluid compatibility
// tables (Section VII, pages 162-216). Parker's legend is mapped to SealGuy as:
//   1 satisfactory          -> good
//   2 fair (usually static)  -> fair
//   3 doubtful (static only) -> avoid  (treated conservatively)
//   4 unsatisfactory         -> avoid
//   X insufficient data      -> unknown
// The original Parker page and numeric rating are kept in each note for
// transparency. Broad categories (acids, bases, solvents, refrigerant) stay
// conservative/general because results vary enormously by specific chemical;
// look the exact chemical up in ORD-5700 and add a row.
//
// Any material not listed for a fluid is treated as "unknown" by the scorer
// (NOT assumed compatible). PTFE is not in Parker's elastomer columns, so its
// ratings remain general "inert / special-case gland" notes. Do not add exact
// compound numbers, approvals, or part numbers here.

import type { Rating } from "./materials";

export interface FluidCompatibility {
  fluidId: string;
  label: string;
  synonyms: string[];
  ratings: Record<string, { rating: Rating; note: string }>;
}

export interface FluidOption {
  id: string;
  label: string;
}

// Order matches the searchable select in the UI.
export const FLUID_OPTIONS: FluidOption[] = [
  { id: "water", label: "Water" },
  { id: "steam", label: "Steam" },
  { id: "mineral_oil", label: "Mineral oil" },
  { id: "hydraulic_oil", label: "Hydraulic oil (petroleum)" },
  { id: "gasoline", label: "Gasoline" },
  { id: "diesel", label: "Diesel" },
  { id: "ethanol_fuel", label: "Ethanol blend fuel" },
  { id: "dot_brake", label: "DOT 3/4 brake fluid" },
  { id: "silicone_oil", label: "Silicone oil" },
  { id: "air", label: "Air" },
  { id: "vacuum", label: "Vacuum" },
  { id: "refrigerant", label: "Refrigerant" },
  { id: "dilute_acid", label: "Dilute acid" },
  { id: "strong_acid", label: "Strong acid" },
  { id: "dilute_base", label: "Dilute base" },
  { id: "strong_base", label: "Strong base" },
  { id: "solvent", label: "Solvent" },
  { id: "unknown", label: "Unknown / other" },
];

type Entry = [Rating, string];

function compat(
  fluidId: string,
  label: string,
  synonyms: string[],
  entries: Record<string, Entry>,
): FluidCompatibility {
  const ratings: Record<string, { rating: Rating; note: string }> = {};
  for (const [id, [rating, note]] of Object.entries(entries)) {
    ratings[id] = { rating, note };
  }
  return { fluidId, label, synonyms, ratings };
}

export const FLUIDS: FluidCompatibility[] = [
  compat("water", "Water", ["hot water", "potable water", "process water"], {
    nbr: ["good", "Parker ORD-5700 p.215: rating 1 (satisfactory). Cold water; watch hot water."],
    hnbr: ["fair", "Parker ORD-5700 p.215: rating 2 (fair; usually OK static)."],
    epdm: ["good", "Parker ORD-5700 p.215: rating 1 (satisfactory)."],
    fkm: ["fair", "Parker ORD-5700 p.215: rating 2 (fair). Hot water/steam attacks standard grades."],
    ffkm: ["good", "Parker ORD-5700 p.215: rating 1 (satisfactory)."],
    cr: ["fair", "Parker ORD-5700 p.215: rating 2 (fair; usually OK static)."],
    fvmq: ["good", "Parker ORD-5700 p.215: rating 1 (satisfactory)."],
    vmq: ["good", "Parker ORD-5700 p.215: rating 1 (satisfactory)."],
    ptfe: ["good", "Inert to water (special-case gland; not in Parker elastomer table)."],
  }),
  compat("steam", "Steam", ["hot water/steam", "saturated steam"], {
    epdm: ["good", "Parker ORD-5700 p.209 (steam <400F): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.209 (steam <400F): rating 1 (satisfactory)."],
    vmq: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 3 (doubtful; static only)."],
    hnbr: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 4 (unsatisfactory)."],
    nbr: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 4 (unsatisfactory)."],
    fkm: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 4 (unsatisfactory). Special grades only."],
    fvmq: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 4 (unsatisfactory)."],
    cr: ["avoid", "Parker ORD-5700 p.209 (steam <400F): rating 4 (unsatisfactory)."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("mineral_oil", "Mineral oil", ["petroleum oil", "lubricating oil"], {
    nbr: ["good", "Parker ORD-5700 p.196 (mineral oils): rating 1 (satisfactory)."],
    hnbr: ["good", "Parker ORD-5700 p.196 (mineral oils): rating 1 (satisfactory)."],
    fkm: ["good", "Parker ORD-5700 p.196 (mineral oils): rating 1 (satisfactory)."],
    fvmq: ["good", "Parker ORD-5700 p.196 (mineral oils): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.196 (mineral oils): rating 1 (satisfactory)."],
    cr: ["fair", "Parker ORD-5700 p.196 (mineral oils): rating 2 (fair; usually OK static)."],
    vmq: ["fair", "Parker ORD-5700 p.196 (mineral oils): rating 2 (fair; static only)."],
    epdm: ["avoid", "Parker ORD-5700 p.196 (mineral oils): rating 3 (doubtful). EPDM swells in petroleum oils."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("hydraulic_oil", "Hydraulic oil (petroleum)", ["hydraulic fluid", "petroleum hydraulic"], {
    nbr: ["good", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 1 (satisfactory)."],
    hnbr: ["good", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 1 (satisfactory)."],
    fkm: ["good", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 1 (satisfactory)."],
    fvmq: ["good", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 1 (satisfactory)."],
    cr: ["fair", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 2 (fair; static)."],
    vmq: ["fair", "Parker ORD-5700 p.187 (hydraulic oil, petroleum base): rating 2 (fair; static)."],
    epdm: ["avoid", "Parker ORD-5700 p.187: rating 4 (unsatisfactory) for petroleum hydraulic oil. EPDM suits phosphate-ester fluids instead."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("gasoline", "Gasoline", ["petrol", "fuel"], {
    nbr: ["good", "Parker ORD-5700 p.185 (gasoline): rating 1 (satisfactory). Aromatics reduce life."],
    hnbr: ["good", "Parker ORD-5700 p.185 (gasoline): rating 1 (satisfactory)."],
    fkm: ["good", "Parker ORD-5700 p.185 (gasoline): rating 1 (satisfactory)."],
    fvmq: ["good", "Parker ORD-5700 p.185 (gasoline): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.185 (gasoline): rating 1 (satisfactory)."],
    epdm: ["avoid", "Parker ORD-5700 p.185 (gasoline): rating 4 (unsatisfactory). Swells in fuel."],
    cr: ["avoid", "Parker ORD-5700 p.185 (gasoline): rating 4 (unsatisfactory)."],
    vmq: ["avoid", "Parker ORD-5700 p.185 (gasoline): rating 4 (unsatisfactory). Swells in fuel."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("diesel", "Diesel", ["diesel fuel", "gas oil"], {
    nbr: ["good", "Parker ORD-5700 p.179 (diesel oil): rating 1 (satisfactory). Biodiesel reduces life."],
    hnbr: ["good", "Parker ORD-5700 p.179 (diesel oil): rating 1 (satisfactory)."],
    fkm: ["good", "Parker ORD-5700 p.179 (diesel oil): rating 1 (satisfactory)."],
    fvmq: ["good", "Parker ORD-5700 p.179 (diesel oil): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.179 (diesel oil): rating 1 (satisfactory)."],
    cr: ["avoid", "Parker ORD-5700 p.179 (diesel oil): rating 3 (doubtful; static only)."],
    epdm: ["avoid", "Parker ORD-5700 p.179 (diesel oil): rating 4 (unsatisfactory). Swells in fuel."],
    vmq: ["avoid", "Parker ORD-5700 p.179 (diesel oil): rating 4 (unsatisfactory). Swells in fuel."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("ethanol_fuel", "Ethanol blend fuel", ["e10", "e85", "gasohol", "flex fuel"], {
    // No "gasohol" row in Parker; derived conservatively as the worse of the
    // "Gasoline" (p.185) and "Ethanol" (p.181) ratings for each family.
    ffkm: ["good", "Parker ORD-5700: rating 1 in both gasoline (p.185) and ethanol (p.181)."],
    fvmq: ["good", "Parker ORD-5700: rating 1 in both gasoline (p.185) and ethanol (p.181)."],
    nbr: ["avoid", "Parker ORD-5700: ethanol (p.181) rating 3 (doubtful). Ethanol shortens NBR life."],
    hnbr: ["avoid", "Parker ORD-5700: ethanol (p.181) rating 3 (doubtful)."],
    fkm: ["avoid", "Parker ORD-5700: ethanol (p.181) rating 3 (doubtful). Use an ethanol-rated FKM (GFLT/type)."],
    epdm: ["avoid", "Parker ORD-5700: gasoline (p.185) rating 4. Swells in the hydrocarbon fraction."],
    cr: ["avoid", "Parker ORD-5700: gasoline (p.185) rating 4 (unsatisfactory)."],
    vmq: ["avoid", "Parker ORD-5700: gasoline (p.185) rating 4 (unsatisfactory)."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("dot_brake", "DOT 3/4 brake fluid", ["glycol brake fluid", "dot3", "dot4"], {
    epdm: ["good", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 1 (satisfactory)."],
    cr: ["fair", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 2 (fair; usually OK static)."],
    nbr: ["avoid", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 3 (doubtful). Not for glycol brake fluid."],
    hnbr: ["avoid", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 3 (doubtful)."],
    vmq: ["avoid", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 3 (doubtful; static only)."],
    fkm: ["avoid", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 4 (unsatisfactory). Attacked by glycol brake fluid."],
    fvmq: ["avoid", "Parker ORD-5700 p.169 (DOT 3 glycol): rating 4 (unsatisfactory)."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("silicone_oil", "Silicone oil", ["silicone fluid", "pdms"], {
    nbr: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    hnbr: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    epdm: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    fkm: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    ffkm: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    cr: ["good", "Parker ORD-5700 p.206 (silicone oils): rating 1 (satisfactory)."],
    vmq: ["avoid", "Parker ORD-5700 p.206 (silicone oils): rating 3 (doubtful). Silicone seal swells in silicone fluid."],
    fvmq: ["avoid", "Parker ORD-5700 p.206 (silicone oils): rating 3 (doubtful)."],
    ptfe: ["good", "Inert (special-case gland; not in Parker elastomer table)."],
  }),
  compat("air", "Air", ["compressed air", "pneumatic"], {
    nbr: ["good", "Common pneumatic material; mind compressor oil carryover."],
    epdm: ["good", "Good for dry/oil-free air."],
    fkm: ["good", "Good, including hot air."],
    hnbr: ["good", "Good general air service."],
    cr: ["good", "Good general air service."],
    vmq: ["fair", "Static air OK; poor for dynamic pneumatics."],
    fvmq: ["fair", "Static air OK."],
    ffkm: ["good", "Compatible (usually overkill)."],
    ptfe: ["good", "Inert (special-case gland)."],
  }),
  compat("vacuum", "Vacuum", ["high vacuum", "uhv"], {
    fkm: ["good", "Low outgassing; common vacuum elastomer."],
    ffkm: ["good", "Low outgassing for demanding vacuum/semicon."],
    ptfe: ["good", "Low outgassing (special-case gland)."],
    nbr: ["fair", "Usable for rough vacuum; verify outgassing."],
    epdm: ["fair", "Usable for rough vacuum; verify outgassing."],
    hnbr: ["fair", "Usable for rough vacuum."],
    cr: ["fair", "Usable for rough vacuum."],
    fvmq: ["fair", "Verify outgassing."],
    vmq: ["fair", "Higher permeability/outgassing; verify and consider grease."],
  }),
  compat("refrigerant", "Refrigerant", ["hfc", "hfo", "ammonia", "co2", "freon"], {
    cr: ["fair", "Traditional refrigerant elastomer; depends on refrigerant type."],
    hnbr: ["fair", "Common in modern A/C (e.g. R-134a) systems; verify the refrigerant/oil."],
    // FKM, EPDM, and others left as unknown: refrigerant compatibility is highly
    // type-specific (HFC vs HFO vs ammonia vs CO2) and needs source-backed data.
  }),
  compat("dilute_acid", "Dilute acid", ["weak acid", "diluted acid"], {
    ffkm: ["good", "Broad acid resistance; verify acid/temperature."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["fair", "Good for many dilute inorganic acids; verify."],
    fkm: ["fair", "Good for many acids; weak vs some (e.g. hot/oxidizing); verify."],
    vmq: ["fair", "Limited; depends on acid."],
    cr: ["fair", "Limited; depends on acid."],
    hnbr: ["fair", "Limited; depends on acid."],
    fvmq: ["fair", "Limited; depends on acid."],
    nbr: ["avoid", "Poor acid resistance."],
  }),
  compat("strong_acid", "Strong acid", ["concentrated acid", "oxidizing acid"], {
    ffkm: ["good", "Often the right family for aggressive acids; verify grade/temperature."],
    ptfe: ["good", "Inert (special-case gland)."],
    fkm: ["fair", "Good for many acids; weak vs hot/oxidizing acids; verify."],
    epdm: ["fair", "Good for some inorganic acids; verify acid and temperature."],
    nbr: ["avoid", "Attacked by strong acids."],
    hnbr: ["avoid", "Attacked by strong acids."],
    cr: ["avoid", "Attacked by strong oxidizing acids."],
    vmq: ["avoid", "Poor in strong acids."],
    fvmq: ["avoid", "Poor in strong acids."],
  }),
  compat("dilute_base", "Dilute base", ["weak alkali", "dilute caustic"], {
    epdm: ["good", "Good in many alkaline solutions."],
    ffkm: ["good", "Broad resistance; verify grade."],
    ptfe: ["good", "Inert (special-case gland)."],
    cr: ["good", "Good general base resistance."],
    nbr: ["fair", "Tolerates dilute bases; verify."],
    hnbr: ["fair", "Tolerates dilute bases; verify."],
    fkm: ["fair", "Standard FKM is weaker vs bases/amines; verify."],
    vmq: ["fair", "Limited; depends on concentration."],
    fvmq: ["fair", "Limited; depends on concentration."],
  }),
  compat("strong_base", "Strong base", ["caustic", "concentrated alkali", "amine"], {
    epdm: ["good", "Strong base resistance."],
    ffkm: ["good", "Use a base/amine-rated grade; verify."],
    ptfe: ["good", "Inert (special-case gland)."],
    nbr: ["fair", "Limited; verify concentration/temperature."],
    hnbr: ["fair", "Limited; verify concentration/temperature."],
    cr: ["fair", "Limited; verify."],
    fkm: ["avoid", "Standard FKM is attacked by strong bases/amines."],
    vmq: ["avoid", "Poor in strong bases."],
    fvmq: ["avoid", "Poor in strong bases."],
  }),
  compat("solvent", "Solvent", ["organic solvent", "ketone", "ester", "chlorinated"], {
    ffkm: ["good", "Broadest solvent resistance; verify the exact solvent."],
    ptfe: ["good", "Inert to most solvents (special-case gland)."],
    // Everything else left as unknown on purpose: "solvent" spans ketones,
    // esters, aromatics, chlorinated, alcohols, etc. with opposite results.
    // Identify the exact solvent and add a source-backed row.
  }),
  compat("unknown", "Unknown / other", ["other", "unspecified"], {
    // No data on purpose. The scorer reports "unknown" and the red-flag panel
    // tells the user not to infer compatibility.
  }),
];

export const FLUID_BY_ID: Record<string, FluidCompatibility> = Object.fromEntries(
  FLUIDS.map((f) => [f.fluidId, f]),
);
