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
} from "lucide-react";
import { useState } from "react";
import { APP_NAME } from "@/lib/constants";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Projects",
    icon: Building2,
    children: [
      { label: "All Projects", href: "/projects", icon: Building2 },
      { label: "Project Schedule", href: "/projects/schedule", icon: ClipboardList },
      { label: "BOQ", href: "/projects/boq", icon: FileText },
      { label: "Budget", href: "/projects/budget", icon: Wallet },
      { label: "Tasks", href: "/projects/tasks", icon: ClipboardList },
      { label: "Progress Monitor", href: "/projects/progress", icon: TrendingUp },
      { label: "Contractors", href: "/projects/contractors", icon: HardHat },
      { label: "Workers", href: "/projects/workers", icon: UserCheck },
      { label: "Requisition", href: "/projects/requisition", icon: ClipboardList },
      { label: "Bills", href: "/projects/bills", icon: Receipt },
      { label: "Quotations", href: "/projects/quotations", icon: FileText },
      { label: "Work Orders", href: "/projects/work-orders", icon: FileText },
      { label: "Advanced Billing", href: "/projects/advanced-billing", icon: Receipt },
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
      { label: "Profit & Loss", href: "/accounts/profit-loss", icon: TrendingUp },
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

function SidebarItem({ item, level = 0 }: SidebarItemProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (!item.children) return false;
    return item.children.some((child) => child.href === pathname || pathname.startsWith(child.href ?? "___"));
  });

  const isActive = item.href === pathname;

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            level > 0 && "pl-9"
          )}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
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
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        level === 0
          ? "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        isActive && "bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
      )}
    >
      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-amber-600")} />
      <span>{item.label}</span>
      {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-30">
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
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
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
