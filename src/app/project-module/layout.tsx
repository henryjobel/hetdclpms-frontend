"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  ChevronDown, ChevronRight, Search, Settings, Bell,
  LayoutGrid, Folder, ClipboardList, Receipt,
  Landmark, Phone, TrendingUp, DraftingCompass,
  Loader2, UserCircle,
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
  children?: NavChild[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Project Setup",
    icon: Folder,
    children: [
      { label: "Project Type", href: "/project-module/project-type" },
      { label: "Project List", href: "/project-module" },
      { label: "Site", href: "/project-module/site" },
      { label: "Documents", href: "/project-module/documents" },
    ],
  },
  {
    label: "Land / Owner",
    icon: Landmark,
    children: [
      { label: "Land Owner Info", href: "/project-module/flat-land/land-list" },
      { label: "Deed / Mutation / Approval", href: "/project-module/documents" },
      { label: "Developer Agreement", href: "/project-module/documents" },
      { label: "Owner vs Developer Share", href: "/project-module/share-project/assign-share" },
    ],
  },
  {
    label: "Design & Approval",
    icon: DraftingCompass,
    children: [
      { label: "Architects & Consultants", href: "/project-module/design/consultants" },
      { label: "Design Contract / Fee", href: "/project-module/design/contract-fee" },
      { label: "Drawing Submission", href: "/project-module/design/drawing-submission" },
      { label: "Drawing Approval Status", href: "/project-module/design/approval-status" },
      { label: "Structural / MEP / Soil Test", href: "/project-module/design/structural-mep-soil" },
      { label: "Approval Document Upload", href: "/project-module/design/approval-documents" },
      { label: "Design Payment Tracking", href: "/project-module/design/payments" },
      { label: "All Design Records", href: "/project-module/design/records" },
    ],
  },
  {
    label: "Contact",
    icon: Phone,
    children: [
      { label: "Customer Accounts", href: "/project-module/contact/customer-accounts" },
      { label: "Supplier Accounts", href: "/project-module/contact/supplier-accounts" },
      { label: "Labour / Worker", href: "/project-module/contact/labour" },
      { label: "Contractor", href: "/project-module/contact/contractors" },
    ],
  },
  {
    label: "Construction Ops",
    icon: ClipboardList,
    children: [
      { label: "BOQ", href: "/project-module/billing/boq" },
      { label: "Work Order", href: "/project-module/billing/work-order" },
      { label: "Contractor Work Order", href: "/project-module/billing/contractor-work-order" },
      { label: "Quote", href: "/project-module/billing/quote" },
      { label: "Project Reports", href: "/project-module/reports" },
    ],
  },
  {
    label: "Procurement",
    icon: ClipboardList,
    children: [
      { label: "Material Requisition", href: "/project-module/requisition/material" },
      { label: "Service/Work Requisition", href: "/project-module/requisition/service" },
      { label: "Fund Requisition", href: "/project-module/requisition/fund" },
      { label: "Fund Requisition Report", href: "/project-module/requisition/fund-report" },
    ],
  },
  {
    label: "Billing & Finance",
    icon: Receipt,
    children: [
      { label: "Bill/Invoice", href: "/project-module/billing/bill-invoice" },
      { label: "Contractor Bill", href: "/project-module/billing/contractor-bill" },
      { label: "Labour/Worker Bill", href: "/project-module/billing/labour-worker-bill" },
      { label: "Period Billing", href: "/project-module/billing/period" },
      { label: "Adjustment Billing", href: "/project-module/billing/adjustment" },
      {
        label: "Configuration",
        children: [
          { label: "Category", href: "/project-module/billing/config/category" },
          { label: "Bill Item", href: "/project-module/billing/config/bill-item" },
          { label: "BOQ Title", href: "/project-module/billing/config/boq-title" },
          { label: "Service/Work Name", href: "/project-module/billing/config/service-work-name" },
        ],
      },
    ],
  },
  {
    label: "Real Estate",
    icon: Landmark,
    children: [
      { label: "Flat / Unit", href: "/project-module/flat-land/flat" },
      {
        label: "Land Setup",
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
    label: "Investment & Share",
    icon: TrendingUp,
    children: [
      { label: "Investor", href: "/project-module/investment/investor" },
      { label: "Investment Configuration", href: "/project-module/investment/configuration" },
      { label: "Assign Share", href: "/project-module/share-project/assign-share" },
      { label: "Share Report", href: "/project-module/share-project/share-report" },
      { label: "Penalty Report", href: "/project-module/share-project/penalty-report" },
      { label: "ShareHolder Point Report", href: "/project-module/share-project/shareholder-point-report" },
      { label: "Project Share Configuration", href: "/project-module/share-project/configuration" },
    ],
  },
];

function getChildLinks(items: NavChild[] = []): Array<{ label: string; href: string }> {
  return items.flatMap((item) => {
    const current = item.href ? [{ label: item.label, href: item.href }] : [];
    return [...current, ...getChildLinks(item.children)];
  });
}

const MODULE_LINKS = NAV_ITEMS.flatMap((item) =>
  getChildLinks(item.children).map((child) => ({
    ...child,
    group: item.label,
  }))
);

function hasActiveChild(items: NavChild[] | undefined, pathname: string): boolean {
  return Boolean(items?.some((item) => {
    if (item.href === pathname) return true;
    if (item.href && item.href !== "/project-module" && pathname.startsWith(`${item.href}/`)) return true;
    return hasActiveChild(item.children, pathname);
  }));
}

function DropdownItem({ item, onClose, pathname }: { item: NavChild; onClose: () => void; pathname: string }) {
  const [subOpen, setSubOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = hasActiveChild([item], pathname);

  function openSubmenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSubOpen(true);
  }

  function closeSubmenuSoon() {
    closeTimer.current = setTimeout(() => setSubOpen(false), 180);
  }

  if (item.children) {
    return (
      <div
        className="relative"
        onMouseEnter={openSubmenu}
        onMouseLeave={closeSubmenuSoon}
      >
        <button className={cn(
          "w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50",
          active ? "text-violet-700 bg-violet-50" : "text-gray-700"
        )}>
          {item.label}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {subOpen && (
          <div className="absolute left-full top-0 w-52 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-[60]">
            {item.children.map((sub) => (
              <Link
                key={sub.label}
                href={sub.href ?? "#"}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50",
                  sub.href === pathname ? "text-violet-700 bg-violet-50" : "text-gray-700"
                )}
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
      className={cn(
        "block px-4 py-2 text-sm hover:bg-gray-50",
        item.href === pathname ? "text-violet-700 bg-violet-50 font-medium" : "text-gray-700"
      )}
    >
      {item.label}
    </Link>
  );
}

function NavDropdownItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = hasActiveChild(item.children, pathname);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeMenuSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 220);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenuSoon}
    >
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
          active
            ? "bg-violet-600 text-white hover:bg-violet-700"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
        {item.label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 min-w-[190px] bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {item.children?.map((child) => (
            <DropdownItem key={child.label} item={child} pathname={pathname} onClose={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectModuleLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const searchResults = search.trim()
    ? MODULE_LINKS.filter((item) => `${item.group} ${item.label}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : [];

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

          <div className="flex items-center gap-1 flex-1 flex-wrap overflow-visible">
            {NAV_ITEMS.map((item) => (
              <NavDropdownItem key={item.label} item={item} pathname={pathname} />
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
              {searchResults.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                  {searchResults.map((item) => (
                    <Link
                      key={`${item.group}-${item.href}`}
                      href={item.href}
                      onClick={() => setSearch("")}
                      className="block px-3 py-2 hover:bg-violet-50"
                    >
                      <span className="block text-[11px] text-gray-400">{item.group}</span>
                      <span className="block text-sm text-gray-700">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/settings" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </Link>
            <Link href="/" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Dashboard">
              <LayoutGrid className="w-4 h-4" />
            </Link>
            <Link href="/accounts/pending-approvals" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Pending Approvals">
              <Bell className="w-4 h-4" />
            </Link>
            <Link href="/users" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" title="Users">
              <UserCircle className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-57px)]">{children}</main>
    </div>
  );
}
