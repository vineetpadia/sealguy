// Material family data for SealGuy.
//
// Temperature ranges (tempMinC/tempMaxC) are the common-service ranges from the
// Parker O-Ring Handbook ORD-5700 (page 162 summary table; PTFE from the back-up
// ring guidance, page 152). Those quantitative values are "source-backed".
//
// The qualitative ratings (dynamicSuitability, abrasionResistance,
// ozoneResistance, vacuumSuitability) and the strengths/weaknesses/notes prose
// remain CONSERVATIVE, GENERAL family-level guidance. They are a starting point,
// not a substitute for a compound-specific datasheet or testing. Specific
// compounds within a family vary widely.

export type Rating = "good" | "fair" | "avoid" | "unknown";

export type SourceStatus = "seeded-general" | "source-backed" | "needs-source";

export interface MaterialFamily {
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
  sourceStatus: SourceStatus;
}

export const MATERIALS: MaterialFamily[] = [
  {
    id: "nbr",
    name: "NBR / Buna-N",
    aliases: ["nitrile", "buna", "buna-n", "nbr"],
    tempMinC: -34,
    tempMaxC: 121,
    costTier: 1,
    dynamicSuitability: "good",
    abrasionResistance: "good",
    ozoneResistance: "avoid",
    vacuumSuitability: "fair",
    strengths: [
      "Petroleum oils and many hydraulic oils",
      "General-purpose, widely available, low cost",
      "Good abrasion and dynamic wear resistance",
    ],
    weaknesses: [
      "Ozone, sunlight, and weather exposure",
      "Strong acids and ketones",
      "DOT 3/4 (glycol) brake fluid",
    ],
    notes: [
      "Default low-cost choice for petroleum oil/fuel service indoors.",
      "Low-temperature and high-temperature grades exist; verify the specific compound.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "epdm",
    name: "EPDM",
    aliases: ["epdm", "ethylene propylene", "epr"],
    tempMinC: -57,
    tempMaxC: 121,
    costTier: 1,
    dynamicSuitability: "fair",
    abrasionResistance: "fair",
    ozoneResistance: "good",
    vacuumSuitability: "fair",
    strengths: [
      "Water, hot water, and steam",
      "Glycol-based (DOT 3/4) brake fluids",
      "Ozone, weather, and many polar fluids",
    ],
    weaknesses: [
      "Petroleum oils, fuels, and greases (swells badly)",
      "Mineral-oil-based hydraulic fluids",
    ],
    notes: [
      "Excellent for water/steam/weather but must be kept away from petroleum oils.",
      "Peroxide-cured grades give better heat/steam performance.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "fkm",
    name: "FKM / fluoroelastomer",
    aliases: ["fkm", "viton", "fluoroelastomer", "fpm"],
    tempMinC: -26,
    tempMaxC: 205,
    costTier: 3,
    dynamicSuitability: "good",
    abrasionResistance: "good",
    ozoneResistance: "good",
    vacuumSuitability: "good",
    strengths: [
      "High temperature",
      "Oils, fuels, and many chemicals",
      "Ozone, weather, and vacuum service",
    ],
    weaknesses: [
      "Low temperature (standard grades stiffen)",
      "Hot water/steam, amines, and some brake fluids",
      "Ketones and esters",
    ],
    notes: [
      "Broad chemical and heat workhorse above NBR's range.",
      "Low-temperature and specialty fuel grades exist; verify the type (A/B/F/GLT).",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "hnbr",
    name: "HNBR",
    aliases: ["hnbr", "hydrogenated nitrile", "hsn"],
    tempMinC: -32,
    tempMaxC: 149,
    costTier: 3,
    dynamicSuitability: "good",
    abrasionResistance: "good",
    ozoneResistance: "good",
    vacuumSuitability: "fair",
    strengths: [
      "Oils and fuels, like NBR but tougher",
      "Better heat, ozone, and mechanical strength than NBR",
      "Good abrasion and dynamic performance",
    ],
    weaknesses: [
      "Strong acids",
      "Ketones, esters, and some polar solvents",
    ],
    notes: [
      "Step up from NBR for hotter or more demanding oil/fuel service.",
      "Common in A/C and automotive applications.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "vmq",
    name: "Silicone / VMQ",
    aliases: ["silicone", "vmq", "mvq", "si"],
    tempMinC: -115,
    tempMaxC: 232,
    costTier: 2,
    dynamicSuitability: "avoid",
    abrasionResistance: "avoid",
    ozoneResistance: "good",
    vacuumSuitability: "avoid",
    strengths: [
      "Very wide temperature range",
      "Excellent low-temperature flexibility",
      "Static seals, weather, and ozone",
    ],
    weaknesses: [
      "Poor tear, abrasion, and dynamic wear resistance",
      "Most fuels and many oils",
      "Permeability and outgassing in vacuum",
    ],
    notes: [
      "Best for static, low-stress seals across a wide temperature band.",
      "Not for dynamic/abrasive service or fuel exposure.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "fvmq",
    name: "Fluorosilicone / FVMQ",
    aliases: ["fluorosilicone", "fvmq", "fsi"],
    tempMinC: -73,
    tempMaxC: 177,
    costTier: 4,
    dynamicSuitability: "avoid",
    abrasionResistance: "avoid",
    ozoneResistance: "good",
    vacuumSuitability: "fair",
    strengths: [
      "Low-temperature flexibility with fuel/oil resistance",
      "Good for cold fuel-system static seals",
      "Ozone and weather",
    ],
    weaknesses: [
      "Poor tear, abrasion, and dynamic wear (like silicone)",
      "Limited mechanical strength",
    ],
    notes: [
      "Niche choice when both low temperature and fuel resistance are required.",
      "Typically static service only.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "ffkm",
    name: "FFKM",
    aliases: ["ffkm", "perfluoroelastomer", "kalrez", "chemraz"],
    tempMinC: -26,
    tempMaxC: 320,
    costTier: 5,
    dynamicSuitability: "fair",
    abrasionResistance: "fair",
    ozoneResistance: "good",
    vacuumSuitability: "good",
    strengths: [
      "Extreme chemical resistance (near-universal)",
      "Very high temperature",
      "Aggressive chemicals, vacuum, and semiconductor service",
    ],
    weaknesses: [
      "Very high cost",
      "Limited low-temperature performance (standard grades)",
    ],
    notes: [
      "Use only when justified by chemistry/temperature that defeats cheaper families.",
      "Grade selection is application-specific; always verify with the supplier.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "cr",
    name: "Neoprene / CR",
    aliases: ["neoprene", "cr", "chloroprene"],
    tempMinC: -51,
    tempMaxC: 107,
    costTier: 2,
    dynamicSuitability: "fair",
    abrasionResistance: "good",
    ozoneResistance: "good",
    vacuumSuitability: "fair",
    strengths: [
      "Refrigerants (many types) and ammonia-free systems",
      "Weather, ozone, and moderate oil resistance",
      "Good general-purpose toughness",
    ],
    weaknesses: [
      "Aromatic and chlorinated hydrocarbons",
      "Ketones and esters",
      "Strong oxidizing acids",
    ],
    notes: [
      "Traditional choice for refrigeration and weather-exposed seals.",
      "Refrigerant compatibility depends strongly on the specific refrigerant.",
    ],
    sourceStatus: "source-backed",
  },
  {
    id: "ptfe",
    name: "PTFE (special case)",
    aliases: ["ptfe", "teflon", "tfe"],
    tempMinC: -73,
    tempMaxC: 204,
    costTier: 3,
    dynamicSuitability: "fair",
    abrasionResistance: "fair",
    ozoneResistance: "good",
    vacuumSuitability: "good",
    strengths: [
      "Very broad chemical resistance",
      "Low friction",
      "Wide temperature range",
    ],
    weaknesses: [
      "Not a rubber-like elastomer: little elastic recovery",
      "Poor sealing force; cold flow / creep",
      "May require a special gland or an energized design",
    ],
    notes: [
      "Listed as a special case: standard O-ring gland rules do not apply.",
      "Often used as a spring-energized seal or with an elastomer energizer.",
    ],
    sourceStatus: "source-backed",
  },
];

export const MATERIAL_BY_ID: Record<string, MaterialFamily> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
);

export const COST_LABELS: Record<MaterialFamily["costTier"], string> = {
  1: "1 (low)",
  2: "2 (low-med)",
  3: "3 (medium)",
  4: "4 (high)",
  5: "5 (very high)",
};
