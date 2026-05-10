export const mockDashboardStats = {
  totalProjects: 12,
  runningProjects: 7,
  completedProjects: 4,
  planningProjects: 1,
  totalBudget: 850000000,
  totalIncome: 420000000,
  totalExpense: 310000000,
  totalProfit: 110000000,
  totalDue: 65000000,
  accountsPayable: 28000000,
  accountsReceivable: 93000000,
  lowStockItems: 8,
  pendingRequisitions: 14,
  pendingRFQ: 6,
  pendingPurchaseOrders: 9,
};

export const mockProjects = [
  {
    id: "1",
    name: "Bashundhara Residential Complex",
    location: "Bashundhara, Dhaka",
    type: "Residential",
    status: "active",
    budget: 120000000,
    spent: 78000000,
    income: 95000000,
    progress: 65,
    startDate: "2024-01-15",
    endDate: "2025-06-30",
    manager: "Md. Rafiqul Islam",
    totalUnits: 48,
    soldUnits: 31,
  },
  {
    id: "2",
    name: "Gulshan Commercial Tower",
    location: "Gulshan-2, Dhaka",
    type: "Commercial",
    status: "active",
    budget: 250000000,
    spent: 125000000,
    income: 180000000,
    progress: 50,
    startDate: "2023-08-01",
    endDate: "2026-02-28",
    manager: "Eng. Kamal Hossain",
    totalUnits: 20,
    soldUnits: 12,
  },
  {
    id: "3",
    name: "Uttara Housing Project",
    location: "Uttara Sector-13, Dhaka",
    type: "Residential",
    status: "active",
    budget: 85000000,
    spent: 42000000,
    income: 55000000,
    progress: 40,
    startDate: "2024-03-01",
    endDate: "2025-12-31",
    manager: "Md. Shahidul Alam",
    totalUnits: 36,
    soldUnits: 22,
  },
  {
    id: "4",
    name: "Dhanmondi Luxury Apartments",
    location: "Dhanmondi-27, Dhaka",
    type: "Residential",
    status: "completed",
    budget: 95000000,
    spent: 91000000,
    income: 112000000,
    progress: 100,
    startDate: "2022-05-01",
    endDate: "2024-01-31",
    manager: "Eng. Faruk Ahmed",
    totalUnits: 24,
    soldUnits: 24,
  },
  {
    id: "5",
    name: "Mirpur Industrial Hub",
    location: "Mirpur-12, Dhaka",
    type: "Industrial",
    status: "planning",
    budget: 180000000,
    spent: 0,
    income: 0,
    progress: 0,
    startDate: "2025-07-01",
    endDate: "2027-12-31",
    manager: "Md. Aminur Rahman",
    totalUnits: 15,
    soldUnits: 0,
  },
];

export const mockRecentVouchers = [
  { id: "V-001", type: "Payment Voucher", amount: 2500000, date: "2025-04-28", project: "Gulshan Commercial Tower", status: "approved" },
  { id: "V-002", type: "Receipt Voucher", amount: 5000000, date: "2025-04-27", project: "Bashundhara Residential", status: "approved" },
  { id: "V-003", type: "Journal Voucher", amount: 180000, date: "2025-04-26", project: "Uttara Housing Project", status: "pending" },
  { id: "V-004", type: "Payment Voucher", amount: 750000, date: "2025-04-25", project: "Gulshan Commercial Tower", status: "approved" },
  { id: "V-005", type: "Contra Voucher", amount: 1200000, date: "2025-04-24", project: "General", status: "approved" },
];

export const mockCashFlow = [
  { month: "Nov", income: 32000000, expense: 24000000 },
  { month: "Dec", income: 45000000, expense: 31000000 },
  { month: "Jan", income: 38000000, expense: 28000000 },
  { month: "Feb", income: 52000000, expense: 35000000 },
  { month: "Mar", income: 48000000, expense: 32000000 },
  { month: "Apr", income: 61000000, expense: 41000000 },
];

export const mockProjectProgress = [
  { name: "Bashundhara", progress: 65, budget: 120 },
  { name: "Gulshan Tower", progress: 50, budget: 250 },
  { name: "Uttara Housing", progress: 40, budget: 85 },
  { name: "Dhanmondi", progress: 100, budget: 95 },
];

export const mockInventoryItems = [
  { id: "1", name: "Cement (50kg bag)", category: "Building Material", unit: "Bag", stock: 450, minStock: 200, price: 550, supplier: "Bashundhara Cement" },
  { id: "2", name: "Steel Rod (10mm)", category: "Steel", unit: "Ton", stock: 25, minStock: 50, price: 95000, supplier: "BSRM Steel" },
  { id: "3", name: "Red Brick", category: "Building Material", unit: "Piece", stock: 15000, minStock: 10000, price: 12, supplier: "Local Supplier" },
  { id: "4", name: "Sand (cubic ft)", category: "Raw Material", unit: "CFT", stock: 800, minStock: 500, price: 45, supplier: "River Sand Co." },
  { id: "5", name: "Stone Chips (cubic ft)", category: "Raw Material", unit: "CFT", stock: 120, minStock: 300, price: 65, supplier: "Sylhet Stone" },
  { id: "6", name: "Paint (Berger 5L)", category: "Finishing", unit: "Can", stock: 85, minStock: 100, price: 2800, supplier: "Berger Paints" },
  { id: "7", name: "Ceramic Tiles (sqft)", category: "Finishing", unit: "SqFt", stock: 2500, minStock: 1000, price: 85, supplier: "RAK Ceramics" },
  { id: "8", name: "PVC Pipe (1 inch)", category: "Plumbing", unit: "Piece", stock: 180, minStock: 200, price: 320, supplier: "Akij Pipe" },
];

