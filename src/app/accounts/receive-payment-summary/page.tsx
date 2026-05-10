"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { accountsApi } from "@/lib/api";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Banknote, Loader2 } from "lucide-react";

interface SummaryRow {
  id: string;
  voucherNo: string;
  amount: number;
  date: string;
  project: string;
  description: string;
  status: string;
}

export default function ReceivePaymentSummaryPage() {
  const [receipts, setReceipts] = useState<SummaryRow[]>([]);
  const [payments, setPayments] = useState<SummaryRow[]>([]);
  const [totalReceipt, setTotalReceipt] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountsApi.getReceivePaymentSummary().then((r) => {
      setReceipts(r.data.data.receipts || []);
      setPayments(r.data.data.payments || []);
      setTotalReceipt(r.data.data.totalReceipt || 0);
      setTotalPayment(r.data.data.totalPayment || 0);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout title="Receive / Payment Summary" subtitle="Receipt and payment voucher summary like the reference PMS">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
          <p className="text-sm text-emerald-700 mb-1">Total Receipts</p>
          <p className="text-2xl font-bold text-emerald-800">৳{formatNumber(totalReceipt)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5">
          <p className="text-sm text-red-700 mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-red-800">৳{formatNumber(totalPayment)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-amber-500" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-600" /> Receipt Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={receipts as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "voucherNo", header: "Voucher" },
                  { key: "project", header: "Project" },
                  { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                  { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                  { key: "status", header: "Status" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Banknote className="w-4 h-4 text-red-600" /> Payment Summary</CardTitle></CardHeader>
            <CardContent className="p-0">
              <DataTable
                data={payments as unknown as Record<string, unknown>[]}
                columns={[
                  { key: "voucherNo", header: "Voucher" },
                  { key: "project", header: "Project" },
                  { key: "amount", header: "Amount", render: (v) => formatCurrency(v as number) },
                  { key: "date", header: "Date", render: (v) => formatDate(v as string) },
                  { key: "status", header: "Status" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
