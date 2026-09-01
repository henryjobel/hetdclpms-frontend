"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Package,
  Wallet,
  Users,
  HardHat,
  FileText,
  ShoppingCart,
  ClipboardList,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Receipt,
  Banknote,
  CreditCard,
  Layers,
  Truck,
  AlertTriangle,
  UserCheck,
  Home,
  Map,
  Landmark,
  DollarSign,
  Briefcase,
  History,
  Settings2,
  Clock,
  DraftingCompass,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/constants";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Project Module", href: "/project-module", icon: Layers },
  {
    label: "Projects",
    icon: Building2,
    children: [
      { label: "All Projects", href: "/projects", icon: Building2 },
      {
        label: "Land / Owner",
        icon: Landmark,
        children: [
          { label: "Land Owner Info", href: "/projects/land-owner", icon: Users },
          { label: "Deed / Mutation / Approval", href: "/projects/documents", icon: FileText },
          { label: "Developer Agreement", href: "/projects/developer-agreement", icon: ClipboardList },
          { label: "Owner vs Developer Share", href: "/projects/share-ratio", icon: TrendingUp },
        ],
      },
      {
        label: "Design / Architect",
        icon: DraftingCompass,
        children: [
          { label: "Architect / Consultant Profile", href: "/projects/design/consultants", icon: Users },
          { label: "Design Contract / Fee", href: "/projects/design/contract-fee", icon: Receipt },
          { label: "Drawing Submission", href: "/projects/design/drawing-submission", icon: FileText },
          { label: "Drawing Approval Status", href: "/projects/design/approval-status", icon: ClipboardList },
          { label: "Structural / MEP / Soil Test", href: "/projects/design/structural-mep-soil", icon: HardHat },
          { label: "Approval Document Upload", href: "/projects/design/approval-documents", icon: FileText },
          { label: "Design Payment Tracking", href: "/projects/design/payments", icon: Banknote },
        ],
      },
      {
        label: "Project Team",
        icon: Users,
        children: [
          { label: "Project Manager", href: "/projects/project-manager", icon: UserCheck },
          { label: "Site Engineer", href: "/projects/site-engineer", icon: HardHat },
          { label: "Supervisor", href: "/projects/supervisor", icon: UserCheck },
          { label: "Safety Officer", href: "/projects/safety-officer", icon: Shield },
          { label: "Store Keeper", href: "/projects/store-keeper", icon: Package },
          { label: "Accounts Person", href: "/projects/accounts-person", icon: Wallet },
        ],
      },
      {
        label: "Contractor / Labour",
        icon: HardHat,
        children: [
          { label: "Main Contractor", href: "/projects/main-contractor", icon: HardHat },
          { label: "Subcontractor", href: "/projects/subcontractor", icon: Briefcase },
          { label: "Mason / Helper / Rod Binder", href: "/projects/mason-helper-rod-binder", icon: UserCheck },
          { label: "Electrician / Plumber / Painter", href: "/projects/electrician-plumber-painter", icon: UserCheck },
          { label: "Attendance / Wage / Payment", href: "/projects/attendance-wage-payment", icon: Clock },
        ],
      },
      {
        label: "Procurement / Inventory",
        icon: Package,
        children: [
          { label: "Material Requisition", href: "/projects/procurement/material-requisition", icon: ClipboardList },
          { label: "Supplier Quotation", href: "/projects/procurement/supplier-quotation", icon: FileText },
          { label: "Purchase Order", href: "/projects/procurement/purchase-order", icon: ShoppingCart },
          { label: "GRN", href: "/projects/procurement/grn", icon: Truck },
          { label: "Stock Adjustment", href: "/projects/procurement/stock-adjustment", icon: AlertTriangle },
          { label: "Purchase Bill / Invoice", href: "/projects/procurement/purchase-bill", icon: Receipt },
        ],
      },
      {
        label: "Project Execution",
        icon: ClipboardList,
        children: [
          { label: "BOQ", href: "/projects/boq", icon: FileText },
          { label: "Budget", href: "/projects/budget", icon: Wallet },
          { label: "Work Order", href: "/projects/work-orders", icon: FileText },
          { label: "Schedule / Gantt", href: "/projects/schedule", icon: ClipboardList },
          { label: "Task Management", href: "/projects/tasks", icon: ClipboardList },
          { label: "Progress Log", href: "/projects/progress", icon: TrendingUp },
          { label: "Site Report", href: "/projects/site-report", icon: BarChart3 },
        ],
      },
      {
        label: "Accounts",
        icon: Wallet,
        children: [
          { label: "Voucher", href: "/projects/accounts/voucher", icon: FileText },
          { label: "Project-wise Income", href: "/projects/accounts/project-income", icon: TrendingUp },
          { label: "Project Expense", href: "/projects/accounts/project-expense", icon: TrendingUp },
          { label: "Payable / Receivable", href: "/projects/accounts/payable-receivable", icon: CreditCard },
          { label: "Contractor Bill", href: "/projects/contractor-bill", icon: Receipt },
          { label: "Labour Bill", href: "/projects/labour-bill", icon: Receipt },
          { label: "Profit / Loss", href: "/projects/accounts/profit-loss", icon: TrendingUp },
          { label: "Cash Flow", href: "/projects/accounts/cash-flow", icon: Banknote },
        ],
      },
      {
        label: "Real Estate",
        icon: Home,
        children: [
          { label: "Flat / Land / Unit Setup", href: "/projects/real-estate/units", icon: Landmark },
          { label: "Booking", href: "/projects/real-estate/bookings", icon: ClipboardList },
          { label: "Sale", href: "/projects/real-estate/sales", icon: DollarSign },
          { label: "Installment", href: "/projects/real-estate/installments", icon: Receipt },
          { label: "Collection Report", href: "/projects/real-estate/collection-report", icon: Banknote },
          { label: "Aging / Due Report", href: "/projects/real-estate/aging-report", icon: AlertTriangle },
        ],
      },
    ],
  },
  {
    label: "Real Estate",
    icon: Home,
    children: [
      { label: "Overview", href: "/real-estate", icon: Home },
      { label: "Units", href: "/real-estate/units", icon: Landmark },
      { label: "Bookings", href: "/real-estate/bookings", icon: ClipboardList },
      { label: "Sales", href: "/real-estate/sales", icon: DollarSign },
      { label: "Collection Report", href: "/real-estate/collection-report", icon: Banknote },
      { label: "Aging Report", href: "/real-estate/aging-report", icon: AlertTriangle },
      { label: "Blocks & Roads", href: "/real-estate/blocks-roads", icon: Map },
    ],
  },
  {
    label: "Accounts",
    icon: Wallet,
    children: [
      { label: "Overview", href: "/accounts", icon: BarChart3 },
      { label: "Chart Groups", href: "/accounts/chart-groups", icon: Layers },
      { label: "Chart of Accounts", href: "/accounts/chart", icon: Layers },
      { label: "Vouchers", href: "/accounts/vouchers", icon: FileText },
      { label: "Contra Vouchers", href: "/accounts/contra-vouchers", icon: FileText },
      { label: "General Ledger", href: "/accounts/ledger", icon: ClipboardList },
      { label: "Project-Wise Accounting", href: "/accounts/project-accounting", icon: ClipboardList },
      { label: "Pending Approvals", href: "/accounts/pending-approvals", icon: Shield },
      { label: "Trial Balance", href: "/accounts/trial-balance", icon: BarChart3 },
      { label: "Day Book", href: "/accounts/day-book", icon: ClipboardList },
      { label: "Receive/Payment", href: "/accounts/receive-payment-summary", icon: Banknote },
      { label: "Approval History", href: "/accounts/approval-history", icon: Shield },
      { label: "Cash Book", href: "/accounts/cash-book", icon: Banknote },
      { label: "Bank Reconciliation", href: "/accounts/bank-reconciliation", icon: Banknote },
      { label: "Cheque Management", href: "/accounts/cheques", icon: CreditCard },
      { label: "Cheque Ranges", href: "/accounts/cheque-ranges", icon: CreditCard },
      { label: "Payable", href: "/accounts/payable", icon: CreditCard },
      { label: "Receivable", href: "/accounts/receivable", icon: Banknote },
      { label: "Customer Accounts", href: "/accounts/customer-accounts", icon: Banknote },
      { label: "Supplier Accounts", href: "/accounts/supplier-accounts", icon: Banknote },
      { label: "Installments", href: "/accounts/installments", icon: Receipt },
      { label: "Bank & Cash", href: "/accounts/bank-cash", icon: Banknote },
      { label: "Project-Wise Income", href: "/accounts/project-income", icon: TrendingUp },
      { label: "Project Expense Tracking", href: "/accounts/project-expense", icon: TrendingUp },
      { label: "Profit & Loss", href: "/accounts/profit-loss", icon: TrendingUp },
      { label: "Project Cost Report", href: "/accounts/project-cost-report", icon: BarChart3 },
      { label: "Balance Sheet", href: "/accounts/balance-sheet", icon: BarChart3 },
      { label: "Cash Flow", href: "/accounts/cash-flow", icon: TrendingUp },
    ],
  },
  {
    label: "Inventory",
    icon: Package,
    children: [
      { label: "Stock Overview", href: "/inventory", icon: Package },
      { label: "Products", href: "/inventory/products", icon: Layers },
      { label: "Purchase", href: "/inventory/purchase", icon: ShoppingCart },
      { label: "Stock Adjustment", href: "/inventory/adjustment", icon: AlertTriangle },
      { label: "Material Requisition", href: "/inventory/requisition", icon: ClipboardList },
      { label: "RFQ", href: "/inventory/rfq", icon: FileText },
      { label: "RFQ Comparison", href: "/inventory/rfq-comparison", icon: BarChart3 },
      { label: "Purchase Orders", href: "/inventory/purchase-orders", icon: ShoppingCart },
      { label: "GRN", href: "/inventory/grn", icon: Truck },
      { label: "Purchase Bills", href: "/inventory/bills", icon: Receipt },
      { label: "Reports", href: "/inventory/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Billing",
    icon: Receipt,
    children: [
      { label: "Period Billing", href: "/billing/period", icon: Receipt },
      { label: "Adjustment Billing", href: "/billing/adjustment", icon: Receipt },
      { label: "Contractor Work Orders", href: "/billing/contractor-work-orders", icon: Briefcase },
      { label: "Labor/Worker Bills", href: "/billing/labor-worker-bills", icon: Briefcase },
      { label: "Vendor Bills", href: "/billing/vendor-bills", icon: Receipt },
      { label: "Quotes", href: "/billing/quotes", icon: FileText },
    ],
  },
  {
    label: "Assets",
    icon: Landmark,
    children: [
      { label: "Asset Register", href: "/assets", icon: Landmark },
      { label: "Maintenance", href: "/assets/maintenance", icon: ClipboardList },
    ],
  },
  {
    label: "Reports",
    icon: BarChart3,
    children: [
      { label: "Analytics", href: "/reports", icon: BarChart3 },
      { label: "Operational Bundle", href: "/reports/operational", icon: FileText },
    ],
  },
  {
    label: "Users & Roles",
    icon: Users,
    children: [
      { label: "Users", href: "/users", icon: Users },
      { label: "Roles & Permissions", href: "/users/roles", icon: Shield },
      { label: "Activity Log", href: "/users/activity", icon: History },
    ],
  },
  {
    label: "HRM",
    icon: Briefcase,
    children: [
      { label: "Departments", href: "/hrm/departments", icon: Briefcase },
      { label: "Designations", href: "/hrm/designations", icon: Briefcase },
      { label: "Shifts", href: "/hrm/shifts", icon: Clock },
      { label: "Sections", href: "/hrm/sections", icon: Layers },
      { label: "Units", href: "/hrm/units", icon: Building2 },
      { label: "Employees", href: "/hrm/employees", icon: Users },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General Settings", href: "/settings", icon: Settings },
      { label: "Company", href: "/settings/company", icon: Building2 },
      { label: "Financial Years", href: "/settings/financial-years", icon: Settings2 },
      { label: "Currency", href: "/settings/currency", icon: DollarSign },
      { label: "Invoice Settings", href: "/settings/invoice-settings", icon: FileText },
      { label: "Report Settings", href: "/settings/report-settings", icon: BarChart3 },
      { label: "SMS Settings", href: "/settings/sms-settings", icon: Settings2 },
      { label: "Approval Layers", href: "/settings/approval-layers", icon: Shield },
    ],
  },
];

interface SidebarItemProps {
  item: NavItem;
  level?: number;
}

function hasActiveRoute(item: NavItem, pathname: string): boolean {
  if (item.href) {
    if (item.href === pathname) return true;
    if (!["/", "/projects", "/project-module"].includes(item.href) && pathname.startsWith(`${item.href}/`)) return true;
  }
  return Boolean(item.children?.some((child) => hasActiveRoute(child, pathname)));
}

function SidebarItem({ item, level = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const activeBranch = hasActiveRoute(item, pathname);
  const [open, setOpen] = useState(() => activeBranch);
  const indentStyle = level > 0 ? { paddingLeft: `${12 + level * 14}px` } : undefined;

  useEffect(() => {
    if (activeBranch) setOpen(true);
  }, [activeBranch]);

  const isActive = item.href === pathname || Boolean(item.href && !["/", "/projects", "/project-module"].includes(item.href) && pathname.startsWith(`${item.href}/`));

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={indentStyle}
          className={cn(
            "w-full min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeBranch
              ? "bg-amber-50 text-amber-800 shadow-sm ring-1 ring-amber-100 hover:bg-amber-50 hover:text-amber-800"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <item.icon className={cn("w-4 h-4 flex-shrink-0", activeBranch && "text-amber-600")} />
          <span className="min-w-0 flex-1 truncate text-left" title={item.label}>{item.label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <div className="mt-0.5 ml-2 border-l border-gray-200 pl-2">
            {item.children.map((child) => (
              <SidebarItem key={child.href ?? child.label} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      aria-current={isActive ? "page" : undefined}
      style={indentStyle}
      className={cn(
        "group flex min-w-0 items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        level === 0
          ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        isActive && "bg-amber-500 text-white shadow-sm hover:bg-amber-500 hover:text-white"
      )}
    >
      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-white")} />
      <span className="min-w-0 flex-1 truncate" title={item.label}>{item.label}</span>
      {isActive && <span className="ml-auto h-5 w-1 rounded-full bg-white/80" />}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{APP_NAME}</p>
          <p className="text-xs text-gray-400 leading-tight">Property Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <SidebarItem key={item.href ?? item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">Super Admin</p>
            <p className="text-xs text-gray-400 truncate">admin@hetpms.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
