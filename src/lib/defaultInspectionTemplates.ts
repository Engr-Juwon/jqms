import { InspectionTemplate } from '../types';

export type BuiltinTemplateDef = Omit<InspectionTemplate, 'id' | 'companyId' | 'createdAt'>;

export const BUILTIN_TEMPLATES: BuiltinTemplateDef[] = [
  // ═══════════════════════════════════════════════════════════
  // BEAM
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Beam',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Bar diameter as per drawing', critical: true },
      { label: 'Number of bars (top/bottom)', critical: true },
      { label: 'Concrete cover (clear) — bottom', critical: true },
      { label: 'Concrete cover (clear) — top', critical: true },
      { label: 'Stirrup spacing (mid-span)', critical: true },
      { label: 'Stirrup spacing (support zone)', critical: true },
      { label: 'Lap length at splices', critical: true },
      { label: 'Anchorage length at supports', critical: false },
      { label: 'Stirrup hook angle (135°)', critical: false },
      { label: 'Additional bars at openings', critical: false },
      { label: 'Tie wire tightness', critical: false },
      {
        label: 'Staggering of lap lengths in critical beam zones',
        critical: true,
      },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Beam',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Formwork alignment and level', critical: true },
      { label: 'Form dimensions match drawing', critical: true },
      { label: 'Props and supports adequate', critical: true },
      { label: 'Joints sealed (no leakage)', critical: false },
      { label: 'Release agent applied uniformly', critical: false },
      { label: 'Form cleanliness (no debris)', critical: false },
      { label: 'Cambering provided where required', critical: false },
      { label: 'Edge protection installed', critical: false },
      { label: 'Soffit smoothness', critical: false },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'Slab/Beam soffits checked with optical level for correct elevation',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
      {
        label: 'Required camber for long-span beams is set per design specs',
        critical: true,
      },
    ],
  },
  {
    element: 'Beam',
    stage: 'MEP Pre-Pour',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Conduits routed between top/bottom rebar meshes with 25-30mm clear concrete cover',
        critical: true,
      },
      {
        label:
          'Conduits spaced adequately (min. 1 diameter gap) to prevent concrete honeycombing',
        critical: true,
      },
      {
        label:
          'All conduits rigidly tied to rebar matrix at intervals <= 1.0m to prevent floating',
        critical: true,
      },
      {
        label:
          'Junction/switch boxes fully packed/sealed (foam/tape) against concrete ingress',
        critical: true,
      },
      {
        label:
          'Conduit bends utilize long-radius sweeps; floor-to-floor drops/risers checked clear',
        critical: true,
      },
      {
        label:
          'Sleeve dimensions and coordinates cross-checked with approved structural/MEP drawings',
        critical: true,
      },
      {
        label:
          'Beam sleeves placed strictly within the middle third depth (neutral axis) of the beam',
        critical: true,
      },
      {
        label:
          'Sleeves rigidly secured to formwork/rebar to prevent horizontal or vertical tilting',
        critical: true,
      },
      {
        label:
          'Both ends of all sleeves tightly capped or sealed to block concrete slurry',
        critical: true,
      },
      {
        label:
          'Vertical drain stacks, water lines, and vent sleeves properly located and plumb',
        critical: true,
      },
      {
        label:
          'Puddle flanges installed on sleeves passing through wet areas (toilets, balconies)',
        critical: true,
      },
      {
        label:
          'Embedded drainage lines checked with spirit level for correct gradient/fall (1:50/1:100)',
        critical: true,
      },
      {
        label:
          'Pressure/leak tests (hydrostatic or air) completed and holding successfully before pour',
        critical: true,
      },
      {
        label:
          'MEP installations verified not to have cut, bent, or displaced structural rebar or stirrups',
        critical: true,
      },
      {
        label:
          'Expansion joint crossings equipped with designated flexible loops or sleeve systems',
        critical: true,
      },
      {
        label:
          'Formwork decks cleared of all MEP debris, wire clippings, and material offcuts',
        critical: false,
      },
      {
        label:
          'Standby MEP technicians scheduled to be on-site with spare materials during the active pour',
        critical: false,
      },
    ],
  },
  {
    element: 'Beam',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Water arrangements ready', critical: false },
      { label: 'Curing materials available', critical: false },
      { label: 'Pour sequence agreed', critical: false },
      { label: 'Weather conditions acceptable', critical: false },
      { label: 'Grid lines verified', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Beam',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Beam',
    stage: 'During Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Concrete slump within tolerance', critical: true },
      { label: 'Layer thickness <= 500 mm', critical: true },
      { label: 'Adequate vibration applied', critical: true },
      { label: 'Cube samples taken correctly', critical: true },
      { label: 'No cold joints', critical: false },
      { label: 'No segregation observed', critical: false },
      { label: 'Continuous supply maintained', critical: false },
    ],
  },
  {
    element: 'Beam',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Dimensions verified post-strike', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time (within 2 hrs)', critical: false },
      { label: 'Edges and corners intact', critical: false },
    ],
  },
  {
    element: 'Beam',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
      { label: 'No premature drying signs', critical: false },
    ],
  },
  {
    element: 'Beam',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Props re-installed (back-propping)', critical: false },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // COLUMN (RECTANGULAR)
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Column (Rectangular)',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Lap length at joints', critical: true },
      { label: 'Tie spacing as per drawing', critical: true },
      { label: 'Concrete cover all sides', critical: true },
      { label: 'Verticality of cage', critical: true },
      {
        label: 'Number and position of main vertical bars against grid lines',
        critical: true,
      },
      { label: 'Link/Stirrup spacing and 135° hook anchorage', critical: true },
      {
        label:
          'Starter bars for the next floor are correct height and positioned',
        critical: true,
      },
      {
        label: 'Cleanliness: Base of members (kickers) free of dirt',
        critical: false,
      },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Verticality Check',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Plumb in X-direction (<= H/300)', critical: true },
      { label: 'Plumb in Y-direction (<= H/300)', critical: true },
      { label: 'Diagonal measurements equal', critical: true },
      { label: 'Reference lines marked', critical: false },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Form alignment and plumb', critical: true },
      { label: 'Form bracing adequate', critical: true },
      {
        label: 'Vertical elements checked with plumb-bob/laser',
        critical: true,
      },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'Slab/Beam soffits checked with optical level for correct elevation',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Wall/Column ties are fully tightened and spaced to resist lateral pressure',
        critical: true,
      },
      {
        label:
          'Access pockets provided at column bases to remove sawdust/trash',
        critical: false,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
      {
        label: 'Required camber for long-span beams is set per design specs',
        critical: true,
      },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Vibrators tested and ready', critical: false },
      { label: 'Curing materials available', critical: false },
      { label: 'Column location matches drawings', critical: true },
      { label: 'Grid lines verified', critical: true },
      { label: 'Column is plumb (vertically, Inclination)', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Pour height <= 1.5 m to avoid segregation', critical: true },
      { label: 'Vibration adequate at all layers', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'No cold joints', critical: false },
      { label: 'No segregation observed', critical: false },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Dimensions verified post-strike', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
    ],
  },
  {
    element: 'Column (Rectangular)',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // COLUMN (CIRCULAR)
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Column (Circular)',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Spiral ties spacing and diameter', critical: true },
      { label: 'Concrete cover all around', critical: true },
      { label: 'Verticality of cage', critical: true },
      { label: 'Spiral tie hook overlap', critical: false },
      {
        label: 'Number and position of main vertical bars against grid lines',
        critical: true,
      },
      { label: 'Link/Stirrup spacing and 135° hook anchorage', critical: true },
      {
        label:
          'Starter bars for the next floor are correct height and positioned',
        critical: true,
      },
      {
        label: 'Cleanliness: Base of members (kickers) free of dirt',
        critical: false,
      },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Verticality Check',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Plumb in X-direction (<= H/300)', critical: true },
      { label: 'Plumb in Y-direction (<= H/300)', critical: true },
      { label: 'Diameter verified at multiple levels', critical: true },
      { label: 'Reference lines marked', critical: false },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Circular form alignment and plumb', critical: true },
      { label: 'Form bracing adequate (radial)', critical: true },
      {
        label: 'Vertical elements checked with plumb-bob/laser',
        critical: true,
      },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'Slab/Beam soffits checked with optical level for correct elevation',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Wall/Column ties are fully tightened and spaced to resist lateral pressure',
        critical: true,
      },
      {
        label:
          'Access pockets provided at column bases to remove sawdust/trash',
        critical: false,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
      {
        label: 'Required camber for long-span beams is set per design specs',
        critical: true,
      },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Vibrators tested and ready', critical: false },
      { label: 'Column location matches drawings', critical: true },
      { label: 'Grid lines verified', critical: true },
      { label: 'Column is plumb (vertically, Inclination)', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Pour height <= 1.5 m to avoid segregation', critical: true },
      { label: 'Vibration adequate at all layers', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'No cold joints', critical: false },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Diameter verified post-strike', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
    ],
  },
  {
    element: 'Column (Circular)',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SLAB
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Slab',
    stage: 'Bottom Reinforcement',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud, and oil',
        critical: false,
      },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Bar diameter and spacing — main (Bottom)', critical: true },
      {
        label: 'Bar diameter and spacing — distribution (Bottom)',
        critical: true,
      },
      { label: 'Distribution/Temperature bars installed', critical: false },
      { label: 'Concrete cover bottom', critical: true },
      { label: 'Main bars properly positioned (Top)', critical: true },
      { label: 'Proper spacing maintained (Top)', critical: true },
      { label: 'Top bars over supports', critical: true },
      { label: 'Negative moment steel at columns', critical: true },
      { label: 'Concrete cover top', critical: true },
      {
        label:
          'Lap lengths meet design specs and are staggered (not in same section)',
        critical: true,
      },
      {
        label: 'Bottom mat spacing & chair reinforcement (for top mat)',
        critical: true,
      },
      {
        label: 'Chairs / spacers installed at required intervals',
        critical: true,
      },
      {
        label: 'Continuity/Trimming bars around openings (shaft/stair void)',
        critical: true,
      },
    ],
  },
  {
    element: 'Slab',
    stage: 'Openings & Sleeves',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'All openings located correctly', critical: true },
      { label: 'Additional reinforcement around openings', critical: true },
      { label: 'Sleeves for MEP services in place', critical: false },
      { label: 'Sleeves secured against displacement', critical: false },
    ],
  },
  {
    element: 'Slab',
    stage: 'Conduits & Services',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Electrical conduits secured', critical: false },
      { label: 'Plumbing pipes secured', critical: false },
      { label: 'Minimum cover above conduits maintained', critical: true },
      { label: 'Junction boxes installed', critical: false },
    ],
  },
  {
    element: 'Slab',
    stage: 'MEP Pre-Pour',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Conduits routed between top/bottom rebar meshes with 25-30mm clear concrete cover',
        critical: true,
      },
      {
        label:
          'Conduits spaced adequately (min. 1 diameter gap) to prevent concrete honeycombing',
        critical: true,
      },
      {
        label:
          'All conduits rigidly tied to rebar matrix at intervals <= 1.0m to prevent floating',
        critical: true,
      },
      {
        label:
          'Junction/switch boxes fully packed/sealed (foam/tape) against concrete ingress',
        critical: true,
      },
      {
        label:
          'Conduit bends utilize long-radius sweeps; floor-to-floor drops/risers checked clear',
        critical: true,
      },
      {
        label:
          'Sleeve dimensions and coordinates cross-checked with approved structural/MEP drawings',
        critical: true,
      },
      {
        label:
          'Beam sleeves placed strictly within the middle third depth (neutral axis) of the beam',
        critical: true,
      },
      {
        label:
          'Sleeves rigidly secured to formwork/rebar to prevent horizontal or vertical tilting',
        critical: true,
      },
      {
        label:
          'Both ends of all sleeves tightly capped or sealed to block concrete slurry',
        critical: true,
      },
      {
        label:
          'Vertical drain stacks, water lines, and vent sleeves properly located and plumb',
        critical: true,
      },
      {
        label:
          'Puddle flanges installed on sleeves passing through wet areas (toilets, balconies)',
        critical: true,
      },
      {
        label:
          'Embedded drainage lines checked with spirit level for correct gradient/fall (1:50/1:100)',
        critical: true,
      },
      {
        label:
          'Pressure/leak tests (hydrostatic or air) completed and holding successfully before pour',
        critical: true,
      },
      {
        label:
          'MEP installations verified not to have cut, bent, or displaced structural rebar or stirrups',
        critical: true,
      },
      {
        label:
          'Expansion joint crossings equipped with designated flexible loops or sleeve systems',
        critical: true,
      },
      {
        label:
          'Formwork decks cleared of all MEP debris, wire clippings, and material offcuts',
        critical: false,
      },
      {
        label:
          'Standby MEP technicians scheduled to be on-site with spare materials during the active pour',
        critical: false,
      },
    ],
  },
  {
    element: 'Slab',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'All embedments installed', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Pour sequence agreed', critical: false },
      { label: 'Grid lines verified', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Slab',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Slab',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slab thickness verified at multiple points', critical: true },
      { label: 'Level and finish acceptable', critical: true },
      { label: 'Slump test passed', critical: true },
      { label: 'Vibration adequate', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'Curing initiated within 2 hours', critical: false },
    ],
  },
  {
    element: 'Slab',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Level and flatness verified', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Slab',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
      { label: 'No premature drying signs', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // WALL
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Wall',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Concrete cover both faces', critical: true },
      { label: 'Lap length at joints', critical: true },
      { label: 'Tie spacing and tightness', critical: true },
      { label: 'Opening reinforcement', critical: false },
      {
        label: 'Horizontal and vertical rebar placement and spacing',
        critical: true,
      },
      {
        label: 'Proper lapping with base foundation/previous lift',
        critical: true,
      },
      {
        label: 'Wall ties/spacers installed to maintain thickness',
        critical: true,
      },
      {
        label: 'Cleanliness: Base of members (kickers) free of dirt',
        critical: false,
      },
      { label: 'Verticality of rebar cage', critical: true },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Wall',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Form alignment and plumb', critical: true },
      { label: 'Form bracing adequate', critical: true },
      { label: 'Tie rods spacing and strength', critical: true },
      {
        label: 'Vertical elements checked with plumb-bob/laser',
        critical: true,
      },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'Slab/Beam soffits checked with optical level for correct elevation',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Wall/Column ties are fully tightened and spaced to resist lateral pressure',
        critical: true,
      },
      {
        label:
          'Access pockets provided at column bases to remove sawdust/trash',
        critical: false,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
      {
        label: 'Required camber for long-span beams is set per design specs',
        critical: true,
      },
    ],
  },
  {
    element: 'Wall',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Vibrators tested and ready', critical: false },
      { label: 'Pour sequence agreed', critical: false },
      { label: 'Grid lines verified', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Wall',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Wall',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Pour height <= 1.5 m per lift', critical: true },
      { label: 'Vibration adequate at all layers', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'No cold joints between lifts', critical: false },
      { label: 'Construction joint prepared correctly', critical: false },
    ],
  },
  {
    element: 'Wall',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Plumb and alignment verified', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Wall',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
      { label: 'No premature drying signs', critical: false },
    ],
  },
  {
    element: 'Wall',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },
  {
    element: 'Wall',
    stage: 'Block-work Inspection',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Block type and grade approved', critical: true },
      { label: 'Mortar mix and joint thickness', critical: true },
      { label: 'Verticality and alignment', critical: true },
      { label: 'Bond pattern correct', critical: false },
      { label: 'Lintels and sills installed', critical: false },
      { label: 'Damp proof course (DPC) installed', critical: false },
    ],
  },
  {
    element: 'Wall',
    stage: 'Plastering Inspection',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface preparation done', critical: false },
      { label: 'Plaster thickness uniform', critical: true },
      { label: 'Surface finish smooth', critical: true },
      { label: 'No hollow spots (tap test)', critical: false },
      { label: 'Curing done correctly', critical: false },
      { label: 'Level and plumb verified', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // STAIR
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Stair',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Main bars diameter and spacing', critical: true },
      { label: 'Distribution bars spacing', critical: true },
      { label: 'Concrete cover all faces', critical: true },
      { label: 'Lap length at joints', critical: true },
      { label: 'Waist slab reinforcement', critical: true },
      { label: 'Landing reinforcement', critical: true },
      {
        label: 'Main bottom waist reinforcement correctly anchored to landing',
        critical: true,
      },
      {
        label: 'Top landing bars and nosing bars correctly positioned',
        critical: true,
      },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Stair',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Stair profile and dimensions match drawing', critical: true },
      { label: 'Riser and tread levels correct', critical: true },
      { label: 'Landing levels correct', critical: true },
      { label: 'Form bracing adequate', critical: true },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'Slab/Beam soffits checked with optical level for correct elevation',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
    ],
  },
  {
    element: 'Stair',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Vibrators tested and ready', critical: false },
      { label: 'Grid lines verified', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete cover provided at specified thickness', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Primary and backup vibrators available and tested', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Stair',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Stair',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Pour direction correct (bottom to top)', critical: true },
      { label: 'Vibration adequate at riser faces', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'No honeycombing at riser edges', critical: false },
      { label: 'Landing and flight continuity maintained', critical: false },
    ],
  },
  {
    element: 'Stair',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Riser and tread dimensions verified', critical: true },
      { label: 'Landing levels verified', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Stair',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
      { label: 'No premature drying signs', critical: false },
    ],
  },
  {
    element: 'Stair',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Nosing edges intact', critical: false },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },
  {
    element: 'Stair',
    stage: 'Finish & Tread Inspection',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Tread finish matches approved sample', critical: false },
      { label: 'Riser finish uniform', critical: false },
      { label: 'Nosing profile correct', critical: false },
      { label: 'Anti-slip treatment applied', critical: false },
      { label: 'Level and flatness OK', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // MEP
  // ═══════════════════════════════════════════════════════════
  {
    element: 'MEP',
    stage: 'Conduit First Fix',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Conduit routing as per drawing', critical: true },
      { label: 'Conduit size correct', critical: true },
      { label: 'Junction boxes installed', critical: false },
      { label: 'Adequate cover from rebar', critical: true },
      { label: 'Conduit secured at regular intervals', critical: false },
    ],
  },
  {
    element: 'MEP',
    stage: 'Plumbing Rough-in',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Pipe material certified', critical: true },
      { label: 'Pipe routing as per drawing', critical: true },
      { label: 'Pipe supports spacing adequate', critical: true },
      { label: 'Slope and level correct', critical: true },
      { label: 'Insulation installed where required', critical: false },
    ],
  },
  {
    element: 'MEP',
    stage: 'Plumbing Pressure Test',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Pipe material certified', critical: true },
      { label: 'Test pressure as per spec', critical: true },
      { label: 'Pressure held for required duration', critical: true },
      { label: 'No leaks observed', critical: true },
      { label: 'Test certificate issued', critical: false },
    ],
  },
  {
    element: 'MEP',
    stage: 'HVAC Ducting',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Duct routing as per drawing', critical: true },
      { label: 'Duct size and gauge correct', critical: true },
      { label: 'Support spacing adequate', critical: true },
      { label: 'Insulation installed where required', critical: false },
      { label: 'Fire dampers installed correctly', critical: true },
    ],
  },
  {
    element: 'MEP',
    stage: 'Fire Protection',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Sprinkler head spacing as per drawing', critical: true },
      { label: 'Pipe material and gauge correct', critical: true },
      { label: 'Support spacing adequate', critical: true },
      { label: 'Pressure test passed', critical: true },
      { label: 'Flow test passed', critical: false },
    ],
  },
  {
    element: 'MEP',
    stage: 'Electrical Panel Inspection',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Panel location as per drawing', critical: true },
      { label: 'Panel rating matches load calculation', critical: true },
      { label: 'Earthing connection correct', critical: true },
      { label: 'Cable entry sealed', critical: false },
      { label: 'Labeling complete', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FINISHES
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Finishes',
    stage: 'Tile Work',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Tile pattern matches approval', critical: false },
      { label: 'Joint width uniform', critical: false },
      { label: 'Level and flatness OK', critical: true },
      { label: 'No hollow tiles (tap test)', critical: true },
      { label: 'Grouting uniform', critical: false },
      { label: 'Cutting and finishing neat', critical: false },
    ],
  },
  {
    element: 'Finishes',
    stage: 'Painting Inspection',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface preparation acceptable', critical: false },
      { label: 'Primer applied correctly', critical: false },
      { label: 'Number of coats applied', critical: true },
      { label: 'Color matches approved sample', critical: false },
      { label: 'No drips or runs', critical: false },
      { label: 'Coverage uniform', critical: false },
    ],
  },
  {
    element: 'Finishes',
    stage: 'False Ceiling',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Grid layout as per drawing', critical: true },
      { label: 'Level and flatness OK', critical: true },
      { label: 'Support spacing adequate', critical: true },
      { label: 'Access panels provided where required', critical: false },
      { label: 'Lighting and AC integration correct', critical: false },
    ],
  },
  {
    element: 'Finishes',
    stage: 'Flooring Screed',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Screed thickness uniform', critical: true },
      { label: 'Level and flatness OK', critical: true },
      { label: 'No hollow spots', critical: false },
      { label: 'Curing done correctly', critical: false },
      { label: 'Expansion joints provided', critical: false },
    ],
  },
  {
    element: 'Finishes',
    stage: 'Waterproofing',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface preparation acceptable', critical: true },
      { label: 'Membrane thickness as per spec', critical: true },
      { label: 'Lap joints sealed correctly', critical: true },
      { label: 'Upstands and terminations correct', critical: true },
      { label: 'Flood test passed', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FOUNDATION
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Foundation',
    stage: 'Excavation Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Excavation dimensions match drawing', critical: true },
      { label: 'Excavation levels correct', critical: true },
      { label: 'Side slopes stable', critical: true },
      { label: 'Dewatering adequate', critical: false },
      { label: 'Bottom compaction acceptable', critical: false },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Blinding Concrete',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Blinding thickness correct', critical: true },
      { label: 'Level and flatness OK', critical: true },
      { label: 'Concrete grade correct', critical: true },
      { label: 'Curing done correctly', critical: false },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Bar diameter and spacing as per drawing', critical: true },
      { label: 'Concrete cover correct', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Tie spacing and tightness', critical: true },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v2.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Form alignment and dimensions', critical: true },
      { label: 'Form bracing adequate', critical: true },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Wall/Column ties are fully tightened and spaced to resist lateral pressure',
        critical: true,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Vibration adequate', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'Pour continuous (no cold joints)', critical: false },
      { label: 'Top level correct', critical: true },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Dimensions verified', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Foundation',
    stage: 'Backfilling',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Backfill material approved', critical: true },
      { label: 'Compaction layer thickness <= 300 mm', critical: true },
      { label: 'Compaction test passed', critical: true },
      { label: 'No voids or soft spots', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ROOF
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Roof',
    stage: 'Structural Slab',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Rebar as per drawing', critical: true },
      { label: 'Concrete cover correct', critical: true },
      { label: 'Slump test passed', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'Slope and level correct', critical: true },
    ],
  },
  {
    element: 'Roof',
    stage: 'Waterproofing',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface preparation acceptable', critical: true },
      { label: 'Membrane thickness as per spec', critical: true },
      { label: 'Lap joints sealed correctly', critical: true },
      { label: 'Upstands and terminations correct', critical: true },
      { label: 'Flood test passed', critical: true },
    ],
  },
  {
    element: 'Roof',
    stage: 'Insulation',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Insulation material approved', critical: true },
      { label: 'Insulation thickness correct', critical: true },
      { label: 'Joints sealed or staggered', critical: false },
      { label: 'Mechanical fixing adequate', critical: false },
    ],
  },
  {
    element: 'Roof',
    stage: 'Screed & Falls',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Screed thickness uniform', critical: true },
      { label: 'Falls and slopes correct', critical: true },
      { label: 'Level and flatness OK', critical: true },
      { label: 'Curing done correctly', critical: false },
    ],
  },
  {
    element: 'Roof',
    stage: 'Roofing Tiles / Membrane',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Material matches approved sample', critical: false },
      { label: 'Fixing method correct', critical: true },
      { label: 'Lap and joint details correct', critical: true },
      { label: 'Edge and termination details correct', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // EXTERNAL WORKS
  // ═══════════════════════════════════════════════════════════
  {
    element: 'External Works',
    stage: 'Road Sub-base',
    discipline: 'Civil',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Sub-base material approved', critical: true },
      { label: 'Layer thickness correct', critical: true },
      { label: 'Compaction test passed', critical: true },
      { label: 'Level and falls correct', critical: true },
    ],
  },
  {
    element: 'External Works',
    stage: 'Asphalt / Concrete Paving',
    discipline: 'Civil',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Material grade approved', critical: true },
      { label: 'Thickness correct', critical: true },
      { label: 'Level and falls correct', critical: true },
      { label: 'Surface finish acceptable', critical: false },
      { label: 'Expansion joints provided', critical: false },
    ],
  },
  {
    element: 'External Works',
    stage: 'Drainage',
    discipline: 'Civil',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Pipe material and size correct', critical: true },
      { label: 'Slope and level correct', critical: true },
      { label: 'Manholes and chambers correct', critical: true },
      { label: 'Invert levels correct', critical: true },
      { label: 'Flow test passed', critical: false },
    ],
  },
  {
    element: 'External Works',
    stage: 'Landscaping',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Topsoil depth adequate', critical: false },
      { label: 'Irrigation system installed', critical: false },
      { label: 'Planting as per drawing', critical: false },
      { label: 'Hardscape levels correct', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PRECAST
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Precast',
    stage: 'Casting Yard Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Mould dimensions correct', critical: true },
      { label: 'Rebar and embedments positioned correctly', critical: true },
      { label: 'Concrete grade and slump correct', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'Curing method correct', critical: false },
    ],
  },
  {
    element: 'Precast',
    stage: 'Lifting & Handling',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before lift', critical: true },
      { label: 'Lifting points correct', critical: true },
      { label: 'Lifting equipment certified', critical: true },
      { label: 'No damage during handling', critical: true },
    ],
  },
  {
    element: 'Precast',
    stage: 'Installation & Grouting',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Alignment and level correct', critical: true },
      { label: 'Connection details as per drawing', critical: true },
      { label: 'Grout material and strength correct', critical: true },
      { label: 'Grout compaction adequate', critical: true },
      { label: 'Tolerance within spec', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SHAFT / LIFT SHAFT
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Shaft',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Strict alignment of main vertical bars for shaft plumbness',
        critical: true,
      },
      {
        label: 'Horizontal links/reinforcement spaced per design',
        critical: true,
      },
      {
        label: 'Special trimming bars around the lift-door opening',
        critical: true,
      },
      {
        label:
          'Box-outs or anchor plates for lift guide rails installed per manufacturer drawings',
        critical: true,
      },
      {
        label: 'Material (Diameter & Grade) matches structural schedule',
        critical: true,
      },
      {
        label: 'Surface conditions: Bars are clean of loose rust, mud and oil',
        critical: false,
      },
      {
        label: 'Concrete cover installed at required intervals',
        critical: true,
      },
      {
        label:
          'Lap lengths meet design specs and are staggered (not in same section)',
        critical: true,
      },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Formwork Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Vertical elements checked with plumb-bob/laser',
        critical: true,
      },
      {
        label: 'Internal width, depth and length match structural drawings',
        critical: true,
      },
      {
        label:
          'Prop/shoring spacing sufficient to prevent buckling during pour',
        critical: true,
      },
      {
        label:
          'All joints sealed (taped or foam) to prevent grout leakage (honeycombing)',
        critical: true,
      },
      {
        label:
          'Formwork face is clean, smooth and free of old concrete or debris',
        critical: false,
      },
      {
        label: 'Form oil/mold oil applied evenly (not staining the rebar)',
        critical: false,
      },
      {
        label:
          'Kickers are rigid and stop-ends (for construction joints) are stable',
        critical: true,
      },
      {
        label:
          'Wall/Column ties are fully tightened and spaced to resist lateral pressure',
        critical: true,
      },
      {
        label:
          'Access pockets provided at column bases to remove sawdust/trash',
        critical: false,
      },
      {
        label:
          'Props are resting on solid ground or sole plates (no sinking into mud)',
        critical: true,
      },
      {
        label: 'Required camber for long-span beams is set per design specs',
        critical: true,
      },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      { label: 'Concrete mix design approved', critical: true },
      { label: 'Embedments installed correctly', critical: true },
      { label: 'Inspection sign-off from consultant', critical: true },
      { label: 'Vibrators tested and ready', critical: false },
      { label: 'Column location matches drawings', critical: true },
      { label: 'Grid lines verified', critical: true },
      { label: 'Column is plumb (vertically, Inclination)', critical: true },
      { label: 'Offsets and dimensions confirmed', critical: true },
      { label: 'Correct bar diameter and numbers', critical: true },
      { label: 'Main bars properly positioned', critical: true },
      { label: 'Bars clean (no oil/rust)', critical: false },
      { label: 'Proper spacing maintained', critical: true },
      { label: 'Lap length adequate', critical: true },
      { label: 'Starter bars aligned', critical: true },
      { label: 'Stirrups spacing correct', critical: true },
      { label: 'Hooks and bends properly bent', critical: true },
      { label: 'Rebars properly tied', critical: true },
      { label: 'Concrete Cover provided', critical: true },
      { label: 'Cover thickness maintained', critical: true },
      { label: 'Reinforcement is not touching formwork', critical: true },
      { label: 'Correct dimension', critical: true },
      { label: 'Formwork aligned and vertical', critical: true },
      { label: 'Joints are sealed properly', critical: true },
      { label: 'Adequately braced', critical: true },
      { label: 'Clean and oiled', critical: false },
      { label: 'Conduits positioned correctly', critical: true },
      { label: 'Sleeves/Openings provided', critical: true },
      { label: 'Earthing cables fixed', critical: true },
      { label: 'Kicker aligned', critical: true },
      { label: 'Joint cleaned', critical: true },
      { label: 'No standing water', critical: true },
      { label: 'Access for pouring available', critical: true },
      { label: 'Vibrator available', critical: true },
      { label: 'Backup vibrator ready', critical: true },
      { label: 'Lighting adequate', critical: false },
      { label: 'Mix design approved', critical: true },
      { label: 'Slump test ready', critical: true },
      { label: 'Cube moulds ready', critical: true },
      { label: 'PPE used', critical: true },
      { label: 'Scaffold secure', critical: true },
      { label: 'No loose materials', critical: true },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Pour Authorization',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Formwork Inspection completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'Reinforcement (Rebar) Check completed (Reference checklist attached)',
        critical: true,
      },
      {
        label:
          'MEP/Electrical Embedments checked (Reference checklist attached)',
        critical: true,
      },
      {
        label: 'Cleanliness verified - no debris/water in formwork',
        critical: true,
      },
      {
        label: 'Batching method verified (On-site mixer or Ready-Mix Truck)',
        critical: true,
      },
      { label: 'Pour start time recorded', critical: true },
      { label: 'Slump test result within target range', critical: true },
      { label: 'Cube samples taken and recorded', critical: true },
      { label: 'Mechanical vibrator in use during placement', critical: true },
      { label: 'Concrete poured in layers < 500mm', critical: true },
      { label: 'Weather protection in place (rain/sun)', critical: false },
      { label: 'Site Engineer/C.M. declaration signed', critical: true },
      { label: 'QA/QC Engineer approval granted', critical: true },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Slump test passed', critical: true },
      { label: 'Pour height <= 1.5 m per lift', critical: true },
      { label: 'Vibration adequate at all layers', critical: true },
      { label: 'Cube samples taken', critical: true },
      { label: 'No cold joints between lifts', critical: false },
      { label: 'Construction joint prepared correctly', critical: false },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Post-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Surface finish acceptable', critical: true },
      { label: 'No honeycombing observed', critical: true },
      { label: 'Plumb and alignment verified', critical: true },
      { label: 'No visible cracks', critical: true },
      { label: 'Curing started on time', critical: false },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Curing Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Curing method as specified', critical: true },
      { label: 'Continuous moisture maintained', critical: true },
      { label: 'Curing duration logged', critical: false },
      { label: 'No premature drying signs', critical: false },
    ],
  },
  {
    element: 'Shaft',
    stage: 'Striking Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Minimum strength achieved before strike', critical: true },
      { label: 'No damage during stripping', critical: true },
      { label: 'Formwork inspected for reuse', critical: false },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // STRUCTURAL STEEL PROFILES (H-BEAMS, CHANNELS, COLUMNS)
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Materials',
    stage: 'Structural Steel & Profiles Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Dimensions, web thickness, and flange width match approved shop drawings / specs',
        critical: true,
      },
      {
        label:
          'Steel grade matches structural specification (e.g., S275, S355)',
        critical: true,
      },
      {
        label:
          'Surface condition - free of excessive rust, warping, twisting, or mechanical damage',
        critical: true,
      },
      {
        label:
          'Mill Test Certificates (MTC) provided and traceable to heat numbers stamped on members',
        critical: true,
      },
      {
        label:
          'Proper shop priming / coating applied as per corrosion protection requirements',
        critical: false,
      },
      {
        label:
          'Safe offloading and dunnage arrangements in place to prevent permanent bending',
        critical: false,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // UNIVERSAL / CATCH-ALL MATERIAL & COMPONENT INSPECTION
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Materials',
    stage: 'General Material & Component Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Item description, part number, and technical specifications match Purchase Order (PO)',
        critical: true,
      },
      {
        label:
          'Quantity delivered matches the delivery note and waybill accurately',
        critical: true,
      },
      {
        label:
          'Physical integrity - items are clean, complete, and free of cracks, defects, or transit damage',
        critical: true,
      },
      {
        label:
          'Manufacturer Certificate of Conformity (CoC), data sheets, or test reports provided',
        critical: true,
      },
      {
        label:
          'Proper packaging, part tagging, and identification markings present on boxes/units',
        critical: false,
      },
      {
        label:
          'Recommended storage and environmental requirements met (e.g., dry, shaded, secure)',
        critical: false,
      },
    ],
  },
  {
    element: 'Materials',
    stage: 'Cement & Binders Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Brand & Grade matches project spec (e.g., 42.5R or 32.5N)',
        critical: true,
      },
      {
        label: 'Manufacturing date freshness check (less than 3 months old)',
        critical: true,
      },
      {
        label: 'Bags are dry, intact, and free of lumps (hydration check)',
        critical: true,
      },
      {
        label:
          'Storage area ready - elevated on pallets, well-ventilated, and moisture-proof',
        critical: true,
      },
      {
        label:
          'Manufacturer Mill Test Certificate (MTC) provided and verified against batch numbers',
        critical: true,
      },
      {
        label: 'Quantity matches delivery waybill and purchase order',
        critical: false,
      },
    ],
  },
  {
    element: 'Materials',
    stage: 'Reinforcement Steel Arrival',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Physical diameter measurement matches order (e.g., 12mm, 16mm, 20mm)',
        critical: true,
      },
      {
        label: 'Steel grade matches structural drawings (e.g., Grade 500B)',
        critical: true,
      },
      {
        label: 'No heavy pitting or excessive flaking rust present',
        critical: true,
      },
      {
        label: 'Correct manufacturer rolling marks / tags visible on the bars',
        critical: true,
      },
      {
        label: 'Bundles are properly tagged with heat/batch numbers',
        critical: true,
      },
      {
        label: 'Mill Test Certificate (MTC) matches heat numbers on site',
        critical: true,
      },
      {
        label:
          'Bars stored off the ground on timber sleepers to prevent soil contamination',
        critical: false,
      },
    ],
  },
  {
    element: 'Materials',
    stage: 'Aggregates & Sand Site Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Coarse aggregate size matches spec (e.g., 20mm / 3/4 inch) and is well-graded',
        critical: true,
      },
      {
        label:
          'Aggregates are clean, hard, durable, and free of excessive flaky pieces',
        critical: true,
      },
      {
        label:
          'Fine aggregate (sand) is clean, sharp, and free of clay, shells, or organic matter',
        critical: true,
      },
      {
        label:
          'Silt content acceptable (field bottle test / palm test - no thick stain)',
        critical: true,
      },
      {
        label:
          'No debris (wood, plastic, or construction waste) mixed into the truck load',
        critical: true,
      },
      {
        label:
          'Stockpile designated area is clean and paved/hard-stand to avoid contamination',
        critical: false,
      },
    ],
  },
  {
    element: 'Materials',
    stage: 'Masonry & Concrete Blocks Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Block dimensions and thickness match project specs (e.g., 9-inch or 6-inch)',
        critical: true,
      },
      {
        label:
          'Compressive strength compliance certificate provided by manufacturer',
        critical: true,
      },
      {
        label:
          'Visual check - blocks are well-cured, uniform, and free of deep cracks or breakage',
        critical: true,
      },
      {
        label: 'Edges and corners are sharp and structurally sound',
        critical: false,
      },
      {
        label:
          'Stacked securely on pallets with proper strapping to minimize transit damage',
        critical: false,
      },
      {
        label: 'Quantity matches delivery note and is verified upon offloading',
        critical: false,
      },
    ],
  },
  {
    element: 'Materials',
    stage: 'Waterproofing & Admixtures Inspection',
    discipline: 'Materials',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Product brand and type match approved technical submittal',
        critical: true,
      },
      {
        label:
          'Packaging is sealed, undamaged, and clearly displays batch numbers',
        critical: true,
      },
      {
        label:
          'Shelf life / expiry date verified (product is fresh and unexpired)',
        critical: true,
      },
      {
        label:
          'Technical Data Sheet (TDS) and Material Safety Data Sheet (MSDS) available',
        critical: true,
      },
      {
        label:
          'Storage conditions met (e.g., temperature-controlled or protected from direct sunlight)',
        critical: false,
      },
      {
        label:
          'Manufacturer application guidelines and instructions provided to site crew',
        critical: false,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // DEEP FOUNDATIONS & SUBSTRUCTURE
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Pile',
    stage: 'Bored Pile Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Pile location and coordinates match pile layout plan',
        critical: true,
      },
      { label: 'Pile diameter and depth as per design', critical: true },
      {
        label: 'Borehole stability maintained during excavation (no collapse)',
        critical: true,
      },
      {
        label: 'Groundwater level recorded before and during concreting',
        critical: true,
      },
      {
        label: 'Bottom of bore cleaned of loose soil / slurry (sediment check)',
        critical: true,
      },
      {
        label: 'Reinforcement cage diameter, length, and spacing verified',
        critical: true,
      },
      {
        label: 'Cage centralizers / spacers installed at required intervals',
        critical: true,
      },
      {
        label: 'Concrete tremie pipe installed to bottom before pour starts',
        critical: true,
      },
      {
        label: 'Slump test passed for tremie concrete (typically 150-200mm)',
        critical: true,
      },
      {
        label: 'Concrete poured continuously without interruption',
        critical: true,
      },
      {
        label:
          'Tremie pipe maintained minimum 1.5m embedment in fresh concrete',
        critical: true,
      },
      {
        label: 'Overpour height (cut-off level) meets specification',
        critical: true,
      },
      { label: 'Cube samples taken from tremie concrete', critical: true },
      {
        label: 'Pile Integrity Test (PIT) / Low Strain Dynamic Test completed',
        critical: true,
      },
      {
        label: 'Pile Load Test (static or dynamic) completed and passed',
        critical: true,
      },
      {
        label:
          'As-built pile record (depth, concrete volume, anomalies) documented',
        critical: true,
      },
    ],
  },
  {
    element: 'Pile Cap',
    stage: 'Rebar & Formwork Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Pile heads cut to correct level and cleaned', critical: true },
      {
        label: 'Pile reinforcement exposed and lapped into cap correctly',
        critical: true,
      },
      {
        label:
          'Main bottom reinforcement diameter, spacing, and orientation verified',
        critical: true,
      },
      {
        label: 'Top reinforcement (where required) positioned and supported',
        critical: true,
      },
      { label: 'Concrete cover blocks installed on all faces', critical: true },
      {
        label: 'Formwork dimensions, alignment, and bracing adequate',
        critical: true,
      },
      { label: 'Joints sealed to prevent grout loss', critical: true },
      {
        label: 'Dewatering active and no standing water in excavation',
        critical: true,
      },
      {
        label: 'Waterproofing membrane protection at cap edges (if applicable)',
        critical: false,
      },
    ],
  },
  {
    element: 'Basement',
    stage: 'Retaining Wall Rebar',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Vertical and horizontal bar diameter, spacing, and grade match drawing',
        critical: true,
      },
      { label: 'Lap lengths meet design and are staggered', critical: true },
      {
        label:
          'Waterstops (PVC or bentonite) positioned at construction joints',
        critical: true,
      },
      {
        label: 'Waterstop splices welded / joined correctly with no gaps',
        critical: true,
      },
      {
        label: 'Concrete cover both faces maintained with spacers',
        critical: true,
      },
      {
        label: 'Tie rods / form ties include water-sealing washers',
        critical: true,
      },
      { label: 'Kick-off / kicker concrete sound and cleaned', critical: true },
      { label: 'No displaced waterstop during rebar fixing', critical: true },
      {
        label: 'Dewatering maintained during rebar and formwork works',
        critical: true,
      },
    ],
  },
  {
    element: 'Basement',
    stage: 'Waterproofing (Tanked)',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Substrate surface prepared (smooth, no sharp protrusions, clean)',
        critical: true,
      },
      {
        label: 'Blinding concrete level and finish acceptable',
        critical: true,
      },
      {
        label: 'Membrane type and thickness match approved submittal',
        critical: true,
      },
      {
        label:
          'Membrane laps sealed per manufacturer specification (min 100mm)',
        critical: true,
      },
      {
        label:
          'Penetrations (piles, pipes) detailed with proprietary collars / seals',
        critical: true,
      },
      {
        label: 'Protection board installed immediately after membrane',
        critical: true,
      },
      {
        label:
          'No damage to membrane during backfilling or reinforcement fixing',
        critical: true,
      },
      {
        label: 'Flood / ponding test completed and held for minimum 48 hours',
        critical: true,
      },
      {
        label: 'Leakage mapping documented and repairs signed off',
        critical: true,
      },
      {
        label: 'Waterstop at kicker level correctly bonded to membrane',
        critical: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // HIGH-RISE STRUCTURAL SYSTEMS
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Core Wall',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Vertical bars diameter, count, and grade match structural schedule',
        critical: true,
      },
      {
        label: 'Horizontal bars / links spacing and diameter verified',
        critical: true,
      },
      {
        label: 'Diagonal bars (if required for ductility) positioned correctly',
        critical: true,
      },
      {
        label: 'Lap lengths staggered and meet design requirements',
        critical: true,
      },
      {
        label: 'Concrete cover maintained on both faces with adequate spacers',
        critical: true,
      },
      {
        label: 'Couplers / mechanical splices torque-checked and marked',
        critical: true,
      },
      {
        label: 'Coupler test reports on file and traceable to batch',
        critical: true,
      },
      {
        label: 'Starter bars for next lift correctly positioned and secured',
        critical: true,
      },
      {
        label: 'Opening reinforcement (lift doors, ducts) trimmed and anchored',
        critical: true,
      },
      {
        label: 'Embedments for climbing formwork / platforms secured',
        critical: true,
      },
      {
        label: 'Rebar cage verticality checked with plumb-bob / total station',
        critical: true,
      },
      {
        label: 'Material traceability: heat numbers match MTC',
        critical: true,
      },
    ],
  },
  {
    element: 'Core Wall',
    stage: 'Climbing Formwork Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Climbing rails / brackets aligned and plumb', critical: true },
      {
        label: 'Anchor bolts / box-outs positioned and torqued to spec',
        critical: true,
      },
      {
        label:
          'Previous concrete strength achieved before climbing (cube result)',
        critical: true,
      },
      {
        label: 'Platform decks complete with guardrails and toe boards',
        critical: true,
      },
      {
        label: 'Form panels clean, aligned, and joints sealed',
        critical: true,
      },
      {
        label: 'Release agent applied without staining rebar',
        critical: false,
      },
      {
        label: 'Hydraulic / climbing system tested and operational',
        critical: true,
      },
      {
        label: 'Safety catch / locking pins engaged before release',
        critical: true,
      },
      {
        label: 'Load capacity of platform not exceeded (materials staging)',
        critical: true,
      },
      {
        label: 'Emergency descent / rescue plan reviewed with crew',
        critical: true,
      },
      {
        label: 'Formwork verticality checked before concrete pour',
        critical: true,
      },
    ],
  },
  {
    element: 'Core Wall',
    stage: 'Pre-Pour Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Approved drawing on site', critical: true },
      {
        label: 'Concrete mix design approved for high-rise pump height',
        critical: true,
      },
      {
        label: 'Pour sequence and lift height agreed (typically 3.0–4.5m)',
        critical: true,
      },
      {
        label: 'Concrete pump line capacity verified for vertical delivery',
        critical: true,
      },
      {
        label: 'Embedments installed correctly (conduits, sleeves, boxes)',
        critical: true,
      },
      { label: 'Inspection sign-off from consultant obtained', critical: true },
      {
        label: 'Vibrators tested and adequate length for wall thickness',
        critical: true,
      },
      { label: 'Cube moulds ready and labelled', critical: true },
      { label: 'No standing water at base of wall', critical: true },
      {
        label: 'Construction joint surface roughened and cleaned',
        critical: true,
      },
      { label: 'Pour card signed by Site Engineer and QA/QC', critical: true },
    ],
  },
  {
    element: 'Core Wall',
    stage: 'Concrete Pour',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Slump test passed (account for vertical transport time)',
        critical: true,
      },
      {
        label: 'Pour rate controlled to prevent formwork overpressure',
        critical: true,
      },
      {
        label: 'Internal vibration at regular intervals and depths',
        critical: true,
      },
      { label: 'No cold joints between lifts', critical: true },
      { label: 'Cube samples taken and cured on-site', critical: true },
      {
        label: 'Concrete temperature monitored (avoid thermal cracking)',
        critical: false,
      },
      {
        label: 'Top surface screeded level and prepared for next lift',
        critical: true,
      },
    ],
  },
  {
    element: 'Core Wall',
    stage: 'Post-Pour & Striking',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Minimum strength achieved before climbing / striking',
        critical: true,
      },
      {
        label: 'Surface finish acceptable (no honeycombing at form ties)',
        critical: true,
      },
      { label: 'No visible cracks or cold joints', critical: true },
      {
        label: 'Form tie holes treated / sealed per waterproofing spec',
        critical: true,
      },
      {
        label: 'Verticality and alignment verified post-strike',
        critical: true,
      },
      {
        label: 'Curing started within 2 hours (water or compound)',
        critical: true,
      },
      {
        label: 'Formwork inspected for damage before next cycle',
        critical: false,
      },
    ],
  },
  {
    element: 'Transfer Structure',
    stage: 'Rebar Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Heavy congestion zones reviewed with structural engineer',
        critical: true,
      },
      {
        label: 'Main transfer beam / truss bars positioned per shop drawings',
        critical: true,
      },
      {
        label: 'Bar sequencing and layering matches design intent',
        critical: true,
      },
      {
        label: 'Couplers / lap locations approved where congestion requires',
        critical: true,
      },
      {
        label: 'Formwork designed for heavy self-weight and construction loads',
        critical: true,
      },
      {
        label: 'Shoring / falsework load calculations reviewed and approved',
        critical: true,
      },
      { label: 'Vibration access planned for congested zones', critical: true },
      {
        label: 'Concrete cover maintained despite multiple bar layers',
        critical: true,
      },
    ],
  },
  {
    element: 'Post-Tensioning',
    stage: 'Tendon Installation',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Tendon type, size, and strand count match design',
        critical: true,
      },
      {
        label: 'Duct material and diameter as per specification',
        critical: true,
      },
      {
        label:
          'Tendon profile / elevation matches shop drawings at support and mid-span',
        critical: true,
      },
      {
        label:
          'Profile hold-downs / chairs spaced correctly to prevent floating',
        critical: true,
      },
      {
        label: 'Duct splices taped and sealed to prevent grout leakage',
        critical: true,
      },
      {
        label: 'Duct vents / grout tubes positioned at high points and anchors',
        critical: true,
      },
      {
        label: 'Anchor plates seated flush and perpendicular to tendon axis',
        critical: true,
      },
      {
        label: 'Bursting reinforcement around anchors installed correctly',
        critical: true,
      },
      {
        label: 'Tendons protected from welding sparks / site damage',
        critical: true,
      },
      {
        label: 'Tendon elongation calculation reviewed and approved',
        critical: true,
      },
    ],
  },
  {
    element: 'Post-Tensioning',
    stage: 'Stressing Operation',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Minimum concrete compressive strength achieved (cube test result)',
        critical: true,
      },
      {
        label:
          'Stressing equipment (jack, pump, gauge) calibrated and certified',
        critical: true,
      },
      {
        label: 'Calibration certificate valid and within date',
        critical: true,
      },
      {
        label: 'Stressing sequence follows approved method statement',
        critical: true,
      },
      { label: 'Initial and final jack pressures recorded', critical: true },
      {
        label: 'Actual elongation measured and compared to theoretical (±5-7%)',
        critical: true,
      },
      {
        label: 'Wedge seating / slip recorded within tolerance',
        critical: true,
      },
      {
        label: 'Safety exclusion zone maintained during stressing',
        critical: true,
      },
      {
        label: 'Stressing records signed by PT specialist and QA/QC',
        critical: true,
      },
      {
        label: 'Any broken strands documented and engineer notified',
        critical: true,
      },
    ],
  },
  {
    element: 'Post-Tensioning',
    stage: 'Grouting',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Grout mix design approved and trial batch tested',
        critical: true,
      },
      {
        label: 'Grout fluidity / flow cone test passed before pumping',
        critical: true,
      },
      {
        label: 'Duct flushed with water and drained before grouting',
        critical: true,
      },
      {
        label: 'Grouting performed from lowest inlet to highest vent',
        critical: true,
      },
      {
        label: 'Grout exits vents continuously with no air pockets',
        critical: true,
      },
      { label: 'Vents sealed progressively in sequence', critical: true },
      {
        label: 'Positive pressure maintained until grout sets',
        critical: true,
      },
      {
        label: 'Grout cube samples taken for strength verification',
        critical: true,
      },
      {
        label:
          'Grouting records (volume, pressure, time) documented per tendon',
        critical: true,
      },
      {
        label:
          'Any voids detected by later inspection are injected and repaired',
        critical: true,
      },
    ],
  },
  {
    element: 'Structural Steel',
    stage: 'Connection & Welding Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Steel sections match approved shop drawings and MTC',
        critical: true,
      },
      {
        label: 'Bolt grade, size, and quantity match connection detail',
        critical: true,
      },
      {
        label:
          'Bolt tension / torque verified with calibrated wrench (10% min sample)',
        critical: true,
      },
      {
        label: 'Weld procedure specification (WPS) approved and available',
        critical: true,
      },
      { label: 'Welder qualifications valid and traceable', critical: true },
      {
        label: 'Visual weld inspection passed (no cracks, undercut, porosity)',
        critical: true,
      },
      {
        label:
          'NDT completed as per ITP (UT/MT/RT) — 100% or sample as specified',
        critical: true,
      },
      {
        label: 'NDT reports reviewed and accepted by consultant',
        critical: true,
      },
      {
        label: 'Connection alignment and gap within tolerance',
        critical: true,
      },
      {
        label: 'Fireproofing substrate primed only where approved',
        critical: false,
      },
    ],
  },
  {
    element: 'Composite Deck',
    stage: 'Metal Decking & Shear Studs',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Decking gauge, profile, and coating match specification',
        critical: true,
      },
      {
        label: 'Decking laid continuously with correct overlap at supports',
        critical: true,
      },
      {
        label: 'Shear stud diameter, length, and spacing per drawing',
        critical: true,
      },
      {
        label: 'Shear stud welding tested (bend test) — 1 per 100 or per shift',
        critical: true,
      },
      {
        label: 'No burn-through or lack of fusion on stud welds',
        critical: true,
      },
      {
        label: 'Edge trim and closures installed to prevent concrete leakage',
        critical: true,
      },
      {
        label: 'Decking fixed to steel beams with approved screws / welds',
        critical: true,
      },
      {
        label: 'Propping / temporary supports adequate for wet concrete load',
        critical: true,
      },
      {
        label: 'Rebar mesh placed and supported on deck (if required)',
        critical: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FACADE & ENVELOPE
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Curtain Wall',
    stage: 'Subframe & Bracket Installation',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Bracket spacing, type, and embedment match structural calculation',
        critical: true,
      },
      {
        label:
          'Bracket alignment verified with laser / string line (plumb & level)',
        critical: true,
      },
      {
        label: 'Anchor bolts torqued and marked; pull-out tests completed',
        critical: true,
      },
      {
        label: 'Thermal break continuity maintained at all brackets',
        critical: true,
      },
      {
        label: 'Subframe mullions and transoms aligned and levelled',
        critical: true,
      },
      {
        label: 'Expansion / movement joints provided as per drawing',
        critical: true,
      },
      {
        label: 'Fire stopping at floor slabs installed behind curtain wall',
        critical: true,
      },
      {
        label: 'No direct metal-to-metal contact bridging thermal break',
        critical: true,
      },
    ],
  },
  {
    element: 'Curtain Wall',
    stage: 'Panel & Glazing Installation',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Glass type, thickness, and coating match approved sample',
        critical: true,
      },
      {
        label: 'Spandrel panels (if any) insulation and backing correct',
        critical: true,
      },
      {
        label: 'Gaskets and seals continuous with no gaps or twists',
        critical: true,
      },
      {
        label: 'Structural silicone / tape applied per manufacturer spec',
        critical: true,
      },
      {
        label: 'Weep holes and drainage pathways clear and functional',
        critical: true,
      },
      {
        label: 'Panel alignment and flatness within tolerance (±3mm typical)',
        critical: true,
      },
      { label: 'Protective film removed and surface cleaned', critical: false },
      { label: 'No visible damage to glass or frame finish', critical: false },
    ],
  },
  {
    element: 'Curtain Wall',
    stage: 'Water Penetration Test',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Spray rack setup per AAMA 501.1 / 501.2 or project spec',
        critical: true,
      },
      {
        label: 'Test pressure differential applied as specified',
        critical: true,
      },
      {
        label: 'No water penetration observed on interior face during test',
        critical: true,
      },
      {
        label: 'Test witnessed by consultant and documented with photos',
        critical: true,
      },
      {
        label: 'Defects recorded and rectified before final sign-off',
        critical: true,
      },
      {
        label: 'Test report issued with pressure and duration data',
        critical: true,
      },
    ],
  },
  {
    element: 'Facade',
    stage: 'Cladding Subframe',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Subframe material and section size match approved submittal',
        critical: true,
      },
      {
        label: 'Bracket spacing and fixings calculated for wind load',
        critical: true,
      },
      {
        label: 'Vertical and horizontal rails aligned and level',
        critical: true,
      },
      {
        label: 'Thermal isolation pads present between metal and structure',
        critical: true,
      },
      {
        label: 'Fire barriers and cavity barriers installed at floor lines',
        critical: true,
      },
      {
        label: 'Fixings are stainless steel or hot-dip galvanized as specified',
        critical: true,
      },
      {
        label: 'Subframe load tested if required by specification',
        critical: true,
      },
    ],
  },
  {
    element: 'Facade',
    stage: 'Cladding Panel Installation',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Panel material, colour, and texture match approved sample',
        critical: true,
      },
      {
        label: 'Panel dimensions and joint width within tolerance',
        critical: true,
      },
      {
        label: 'Fixing clips engaged and back-secured per detail',
        critical: true,
      },
      {
        label: 'Sealant colour and type approved; backing rod installed',
        critical: true,
      },
      {
        label: 'No panel damage or staining from installation process',
        critical: false,
      },
      {
        label: 'Expansion joints aligned with structural movement joints',
        critical: true,
      },
      {
        label: 'Insulation behind cladding continuous and properly fixed',
        critical: true,
      },
    ],
  },
  {
    element: 'Balcony',
    stage: 'Railing & Glazing Inspection',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Railing height and spacing comply with code (typically 1.1m min)',
        critical: true,
      },
      { label: 'Infill spacing prevents 100mm sphere passage', critical: true },
      {
        label: 'Handrail fixings into structural slab (not just screed)',
        critical: true,
      },
      {
        label:
          'Glass balustrade thickness and type (laminated/tempered) verified',
        critical: true,
      },
      { label: 'Glass fixings and gaskets secure and aligned', critical: true },
      {
        label:
          'Railing load tested to code requirement (horizontal UDL and point load)',
        critical: true,
      },
      {
        label: 'No sharp edges or protrusions on finished railing',
        critical: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // VERTICAL TRANSPORTATION
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Lift',
    stage: 'Pit & Shaft Inspection',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Lift pit dimensions, level, and sump pump functional',
        critical: true,
      },
      {
        label: 'Pit waterproofing complete and tested (no leaks)',
        critical: true,
      },
      {
        label:
          'Guide rail bracket embedments / anchor bolts positioned correctly',
        critical: true,
      },
      {
        label: 'Shaft plumb and alignment verified (laser plumb)',
        critical: true,
      },
      {
        label: 'Shaft lighting and emergency lighting operational',
        critical: false,
      },
      {
        label: 'Fire-rated doors and frames installed at landings',
        critical: true,
      },
      {
        label: 'Buffer pits and foundations aligned with lift layout',
        critical: true,
      },
      {
        label: 'Machine room slab load capacity verified for equipment',
        critical: true,
      },
    ],
  },
  {
    element: 'Lift',
    stage: 'Installation & Testing',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Guide rails plumb and bracket spacing per manufacturer',
        critical: true,
      },
      { label: 'Car and counterweight alignment checked', critical: true },
      { label: 'Overspeed governor and safety gear tested', critical: true },
      { label: 'Door operator and safety edges functional', critical: true },
      { label: 'Emergency alarm and intercom tested', critical: true },
      {
        label: 'Load test (125% rated load) completed and passed',
        critical: true,
      },
      {
        label: 'Speed test and levelling accuracy within tolerance (±5mm)',
        critical: true,
      },
      {
        label: 'Power supply and earthing continuity verified',
        critical: true,
      },
      {
        label: 'Lift manufacturer commissioning report issued',
        critical: true,
      },
      {
        label: 'Local authority inspection and certificate obtained',
        critical: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ADVANCED MEP
  // ═══════════════════════════════════════════════════════════
  {
    element: 'MEP',
    stage: 'Cable Tray & Ladder',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Tray route and elevation match approved shop drawings',
        critical: true,
      },
      {
        label: 'Support spacing per manufacturer and load calculation',
        critical: true,
      },
      {
        label: 'Tray sections bonded for electrical continuity and earthed',
        critical: true,
      },
      {
        label:
          'Segregation maintained (HV/LV, power/data, fire alarm separate)',
        critical: true,
      },
      {
        label:
          'Fire-rated penetrations sealed where tray passes through walls/floors',
        critical: true,
      },
      {
        label:
          'Tray covers installed where required (vertical risers, public areas)',
        critical: false,
      },
      {
        label:
          'Expansion joints provided where tray crosses building expansion joint',
        critical: true,
      },
    ],
  },
  {
    element: 'MEP',
    stage: 'Earthing & Lightning Protection',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      { label: 'Earth electrode type and depth as per design', critical: true },
      {
        label: 'Earth pit resistance measured and <= 1 ohm (or spec value)',
        critical: true,
      },
      { label: 'Main earthing bar installed and labelled', critical: true },
      {
        label:
          'Equipotential bonding to structural steel, lifts, and MEP services',
        critical: true,
      },
      {
        label: 'Lightning conductor route and fixings per drawing',
        critical: true,
      },
      {
        label:
          'Air termination network covers roof area as per rolling sphere method',
        critical: true,
      },
      {
        label: 'Down conductor continuity tested (<= 0.05 ohm)',
        critical: true,
      },
      {
        label: 'Test clamps accessible for future maintenance',
        critical: false,
      },
    ],
  },
  {
    element: 'MEP',
    stage: 'Fire Stopping',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Fire stopping material rated for the required FRL (Fire Resistance Level)',
        critical: true,
      },
      {
        label: 'All MEP penetrations through fire-rated walls/floors sealed',
        critical: true,
      },
      {
        label: 'Intumescent collars on plastic pipes through slabs',
        critical: true,
      },
      {
        label: 'Fire batts / pillows installed around cable bundles',
        critical: true,
      },
      {
        label: 'Fire stopping tested and certified by third party if required',
        critical: true,
      },
      {
        label: 'No gaps, cracks, or missing seals at penetrations',
        critical: true,
      },
      {
        label: 'Fire stopping submittal and test reports on file',
        critical: true,
      },
    ],
  },
  {
    element: 'MEP',
    stage: 'Water Tank Installation',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Tank location, dimensions, and capacity match design',
        critical: true,
      },
      {
        label:
          'Tank base / plumb level and capable of supporting full water load',
        critical: true,
      },
      {
        label:
          'Internal and external coating / lining approved for potable water',
        critical: true,
      },
      {
        label: 'Nozzle locations and sizes match mechanical drawings',
        critical: true,
      },
      {
        label: 'Level sensors, float switches, and overflow alarms tested',
        critical: true,
      },
      {
        label: 'Tank cleaned and disinfected before commissioning',
        critical: true,
      },
      {
        label: 'Water tightness test (24-hour hold) passed with no leakage',
        critical: true,
      },
      {
        label: 'Access manway and internal ladder installed securely',
        critical: false,
      },
    ],
  },
  {
    element: 'MEP',
    stage: 'Fire Alarm & BMS',
    discipline: 'MEP',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'Device locations (smoke/heat detectors, MCPs, sounders) match drawing',
        critical: true,
      },
      {
        label: 'Loop wiring continuity and insulation resistance tested',
        critical: true,
      },
      {
        label: 'Smoke detector sensitivity tested with calibrated aerosol',
        critical: true,
      },
      {
        label: 'Fire alarm panel programming matches cause-and-effect matrix',
        critical: true,
      },
      {
        label:
          'Integration with lift recall, HVAC shutdown, and sprinkler flow switches tested',
        critical: true,
      },
      { label: 'BMS point-to-point commissioning completed', critical: true },
      {
        label:
          'Graphic interface (BMS) shows correct floor plans and device status',
        critical: false,
      },
      {
        label: 'Witnessed functional test with consultant and fire authority',
        critical: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TESTING, COMMISSIONING & SPECIALIST WORKS
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Fireproofing',
    stage: 'Spray-Applied Fire Resistive Material',
    discipline: 'Architectural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label:
          'SFRM type and thickness match approved submittal and fire rating',
        critical: true,
      },
      {
        label: 'Substrate primed and cleaned before application',
        critical: true,
      },
      {
        label: 'Thickness gauge measurements taken per ITP (min 10 per 100m²)',
        critical: true,
      },
      {
        label: 'Density and adhesion tests passed (ASTM E605 / E736)',
        critical: true,
      },
      {
        label: 'No gaps, voids, or delamination at steel connections',
        critical: true,
      },
      {
        label:
          'Application stopped 25mm from bolted/welded connections (if exposed required)',
        critical: true,
      },
      {
        label: 'Protection from weather during curing period',
        critical: false,
      },
    ],
  },
  {
    element: 'Expansion Joint',
    stage: 'Structural & Facade Joint Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Joint width and location match structural movement design',
        critical: true,
      },
      {
        label:
          'Fire barrier / compression seal installed through full floor depth',
        critical: true,
      },
      {
        label: 'Waterproof membrane continuous across joint (roof/balcony)',
        critical: true,
      },
      {
        label:
          'Cover plate / bellows allows full design movement in both directions',
        critical: true,
      },
      {
        label: 'No rigid fixing that restrains intended movement',
        critical: true,
      },
      {
        label: 'Finish floor joint cover flush and trip-hazard free',
        critical: true,
      },
      {
        label:
          'Sealant type rated for expected movement (typically ±25% or ±50%)',
        critical: true,
      },
    ],
  },
  {
    element: 'Concrete',
    stage: 'Non-Destructive Testing',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Rebound hammer (Schmidt) calibration checked before testing',
        critical: true,
      },
      {
        label: 'Test grid marked and documented on as-built drawings',
        critical: true,
      },
      {
        label: 'UPV (Ultrasonic Pulse Velocity) test procedure approved',
        critical: true,
      },
      {
        label: 'Core extraction locations approved by structural engineer',
        critical: true,
      },
      {
        label: 'Core samples tested in certified lab and results documented',
        critical: true,
      },
      {
        label: 'Carbonation depth test completed where required',
        critical: false,
      },
      {
        label: 'NDT report reviewed and accepted by consultant',
        critical: true,
      },
    ],
  },
  {
    element: 'Structural',
    stage: 'Load Testing',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Load test procedure approved by structural engineer',
        critical: true,
      },
      {
        label: 'Test load magnitude and duration per code / spec',
        critical: true,
      },
      {
        label: 'Deflection measurements baseline recorded before loading',
        critical: true,
      },
      {
        label: 'Deflection during load and recovery after unloading recorded',
        critical: true,
      },
      {
        label: 'No residual deflection exceeding allowable limits',
        critical: true,
      },
      { label: 'No cracks observed during or after load test', critical: true },
      { label: 'Test witnessed by consultant and documented', critical: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TEMPORARY WORKS & SITE EQUIPMENT
  // ═══════════════════════════════════════════════════════════
  {
    element: 'Tower Crane',
    stage: 'Monthly Structural Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Mast bolts / pins inspected for tightness and corrosion',
        critical: true,
      },
      { label: 'Jib and counter-jib connection bolts checked', critical: true },
      {
        label: 'Wire rope inspected for broken strands, wear, and kinks',
        critical: true,
      },
      { label: 'Trolley and hoist brake function tested', critical: true },
      {
        label: 'Limit switches (hoist, trolley, slew, radius) tested',
        critical: true,
      },
      {
        label: 'Load moment indicator (LMI) calibrated and functional',
        critical: true,
      },
      {
        label: 'Anemometer operational and alarm set correctly',
        critical: true,
      },
      {
        label: 'Foundation / tie-in frame inspected for cracks or settlement',
        critical: true,
      },
      {
        label: 'Electrical earthing and lightning protection checked',
        critical: true,
      },
      {
        label: 'Inspection tag / certificate posted in cab and valid',
        critical: true,
      },
    ],
  },
  {
    element: 'Scaffolding',
    stage: 'Engineering & Safety Inspection',
    discipline: 'Structural',
    version: 'v1.0',
    isSystem: true,
    isActive: true,
    items: [
      {
        label: 'Scaffold design calculation approved for imposed load',
        critical: true,
      },
      {
        label: 'Base plates on firm ground with sole boards where required',
        critical: true,
      },
      {
        label: 'Vertical standards plumb and braced in both directions',
        critical: true,
      },
      { label: 'Ledger and transom spacing per design', critical: true },
      {
        label:
          'Toe boards, guardrails, and mid-rails complete on all open sides',
        critical: true,
      },
      {
        label: 'Access ladders secured and extend 1m above platform',
        critical: true,
      },
      {
        label: 'Tie connections to structure at required intervals',
        critical: true,
      },
      {
        label: 'No missing or damaged components (couplers, boards, tubes)',
        critical: true,
      },
      {
        label: 'Green safety tag signed and dated by competent person',
        critical: true,
      },
      { label: 'Maximum load signage posted at access points', critical: true },
    ],
  },
];

export const ELEMENTS = [
  'Beam',
  'Column (Rectangular)',
  'Column (Circular)',
  'Slab',
  'Wall',
  'Stair',
  'Shaft',
  'MEP',
  'Finishes',
  'Foundation',
  'Roof',
  'External Works',
  'Precast',
  'Materials',
  // HIGH-RISE & SPECIALIST ELEMENTS
  'Pile',
  'Pile Cap',
  'Basement',
  'Core Wall',
  'Transfer Structure',
  'Post-Tensioning',
  'Structural Steel',
  'Composite Deck',
  'Curtain Wall',
  'Facade',
  'Balcony',
  'Lift',
  'Fireproofing',
  'Expansion Joint',
  'Concrete',
  'Scaffolding',
  'Tower Crane',
] as const;

export function getStagesForElement(
  templates: InspectionTemplate[],
  element: string
): InspectionTemplate[] {
  return templates.filter((t) => t.element === element);
}
