export interface SubtradeDefinition {
  name: string;
  code: string;
  description: string;
}

export interface DefaultTradeDefinition {
  name: string;
  code: string;
  color: string;
  icon: string;
  description: string;
  subtrades: SubtradeDefinition[];
}

export const DEFAULT_TRADES: DefaultTradeDefinition[] = [
  {
    name: "Structural",
    code: "STR",
    color: "#0f766e",
    icon: "building-2",
    description: "Structural concrete, steel, foundations, and enabling works.",
    subtrades: [
      "Rebar",
      "Formwork",
      "Concrete",
      "Structural Steel",
      "Precast",
      "Post-Tensioning",
      "Earthworks",
      "Foundation Works",
      "Piling",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name} works`,
    })),
  },
  {
    name: "Architectural",
    code: "ARC",
    color: "#ea580c",
    icon: "paintbrush",
    description: "Architectural finishes, facade, masonry, and waterproofing.",
    subtrades: [
      "Blockwork",
      "Brickwork",
      "Plastering",
      "Screeding",
      "Painting",
      "Tiling",
      "Ceiling",
      "Joinery",
      "Flooring",
      "Roofing",
      "Waterproofing",
      "Cladding",
      "Facade",
      "Glazing",
      "Aluminum Works",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name} works`,
    })),
  },
  {
    name: "Mechanical",
    code: "MEC",
    color: "#2563eb",
    icon: "fan",
    description:
      "Mechanical systems, HVAC, plumbing, drainage, and firefighting.",
    subtrades: [
      "HVAC",
      "Plumbing",
      "Drainage",
      "Fire Fighting",
      "Gas Systems",
      "Chilled Water",
      "Pumps",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name} systems`,
    })),
  },
  {
    name: "Electrical",
    code: "ELE",
    color: "#ca8a04",
    icon: "zap",
    description:
      "Electrical power, lighting, ELV, controls, and earthing systems.",
    subtrades: [
      "Power",
      "Lighting",
      "ELV",
      "Structured Cabling",
      "Access Control",
      "CCTV",
      "Earthing",
      "Lightning Protection",
      "Generator Systems",
      "Solar Systems",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name} works`,
    })),
  },
  {
    name: "Infrastructure",
    code: "INF",
    color: "#16a34a",
    icon: "route",
    description:
      "Roadworks, utilities, landscaping, and external infrastructure.",
    subtrades: [
      "Roadworks",
      "Asphalt",
      "Drainage",
      "Kerbs",
      "Walkways",
      "Landscaping",
      "Utility Services",
      "External Lighting",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name} works`,
    })),
  },
  {
    name: "Specialized Works",
    code: "SPC",
    color: "#7c3aed",
    icon: "sparkles",
    description: "Specialized and high-risk technical installations.",
    subtrades: [
      "Marine Works",
      "Geotechnical Works",
      "Data Center Installations",
      "Clean Rooms",
      "Industrial Flooring",
      "Laboratory Installations",
    ].map((name, index) => ({
      name,
      code: `${index + 1}`.padStart(2, "0"),
      description: `${name}`,
    })),
  },
];
