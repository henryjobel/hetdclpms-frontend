"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  ChevronDown, ChevronRight, Search, Settings, Bell,
  LayoutGrid, Folder, Share2, ClipboardList, Receipt,
  Landmark, FileText, Building2, Phone, TrendingUp,
  Loader2, UserCircle, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavChild {
  label: string;
  href?: string;
  children?: NavChild[];
}
interface NavItem {
  label: string;
  icon?: React.ElementType;
  isPrimary?: boolean;
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Projects",
    icon: Folder,
    isPrimary: true,
    children: [
      { label: "Project Type", href: "/project-module/project-type" },
      { label: "Project", href: "/project-module" },
      { label: "Site", href: "/project-module/site" },
      { label: "Reports", href: "/project-module/reports" },
    ],
  },
  {
    label: "Project",
    icon: Building2,
    children: [
      { label: "Project List", href: "/project-module" },
    ],
  },
  {
    label: "Contact",
    icon: Phone,
    children: [
      { label: "Customer Accounts", href: "/project-module/contact/customer-accounts" },
      { label: "Supplier Accounts", href: "/project-module/contact/supplier-accounts" },
      { label: "Labour/Worker/Contractor", href: "/project-module/contact/labour" },
    ],
  },
  {
    label: "Investment",
    icon: TrendingUp,
    children: [
      { label: "Investor", href: "/project-module/investment/investor" },
      { label: "Configuration", href: "/project-module/investment/configuration" },
    ],
  },
  {
    label: "Share Project",
    icon: Share2,
    children: [
      { label: "Assign Share", href: "/project-module/share-project/assign-share" },
      { label: "Share Report", href: "/project-module/share-project/share-report" },
      { label: "Penalty Report", href: "/project-module/share-project/penalty-report" },
      { label: "ShareHolder Point Report", href: "/project-module/share-project/shareholder-point-report" },
      { label: "Project Share Configuration", href: "/project-module/share-project/configuration" },
    ],
  },
  {
    label: "Requisition",
    icon: ClipboardList,
    children: [
      { label: "Material Requisition", href: "/project-module/requisition/material" },
      { label: "Service/Work Requisition", href: "/project-module/requisition/service" },
      { label: "Fund Requisition", href: "/project-module/requisition/fund" },
      { label: "Fund Requisition Report", href: "/project-module/requisition/fund-report" },
    ],
  },
  {
    label: "Billing",
    icon: Receipt,
    children: [
      {
        label: "Configuration",
        children: [
          { label: "Category", href: "/project-module/billing/config/category" },
          { label: "Bill Item", href: "/project-module/billing/config/bill-item" },
          { label: "Service/Work Name", href: "/project-module/billing/config/service-work-name" },
          { label: "BOQ Title", href: "/project-module/billing/config/boq-title" },
        ],
      },
      { label: "Bill/Invoice", href: "/project-module/billing/bill-invoice" },
      { label: "Contractor Bill", href: "/project-module/billing/contractor-bill" },
      { label: "Labour/Worker Bill", href: "/project-module/billing/labour-worker-bill" },
      { label: "Work Order", href: "/project-module/billing/work-order" },
      { label: "Contractor Work Order", href: "/project-module/billing/contractor-work-order" },
      { label: "Period Billing", href: "/project-module/billing/period" },
      { label: "Adjustment Billing", href: "/project-module/billing/adjustment" },
      { label: "Quote", href: "/project-module/billing/quote" },
    ],
  },
  {
    label: "Flat/Land",
    icon: Landmark,
    children: [
      { label: "Flat", href: "/project-module/flat-land/flat" },
      {
        label: "Land",
        children: [
          { label: "Road", href: "/project-module/flat-land/road" },
          { label: "Block", href: "/project-module/flat-land/block" },
          { label: "Land", href: "/project-module/flat-land/land-list" },
        ],
      },
      { label: "Booking", href: "/project-module/flat-land/booking" },
      { label: "Flat/Land Sale", href: "/project-module/flat-land/sale" },
      { label: "Flat/Land Sale Report", href: "/project-module/flat-land/sale-report" },
      { label: "Sale Collection Report", href: "/project-module/flat-land/collection-report" },
      { label: "Plot Distribution Report", href: "/project-module/flat-land/plot-distribution" },
      { label: "Aging Report", href: "/project-module/flat-land/aging-report" },
      { label: "Installment Report", href: "/project-module/flat-land/installment-report" },
    ],
  },
  {
    label: "Document",
    icon: FileText,
    children: [
      { label: "Project Documentation List", href: "/project-module/documents" },
    ],
  },
];

function DropdownItem({ item, onClose }: { item: NavChild; onClose: () => void }) {
  const [subOpen, setSubOpen] = useState(false);

  if (item.children) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setSubOpen(true)}
        onMouseLeave={() => setSubOpen(false)}
      >
        <button className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
          {item.label}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {subOpen && (
          <div className="absolute left-full top-0 ml-0.5 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[60]">
            {item.children.map((sub) => (
              <Link
                key={sub.label}
                href={sub.href ?? "#"}
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                {sub.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      onClick={onClose}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      {item.label}
    </Link>
  );
}

function NavDropdownItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
          item.isPrimary
            ? "bg-violet-600 text-white hover:bg-violet-700"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
        {item.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[190px] bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {item.children?.map((child) => (
            <DropdownItem key={child.label} item={child} onClose={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectModuleLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center gap-2 px-3 py-2">
          <Link href="/project-module" className="mr-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center bg-white">
              <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">Somikaron IT Ltd</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavDropdownItem key={item.label} item={item} />
            ))}
          </div>

          <div className="ml-2 flex items-center gap-1 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Modules..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Sun className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <UserCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-57px)]">{children}</main>
    </div>
  );
}
