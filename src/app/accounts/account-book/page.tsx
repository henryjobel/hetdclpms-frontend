"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { accountsApi } from "@/lib/api";
import { exportRowsToPdf, type ExportColumn } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  FileDown,
  Loader2,
  Plus,
  Wallet,
  X,
} from "lucide-react";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  type: string;
  balance: number;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface CashBookRow {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description?: string;
  balance: number;
  transDate: string;
  bankAccount: { id: string; name: string; bankName: string; type: string };
}

interface AccountBookRow extends CashBookRow {
  entryType: "Received" | "Payment";
  cashIn: number;
  cashOut: number;
  bankIn: number;
  bankOut: number;
  totalIn: number;
  totalOut: number;
}

interface AccountBookExportRow extends AccountBookRow {
  accountName: string;
}

const defaultForm = {
  entryType: "receipt",
  accountId: "",
  toAccountId: "",
  amount: "",
  transDate: "",
  description: "",
};

function isCashAccount(account?: { type?: string; bankName?: string; name?: string }) {
  const text = `${account?.type ?? ""} ${account?.bankName ?? ""} ${account?.name ?? ""}`.toLowerCase();
  return text.includes("cash");
}

function amountText(value: number) {
  return value ? formatCurrency(value) : "-";
}

function amountClass(value: number, color: "green" | "red" | "blue" | "amber" | "dark" = "dark") {
  if (!value) return "text-gray-400";
  const colors = {
    green: "text-green-700",
    red: "text-red-600",
    blue: "text-blue-700",
    amber: "text-amber-700",
    dark: "text-gray-900",
  };
  return `${colors[color]} font-semibold tabular-nums`;
}

