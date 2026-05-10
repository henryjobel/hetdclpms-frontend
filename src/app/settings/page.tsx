"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, reportsApi, settingsApi } from "@/lib/api";
import { Building2, Bell, Shield, Database, Palette, Check, FileText, BarChart3 } from "lucide-react";

type Section = "company" | "notifications" | "preferences" | "invoice" | "reports" | "security" | "backup";

const navItems: { id: Section; icon: React.ElementType; label: string }[] = [
  { id: "company", icon: Building2, label: "Company Info" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "preferences", icon: Palette, label: "Preferences" },
  { id: "invoice", icon: FileText, label: "Invoice Setup" },
  { id: "reports", icon: BarChart3, label: "Report Setup" },
  { id: "security", icon: Shield, label: "Security" },
  { id: "backup", icon: Database, label: "Backup & Data" },
];

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("company");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState({
    name: "HET Real Estate & Construction",
    address: "Gulshan-2, Dhaka-1212, Bangladesh",
    phone: "+880 1700-000000",
    email: "info@hetpms.com",
    tin: "123456789",
  });

  const [notifications, setNotifications] = useState({
    lowStock: true,
    overdueInstallment: true,
    voucherApproval: false,
    dailySummary: true,
    projectMilestone: true,
  });

  const [preferences, setPreferences] = useState({
    currency: "BDT (Tk)",
    dateFormat: "DD/MM/YYYY",
    fyStart: "July",
  });

  const [invoice, setInvoice] = useState({
    prefix: "INV",
    quotePrefix: "QT",
    billPrefix: "BL",
    workOrderPrefix: "WO",
  });

  const [reportSetup, setReportSetup] = useState({
    showLogo: true,
    footerText: "System generated report",
    defaultFormat: "PDF",
  });

  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [securityError, setSecurityError] = useState("");

  useEffect(() => {
    settingsApi.getSystem()
      .then((response) => {
        const data = response.data.data || {};
        if (data.company) setCompany(data.company);
        if (data.notifications) setNotifications(data.notifications);
        if (data.preferences) setPreferences(data.preferences);
        if (data.invoice) setInvoice(data.invoice);
        if (data.reports) setReportSetup(data.reports);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    await settingsApi.saveSystem({
      company,
      notifications,
      preferences,
      invoice,
      reports: reportSetup,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDownload(type: string, filename: string) {
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

  async function handleSecuritySave(e: React.FormEvent) {
    e.preventDefault();
    setSecurityError("");
    if (security.newPassword !== security.confirmPassword) {
      setSecurityError("New passwords do not match");
      return;
    }
    if (security.newPassword.length < 6) {
      setSecurityError("Password must be at least 6 characters");
      return;
    }

    try {
      await authApi.changePassword(security.currentPassword, security.newPassword);
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setSecurityError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update password");
    }
  }

  return (
    <MainLayout title="Settings" subtitle="System configuration and preferences">
      {loading ? (
        <div className="flex justify-center py-20 text-sm text-gray-400">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-3">
                {navItems.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setActive(id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                      active === id ? "bg-amber-50 text-amber-700 font-medium" : "text-gray-700 hover:bg-gray-100"
                    }`}>
                    <Icon className={`w-4 h-4 ${active === id ? "text-amber-600" : "text-gray-500"}`} />
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {active === "company" && (
              <SettingsCard title="Company Information" subtitle="Update company name, address, and contact details" icon={Building2}>
                {[
                  { label: "Company Name", key: "name" as const, type: "text" },
                  { label: "Company Address", key: "address" as const, type: "text" },
                  { label: "Phone", key: "phone" as const, type: "text" },
                  { label: "Email", key: "email" as const, type: "email" },
                  { label: "TIN Number", key: "tin" as const, type: "text" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
                    <input type={type} value={company[key]} onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
                  </div>
                ))}
                <SaveButton saved={saved} onClick={handleSave} />
              </SettingsCard>
            )}

            {active === "notifications" && (
              <SettingsCard title="Notifications" subtitle="Configure notification preferences and alerts" icon={Bell}>
                {([
                  { key: "lowStock" as const, label: "Low stock alerts" },
                  { key: "overdueInstallment" as const, label: "Overdue installment alerts" },
                  { key: "voucherApproval" as const, label: "Voucher approval notifications" },
                  { key: "dailySummary" as const, label: "Daily summary report" },
                  { key: "projectMilestone" as const, label: "Project milestone alerts" },
                ] as const).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{label}</span>
                    <button onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${notifications[key] ? "bg-amber-500" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
                <SaveButton saved={saved} onClick={handleSave} />
              </SettingsCard>
            )}

            {active === "preferences" && (
              <SettingsCard title="System Preferences" subtitle="Customize system behavior and defaults" icon={Palette}>
                <SelectField label="Default Currency" value={preferences.currency} onChange={(value) => setPreferences({ ...preferences, currency: value })}
                  options={["BDT (Tk)", "USD ($)", "EUR (€)"]} />
                <SelectField label="Date Format" value={preferences.dateFormat} onChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                  options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
                <SelectField label="Financial Year Start" value={preferences.fyStart} onChange={(value) => setPreferences({ ...preferences, fyStart: value })}
                  options={["January","February","March","April","May","June","July","August","September","October","November","December"]} />
                <SaveButton saved={saved} onClick={handleSave} />
              </SettingsCard>
            )}

            {active === "invoice" && (
              <SettingsCard title="Invoice Setup" subtitle="Configure numbering prefixes for commercial documents" icon={FileText}>
                <InputField label="Invoice Prefix" value={invoice.prefix} onChange={(value) => setInvoice({ ...invoice, prefix: value })} />
                <InputField label="Quotation Prefix" value={invoice.quotePrefix} onChange={(value) => setInvoice({ ...invoice, quotePrefix: value })} />
                <InputField label="Bill Prefix" value={invoice.billPrefix} onChange={(value) => setInvoice({ ...invoice, billPrefix: value })} />
                <InputField label="Work Order Prefix" value={invoice.workOrderPrefix} onChange={(value) => setInvoice({ ...invoice, workOrderPrefix: value })} />
                <SaveButton saved={saved} onClick={handleSave} />
              </SettingsCard>
            )}

            {active === "reports" && (
              <SettingsCard title="Report Setup" subtitle="Configure report output, branding and footer text" icon={BarChart3}>
                <div className="flex items-center justify-between py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-700">Show Company Logo in Reports</span>
                  <button onClick={() => setReportSetup({ ...reportSetup, showLogo: !reportSetup.showLogo })}
                    className={`w-10 h-5 rounded-full relative transition-colors ${reportSetup.showLogo ? "bg-amber-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${reportSetup.showLogo ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <InputField label="Footer Text" value={reportSetup.footerText} onChange={(value) => setReportSetup({ ...reportSetup, footerText: value })} />
                <SelectField label="Default Export Format" value={reportSetup.defaultFormat} onChange={(value) => setReportSetup({ ...reportSetup, defaultFormat: value })}
                  options={["PDF", "CSV", "EXCEL"]} />
                <SaveButton saved={saved} onClick={handleSave} />
              </SettingsCard>
            )}

            {active === "security" && (
              <SettingsCard title="Security" subtitle="Change your account password" icon={Shield}>
                <form onSubmit={handleSecuritySave} className="space-y-4">
                  {securityError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{securityError}</p>}
                  <InputField label="Current Password" type="password" value={security.currentPassword} onChange={(value) => setSecurity({ ...security, currentPassword: value })} />
                  <InputField label="New Password" type="password" value={security.newPassword} onChange={(value) => setSecurity({ ...security, newPassword: value })} />
                  <InputField label="Confirm New Password" type="password" value={security.confirmPassword} onChange={(value) => setSecurity({ ...security, confirmPassword: value })} />
                  <SaveButton saved={saved} label="Update Password" />
                </form>
              </SettingsCard>
            )}

            {active === "backup" && (
              <SettingsCard title="Backup & Data" subtitle="Export and manage system data" icon={Database}>
                <p className="text-sm text-gray-600">Export your data for backup or migration purposes.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Export Projects (CSV)", type: "projects", filename: "projects.csv" },
                    { label: "Export Financial Data (CSV)", type: "financial", filename: "financial.csv" },
                    { label: "Export Inventory (CSV)", type: "inventory", filename: "inventory.csv" },
                    { label: "Export Installments (CSV)", type: "installments", filename: "installments.csv" },
                  ].map((item) => (
                    <button key={item.type} onClick={() => handleDownload(item.type, item.filename)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 text-left transition-colors">
                      {item.label}
                    </button>
                  ))}
                </div>
              </SettingsCard>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

function SettingsCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function InputField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400" />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function SaveButton({ saved, onClick, label = "Save Changes" }: { saved: boolean; onClick?: () => void; label?: string }) {
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
        saved ? "bg-green-500 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"
      }`}>
      {saved && <Check className="w-3.5 h-3.5" />}
      {saved ? "Saved!" : label}
    </button>
  );
}
