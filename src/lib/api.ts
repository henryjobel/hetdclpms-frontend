import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("het_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("het_token");
      localStorage.removeItem("het_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/api/auth/change-password", { currentPassword, newPassword }),
};

// ── Dashboard ────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get("/api/accounts/dashboard-summary"),
};

// ── Projects ─────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get("/api/projects", { params }),
  getById: (id: string) => api.get(`/api/projects/${id}`),
  create: (data: unknown) => api.post("/api/projects", data),
  update: (id: string, data: unknown) => api.put(`/api/projects/${id}`, data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  getBOQ: (projectId: string) => api.get(`/api/projects/${projectId}/boq`),
  createBOQ: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/boq`, data),
  getTasks: (projectId: string) => api.get(`/api/projects/${projectId}/tasks`),
  createTask: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/tasks`, data),
  updateTask: (projectId: string, taskId: string, data: unknown) => api.patch(`/api/projects/${projectId}/tasks/${taskId}`, data),
  getProgress: (projectId: string) => api.get(`/api/projects/${projectId}/progress`),
  createProgress: (projectId: string, data: unknown) => api.post(`/api/projects/${projectId}/progress`, data),
  deleteBOQItem: (itemId: string) => api.delete(`/api/projects/boq/${itemId}`),
  deleteTask: (projectId: string, taskId: string) => api.delete(`/api/projects/${projectId}/tasks/${taskId}`),
  getQuotations: () => api.get("/api/projects/quotations/all"),
  createQuotation: (data: unknown) => api.post("/api/projects/quotations", data),
  updateQuotation: (id: string, data: unknown) => api.put(`/api/projects/quotations/${id}`, data),
  deleteQuotation: (id: string) => api.delete(`/api/projects/quotations/${id}`),
  getWorkOrders: () => api.get("/api/projects/work-orders/all"),
  createWorkOrder: (data: unknown) => api.post("/api/projects/work-orders", data),
  updateWorkOrder: (id: string, data: unknown) => api.put(`/api/projects/work-orders/${id}`, data),
  deleteWorkOrder: (id: string) => api.delete(`/api/projects/work-orders/${id}`),
};

// ── Workers ──────────────────────────────────────────────────────────
export const workersApi = {
  getAll: () => api.get("/api/workers"),
  create: (data: unknown) => api.post("/api/workers", data),
  update: (id: string, data: unknown) => api.put(`/api/workers/${id}`, data),
  delete: (id: string) => api.delete(`/api/workers/${id}`),
  attendance: (id: string, data: unknown) =>
    api.post(`/api/workers/${id}/attendance`, data),
};

// ── Contractors ──────────────────────────────────────────────────────
export const contractorsApi = {
  getAll: () => api.get("/api/contractors"),
  create: (data: unknown) => api.post("/api/contractors", data),
  update: (id: string, data: unknown) =>
    api.put(`/api/contractors/${id}`, data),
  delete: (id: string) => api.delete(`/api/contractors/${id}`),
  assign: (id: string, data: unknown) =>
    api.post(`/api/contractors/${id}/assign`, data),
  pay: (assignmentId: string, amount: number) =>
    api.post(`/api/contractors/assignments/${assignmentId}/pay`, { amount }),
};

