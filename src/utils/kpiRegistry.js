export const kpiRegistry = {
  "/": {
    overview: [
      { key: "mtd-revenue", label: "MTD Revenue" },
      { key: "total-visits", label: "Total Visits" },
      { key: "bed-occupancy", label: "Bed Occupancy" },
      { key: "pharmacy-collection", label: "Pharmacy Collection" },
      { key: "meal-production", label: "Meal Production" },
      { key: "metric-trend-chart", label: "Metric Trend Chart" },
      { key: "department-contribution-chart", label: "Department Contribution Chart" },
      { key: "site-performance-chart", label: "Site Wise Performance Chart" },
      { key: "patient-flow-chart", label: "Patient Flow & Occupancy Chart" },
      { key: "metric-toggle", label: "Metric Toggle Buttons" },
      { key: "alert-cards", label: "Alert Cards" },
      { key: "export-pdf", label: "Export PDF Button" },
    ],
  },
  "/revenue": {
    overview: [
      { key: "mtd", label: "MTD Revenue" },
      { key: "yesterday", label: "Yesterday Revenue" },
      { key: "avg-daily", label: "Avg Daily Revenue" },
      { key: "projected", label: "Projected Revenue" },
      { key: "trend-chart", label: "Revenue Trend Chart" },
      { key: "donut-chart", label: "Department Revenue Donut Chart" },
    ],
    daily: [
      { key: "breakdown", label: "Daily Revenue Breakdown Table" },
    ],
    department: [
      { key: "share-chart", label: "Department Revenue Share Chart" },
      { key: "top-departments", label: "Top Departments Table" },
    ],
    collections: [
      { key: "cash", label: "Cash Collection" },
      { key: "card", label: "Card/UPI Collection" },
      { key: "tpa", label: "Pending TPA" },
    ],
    discounts: [
      { key: "table", label: "Discounts Allowed Table" },
    ],
    refunds: [
      { key: "table", label: "Refunds Processed Table" },
    ],
    insurance: [
      { key: "submitted", label: "TPA Claims Submitted" },
      { key: "settled", label: "TPA Claims Settled" },
      { key: "deductions", label: "TPA Deductions" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
      { key: "format-info", label: "Required Format Info Card" },
    ],
  },
  "/patients": {
    overview: [
      { key: "visits", label: "Total Visits (MTD)" },
      { key: "opd", label: "OPD Visits" },
      { key: "ipd", label: "IPD Admissions" },
      { key: "emergency", label: "Emergency Cases" },
      { key: "distribution-chart", label: "Patient Distribution Chart" },
      { key: "top-specialties", label: "Top Specialties Table" },
    ],
    opd: [
      { key: "table", label: "OP Patient Analytics Table" },
    ],
    ipd: [
      { key: "table", label: "IP Patient Analytics Table" },
    ],
    retention: [
      { key: "new", label: "New Patients" },
      { key: "repeat", label: "Repeat Patients" },
      { key: "satisfaction", label: "Patient Satisfaction" },
    ],
    demographics: [
      { key: "gender-chart", label: "By Gender Chart" },
      { key: "age-chart", label: "By Age Group Chart" },
    ],
    doctor: [
      { key: "table", label: "Top Doctor Consulting Load Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
    ],
  },
  "/beds": {
    overview: [
      { key: "total", label: "Total Beds" },
      { key: "occupancy", label: "Overall Occupancy" },
      { key: "available", label: "Available Beds" },
      { key: "turnover", label: "Turnover Rate" },
      { key: "occupancy-chart", label: "Bed Occupancy Status Chart" },
      { key: "critical-alerts", label: "Critical Bed Alerts Table" },
    ],
    icu: [
      { key: "table", label: "ICU Status Breakdown Table" },
    ],
    ward: [
      { key: "capacity", label: "Ward Capacity" },
      { key: "ward-occ", label: "Ward Occupancy" },
      { key: "discharges", label: "Discharges Expected" },
    ],
    deluxe: [
      { key: "table", label: "Private & Deluxe Rooms Table" },
    ],
    ventilator: [
      { key: "status", label: "Ventilator & Equipment Status Card" },
    ],
    availability: [
      { key: "table", label: "Live Bed Availability Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
      { key: "format-info", label: "Required Format Info Card" },
    ],
  },
  "/lab": {
    overview: [
      { key: "tests", label: "Total Tests Today" },
      { key: "scans", label: "Scans Today" },
      { key: "tat", label: "Average TAT" },
      { key: "revenue", label: "Diagnostics Revenue" },
      { key: "volumes-chart", label: "Test Volumes by Modality Chart" },
      { key: "alerts", label: "Alerts & Outliers Table" },
    ],
    pathology: [
      { key: "table", label: "Pathology Sub-Departments Table" },
    ],
    radiology: [
      { key: "xray", label: "X-Ray Scans" },
      { key: "usg", label: "Ultrasound Scans" },
      { key: "mri", label: "MRI / CT Scan" },
    ],
    tat: [
      { key: "table", label: "Turnaround Time Analytics Table" },
    ],
    pending: [
      { key: "table", label: "Pending Reports Queue Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
    ],
  },
  "/pharmacy": {
    overview: [
      { key: "collection", label: "Today's Collection" },
      { key: "bills", label: "Total Bills" },
      { key: "avg-bill", label: "Avg Bill Value" },
      { key: "ipd-indents", label: "IPD Indents" },
      { key: "trend-chart", label: "Pharmacy Collection Trend Chart" },
      { key: "stock-alerts", label: "Stock Alerts Table" },
    ],
    sales: [
      { key: "table", label: "Daily Sales Breakdown Table" },
    ],
    inventory: [
      { key: "table", label: "Inventory Status Table" },
    ],
    expiry: [
      { key: "30d", label: "Expiring in 30 Days" },
      { key: "90d", label: "Expiring in 90 Days" },
      { key: "risk", label: "Value at Risk" },
    ],
    refunds: [
      { key: "table", label: "Pharmacy Returns & Refunds Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
    ],
  },
  "/kitchen-diet": {
    overview: [
      { key: "total-diet", label: "Total Diet Order" },
      { key: "patient-served", label: "Total Patient Served" },
      { key: "meal-prod", label: "Total Meal Production" },
      { key: "diet-mod", label: "Diet Modification Count" },
      { key: "special-diet", label: "Special Diet Count" },
      { key: "normal-diet", label: "Normal Diet Count" },
      { key: "meal-breakdown", label: "Meal Production Breakdown Table" },
      { key: "diet-breakdown", label: "Diet Category Breakdown Table" },
    ],
    production: [
      { key: "table", label: "Meal Production Breakdown Table" },
    ],
    diet: [
      { key: "table", label: "Diet Category Breakdown Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
      { key: "kpi-sources", label: "KPI Source Files Info Card" },
    ],
  },
  "/operations": {
    overview: [
      { key: "utilization", label: "Doctor Utilization" },
      { key: "admissions", label: "Admissions" },
      { key: "alos", label: "ALOS" },
      { key: "emergency", label: "Emergency" },
      { key: "insurance", label: "Insurance Claims" },
      { key: "discharges", label: "Discharges" },
      { key: "occupancy", label: "Occupancy" },
      { key: "efficiency", label: "Efficiency" },
      { key: "ot-chart", label: "OT Utilization & Staffing Chart" },
      { key: "key-metrics", label: "Key Metrics Card" },
      { key: "executive-alerts", label: "Executive Alerts" },
    ],
    doctor: [
      { key: "table", label: "Doctor Utilization Table" },
    ],
    admission: [
      { key: "adm", label: "Admissions" },
      { key: "disch", label: "Discharges" },
      { key: "net", label: "Net Change" },
    ],
    alos: [
      { key: "hospital", label: "Hospital ALOS" },
      { key: "icu", label: "ICU ALOS" },
      { key: "cardiology", label: "Cardiology ALOS" },
      { key: "ortho", label: "Orthopedics ALOS" },
    ],
    emergency: [
      { key: "cases", label: "Emergency Cases" },
      { key: "critical", label: "Critical Patients" },
      { key: "observation", label: "Observation Patients" },
      { key: "er-adm", label: "ER Admissions" },
    ],
    peak: [
      { key: "chart", label: "Peak Hour Analytics Chart" },
      { key: "table", label: "Hourly Breakdown Table" },
    ],
    insurance: [
      { key: "total", label: "Total Claims" },
      { key: "approved", label: "Approved Claims" },
      { key: "pending", label: "Pending Claims" },
      { key: "rejected", label: "Rejected Claims" },
    ],
    department: [
      { key: "table", label: "Department Efficiency Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
      { key: "format-info", label: "Required Format Info Card" },
    ],
  },
  "/doctors": {
    overview: [
      { key: "revenue", label: "Total Doctor Revenue" },
      { key: "gross", label: "Gross Payout" },
      { key: "net", label: "Net Payout" },
      { key: "pending", label: "Pending Payout" },
      { key: "tds", label: "TDS Deducted" },
      { key: "doctors", label: "Active Doctors Count" },
      { key: "top-ranking", label: "Top Doctor Payout Ranking Panel" },
      { key: "payout-alerts", label: "Payout Alerts" },
    ],
    doctor: [
      { key: "table", label: "Doctor-wise Payout Details Table" },
    ],
    department: [
      { key: "table", label: "Department-wise Payout Table" },
    ],
    service: [
      { key: "table", label: "Service-wise Revenue & Payout Table" },
    ],
    contribution: [
      { key: "panel", label: "Doctor Revenue Contribution Panel" },
    ],
    trend: [
      { key: "panel", label: "Monthly Doctor Payout Trend Panel" },
    ],
    pending: [
      { key: "table", label: "Pending Doctor Payout Table" },
    ],
    tds: [
      { key: "table", label: "TDS & Deduction Details Table" },
    ],
    top: [
      { key: "table", label: "Top Doctors by Net Payout Table" },
    ],
    upload: [
      { key: "widget", label: "Upload Doctor Payout Widget" },
    ],
  },
  "/nursing": {
    overview: [
      { key: "kpi-grid", label: "Nursing KPI Grid" },
      { key: "placeholder", label: "Configuration Placeholder" },
    ],
    "midnight-census": [
      { key: "form", label: "Midnight Census Form" },
    ],
    upload: [
      { key: "widget", label: "Upload Widget" },
      { key: "how-it-works", label: "How It Works Info Card" },
    ],
  },
  "/reports": {
    overview: [
      { key: "revenue", label: "Revenue Reports Count" },
      { key: "patient", label: "Patient Reports Count" },
      { key: "pharmacy", label: "Pharmacy Reports Count" },
      { key: "lab", label: "Lab Reports Count" },
    ],
    revenue: [
      { key: "table", label: "Revenue Reports Table" },
    ],
    patient: [
      { key: "table", label: "Patient Reports Table" },
    ],
    pharmacy: [
      { key: "table", label: "Pharmacy Reports Table" },
    ],
    lab: [
      { key: "table", label: "Lab Reports Table" },
    ],
    bed: [
      { key: "table", label: "Bed Reports Table" },
    ],
    drill: [
      { key: "panel", label: "Drill Down Reports Panel" },
    ],
    pdf: [
      { key: "export", label: "Export PDF Card" },
    ],
    excel: [
      { key: "export", label: "Export Excel Card" },
    ],
    schedule: [
      { key: "form", label: "Schedule Reports Form" },
    ],
  },
  "/settings": {
    overview: [
      { key: "stats-cards", label: "Statistics Cards" },
    ],
    profile: [
      { key: "avatar", label: "Profile Picture Section" },
      { key: "account-details", label: "Account Details Form" },
      { key: "privacy", label: "Privacy Policy Section" },
    ],
    users: [
      { key: "create-role", label: "Create Role Form" },
      { key: "create-user", label: "Create User Form" },
      { key: "role-access", label: "Role Access Design Section" },
      { key: "user-config", label: "User Login Configuration Section" },
    ],
    modules: [
      { key: "configuration", label: "Module Configuration Section" },
    ],
    notifications: [
      { key: "preferences", label: "Notification Preferences Form" },
    ],
    branch: [
      { key: "table", label: "Branch Configuration Table" },
    ],
    security: [
      { key: "password-policy", label: "Password Policy Form" },
      { key: "change-password", label: "Change Password Form" },
    ],
    backup: [
      { key: "controls", label: "Backup Controls & History Table" },
    ],
    refresh: [
      { key: "settings", label: "Data Refresh Settings Form" },
    ],
    logs: [
      { key: "viewer", label: "System Logs Viewer" },
    ],
  },
};
