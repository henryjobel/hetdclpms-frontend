export const APP_NAME = "HET PMS";
export const APP_FULL_NAME = "HET Property Management System";
export const APP_VERSION = "1.0.0";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
  PROJECT_MANAGER: "project_manager",
  SITE_ENGINEER: "site_engineer",
  INVENTORY_MANAGER: "inventory_manager",
  PROCUREMENT_OFFICER: "procurement_officer",
  CONTRACTOR: "contractor",
  VIEWER: "viewer",
} as const;

export const PROJECT_STATUS = {
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Running",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

export const VOUCHER_TYPES = [
  "Payment Voucher",
  "Receipt Voucher",
  "Journal Voucher",
  "Contra Voucher",
  "Adjustment Voucher",
];

export const ACCOUNT_TYPES = [
  "Asset",
  "Liability",
  "Income",
  "Expense",
  "Equity",
  "Bank",
  "Cash",
];

export const REQUISITION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  FULFILLED: "fulfilled",
};

export const PURCHASE_ORDER_STATUS = {
  DRAFT: "draft",
  SENT: "sent",
  CONFIRMED: "confirmed",
  RECEIVED: "received",
  CANCELLED: "cancelled",
};

export const PROJECT_PHASES = [
  "Pre-Construction",
  "Site Preparation",
  "Earthwork",
  "Foundation",
  "Piling",
  "Structural / RCC",
  "Masonry",
  "Roofing",
  "Plastering",
  "Flooring & Tiles",
  "Doors & Windows",
  "Electrical",
  "Plumbing & Sanitary",
  "Painting & Finishing",
  "External Works",
] as const;

export type ProjectPhase = (typeof PROJECT_PHASES)[number];

export const PHASE_SUBCATEGORIES_MAP: Record<ProjectPhase, readonly string[]> = {
  "Pre-Construction": [
    "Design & Drawing",
    "Soil Test",
    "Survey",
    "Approval & Permit",
    "Project Management",
  ],
  "Site Preparation": [
    "Site Clearing",
    "Demolition",
    "Site Leveling",
    "Temporary Setup",
    "Site Security",
  ],
  "Earthwork": [
    "Excavation",
    "Earth Filling",
    "Sand Filling",
    "Backfilling",
    "Soil Disposal",
    "Compaction",
  ],
  "Foundation": [
    "PCC",
    "Footing",
    "Foundation Wall",
    "Grade Beam",
    "DPC",
    "Waterproofing",
    "Anti-Termite Treatment",
  ],
  "Piling": [
    "Pile Work",
    "Pile Reinforcement",
    "Pile Concrete",
    "Pile Testing",
    "Pile Cap",
  ],
  "Structural / RCC": [
    "Column",
    "Beam",
    "Slab",
    "Staircase",
    "Lintel & Chajja",
    "Reinforcement Steel",
    "Formwork",
    "Concrete",
  ],
  "Masonry": [
    "Brickwork",
    "Blockwork",
    "Partition Wall",
    "Boundary Wall",
    "Lintel & Opening",
  ],
  "Roofing": [
    "Roof Slab",
    "Roof Waterproofing",
    "Roof Insulation",
    "Roof Screed",
    "Parapet",
    "Roof Drainage",
  ],
  "Plastering": [
    "Internal Plaster",
    "External Plaster",
    "Ceiling Plaster",
    "Waterproof Plaster",
    "Surface Preparation",
  ],
  "Flooring & Tiles": [
    "Floor Tiles",
    "Wall Tiles",
    "Stair Tiles",
    "Marble & Granite",
    "Skirting",
    "Tile Adhesive & Grouting",
  ],
  "Doors & Windows": [
    "Main Door",
    "Internal Doors",
    "Toilet Doors",
    "Windows",
    "Glass",
    "Door & Window Hardware",
  ],
  "Electrical": [
    "Wiring",
    "Conduit",
    "Switch & Socket",
    "Lighting",
    "DB & Protection",
    "Earthing",
    "AC & Fan Points",
    "CCTV / LAN",
  ],
  "Plumbing & Sanitary": [
    "Water Supply",
    "Drainage",
    "Sewerage",
    "Sanitary Fixtures",
    "Kitchen Plumbing",
    "Water Tank",
    "Pump",
    "Septic / Inspection Chamber",
  ],
  "Painting & Finishing": [
    "Wall Putty",
    "Primer",
    "Interior Paint",
    "Exterior Paint",
    "Ceiling Paint",
    "Metal / Wood Paint",
    "Final Touch-up",
  ],
  "External Works": [
    "Boundary Wall",
    "Main Gate",
    "Driveway",
    "Footpath / Paving",
    "Drainage",
    "Landscaping",
    "External Electrical",
    "External Plumbing",
  ],
};

