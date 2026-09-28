"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { accountsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BookOpen,
  Building2,
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

export default function AccountBookPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
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

      const [accountsRes, cashBookRes] = await Promise.all([
        accountsApi.getBankAccounts(),
        accountsApi.getCashBook(params),
      ]);
      setAccounts(accountsRes.data.data || []);
      setRows(cashBookRes.data.data.rows || []);
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
          }),
        ]);
      } else {
        const isReceipt = form.entryType === "receipt";
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" /> Account Book
          </CardTitle>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium">
            <Plus className="w-4 h-4" /> New Entry
          </button>
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
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <DataTable
              data={bookRows as unknown as Record<string, unknown>[]}
              columns={[
                { key: "transDate", header: "Date", render: (value) => formatDate(String(value)) },
                { key: "entryType", header: "Type", render: (value) => (
                  <span className={value === "Received" ? "text-green-700 font-medium" : "text-red-600 font-medium"}>{String(value)}</span>
                ) },
                { key: "description", header: "Particulars", render: (value) => String(value || "-") },
                { key: "bankAccount", header: "Account", render: (_value, row) => {
                  const account = (row as unknown as AccountBookRow).bankAccount;
                  return `${account.name} (${account.type})`;
                } },
                { key: "cashIn", header: "Cash In", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "cashOut", header: "Cash Out", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "bankIn", header: "Bank In", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "bankOut", header: "Bank Out", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "totalIn", header: "Total In", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "totalOut", header: "Total Out", render: (value) => Number(value) ? formatCurrency(Number(value)) : "-" },
                { key: "balance", header: "Balance", render: (value) => formatCurrency(Number(value || 0)) },
              ]}
            />
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
