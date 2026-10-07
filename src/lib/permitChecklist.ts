export type PermitChecklistStatus = "PASS" | "FAIL" | "N/A";

export interface PermitChecklistItem {
  id: string;
  category: string;
  label: string;
  status: PermitChecklistStatus;
  notes: string;
}

const CHECKLIST_LABELS: Array<{ category: string; label: string }> = [
  {
    category: "Rebar",
    label:
      "Reinforcement bar sizes, diameters & grades match structural drawings",
  },
  {
    category: "Rebar",
    label:
      "Bar spacing, layout & number of bars verified against structural drawings",
  },
  {
    category: "Rebar",
    label:
      "Lap lengths, anchorage lengths & hook details comply with structural notes",
  },
  {
    category: "Rebar",
    label:
      "Tie wire binding is secure; bar intersections properly tied and trimmed",
  },
  {
    category: "Rebar",
    label:
      "Bottom and side concrete cover blocks / spacers securely installed to specified thickness",
  },
  {
    category: "Rebar",
    label:
      "Reinforcement free from heavy rust, oil, grease, paint, mud or bond-impacting contaminants",
  },
  {
    category: "Formwork",
    label:
      "Shuttering alignment, straightness & dimensions verified against layout drawings",
  },
  {
    category: "Formwork",
    label:
      "Formwork rigidity, bracing, tie-rods & structural props are adequate to prevent bulging or failure",
  },
  {
    category: "Formwork",
    label:
      "Verticality (plumb) and horizontal levels of formwork checked and verified",
  },
  {
    category: "Formwork",
    label: "Formwork joints sealed tightly to prevent cement slurry leakage",
  },
  {
    category: "Formwork",
    label:
      "Formwork interior thoroughly cleaned of debris, wire cuttings & sawdust",
  },
  {
    category: "Formwork",
    label:
      "Approved formwork release agent applied evenly (avoiding contact with reinforcement)",
  },
  {
    category: "MEPF",
    label:
      "Electrical conduits, junction boxes & sleeves securely anchored to prevent displacement during pour",
  },
  {
    category: "MEPF",
    label:
      "Plumbing pipes, floor drains, blockouts & voids correctly positioned and secured",
  },
  {
    category: "MEPF",
    label:
      "Waterstops, swellable bars or hydrophilic strips properly installed at construction joints",
  },
  {
    category: "MEPF",
    label:
      "Cast-in plates, anchor bolts, dowels & structural inserts accurately located and checked",
  },
  {
    category: "Survey",
    label:
      "Axis gridlines and reference levels transferred and verified on formwork deck",
  },
  {
    category: "Survey",
    label: "Camber applied where specified for long-span beams or slabs",
  },
  {
    category: "Preparation",
    label:
      "Previous construction joint surface roughened (scabbled), cleaned & laitance removed",
  },
  {
    category: "Preparation",
    label:
      "Cold joints pre-wetted (saturated surface dry - SSD) prior to new concrete placement",
  },
  {
    category: "Logistics",
    label:
      "Concrete pump, delivery lines & pipeline routing inspected and secured",
  },
  {
    category: "Logistics",
    label:
      "Sufficient operable internal poker vibrators (plus reliable backups) confirmed on site",
  },
  {
    category: "Logistics",
    label:
      "Adequate site lighting and emergency power plant confirmed for continuous operations",
  },
  {
    category: "Logistics",
    label:
      "Weather forecast checked; temporary rain protection covers and polythene sheets on standby",
  },
  {
    category: "Testing",
    label:
      "Cube test specimen molds, tamping rods & slump test cone cleaned and prepared on site",
  },
  {
    category: "Testing",
    label:
      "Slump test and temperature measurement procedure briefed to testing technician",
  },
  {
    category: "Safety",
    label:
      "Working platforms, guardrails, access ladders & safety harnesses secured for site crew",
  },
  {
    category: "Curing",
    label:
      "Post-pour curing materials (curing compound, hessian sacks, or sprinklers) available on site",
  },
];

export const createDefaultPermitChecklist = (): PermitChecklistItem[] =>
  CHECKLIST_LABELS.map((item, index) => ({
    ...item,
    id: `chk-${index}`,
    status: "FAIL",
    notes: "",
  }));