// ── Bills ────────────────────────────────────────────────────────────
export const billsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get("/api/bills", { params }),
  create: (data: unknown) => api.post("/api/bills", data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/api/bills/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/bills/${id}`),
};

// ── Inventory ────────────────────────────────────────────────────────
export const inventoryApi = {
  getProducts: (params?: Record<string, string>) =>
    api.get("/api/inventory/products", { params }),
  createProduct: (data: unknown) => api.post("/api/inventory/products", data),
  updateProduct: (id: string, data: unknown) =>
    api.put(`/api/inventory/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/api/inventory/products/${id}`),
  adjustStock: (id: string, data: unknown) =>
    api.post(`/api/inventory/products/${id}/adjustment`, data),
  getSuppliers: () => api.get("/api/inventory/suppliers"),
  createSupplier: (data: unknown) =>
    api.post("/api/inventory/suppliers", data),
  getRequisitions: (params?: Record<string, string>) =>
    api.get("/api/inventory/requisitions", { params }),
  createRequisition: (data: unknown) =>
    api.post("/api/inventory/requisitions", data),
  updateRequisitionStatus: (id: string, status: string) =>
    api.patch(`/api/inventory/requisitions/${id}/status`, { status }),
  getRFQs: () => api.get("/api/inventory/rfqs"),
  createRFQ: (data: unknown) => api.post("/api/inventory/rfqs", data),
  updateRFQ: (id: string, data: unknown) => api.put(`/api/inventory/rfqs/${id}`, data),
  getRFQComparison: (params?: Record<string, string>) => api.get("/api/inventory/rfqs/comparison", { params }),
  selectRFQ: (id: string) => api.patch(`/api/inventory/rfqs/${id}/select`),
  getPurchaseOrders: () => api.get("/api/inventory/purchase-orders"),
  createPurchaseOrder: (data: unknown) =>
    api.post("/api/inventory/purchase-orders", data),
  updatePurchaseOrderStatus: (id: string, status: string) =>
    api.patch(`/api/inventory/purchase-orders/${id}/status`, { status }),
  getGRNs: () => api.get("/api/inventory/grns"),
  createGRN: (data: unknown) => api.post("/api/inventory/grns", data),
  getAdjustments: () => api.get("/api/inventory/adjustments"),
  deleteRequisition: (id: string) => api.delete(`/api/inventory/requisitions/${id}`),
  deleteRFQ: (id: string) => api.delete(`/api/inventory/rfqs/${id}`),
  deletePurchaseOrder: (id: string) => api.delete(`/api/inventory/purchase-orders/${id}`),
};

// ── Accounts ─────────────────────────────────────────────────────────
export const accountsApi = {
  getChart: () => api.get("/api/accounts/chart"),
  createAccount: (data: unknown) => api.post("/api/accounts/chart", data),
  getVouchers: (params?: Record<string, string>) =>
    api.get("/api/accounts/vouchers", { params }),
  createVoucher: (data: unknown) => api.post("/api/accounts/vouchers", data),
  approveVoucher: (id: string) =>
    api.patch(`/api/accounts/vouchers/${id}/approve`),
  getLedger: (params?: Record<string, string>) =>
    api.get("/api/accounts/ledger", { params }),
  getInstallments: () => api.get("/api/accounts/installments"),
  createInstallment: (data: unknown) =>
    api.post("/api/accounts/installments", data),
  payInstallment: (id: string, data: unknown) =>
    api.post(`/api/accounts/installments/${id}/pay`, data),
  getBankAccounts: () => api.get("/api/accounts/bank-accounts"),
  createBankAccount: (data: unknown) => api.post("/api/accounts/bank-accounts", data),
  createBankTransaction: (data: unknown) => api.post("/api/accounts/bank-transactions", data),
  getCashBook: (params?: Record<string, string>) => api.get("/api/accounts/cash-book", { params }),
  getBankReconciliations: () => api.get("/api/accounts/bank-reconciliations"),
  createBankReconciliation: (data: unknown) => api.post("/api/accounts/bank-reconciliations", data),
  updateBankReconciliation: (id: string, data: unknown) => api.put(`/api/accounts/bank-reconciliations/${id}`, data),
  deleteBankReconciliation: (id: string) => api.delete(`/api/accounts/bank-reconciliations/${id}`),
  getCheques: () => api.get("/api/accounts/cheques"),
  createCheque: (data: unknown) => api.post("/api/accounts/cheques", data),
  updateCheque: (id: string, data: unknown) => api.put(`/api/accounts/cheques/${id}`, data),
  deleteCheque: (id: string) => api.delete(`/api/accounts/cheques/${id}`),
  getProfitLoss: (params?: Record<string, string>) =>
    api.get("/api/accounts/profit-loss", { params }),
  getDashboardSummary: () => api.get("/api/accounts/dashboard-summary"),
  getSalesForecast: (params?: Record<string, string>) =>
    api.get("/api/accounts/sales-forecast", { params }),
  getBalanceSheet: () => api.get("/api/accounts/balance-sheet"),
  getCashFlow: () => api.get("/api/accounts/cash-flow"),
  getTrialBalance: () => api.get("/api/accounts/trial-balance"),
  getDayBook: (params?: Record<string, string>) => api.get("/api/accounts/day-book", { params }),
  getReceivePaymentSummary: () => api.get("/api/accounts/receive-payment-summary"),
  getApprovalLogs: (params?: Record<string, string>) => api.get("/api/accounts/approval-logs", { params }),
  getPendingApprovals: () => api.get("/api/accounts/pending-approvals"),
  updateAccount: (id: string, data: unknown) => api.put(`/api/accounts/chart/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/api/accounts/chart/${id}`),
  deleteVoucher: (id: string) => api.delete(`/api/accounts/vouchers/${id}`),
  deleteInstallment: (id: string) => api.delete(`/api/accounts/installments/${id}`),
};

// Operations
export const operationsApi = {
  getBilling: () => api.get("/api/operations/billing"),
  createBilling: (data: unknown) => api.post("/api/operations/billing", data),
  updateBilling: (id: string, data: unknown) => api.put(`/api/operations/billing/${id}`, data),
  updateBillingStatus: (id: string, data: unknown) => api.patch(`/api/operations/billing/${id}/status`, data),
  deleteBilling: (id: string) => api.delete(`/api/operations/billing/${id}`),
  getAssets: () => api.get("/api/operations/assets"),
  createAsset: (data: unknown) => api.post("/api/operations/assets", data),
  updateAsset: (id: string, data: unknown) => api.put(`/api/operations/assets/${id}`, data),
  deleteAsset: (id: string) => api.delete(`/api/operations/assets/${id}`),
  getAssetMaintenance: () => api.get("/api/operations/asset-maintenance"),
  createAssetMaintenance: (data: unknown) => api.post("/api/operations/asset-maintenance", data),
  updateAssetMaintenance: (id: string, data: unknown) => api.put(`/api/operations/asset-maintenance/${id}`, data),
  deleteAssetMaintenance: (id: string) => api.delete(`/api/operations/asset-maintenance/${id}`),
  getDepreciationSummary: () => api.get("/api/operations/assets/depreciation-summary"),
  getApprovalLayers: () => api.get("/api/operations/approval-layers"),
  createApprovalLayer: (data: unknown) => api.post("/api/operations/approval-layers", data),
  updateApprovalLayer: (id: string, data: unknown) => api.put(`/api/operations/approval-layers/${id}`, data),
  deleteApprovalLayer: (id: string) => api.delete(`/api/operations/approval-layers/${id}`),
};

export const settingsApi = {
  getSystem: () => api.get("/api/settings/system"),
  saveSystem: (data: unknown) => api.put("/api/settings/system", data),
};

// ── Users ────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: () => api.get("/api/users"),
  create: (data: unknown) => api.post("/api/users", data),
  update: (id: string, data: unknown) => api.put(`/api/users/${id}`, data),
  toggleStatus: (id: string, isActive: boolean) =>
    api.patch(`/api/users/${id}/status`, { isActive }),
  getRoles: () => api.get("/api/users/roles"),
};

// ── Real Estate ─────────────────────────────────────────────────────
export const realEstateApi = {
  getSummary: () => api.get("/api/real-estate/summary"),
  getCollectionReport: () => api.get("/api/real-estate/collection-report"),
  getAgingReport: () => api.get("/api/real-estate/aging-report"),
  getBlocks: () => api.get("/api/real-estate/blocks"),
  createBlock: (data: unknown) => api.post("/api/real-estate/blocks", data),
  updateBlock: (id: string, data: unknown) => api.put(`/api/real-estate/blocks/${id}`, data),
  deleteBlock: (id: string) => api.delete(`/api/real-estate/blocks/${id}`),
  getRoads: () => api.get("/api/real-estate/roads"),
  createRoad: (data: unknown) => api.post("/api/real-estate/roads", data),
  updateRoad: (id: string, data: unknown) => api.put(`/api/real-estate/roads/${id}`, data),
  deleteRoad: (id: string) => api.delete(`/api/real-estate/roads/${id}`),
  getUnits: (params?: Record<string, string>) => api.get("/api/real-estate/units", { params }),
  createUnit: (data: unknown) => api.post("/api/real-estate/units", data),
  updateUnit: (id: string, data: unknown) => api.put(`/api/real-estate/units/${id}`, data),
  deleteUnit: (id: string) => api.delete(`/api/real-estate/units/${id}`),
  getBookings: () => api.get("/api/real-estate/bookings"),
  createBooking: (data: unknown) => api.post("/api/real-estate/bookings", data),
  updateBooking: (id: string, data: unknown) => api.put(`/api/real-estate/bookings/${id}`, data),
  deleteBooking: (id: string) => api.delete(`/api/real-estate/bookings/${id}`),
  cancelBooking: (id: string, data: unknown) => api.post(`/api/real-estate/bookings/${id}/cancel`, data),
  getSales: () => api.get("/api/real-estate/sales"),
  createSale: (data: unknown) => api.post("/api/real-estate/sales", data),
  updateSale: (id: string, data: unknown) => api.put(`/api/real-estate/sales/${id}`, data),
  deleteSale: (id: string) => api.delete(`/api/real-estate/sales/${id}`),
  createSaleInstallmentPlan: (id: string, data: unknown) => api.post(`/api/real-estate/sales/${id}/installment-plan`, data),
};

export const reportsApi = {
  exportCsv: (type: string) => api.get(`/api/reports/export/${type}`, { responseType: "blob" }),
  getOperational: () => api.get("/api/reports/operational"),
};

export const adminApi = {
  getPermissionCatalog: () => api.get("/api/admin/permissions/catalog"),
  getRoles: () => api.get("/api/admin/roles"),
  createRole: (data: unknown) => api.post("/api/admin/roles", data),
  updateRole: (id: string, data: unknown) => api.put(`/api/admin/roles/${id}`, data),
  getActivity: () => api.get("/api/admin/activity"),
};

export const mastersApi = {
  list: (masterKey: string) => api.get(`/api/masters/${masterKey}`),
  create: (masterKey: string, data: unknown) => api.post(`/api/masters/${masterKey}`, data),
  update: (masterKey: string, id: string, data: unknown) => api.put(`/api/masters/${masterKey}/${id}`, data),
  remove: (masterKey: string, id: string) => api.delete(`/api/masters/${masterKey}/${id}`),
  getCompanyProfile: () => api.get("/api/masters/company-profile"),
  saveCompanyProfile: (data: unknown) => api.put("/api/masters/company-profile", data),
  getCustomerAccounts: () => api.get("/api/masters/account-summaries/customers"),
  getSupplierAccounts: () => api.get("/api/masters/account-summaries/suppliers"),
};
