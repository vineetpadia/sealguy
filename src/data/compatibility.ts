// Fluid <-> material-family compatibility seed data for SealGuy.
//
// CONSERVATIVE, GENERAL guidance only. Ratings are coarse family-level starting
// points, not compound-specific approvals. Any material not listed for a given
// fluid is treated as "unknown" by the scorer (it is NOT assumed compatible).
//
// Do not add exact compound numbers, approvals, or part numbers here. When you
// have a real datasheet, add the row and mark the material's sourceStatus.

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
    epdm: ["good", "Strong in water and hot water."],
    hnbr: ["good", "Good in water and many aqueous fluids."],
    nbr: ["fair", "Acceptable in cold water; watch hot water and additives."],
    fkm: ["fair", "Standard grades can be attacked by hot water/steam; verify type."],
    vmq: ["fair", "Generally tolerated in static water service."],
    fvmq: ["fair", "Tolerated; verify for the specific aqueous mix."],
    cr: ["fair", "Moderate water resistance."],
    ffkm: ["good", "Strong in water and hot water."],
    ptfe: ["good", "Chemically inert to water (special-case gland)."],
  }),
  compat("steam", "Steam", ["hot water/steam", "saturated steam"], {
    epdm: ["good", "Classic steam elastomer (peroxide-cured grades)."],
    ffkm: ["good", "Steam-resistant grades available; verify the grade."],
    vmq: ["fair", "Limited; check temperature and exposure time."],
    hnbr: ["fair", "Limited steam life; verify temperature."],
    nbr: ["avoid", "Degrades in steam/hot water."],
    fkm: ["avoid", "Standard grades attacked by steam; special grades only."],
    fvmq: ["avoid", "Not recommended for steam."],
    cr: ["avoid", "Not recommended for steam."],
    ptfe: ["good", "Inert (special-case gland)."],
  }),
  compat("mineral_oil", "Mineral oil", ["petroleum oil", "lubricating oil"], {
    nbr: ["good", "Core NBR application."],
    hnbr: ["good", "Excellent in petroleum oils."],
    fkm: ["good", "Excellent oil resistance, especially hot."],
    fvmq: ["good", "Resists oils while staying flexible cold."],
    ffkm: ["good", "Compatible (usually overkill for plain oil)."],
    cr: ["fair", "Moderate; aniline point dependent."],
    vmq: ["fair", "Static only; can swell in some oils."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["avoid", "Swells severely in petroleum oils."],
  }),
  compat("hydraulic_oil", "Hydraulic oil (petroleum)", ["hydraulic fluid", "petroleum hydraulic"], {
    nbr: ["good", "Standard for petroleum hydraulic oils."],
    hnbr: ["good", "Tougher option for hotter hydraulics."],
    fkm: ["good", "Good for high-temperature hydraulics."],
    fvmq: ["good", "Compatible; limited mechanical strength."],
    ffkm: ["good", "Compatible (usually overkill)."],
    cr: ["fair", "Moderate resistance."],
    vmq: ["fair", "Static only."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["avoid", "Not for petroleum-based hydraulic oil. EPDM suits phosphate-ester fluids instead."],
  }),
  compat("gasoline", "Gasoline", ["petrol", "fuel"], {
    fkm: ["good", "Strong fuel resistance, especially hot."],
    fvmq: ["good", "Good fuel resistance with low-temperature flexibility."],
    ffkm: ["good", "Compatible (usually overkill)."],
    hnbr: ["fair", "Acceptable; FKM preferred for aggressive/hot fuel."],
    nbr: ["fair", "OK for plain gasoline; aromatics reduce life."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["avoid", "Swells in fuel."],
    vmq: ["avoid", "Swells in fuel."],
    cr: ["avoid", "Poor in gasoline."],
  }),
  compat("diesel", "Diesel", ["diesel fuel", "gas oil"], {
    fkm: ["good", "Strong diesel resistance."],
    hnbr: ["good", "Good diesel resistance."],
    fvmq: ["good", "Good with cold flexibility."],
    ffkm: ["good", "Compatible (usually overkill)."],
    nbr: ["fair", "OK for diesel; biodiesel content reduces life."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["avoid", "Swells in fuel."],
    vmq: ["avoid", "Swells in fuel."],
    cr: ["avoid", "Poor in diesel."],
  }),
  compat("ethanol_fuel", "Ethanol blend fuel", ["e10", "e85", "gasohol", "flex fuel"], {
    ffkm: ["good", "Broadly resistant; verify grade."],
    fkm: ["fair", "Ethanol attacks some FKM types; use an ethanol-rated grade (e.g. GFLT/type F)."],
    fvmq: ["fair", "Variable with ethanol content; verify."],
    hnbr: ["fair", "Acceptable for moderate blends."],
    nbr: ["fair", "Lower blends only; ethanol shortens life."],
    ptfe: ["good", "Inert (special-case gland)."],
    epdm: ["avoid", "Swells in the hydrocarbon fraction."],
    vmq: ["avoid", "Swells in fuel."],
    cr: ["avoid", "Poor in fuel."],
  }),
  compat("dot_brake", "DOT 3/4 brake fluid", ["glycol brake fluid", "dot3", "dot4"], {
    epdm: ["good", "Standard elastomer for glycol brake fluid."],
    ffkm: ["fair", "Compatible but rarely justified here."],
    vmq: ["fair", "Tolerated in some static uses; verify."],
    ptfe: ["good", "Inert (special-case gland)."],
    nbr: ["avoid", "Not for glycol brake fluid."],
    hnbr: ["avoid", "Not for glycol brake fluid."],
    fkm: ["avoid", "Attacked by glycol brake fluid."],
    fvmq: ["avoid", "Not recommended."],
    cr: ["avoid", "Not recommended."],
  }),
  compat("silicone_oil", "Silicone oil", ["silicone fluid", "pdms"], {
    fkm: ["good", "Compatible with silicone fluids."],
    nbr: ["good", "Generally compatible."],
    hnbr: ["good", "Generally compatible."],
    ffkm: ["good", "Compatible."],
    epdm: ["fair", "Usually tolerated; verify additives."],
    cr: ["fair", "Usually tolerated."],
    ptfe: ["good", "Inert (special-case gland)."],
    vmq: ["avoid", "Silicone seal swells in silicone fluid."],
    fvmq: ["avoid", "Avoid (silicone-based) in silicone fluid."],
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
