import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import { BedDouble, Download, DownloadCloud, IndianRupee, ShoppingCart, TrendingUp, Users, Wheat } from "lucide-react";
import { exportToPDF } from "../utils/exportUtils";
import DraggableKPIGrid from "../components/DraggableKPIGrid";

const monthlyTrend = [
  { month: "Jan", revenue: 28.5, patients: 9800, occupancy: 71, pharmacy: 14.8 },
  { month: "Feb", revenue: 29.2, patients: 10240, occupancy: 74, pharmacy: 15.6 },
  { month: "Mar", revenue: 31.4, patients: 11020, occupancy: 79, pharmacy: 16.9 },
  { month: "Apr", revenue: 30.8, patients: 10870, occupancy: 76, pharmacy: 16.2 },
  { month: "May", revenue: 32.1, patients: 11940, occupancy: 82, pharmacy: 17.4 },
  { month: "Jun", revenue: 32.79, patients: 12407, occupancy: 84, pharmacy: 18.11 },
];

const departmentMix = [
  { name: "Revenue", value: 32.79, color: "#047857" },
  { name: "Pharmacy", value: 18.11, color: "#d97706" },
  { name: "Diagnostics", value: 7.0, color: "#2563eb" },
  { name: "Kitchen", value: 8.39, color: "#7c3aed" },
];

const sitePerformance = [
  { site: "PBMH", revenue: 32.79, patients: 12407, diet: 8394 },
  { site: "KSSCC", revenue: 18.4, patients: 7980, diet: 5120 },
];

const serviceFlow = [
  { day: "Mon", opd: 812, ipd: 986, discharges: 141, occupancy: 78 },
  { day: "Tue", opd: 864, ipd: 994, discharges: 132, occupancy: 80 },
  { day: "Wed", opd: 902, ipd: 1018, discharges: 149, occupancy: 82 },
  { day: "Thu", opd: 948, ipd: 1044, discharges: 156, occupancy: 84 },
  { day: "Fri", opd: 926, ipd: 1038, discharges: 152, occupancy: 83 },
  { day: "Sat", opd: 881, ipd: 1012, discharges: 138, occupancy: 81 },
  { day: "Sun", opd: 702, ipd: 958, discharges: 121, occupancy: 77 },
];

const metricConfig = {
  revenue: { label: "Revenue", dataKey: "revenue", suffix: " Cr", color: "#047857", insight: "Steady growth across all departments" },
  patients: { label: "Patients", dataKey: "patients", suffix: "", color: "#2563eb", insight: "Patient volume increasing month over month" },
  occupancy: { label: "Occupancy", dataKey: "occupancy", suffix: "%", color: "#7c3aed", insight: "Occupancy rates nearing capacity" },
  pharmacy: { label: "Pharmacy", dataKey: "pharmacy", suffix: " L", color: "#d97706", insight: "Pharmacy revenue consistently rising" },
};

const formatCr = (v) => `${v.toFixed(1)} Cr`;
const formatNum = (v) => v.toLocaleString("en-IN");
const formatPct = (v) => `${v}%`;

function CustomTooltip({ active, payload, label, formatter, labelFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium text-gray-700">
            {formatter ? formatter(entry.value, entry.name) : `${entry.name}: ${entry.value}`}
          </span>
        </p>
      ))}
    </div>
  );
}

