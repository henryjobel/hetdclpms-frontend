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