export const PHASE_ALIASES: Record<string, ProjectPhase> = {
  "foundation & substructure": "Foundation",
  "piling & deep foundation": "Piling",
  "earthwork & excavation": "Earthwork",
  "superstructure (columns & slabs)": "Structural / RCC",
  "brickwork & masonry": "Masonry",
  "plastering & concrete works": "Plastering",
  "roofing & roof works": "Roofing",
  "tiles & marble finishing": "Flooring & Tiles",
  "doors, windows & glass": "Doors & Windows",
  "electrical works & fittings": "Electrical",
  "plumbing & sanitary": "Plumbing & Sanitary",
  "painting & waterproofing": "Painting & Finishing",
  "external works & development": "External Works",
  "pre-construction & site preparation": "Pre-Construction",
};

export function normalizePhaseName(phase?: string | null): string {
  if (!phase) return "General";
  const trimmed = phase.trim();
  const lower = trimmed.toLowerCase();
  if (PHASE_ALIASES[lower]) return PHASE_ALIASES[lower];
  const matched = PROJECT_PHASES.find((p) => p.toLowerCase() === lower);
  return matched || trimmed;
}

export function getSubcategoriesForPhase(phase?: string | null): readonly string[] {
  if (!phase) return [];
  const normalized = normalizePhaseName(phase) as ProjectPhase;
  return PHASE_SUBCATEGORIES_MAP[normalized] || [];
}

export type WorkType = "SERVICE" | "RCC" | "EARTHWORK" | "MASONRY" | "FINISHING" | "MEP" | "METAL_WOOD" | "GENERAL";

export interface SubcategoryProfile {
  workType: WorkType;
  workTypeLabel: string;
  badgeColor: string;
  defaultUnit: string;
  suggestedUnits: string[];
  materialLabel: string;
  laborLabel: string;
  materialPlaceholder: string;
  laborPlaceholder: string;
  descPlaceholder: string;
  isMaterialOptional?: boolean;
}

