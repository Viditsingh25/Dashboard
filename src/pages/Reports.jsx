import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import { canAccessKPI } from "../utils/authConfig";
import DragDropGrid from "../components/DragDropGrid";

export default function Reports({ currentUser, roles }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const filterKPI = (tab, key) => canAccessKPI(currentUser, "/reports", tab, key, roles);

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const reportCards = useMemo(() => [
    { key: "revenue", title: "Revenue Reports", value: "124", icon: "💰" },
    { key: "patient", title: "Patient Reports", value: "98", icon: "👨‍⚕️" },
    { key: "pharmacy", title: "Pharmacy Reports", value: "74", icon: "💊" },
    { key: "lab", title: "Lab Reports", value: "63", icon: "🧪" },
  ].filter((c) => filterKPI("overview", c.key)), [currentUser, roles]);

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">
        📑 Reports Center
      </h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <DragDropGrid items={reportCards} renderItem={renderCard} storageKey="kims-reports-main-order" className="grid md:grid-cols-4 gap-5" />
      )}

      {/* REVENUE */}
      {activeTab === "revenue" && filterKPI("revenue", "table") && (
        <ReportTable
          title="💰 Revenue Reports"
          data={[
            ["Daily Revenue", "₹97.86 L"],
            ["MTD Revenue", "₹32.79 Cr"],
            ["Accrued Revenue", "₹10.95 Cr"],
            ["Collection", "₹18.11 L"]
          ]}
        />
      )}

      {/* PATIENT */}
      {activeTab === "patient" && filterKPI("patient", "table") && (
        <ReportTable
          title="👨⚕️ Patient Reports"
          data={[
            ["Total Visits", "12,407"],
            ["OP Visits", "5,589"],
            ["IP Visits", "6,818"],
            ["Emergency", "284"]
          ]}
        />
      )}

      {/* PHARMACY */}
      {activeTab === "pharmacy" && filterKPI("pharmacy", "table") && (
        <ReportTable
          title="💊 Pharmacy Reports"
          data={[
            ["Cash Collection", "₹7.11 L"],
            ["Card Collection", "₹2.25 L"],
            ["Total Collection", "₹18.11 L"],
            ["Refund", "₹1.10 L"]
          ]}
        />
      )}

      {/* LAB */}
      {activeTab === "lab" && filterKPI("lab", "table") && (
        <ReportTable
          title="🧪 Lab Reports"
          data={[
            ["MRI", "142"],
            ["CT Scan", "311"],
            ["Blood Tests", "5842"],
            ["Revenue", "₹48 L"]
          ]}
        />
      )}

      {/* BED */}
      {activeTab === "bed" && filterKPI("bed", "table") && (
        <ReportTable
          title="🛏️ Bed Reports"
          data={[
            ["Occupancy", "86%"],
            ["ICU", "92%"],
            ["Ward", "78%"],
            ["Ventilator", "72%"]
          ]}
        />
      )}

      {/* DRILL DOWN */}
      {activeTab === "drill" && filterKPI("drill", "panel") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">📊 Drill Down Reports</h2>
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-center gap-2"><span className="p-2 bg-blue-50 text-blue-600 rounded-lg">Revenue</span> ➔ Department ➔ Doctor</li>
            <li className="flex items-center gap-2"><span className="p-2 bg-green-50 text-green-600 rounded-lg">Patient</span> ➔ OP ➔ Doctor</li>
            <li className="flex items-center gap-2"><span className="p-2 bg-orange-50 text-orange-600 rounded-lg">Pharmacy</span> ➔ Medicine ➔ Batch</li>
            <li className="flex items-center gap-2"><span className="p-2 bg-purple-50 text-purple-600 rounded-lg">Lab</span> ➔ Test ➔ Patient</li>
          </ul>
        </div>
      )}

      {/* PDF */}
      {activeTab === "pdf" && filterKPI("pdf", "export") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📄 Export PDF</h2>
          <button className="bg-red-600 text-white font-medium px-5 py-3 rounded-lg hover:bg-red-700 shadow-sm transition-colors">
            Download PDF Report
          </button>
        </div>
      )}

      {/* EXCEL */}
      {activeTab === "excel" && filterKPI("excel", "export") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📥 Export Excel</h2>
          <button className="bg-green-600 text-white font-medium px-5 py-3 rounded-lg hover:bg-green-700 shadow-sm transition-colors">
            Download Excel Report
          </button>
        </div>
      )}

      {/* SCHEDULE */}
      {activeTab === "schedule" && filterKPI("schedule", "form") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">⏰ Schedule Reports</h2>
          <div className="space-y-4 max-w-md">
            <input type="email" placeholder="Enter Email" className="border border-gray-300 p-3 w-full rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-green-500" />
            <select className="border border-gray-300 p-3 w-full rounded-lg bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-green-500 text-gray-700">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
            <button className="bg-green-600 text-white font-medium px-5 py-3 rounded-lg w-full hover:bg-green-700 shadow-sm transition-colors">
              Schedule Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function Card({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
        </div>
        <div className="text-4xl bg-gray-50 p-2 rounded-lg">{icon}</div>
      </div>
    </div>
  );
}

function ReportTable({ title, data }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-5 text-gray-800">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-700">
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-4 px-2">{row[0]}</td>
                <td className="py-4 px-2 font-bold text-gray-900">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
