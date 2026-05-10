"use client";
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mastersApi } from "@/lib/api";
import { Building2, Loader2, Save } from "lucide-react";

const defaultForm = {
  companyName: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  taxId: "",
  tradeLicense: "",
};

export function CompanyProfilePage() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mastersApi.getCompanyProfile().then((response) => {
      setForm({ ...defaultForm, ...(response.data.data || {}) });
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await mastersApi.saveCompanyProfile(form);
    } finally {
      setSaving(false);
    }
  }

  return (
    <MainLayout title="Company" subtitle="Maintain core company profile, registration and contact settings">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-amber-600" /></div>
            <div>
              <CardTitle>Company Profile</CardTitle>
              <p className="text-xs text-gray-400 mt-1">Used by admin screens, invoice setup and reporting references.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(form).map(([key, value]) => (
                <div key={key} className={key === "address" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    value={value}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Company Profile
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
