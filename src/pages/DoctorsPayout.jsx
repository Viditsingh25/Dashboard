import { useMemo, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import { canAccessKPI } from "../utils/authConfig";
import * as XLSX from "xlsx";
import DragDropGrid from "../components/DragDropGrid";

export default function DoctorsPayout({ currentUser, roles }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const [uploadedRows, setUploadedRows] = useState([]);
  const [fileName, setFileName] = useState("");

  // Sample dashboard data shown before Excel upload
  const defaultDoctors = [
    {
      doctor: "Dr. A. Sharma",
      department: "Cardiology",
      revenue: 1850000,
      grossPayout: 462500,
      tds: 46250,
      deductions: 12000,
      netPayout: 404250,
      status: "Processed",
      patients: 326,
      service: "Cardiology Procedures",
    },
    {
      doctor: "Dr. R. Patel",
      department: "Orthopedics",
      revenue: 1540000,
      grossPayout: 385000,
      tds: 38500,
      deductions: 8500,
      netPayout: 338000,
      status: "Processed",
      patients: 278,
      service: "Orthopedic Surgery",
    },
    {
      doctor: "Dr. S. Rao",
      department: "Neurology",
      revenue: 1320000,
      grossPayout: 330000,
      tds: 33000,
      deductions: 10000,
      netPayout: 287000,
      status: "Pending",
      patients: 214,
      service: "Neurology Consultation",
    },
    {
      doctor: "Dr. P. Mohanty",
      department: "General Medicine",
      revenue: 1180000,
      grossPayout: 295000,
      tds: 29500,
      deductions: 7000,
      netPayout: 258500,
      status: "Processed",
      patients: 390,
      service: "General Consultation",
    },
    {
      doctor: "Dr. N. Das",
      department: "Radiology",
      revenue: 980000,
      grossPayout: 245000,
      tds: 24500,
      deductions: 5000,
      netPayout: 215500,
      status: "Pending",
      patients: 186,
      service: "Radiology Reporting",
    },
  ];

  const doctors = useMemo(() => {
    if (!uploadedRows.length) return defaultDoctors;

    return uploadedRows.map((row, index) => {
      const doctor =
        row["Doctor Name"] ||
        row["Doctor"] ||
        row["Doctor_Name"] ||
        row["Consultant Name"] ||
        `Doctor ${index + 1}`;

      const department =
        row["Department"] ||
        row["Dept"] ||
        row["Department Name"] ||
        "Unassigned";

      const revenue = toNumber(
        row["Revenue"] ||
          row["Doctor Revenue"] ||
          row["Net Revenue"] ||
          row["Amount"] ||
          row["Gross Revenue"]
      );

      const grossPayout = toNumber(
        row["Gross Payout"] ||
          row["Payout"] ||
          row["Doctor Payout"] ||
          row["Gross Amount"]
      );

      const tds = toNumber(
        row["TDS"] ||
          row["Tds"] ||
          row["Tax Deduction"] ||
          row["TDS Amount"]
      );

      const deductions = toNumber(
        row["Deductions"] ||
          row["Other Deductions"] ||
          row["Deduction"]
      );

      const netPayout =
        toNumber(
          row["Net Payout"] ||
            row["Final Payout"] ||
            row["Payable Amount"]
        ) || Math.max(grossPayout - tds - deductions, 0);

      const patients = toNumber(
        row["Patients"] ||
          row["Patient Count"] ||
          row["Visits"] ||
          row["Cases"]
      );

      const service =
        row["Service"] ||
        row["Service Name"] ||
        row["Speciality"] ||
        "Consultation";

      const status =
        row["Status"] ||
        row["Payout Status"] ||
        (index % 3 === 0 ? "Pending" : "Processed");

      return {
        doctor,
        department,
        revenue,
        grossPayout,
        tds,
        deductions,
        netPayout,
        patients,
        service,
        status,
      };
    });
  }, [uploadedRows]);

  const summary = useMemo(() => {
    const totalRevenue = doctors.reduce((sum, item) => sum + item.revenue, 0);
    const grossPayout = doctors.reduce(
      (sum, item) => sum + item.grossPayout,
      0
    );
    const netPayout = doctors.reduce((sum, item) => sum + item.netPayout, 0);
    const pendingPayout = doctors
      .filter((item) => String(item.status).toLowerCase().includes("pending"))
      .reduce((sum, item) => sum + item.netPayout, 0);

    const totalTDS = doctors.reduce((sum, item) => sum + item.tds, 0);

    return {
      totalRevenue,
      grossPayout,
      netPayout,
      pendingPayout,
      totalTDS,
      doctorCount: doctors.length,
    };
  }, [doctors]);

  const departmentData = useMemo(() => {
    const map = {};

    doctors.forEach((item) => {
      if (!map[item.department]) {
        map[item.department] = {
          department: item.department,
          revenue: 0,
          payout: 0,
          doctors: 0,
        };
      }

      map[item.department].revenue += item.revenue;
      map[item.department].payout += item.netPayout;
      map[item.department].doctors += 1;
    });

    return Object.values(map).sort((a, b) => b.payout - a.payout);
  }, [doctors]);

  const serviceData = useMemo(() => {
    const map = {};

    doctors.forEach((item) => {
      if (!map[item.service]) {
        map[item.service] = {
          service: item.service,
          revenue: 0,
          payout: 0,
          doctors: 0,
        };
      }

      map[item.service].revenue += item.revenue;
      map[item.service].payout += item.netPayout;
      map[item.service].doctors += 1;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [doctors]);

  const topDoctors = useMemo(() => {
    return [...doctors].sort((a, b) => b.netPayout - a.netPayout).slice(0, 10);
  }, [doctors]);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const binaryData = e.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
      });

      setUploadedRows(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  const exportExcel = () => {
    const exportRows = doctors.map((item) => ({
      "Doctor Name": item.doctor,
      Department: item.department,
      Service: item.service,
      Revenue: item.revenue,
      "Gross Payout": item.grossPayout,
      TDS: item.tds,
      Deductions: item.deductions,
      "Net Payout": item.netPayout,
      Patients: item.patients,
      Status: item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Doctor Payout");

    XLSX.writeFile(workbook, "Doctor_Payout_Report.xlsx");
  };

  const filterKPI = (tab, key) => canAccessKPI(currentUser, "/doctors", tab, key, roles);

  const renderMetricCard = (item) => (
    <MetricCard title={item.title} value={item.value} icon={item.icon} />
  );

  const overviewCards = useMemo(() => [
    { key: "revenue", title: "Total Doctor Revenue", value: formatCurrency(summary.totalRevenue), icon: "💰" },
    { key: "gross", title: "Gross Payout", value: formatCurrency(summary.grossPayout), icon: "📊" },
    { key: "net", title: "Net Payout", value: formatCurrency(summary.netPayout), icon: "💳" },
    { key: "pending", title: "Pending Payout", value: formatCurrency(summary.pendingPayout), icon: "⏳" },
    { key: "tds", title: "TDS Deducted", value: formatCurrency(summary.totalTDS), icon: "🧾" },
    { key: "doctors", title: "Active Doctors", value: summary.doctorCount, icon: "👨‍⚕️" },
  ].filter((c) => filterKPI("overview", c.key)), [summary, currentUser, roles]);

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-green-800">
            👨‍⚕️ Doctor Payout Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            Doctor-wise revenue, payout, TDS, deductions and pending payout
            monitoring.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportExcel}
            className="rounded-lg bg-green-700 px-4 py-2 font-medium text-white shadow hover:bg-green-800"
          >
            📥 Export Excel
          </button>

          <button
            onClick={() => navigate("/doctors?tab=upload")}
            className="rounded-lg bg-white px-4 py-2 font-medium text-green-700 shadow hover:bg-green-100"
          >
            📤 Upload Payout Data
          </button>
        </div>
      </div>



      {activeTab === "overview" && (
        <>
          <DragDropGrid items={overviewCards} renderItem={renderMetricCard} storageKey="kims-doctors-overview-order" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" />

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {filterKPI("overview", "top-ranking") && (
              <Panel title="🏆 Top Doctor Payout Ranking">
                <SimpleTable
                  headers={["Doctor", "Department", "Net Payout"]}
                  rows={topDoctors.slice(0, 5).map((item) => [
                    item.doctor,
                    item.department,
                    formatCurrency(item.netPayout),
                  ])}
                />
              </Panel>
            )}

            {filterKPI("overview", "payout-alerts") && (
              <Panel title="🚨 Payout Alerts">
                <div className="space-y-3">
                  <Alert text={`${formatCurrency(summary.pendingPayout)} payout is pending for approval.`} type="warning" />
                  <Alert text={`${summary.doctorCount} doctors are included in the current payout cycle.`} type="info" />
                  <Alert text="TDS and deductions are calculated separately for payout control." type="success" />
                </div>
              </Panel>
            )}
          </div>
        </>
      )}

      {activeTab === "doctor" && filterKPI("doctor", "table") && (
        <Panel title="👨‍⚕️ Doctor-wise Payout Details">
          <SimpleTable
            headers={[
              "Doctor",
              "Department",
              "Revenue",
              "Gross Payout",
              "TDS",
              "Net Payout",
              "Status",
            ]}
            rows={doctors.map((item) => [
              item.doctor,
              item.department,
              formatCurrency(item.revenue),
              formatCurrency(item.grossPayout),
              formatCurrency(item.tds),
              formatCurrency(item.netPayout),
              <StatusBadge status={item.status} />,
            ])}
          />
        </Panel>
      )}

      {activeTab === "department" && filterKPI("department", "table") && (
        <Panel title="🏥 Department-wise Doctor Payout">
          <SimpleTable
            headers={["Department", "Doctors", "Revenue", "Net Payout"]}
            rows={departmentData.map((item) => [
              item.department,
              item.doctors,
              formatCurrency(item.revenue),
              formatCurrency(item.payout),
            ])}
          />
        </Panel>
      )}

      {activeTab === "service" && filterKPI("service", "table") && (
        <Panel title="🧪 Service-wise Revenue & Payout">
          <SimpleTable
            headers={["Service", "Doctors", "Revenue", "Payout"]}
            rows={serviceData.map((item) => [
              item.service,
              item.doctors,
              formatCurrency(item.revenue),
              formatCurrency(item.payout),
            ])}
          />
        </Panel>
      )}

      {activeTab === "contribution" && filterKPI("contribution", "panel") && (
        <Panel title="📈 Doctor Revenue Contribution">
          <div className="space-y-5">
            {topDoctors.map((item) => {
              const percentage =
                summary.totalRevenue > 0
                  ? (item.revenue / summary.totalRevenue) * 100
                  : 0;

              return (
                <div key={item.doctor}>
                  <div className="mb-2 flex justify-between text-sm font-medium">
                    <span>
                      {item.doctor} — {item.department}
                    </span>
                    <span>
                      {formatCurrency(item.revenue)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="h-3 rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-green-600"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {activeTab === "trend" && filterKPI("trend", "panel") && (
        <Panel title="📅 Monthly Doctor Payout Trend">
          <div className="grid gap-5 md:grid-cols-5">
            <MetricCard title="January" value="₹10.2 L" icon="📅" />
            <MetricCard title="February" value="₹11.4 L" icon="📅" />
            <MetricCard title="March" value="₹12.1 L" icon="📅" />
            <MetricCard title="April" value="₹13.8 L" icon="📅" />
            <MetricCard title="May" value="₹15.0 L" icon="📈" />
          </div>
        </Panel>
      )}

      {activeTab === "pending" && filterKPI("pending", "table") && (
        <Panel title="⏳ Pending Doctor Payout">
          <SimpleTable
            headers={["Doctor", "Department", "Net Payout", "Status"]}
            rows={doctors
              .filter((item) =>
                String(item.status).toLowerCase().includes("pending")
              )
              .map((item) => [
                item.doctor,
                item.department,
                formatCurrency(item.netPayout),
                <StatusBadge status={item.status} />,
              ])}
          />
        </Panel>
      )}

      {activeTab === "tds" && filterKPI("tds", "table") && (
        <Panel title="🧾 TDS & Deduction Details">
          <SimpleTable
            headers={[
              "Doctor",
              "Gross Payout",
              "TDS",
              "Other Deductions",
              "Net Payout",
            ]}
            rows={doctors.map((item) => [
              item.doctor,
              formatCurrency(item.grossPayout),
              formatCurrency(item.tds),
              formatCurrency(item.deductions),
              formatCurrency(item.netPayout),
            ])}
          />
        </Panel>
      )}

      {activeTab === "top" && filterKPI("top", "table") && (
        <Panel title="🏆 Top Doctors by Net Payout">
          <SimpleTable
            headers={["Rank", "Doctor", "Department", "Patients", "Net Payout"]}
            rows={topDoctors.map((item, index) => [
              `#${index + 1}`,
              item.doctor,
              item.department,
              item.patients || "-",
              formatCurrency(item.netPayout),
            ])}
          />
        </Panel>
      )}

      {activeTab === "upload" && filterKPI("upload", "widget") && (
        <Panel title="📤 Upload Doctor Payout Excel">
          <div className="rounded-xl border-2 border-dashed border-green-300 bg-green-50 p-8">
            <p className="mb-4 text-lg font-semibold text-green-800">
              Upload Doctor Payout MIS / Excel File
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleUpload}
              className="rounded border bg-white p-3"
            />

            {fileName && (
              <div className="mt-5 rounded-lg bg-white p-4 shadow">
                <p className="font-semibold text-green-700">
                  Uploaded File: {fileName}
                </p>

                <p className="mt-1 text-gray-600">
                  Records Loaded: {uploadedRows.length}
                </p>
              </div>
            )}

            <div className="mt-6 rounded-lg bg-white p-5 text-sm text-gray-700 shadow">
              <p className="mb-2 font-bold">Recommended Excel Columns:</p>

              <p>
                Doctor Name, Department, Service, Revenue, Gross Payout, TDS,
                Deductions, Net Payout, Patients, Status
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-gray-800">{value}</h2>
        </div>

        <div className="text-5xl">{icon}</div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-5 text-2xl font-bold text-green-800">{title}</h2>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="border-b bg-green-50 text-left">
            {headers.map((header) => (
              <th key={header} className="p-3 text-sm font-bold text-green-800">
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-green-50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="p-3 text-sm text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={headers.length}
                className="p-6 text-center text-gray-500"
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const isPending = String(status).toLowerCase().includes("pending");

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isPending
          ? "bg-orange-100 text-orange-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {status}
    </span>
  );
}

function Alert({ text, type }) {
  const styles = {
    warning: "bg-orange-100 text-orange-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
  };

  return <div className={`rounded-lg p-4 ${styles[type]}`}>{text}</div>;
}

function toNumber(value) {
  if (typeof value === "number") return value;

  if (!value) return 0;

  return Number(String(value).replace(/[₹,\s]/g, "")) || 0;
}

function formatCurrency(value) {
  if (!value) return "₹0";

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`;
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}
