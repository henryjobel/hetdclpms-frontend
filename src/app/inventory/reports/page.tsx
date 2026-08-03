"use client";
import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { billsApi, inventoryApi, reportsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AlertTriangle, Download, FileText, Loader2, Package, Receipt, ShoppingCart, Truck } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
  supplier?: { name: string };
}

interface Requisition {
  id: string;
  status: string;
  requestedBy: string;
  createdAt: string;
  project?: { name: string };
  items?: Array<{ quantity: number }>;
}

interface RFQ {
  id: string;
  status: string;
  quotedAmount?: number;
  project?: { name: string };
  supplier?: { name: string };
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  project?: { name: string };
  supplier: { name: string };
}

interface GRN {
  id: string;
  grnNumber: string;
  status: string;
  receivedDate: string;
  po: { poNumber: string; supplier: { name: string } };
  items: Array<{ acceptedQty: number; damagedQty: number }>;
}

interface Bill {
  id: string;
  billNumber: string;
  amount: number;
  status: string;
  billDate: string;
  supplier?: { name: string };
}

export default function InventoryReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [productRes, reqRes, rfqRes, poRes, grnRes, billRes] = await Promise.all([
          inventoryApi.getProducts(),
          inventoryApi.getRequisitions(),
          inventoryApi.getRFQs(),
          inventoryApi.getPurchaseOrders(),
          inventoryApi.getGRNs(),
          billsApi.getAll(),
        ]);
        setProducts(productRes.data.data || []);
        setRequisitions(reqRes.data.data || []);
        setRFQs(rfqRes.data.data || []);
        setPurchaseOrders(poRes.data.data || []);
        setGRNs(grnRes.data.data || []);
        setBills((billRes.data.data || []).filter((bill: Bill) => bill.supplier));
      } catch {
        setProducts([]);
        setRequisitions([]);
        setRFQs([]);
        setPurchaseOrders([]);
        setGRNs([]);
        setBills([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function exportCsv(type: string, filename: string) {
    const response = await reportsApi.exportCsv(type);
    const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  const stockValue = products.reduce((sum, product) => sum + product.stock * product.purchasePrice, 0);
  const lowStock = products.filter((product) => product.stock <= product.minStock);
  const pendingReq = requisitions.filter((item) => item.status === "PENDING").length;
  const poValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
  const billDue = bills.filter((bill) => bill.status !== "paid").reduce((sum, bill) => sum + bill.amount, 0);
  const damagedQty = grns.flatMap((grn) => grn.items || []).reduce((sum, item) => sum + item.damagedQty, 0);

  const categoryRows = useMemo(() => {
    const map: Record<string, { category: string; items: number; stock: number; value: number }> = {};
    products.forEach((product) => {
      if (!map[product.category]) map[product.category] = { category: product.category, items: 0, stock: 0, value: 0 };
      map[product.category].items += 1;
      map[product.category].stock += product.stock;
      map[product.category].value += product.stock * product.purchasePrice;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [products]);

  const procurementRows = [
    { stage: "Material Requisition", count: requisitions.length, pending: pendingReq, value: 0 },
    { stage: "RFQ", count: rfqs.length, pending: rfqs.filter((item) => item.status === "PENDING").length, value: rfqs.reduce((sum, item) => sum + Number(item.quotedAmount || 0), 0) },
    { stage: "Purchase Order", count: purchaseOrders.length, pending: purchaseOrders.filter((item) => ["DRAFT", "SENT"].includes(item.status)).length, value: poValue },
    { stage: "Goods Receipt Note", count: grns.length, pending: grns.filter((item) => item.status !== "RECEIVED").length, value: 0 },
    { stage: "Purchase Bill", count: bills.length, pending: bills.filter((item) => item.status !== "paid").length, value: bills.reduce((sum, item) => sum + item.amount, 0) },
  ];

  return (
    <MainLayout title="Inventory Reports" subtitle="Stock, purchase, requisition, RFQ, PO, GRN and bill reporting">
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => exportCsv("inventory", "inventory.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 text-amber-500" /> Export Stock
        </button>
        <button onClick={() => exportCsv("grn", "grn.csv")} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4 text-amber-500" /> Export GRN
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Stock Value" value={formatCurrency(stockValue)} icon={Package} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Low Stock" value={lowStock.length} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="PO Value" value={formatCurrency(poValue)} icon={ShoppingCart} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Purchase Due" value={formatCurrency(billDue)} icon={Receipt} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="w-4 h-4 text-amber-600" /> Stock By Category</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={categoryRows as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "category", header: "Category" },
                  { key: "items", header: "Items" },
                  { key: "stock", header: "Stock Qty" },
                  { key: "value", header: "Stock Value", render: (value: unknown) => formatCurrency(Number(value)) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-600" /> Procurement Pipeline</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={procurementRows as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "stage", header: "Stage" },
                  { key: "count", header: "Total" },
                  { key: "pending", header: "Pending/Open" },
                  { key: "value", header: "Value", render: (value: unknown) => formatCurrency(Number(value)) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-600" /> Recent GRN</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={grns.slice(0, 10) as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "grnNumber", header: "GRN No" },
                  { key: "po", header: "PO", render: (_value: unknown, row: Record<string, unknown>) => (row.po as { poNumber?: string })?.poNumber ?? "-" },
                  { key: "po", header: "Supplier", render: (_value: unknown, row: Record<string, unknown>) => (row.po as { supplier?: { name?: string } })?.supplier?.name ?? "-" },
                  { key: "receivedDate", header: "Received", render: (value: unknown) => formatDate(String(value)) },
                  { key: "status", header: "Status" },
                ]}
              />
              <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
                Damaged quantity recorded: <span className="font-semibold text-red-600">{damagedQty}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