function exportChart(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const svg = el.querySelector("svg");
  if (!svg) return;
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(clone);
  const blob = new Blob([svgStr], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard({ currentUser }) {
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const metric = metricConfig[selectedMetric];

  const currentSite = currentUser?.site || "PBMH";
  const currentSiteData = useMemo(
    () => sitePerformance.find((item) => item.site === currentSite) || sitePerformance[0],
    [currentSite]
  );

  const kpiItems = useMemo(() => [
    { title: "MTD Revenue", value: `Rs ${currentSiteData.revenue} Cr`, subtitle: "Executive financial view", trend: "+15%", icon: IndianRupee, colorClass: "text-emerald-600", bgClass: "bg-emerald-100", iconSize: 24 },
    { title: "Total Visits", value: currentSiteData.patients.toLocaleString("en-IN"), subtitle: "OP and IP combined", trend: "+8%", icon: Users, colorClass: "text-blue-600", bgClass: "bg-blue-100", iconSize: 24 },
    { title: "Bed Occupancy", value: "84%", subtitle: "Current utilization", trend: "+4%", icon: BedDouble, colorClass: "text-violet-600", bgClass: "bg-violet-100", iconSize: 24 },
    { title: "Pharmacy Collection", value: "Rs 18.11 L", subtitle: "Yesterday collection", trend: "-2.1%", icon: ShoppingCart, colorClass: "text-amber-600", bgClass: "bg-amber-100", iconSize: 24 },
    { title: "Meal Production", value: currentSiteData.diet.toLocaleString("en-IN"), subtitle: "Kitchen and diet KPI", trend: "+5.5%", icon: Wheat, colorClass: "text-rose-600", bgClass: "bg-rose-100", iconSize: 24 },
  ], [currentSiteData]);

  return (
    <div className="space-y-6 fade-in" id="dashboard-content">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-green-700">{currentSite}</p>
          <h2 className="text-2xl font-bold text-gray-800">Executive Analytical Dashboard</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(metricConfig).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedMetric(key)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                selectedMetric === key
                  ? "border-green-700 bg-green-700 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => exportToPDF("dashboard-content")}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
          >
            <DownloadCloud size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div data-tour="kpi-cards">
        <DraggableKPIGrid items={kpiItems} storageKey="kims-dashboard-kpi-order" />
      </div>

      <div data-tour="charts" className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ChartPanel
          id="chart-trend"
          title={`${metric.label} Trend`}
          subtitle={metric.insight}
          className="xl:col-span-2"
          onExport={() => exportChart("chart-trend", `${metric.label}-trend`)}
        >
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={monthlyTrend} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={`grad-${metric.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (metric.dataKey === "patients" ? formatNum(v) : `${v}${metric.suffix}`)}
              />
              <Tooltip content={<CustomTooltip formatter={(v) => `${v}${metric.suffix}`} labelFormatter={(l) => `${l} 2025`} />} />
              <Area
                type="monotone"
                dataKey={metric.dataKey}
                stroke={metric.color}
                strokeWidth={2.5}
                fill={`url(#grad-${metric.dataKey})`}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          id="chart-department"
          title="Department Contribution"
          subtitle="Revenue share by department (Cr)"
          onExport={() => exportChart("chart-department", "department-contribution")}
        >
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={departmentMix}
                dataKey="value"
                nameKey="name"
                innerRadius={78}
                outerRadius={110}
                paddingAngle={3}
                cornerRadius={4}
                animationDuration={1000}
              >
                {departmentMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={(v) => `${v} Cr`} />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={10}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartPanel
          id="chart-site"
          title="Site Wise Performance"
          subtitle="Revenue vs Patient volume comparison"
          onExport={() => exportChart("chart-site", "site-performance")}
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={sitePerformance} margin={{ top: 20, right: 24, left: 0, bottom: 4 }} barGap={12}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="site" tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v} Cr`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatNum}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="rect"
                iconSize={12}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue (Cr)" fill="#047857" radius={[6, 6, 0, 0]} maxBarSize={48}>
                <LabelList dataKey="revenue" position="top" formatter={(v) => `${v} Cr`} style={{ fontSize: 11, fill: "#047857", fontWeight: 600 }} />
              </Bar>
              <Bar yAxisId="right" dataKey="patients" name="Patients" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={48}>
                <LabelList dataKey="patients" position="top" formatter={formatNum} style={{ fontSize: 11, fill: "#2563eb", fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          id="chart-flow"
          title="Patient Flow & Occupancy"
          subtitle="Weekly OPD, IPD, and occupancy trend"
          onExport={() => exportChart("chart-flow", "patient-flow")}
        >
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={serviceFlow} margin={{ top: 20, right: 24, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="occupancyLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                domain={[70, 90]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="rect"
                iconSize={12}
                formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
              />
              <Bar yAxisId="left" dataKey="opd" name="OPD" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar yAxisId="left" dataKey="ipd" name="IPD" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="occupancy"
                name="Occupancy %"
                stroke="url(#occupancyLine)"
                strokeWidth={3}
                dot={{ r: 5, fill: "#7c3aed", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#7c3aed", strokeWidth: 2, stroke: "#fff" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:grid-cols-4">
        {[
          { icon: TrendingUp, title: "Revenue Alert", detail: "Cardiology and pharmacy are driving 54% of value." },
          { icon: Users, title: "Patient Load", detail: "OPD peaks mid-week; staff scheduling should favor Wed-Thu." },
          { icon: BedDouble, title: "Bed Watch", detail: "Occupancy above 80% needs discharge planning review." },
          { icon: Wheat, title: "Diet Ops", detail: "Kitchen volume is stable across seven meal slots." },
        ].map(({ icon: Icon, title, detail }) => (
          <div key={title} className="rounded-lg border border-green-100 bg-gradient-to-br from-green-50 to-white p-4 transition-shadow hover:shadow-md">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-green-800">
              <Icon size={16} /> {title}
            </div>
            <p className="text-sm leading-6 text-gray-600">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartPanel({ id, title, subtitle, className = "", onExport, children }) {
  return (
    <section id={id} className={`group relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex h-7 w-7 items-center justify-center rounded-md text-gray-300 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
            title="Export SVG"
          >
            <Download size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