export function getSubcategoryProfile(phase?: string | null, subcategory?: string | null): SubcategoryProfile {
  const normPhase = normalizePhaseName(phase).toLowerCase();
  const sub = (subcategory || "").toLowerCase();

  // 1. Services, Tests, Consultants, Permits
  if (
    sub.includes("test") ||
    sub.includes("survey") ||
    sub.includes("design") ||
    sub.includes("drawing") ||
    sub.includes("permit") ||
    sub.includes("approval") ||
    sub.includes("management") ||
    sub.includes("commissioning") ||
    sub.includes("soil disposal") ||
    normPhase === "pre-construction"
  ) {
    let defaultUnit = "LS";
    if (sub.includes("soil test")) defaultUnit = "Borehole";
    else if (sub.includes("drawing") || sub.includes("design")) defaultUnit = "Drawing Set";
    else if (sub.includes("survey")) defaultUnit = "Point";

    return {
      workType: "SERVICE",
      workTypeLabel: "Service & Consultancy / কনসালটেন্সি ও টেস্ট",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
      defaultUnit,
      suggestedUnits: ["LS", "Borehole", "Point", "Nos", "Sqft", "Job"],
      materialLabel: "Official / Lab / Vendor Fee (৳ - সরকারি ও ল্যাব ফি)",
      laborLabel: "Consultancy & Service Charge (৳ - বিশেষজ্ঞ ফি)",
      materialPlaceholder: "0 (Optional)",
      laborPlaceholder: "Enter consultancy or test fee",
      descPlaceholder: sub.includes("soil")
        ? "e.g. 3 Boreholes up to 60ft depth with SPT & Lab report"
        : sub.includes("drawing")
        ? "e.g. Architectural & Structural complete working drawings"
        : "e.g. Official approvals and statutory clearance fee",
      isMaterialOptional: true,
    };
  }

  // 2. Earthwork & Excavation & Site Preparation
  if (
    normPhase === "earthwork" ||
    normPhase === "site preparation" ||
    sub.includes("excavation") ||
    sub.includes("earth") ||
    sub.includes("sand filling") ||
    sub.includes("backfilling") ||
    sub.includes("compaction") ||
    sub.includes("clearing") ||
    sub.includes("demolition")
  ) {
    return {
      workType: "EARTHWORK",
      workTypeLabel: "Earthwork & Site Prep / মাটি ও সাইট কাজ",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      defaultUnit: "CFT",
      suggestedUnits: ["CFT", "m³", "Truck", "Trip", "Sqft", "Job"],
      materialLabel: "Material Cost (৳ - মাটি, ভিটি বালি, ফিলিং মালামাল)",
      laborLabel: "Labour & Excavator Cost (৳ - লেবার ও মেশিন ভাড়া)",
      materialPlaceholder: "Cost of sand/earth filling",
      laborPlaceholder: "Labour or excavator charge",
      descPlaceholder: sub.includes("sand")
        ? "e.g. Local Sylhet sand filling in basement area with 95% compaction"
        : "e.g. Foundation earth excavation up to 8ft depth by excavator & labour",
    };
  }

  // 3. Structural RCC & Foundation & Piling
  if (
    normPhase === "structural / rcc" ||
    normPhase === "foundation" ||
    normPhase === "piling" ||
    sub.includes("column") ||
    sub.includes("beam") ||
    sub.includes("slab") ||
    sub.includes("footing") ||
    sub.includes("pile") ||
    sub.includes("rebar") ||
    sub.includes("steel") ||
    sub.includes("concrete") ||
    sub.includes("formwork") ||
    sub.includes("staircase") ||
    sub.includes("pcc")
  ) {
    let defaultUnit = "CFT";
    if (sub.includes("steel") || sub.includes("rebar")) defaultUnit = "Ton";
    else if (sub.includes("formwork")) defaultUnit = "Sqft";
    else if (sub.includes("pile work")) defaultUnit = "Nos";

    return {
      workType: "RCC",
      workTypeLabel: "RCC Structural / রড-সিমেন্ট-ঢালাই",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      defaultUnit,
      suggestedUnits: ["CFT", "m³", "Ton", "Kg", "Sqft", "Nos"],
      materialLabel: "Material Cost (৳ - রড, সিমেন্ট, বালি, পাথর)",
      laborLabel: "Labour Cost (৳ - শাটারিং, রড বাইন্ডিং ও ঢালাই মজুরি)",
      materialPlaceholder: "Rebar, cement, aggregates cost",
      laborPlaceholder: "Shuttering & casting labour",
      descPlaceholder: sub.includes("column")
        ? "e.g. C25 3500psi Concrete Casting & BSRM 500W Rebar for Columns"
        : sub.includes("slab")
        ? "e.g. 5 inch Roof Slab casting with ready-mix concrete & reinforcement"
        : "e.g. 500W Grade Rebar cutting, bending & binding work",
    };
  }

  // 4. Masonry & Plastering
  if (
    normPhase === "masonry" ||
    normPhase === "plastering" ||
    sub.includes("brick") ||
    sub.includes("block") ||
    sub.includes("wall") ||
    sub.includes("plaster")
  ) {
    const isPlaster = sub.includes("plaster");
    return {
      workType: "MASONRY",
      workTypeLabel: "Masonry & Plaster / গাঁথুনি ও প্লাস্টার",
      badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
      defaultUnit: isPlaster ? "Sqft" : "CFT",
      suggestedUnits: isPlaster ? ["Sqft", "Sqm", "CFT", "RFT"] : ["CFT", "Sqft", "Nos", "Pcs", "m²"],
      materialLabel: "Material Cost (৳ - ইট, ব্লক, সিমেন্ট, সিলেট বালি)",
      laborLabel: "Labour Cost (৳ - রাজমিস্ত্রি ও হেল্পার মজুরি)",
      materialPlaceholder: "Bricks, cement, sand cost",
      laborPlaceholder: "Mason & helper labour charge",
      descPlaceholder: isPlaster
        ? "e.g. 1:4 Cement Sand 12mm thick internal wall plaster with smooth finish"
        : "e.g. 5 inch 1st class auto brick masonry with 1:5 cement mortar",
    };
  }

  // 5. Flooring & Tiles & Painting & Finishing
  if (
    normPhase === "flooring & tiles" ||
    normPhase === "painting & finishing" ||
    sub.includes("tile") ||
    sub.includes("marble") ||
    sub.includes("granite") ||
    sub.includes("paint") ||
    sub.includes("putty") ||
    sub.includes("primer") ||
    sub.includes("ceiling")
  ) {
    return {
      workType: "FINISHING",
      workTypeLabel: "Tiles & Finishing / টাইলস, রঙ ও ফিনিশিং",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      defaultUnit: "Sqft",
      suggestedUnits: ["Sqft", "Sqm", "RFT", "Box", "Gallon", "Nos"],
      materialLabel: "Material Cost (৳ - টাইলস, পুটি, প্রাইমার, রঙ, এডহেসিভ)",
      laborLabel: "Labour Cost (৳ - টাইলস মিস্ত্রি ও পেইন্টার মজুরি)",
      materialPlaceholder: "Tiles/paint purchase cost",
      laborPlaceholder: "Tile fixer or painter labour fee",
      descPlaceholder: sub.includes("tile")
        ? "e.g. 24x24 Homogeneous Mirror Polished Floor Tiles with adhesive fitting"
        : "e.g. 2 coats acrylic wall putty with 1 coat primer & 2 coats luxury silk paint",
    };
  }

  // 6. MEP (Electrical, Plumbing, Sanitary, HVAC)
  if (
    normPhase === "electrical" ||
    normPhase === "plumbing & sanitary" ||
    sub.includes("wiring") ||
    sub.includes("conduit") ||
    sub.includes("socket") ||
    sub.includes("lighting") ||
    sub.includes("pipe") ||
    sub.includes("sanitary") ||
    sub.includes("pump") ||
    sub.includes("tank") ||
    sub.includes("drainage") ||
    sub.includes("cctv")
  ) {
    return {
      workType: "MEP",
      workTypeLabel: "MEP & Utility / ইলেকট্রিক্যাল ও প্লাম্বিং",
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
      defaultUnit: "Point",
      suggestedUnits: ["Point", "RFT", "Set", "Nos", "Lot", "Meter"],
      materialLabel: "Material Cost (৳ - তার, পাইপ, সুইচ, বেসিন, ফিটিংস)",
      laborLabel: "Labour Cost (৳ - ইলেকট্রিশিয়ান ও প্লাম্বার ফিটিং চার্জ)",
      materialPlaceholder: "Cables, pipes, fittings cost",
      laborPlaceholder: "Technician & installation fee",
      descPlaceholder: sub.includes("wir")
        ? "e.g. BRB/BBS 1.5rm & 2.5rm Flame Retardant copper wire with PVC conduit"
        : "e.g. CPVC Concealed Water line with Kohler/Grohe sanitary fittings installation",
    };
  }

  // 7. Doors, Windows & Metal Works
  if (
    normPhase === "doors & windows" ||
    sub.includes("door") ||
    sub.includes("window") ||
    sub.includes("glass") ||
    sub.includes("hardware") ||
    sub.includes("gate") ||
    sub.includes("grill")
  ) {
    return {
      workType: "METAL_WOOD",
      workTypeLabel: "Doors & Windows / দরজা, জানালা ও গ্রিল",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      defaultUnit: "Sqft",
      suggestedUnits: ["Sqft", "Nos", "Set", "Pcs", "RFT"],
      materialLabel: "Material Cost (৳ - কাঠ, গ্লাস, অ্যালুমিনিয়াম, লক, হ্যান্ডেল)",
      laborLabel: "Fabrication & Fitting (৳ - তৈরি ও ফিটিং মজুরি)",
      materialPlaceholder: "Frame, shutter, glass cost",
      laborPlaceholder: "Carpenter/fitting charge",
      descPlaceholder: sub.includes("window")
        ? "e.g. Thai 1.2mm Aluminium profile with 5mm tinted tempered glass & mosquito net"
        : "e.g. Solid Teak/Chittagong Segun Wood main entrance door shutter with Polish",
    };
  }

  // Default / General
  return {
    workType: "GENERAL",
    workTypeLabel: "General Construction / সাধারণ নির্মাণ কাজ",
    badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
    defaultUnit: "Nos",
    suggestedUnits: ["Nos", "CFT", "Sqft", "Ton", "m³", "LS", "Point"],
    materialLabel: "Material Cost (৳ - কাঁচামাল বাবদ খরচ)",
    laborLabel: "Labour Cost (৳ - শ্রমিক ও মিস্ত্রি মজুরি)",
    materialPlaceholder: "0",
    laborPlaceholder: "0",
    descPlaceholder: "Item description & specifications",
  };
}