export const mockWorkers = [
  { id: "1", name: "Abdul Karim", role: "Mason", project: "Bashundhara Residential", dailyWage: 800, attendance: 24, status: "active" },
  { id: "2", name: "Rahim Mia", role: "Helper", project: "Gulshan Commercial Tower", dailyWage: 550, attendance: 22, status: "active" },
  { id: "3", name: "Md. Hasan", role: "Welder", project: "Uttara Housing Project", dailyWage: 950, attendance: 20, status: "active" },
  { id: "4", name: "Jalal Uddin", role: "Painter", project: "Bashundhara Residential", dailyWage: 750, attendance: 18, status: "active" },
  { id: "5", name: "Babul Mia", role: "Electrician", project: "Gulshan Commercial Tower", dailyWage: 1100, attendance: 25, status: "active" },
];

export const mockContractors = [
  { id: "1", name: "Rahman Construction Ltd.", specialty: "Civil Work", project: "Bashundhara Residential", contractValue: 15000000, paid: 9000000, due: 6000000, status: "active" },
  { id: "2", name: "Karim & Brothers", specialty: "Electrical", project: "Gulshan Commercial Tower", contractValue: 8500000, paid: 5000000, due: 3500000, status: "active" },
  { id: "3", name: "Modern Plumbing Co.", specialty: "Plumbing", project: "Uttara Housing Project", contractValue: 4200000, paid: 2100000, due: 2100000, status: "active" },
  { id: "4", name: "Steel Masters Ltd.", specialty: "Steel Work", project: "Gulshan Commercial Tower", contractValue: 22000000, paid: 18000000, due: 4000000, status: "active" },
];

export const mockInstallments = [
  { id: "1", client: "Md. Mizanur Rahman", project: "Bashundhara Residential", unit: "Apt-A-501", totalAmount: 8500000, paid: 5100000, due: 3400000, nextDue: "2025-05-15", status: "active" },
  { id: "2", client: "Mrs. Nasrin Akter", project: "Gulshan Commercial Tower", unit: "Shop-G-102", totalAmount: 12000000, paid: 9600000, due: 2400000, nextDue: "2025-05-01", status: "overdue" },
  { id: "3", client: "Eng. Farhan Kabir", project: "Uttara Housing Project", unit: "Apt-B-301", totalAmount: 6500000, paid: 2600000, due: 3900000, nextDue: "2025-06-01", status: "active" },
  { id: "4", client: "Dr. Sabbir Ahmed", project: "Bashundhara Residential", unit: "Apt-C-702", totalAmount: 9200000, paid: 9200000, due: 0, nextDue: null, status: "completed" },
];

export const mockPurchaseOrders = [
  { id: "PO-001", supplier: "BSRM Steel", items: "Steel Rod 10mm - 50 Ton", amount: 4750000, project: "Gulshan Commercial Tower", date: "2025-04-25", status: "confirmed" },
  { id: "PO-002", supplier: "Bashundhara Cement", items: "Cement 50kg - 1000 Bags", amount: 550000, project: "Uttara Housing Project", date: "2025-04-26", status: "sent" },
  { id: "PO-003", supplier: "RAK Ceramics", items: "Floor Tiles 600x600 - 5000 SqFt", amount: 425000, project: "Bashundhara Residential", date: "2025-04-27", status: "draft" },
  { id: "PO-004", supplier: "Sylhet Stone", items: "Stone Chips - 500 CFT", amount: 32500, project: "Uttara Housing Project", date: "2025-04-28", status: "received" },
];

export const mockChartOfAccounts = [
  { id: "1001", name: "Cash in Hand", type: "Asset", balance: 5200000 },
  { id: "1002", name: "Bank - BRAC Bank", type: "Asset", balance: 45000000 },
  { id: "1003", name: "Bank - Dutch Bangla", type: "Asset", balance: 28000000 },
  { id: "2001", name: "Supplier Payable", type: "Liability", balance: 28000000 },
  { id: "2002", name: "Contractor Payable", type: "Liability", balance: 16000000 },
  { id: "3001", name: "Apartment Sales", type: "Income", balance: 350000000 },
  { id: "3002", name: "Booking Money", type: "Income", balance: 70000000 },
  { id: "4001", name: "Material Purchase", type: "Expense", balance: 145000000 },
  { id: "4002", name: "Labor Cost", type: "Expense", balance: 85000000 },
  { id: "4003", name: "Contractor Payment", type: "Expense", balance: 80000000 },
];
