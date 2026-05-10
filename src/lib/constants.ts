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