export default function AccountBookPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [rows, setRows] = useState<CashBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [accountFilter, setAccountFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (accountFilter) params.bankAccountId = accountFilter;
      if (typeFilter) params.type = typeFilter;

      const [accountsRes, cashBookRes, chartRes] = await Promise.all([
        accountsApi.getBankAccounts(),
        accountsApi.getCashBook(params),
        accountsApi.getChart(),
      ]);
      setAccounts(accountsRes.data.data || []);
      setRows(cashBookRes.data.data.rows || []);
      setChartAccounts(chartRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, [accountFilter, typeFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const bookRows = useMemo<AccountBookRow[]>(() => {
    return rows.map((row) => {
      const cash = isCashAccount(row.bankAccount);
      const received = row.type === "credit";
      const cashIn = cash && received ? row.amount : 0;
      const cashOut = cash && !received ? row.amount : 0;
      const bankIn = !cash && received ? row.amount : 0;
      const bankOut = !cash && !received ? row.amount : 0;

      return {
        ...row,
        entryType: received ? "Received" : "Payment",
        cashIn,
        cashOut,
        bankIn,
        bankOut,
        totalIn: cashIn + bankIn,
        totalOut: cashOut + bankOut,
      };
    });
  }, [rows]);

  const totalReceived = bookRows.reduce((sum, row) => sum + row.totalIn, 0);
  const totalPayment = bookRows.reduce((sum, row) => sum + row.totalOut, 0);
  const totalCash = accounts.filter(isCashAccount).reduce((sum, account) => sum + account.balance, 0);
  const totalBank = accounts.filter((account) => !isCashAccount(account)).reduce((sum, account) => sum + account.balance, 0);
  const exportRows: AccountBookExportRow[] = bookRows.map((row) => ({
    ...row,
    accountName: `${row.bankAccount.name} (${row.bankAccount.type})`,
  }));

  const exportColumns: ExportColumn<AccountBookExportRow>[] = [
    { header: "Date", value: (row) => formatDate(row.transDate) },
    { header: "Type", value: (row) => row.entryType },
    { header: "Particulars", value: (row) => row.description || "-" },
    { header: "Account", value: (row) => row.accountName },
    { header: "Cash In", value: (row) => row.cashIn || "" },
    { header: "Cash Out", value: (row) => row.cashOut || "" },
    { header: "Bank In", value: (row) => row.bankIn || "" },
    { header: "Bank Out", value: (row) => row.bankOut || "" },
    { header: "Total In", value: (row) => row.totalIn || "" },
    { header: "Total Out", value: (row) => row.totalOut || "" },
    { header: "Balance", value: (row) => row.balance },
  ];

  function getLedgerAccountId(accountId: string) {
    const account = accounts.find((item) => item.id === accountId);
    const accountType = isCashAccount(account) ? "CASH" : "BANK";
    return chartAccounts.find((item) => item.type === accountType)?.id;
  }

  function handleDownloadPdf() {
    exportRowsToPdf({
      filename: "account-book.pdf",
      title: "Account Book",
      subtitle: "Cash, bank, receipt, payment and contra register",
      columns: exportColumns,
      rows: exportRows,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount || 0);
    if (amount <= 0) return;

    setSaving(true);
    try {
      const transDate = form.transDate ? new Date(form.transDate).toISOString() : undefined;
      const description = form.description || (
        form.entryType === "receipt"
          ? "Payment received"
          : form.entryType === "payment"
            ? "Payment made"
            : "Contra entry"
      );

      if (form.entryType === "contra") {
        const fromAccount = accounts.find((account) => account.id === form.accountId);
        const toAccount = accounts.find((account) => account.id === form.toAccountId);
        const fromLedgerAccountId = getLedgerAccountId(form.accountId);
        const toLedgerAccountId = getLedgerAccountId(form.toAccountId);
        await Promise.all([
          accountsApi.createBankTransaction({
            bankAccountId: form.accountId,
            type: "debit",
            amount,
            transDate,
            description: `${description} - transfer to ${toAccount?.name ?? "account"}`,
          }),
          accountsApi.createBankTransaction({
            bankAccountId: form.toAccountId,
            type: "credit",
            amount,
            transDate,
            description: `${description} - transfer from ${fromAccount?.name ?? "account"}`,
          }),
          accountsApi.createVoucher({
            type: "CONTRA",
            amount,
            description,
            entries: [],
            debitAccountId: toLedgerAccountId,
            creditAccountId: fromLedgerAccountId,
          }),
        ]);
      } else {
        const isReceipt = form.entryType === "receipt";
        const selectedLedgerAccountId = getLedgerAccountId(form.accountId);
        await accountsApi.createBankTransaction({
          bankAccountId: form.accountId,
          type: isReceipt ? "credit" : "debit",
          amount,
          transDate,
          description,
        });
        await accountsApi.createVoucher({
          type: isReceipt ? "RECEIPT" : "PAYMENT",
          amount,
          description,
          entries: [],
          debitAccountId: isReceipt ? selectedLedgerAccountId : undefined,
          creditAccountId: isReceipt ? undefined : selectedLedgerAccountId,
        });
      }

      setShowModal(false);
      setForm(defaultForm);
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout title="Account Book" subtitle="Joma, khoroch and contra entries in one cash-bank register">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Received" value={formatCurrency(totalReceived)} icon={ArrowDownLeft} iconColor="text-green-600" iconBg="bg-green-50" />
        <StatCard title="Payment" value={formatCurrency(totalPayment)} icon={ArrowUpRight} iconColor="text-red-600" iconBg="bg-red-50" />
        <StatCard title="Cash Balance" value={formatCurrency(totalCash)} icon={Wallet} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Bank Balance" value={formatCurrency(totalBank)} icon={Building2} iconColor="text-blue-600" iconBg="bg-blue-50" />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" /> Account Book
          </CardTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={loading || bookRows.length === 0}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-red-500" /> PDF
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> New Entry
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="">All cash and bank accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>
              ))}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value="">All entries</option>
              <option value="credit">Received only</option>
              <option value="debit">Payment only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Register</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="w-[92px] px-3 py-3 text-left font-semibold uppercase">Date</th>
                    <th className="w-[98px] px-3 py-3 text-left font-semibold uppercase">Type</th>
                    <th className="w-[220px] px-3 py-3 text-left font-semibold uppercase">Particulars</th>
                    <th className="w-[190px] px-3 py-3 text-left font-semibold uppercase">Account</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Cash In</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Cash Out</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Bank In</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Bank Out</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Total In</th>
                    <th className="w-[92px] px-3 py-3 text-right font-semibold uppercase">Total Out</th>
                    <th className="sticky right-0 z-10 w-[108px] px-3 py-3 text-right font-semibold uppercase bg-slate-900">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {bookRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">No account entries found</td>
                    </tr>
                  ) : (
                    bookRows.map((row) => (
                      <tr key={row.id} className="align-top hover:bg-amber-50/40">
                        <td className="px-3 py-3 text-gray-600">{formatDate(row.transDate)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${row.entryType === "Received" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                            {row.entryType}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-medium text-gray-900">
                          <span className="line-clamp-2">{row.description || "-"}</span>
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          <span className="line-clamp-2">{row.bankAccount.name} ({row.bankAccount.type})</span>
                        </td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.cashIn, "green")}`}>{amountText(row.cashIn)}</td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.cashOut, "red")}`}>{amountText(row.cashOut)}</td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.bankIn, "green")}`}>{amountText(row.bankIn)}</td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.bankOut, "red")}`}>{amountText(row.bankOut)}</td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.totalIn, "blue")}`}>{amountText(row.totalIn)}</td>
                        <td className={`px-3 py-3 text-right ${amountClass(row.totalOut, "amber")}`}>{amountText(row.totalOut)}</td>
                        <td className="sticky right-0 z-10 px-3 py-3 text-right font-bold tabular-nums text-gray-900 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.8)]">
                          {formatCurrency(Number(row.balance || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">New Account Entry</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["receipt", "Received", ArrowDownLeft],
                  ["payment", "Payment", ArrowUpRight],
                  ["contra", "Contra", ArrowLeftRight],
                ].map(([value, label, Icon]) => {
                  const ActiveIcon = Icon as typeof ArrowDownLeft;
                  return (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setForm({ ...form, entryType: String(value), toAccountId: "" })}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border ${form.entryType === value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-600"}`}
                    >
                      <ActiveIcon className="w-4 h-4" /> {String(label)}
                    </button>
                  );
                })}
              </div>

              <select required value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                <option value="">{form.entryType === "contra" ? "Transfer from account" : "Select cash/bank account"}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>
                ))}
              </select>

              {form.entryType === "contra" && (
                <select required value={form.toAccountId} onChange={(event) => setForm({ ...form, toAccountId: event.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="">Transfer to account</option>
                  {accounts.filter((account) => account.id !== form.accountId).map((account) => (
                    <option key={account.id} value={account.id}>{account.name} - {account.accountNo}</option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <input type="date" value={form.transDate} onChange={(event) => setForm({ ...form, transDate: event.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>

              <input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Particulars / note" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg">
                  {saving && <Loader2 className="w-3.5 h-3.5 inline animate-spin mr-2" />}Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
