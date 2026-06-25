import { useSearchParams, useLocation } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import OperationsChart from "../charts/OperationsChart";
import UploadWidget from "../components/UploadWidget";
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";











const peakHourData = [
  { hour: "8 AM", patients: 52 },
  { hour: "9 AM", patients: 86 },
  { hour: "10 AM", patients: 128 },
  { hour: "11 AM", patients: 154 },
  { hour: "12 PM", patients: 143 },
  { hour: "1 PM", patients: 118 },
];

export default function Operations() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("operations");

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const opsMainCards = [
    { key: "utilization", title: "Doctor Utilization", value: getVal("doctor-utilization", "87%"), icon: "👨⚕️" },
    { key: "admissions", title: "Admissions", value: getVal("admissions", "620"), icon: "📥" },
    { key: "alos", title: "ALOS", value: getVal("alos", "4.2 Days"), icon: "⏳" },
    { key: "emergency", title: "Emergency", value: getVal("emergency", "284"), icon: "🚑" },
    { key: "insurance", title: "Insurance Claims", value: getVal("insurance-claims", "₹18 Cr"), icon: "📑" },
    { key: "discharges", title: "Discharges", value: getVal("discharges", "582"), icon: "📤" },
    { key: "occupancy", title: "Occupancy", value: getVal("occupancy", "86%"), icon: "🛏️" },
    { key: "efficiency", title: "Efficiency", value: getVal("efficiency", "92%"), icon: "🏆" },
  ];

  const opsAdmissionCards = [
    { key: "adm", title: "Admissions", value: getVal("admissions", "620"), icon: "📥" },
    { key: "disch", title: "Discharges", value: getVal("discharges", "582"), icon: "📤" },
    { key: "net", title: "Net Change", value: getVal("net-change", "+38"), icon: "📈" },
  ];

  const opsAlosCards = [
    { key: "hospital", title: "Hospital ALOS", value: getVal("hospital-alos", "4.2 Days"), icon: "⏳" },
    { key: "icu", title: "ICU ALOS", value: getVal("icu-alos", "7.1 Days"), icon: "🚨" },
    { key: "cardiology", title: "Cardiology", value: getVal("cardiology-alos", "4.5 Days"), icon: "❤️" },
    { key: "ortho", title: "Orthopedics", value: getVal("orthopedics-alos", "5.2 Days"), icon: "🦴" },
  ];

  const opsEmergencyCards = [
    { key: "cases", title: "Emergency Cases", value: getVal("emergency", "284"), icon: "🚑" },
    { key: "critical", title: "Critical", value: getVal("critical-cases", "34"), icon: "🔴" },
    { key: "observation", title: "Observation", value: getVal("observation-cases", "61"), icon: "🟡" },
    { key: "er-adm", title: "ER Admissions", value: getVal("er-admissions", "72"), icon: "🏥" },
  ];

  const opsInsuranceCards = [
    { key: "total", title: "Total Claims", value: getVal("total-claims", "₹18 Cr"), icon: "📑" },
    { key: "approved", title: "Approved", value: getVal("approved-claims", "₹15 Cr"), icon: "✅" },
    { key: "pending", title: "Pending", value: getVal("pending-claims", "₹2 Cr"), icon: "⏳" },
    { key: "rejected", title: "Rejected", value: getVal("rejected-claims", "₹1 Cr"), icon: "❌" },
  ];

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">
        📈 Operations Command Center
      </h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <>
          <DragDropGrid items={opsMainCards} renderItem={renderCard} storageKey="kims-ops-main-order" className="grid md:grid-cols-4 gap-5" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <OperationsChart />
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Key Metrics</h2>
              <div className="space-y-3">
                {[
                  ["Surgeries Today", "24"],
                  ["Avg OT Time", "2.5 Hrs"],
                  ["Doctor Availability", "92%"],
                  ["Staff On Duty", "186"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ALERTS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
            <h2 className="text-2xl font-bold mb-5 text-gray-800">
              🚨 Executive Alerts
            </h2>
            <div className="space-y-3">
              <Alert text="ICU Occupancy Above 90%" color="red" />
              <Alert text="Emergency Load Increasing" color="orange" />
              <Alert text="48 Pending Lab Reports" color="orange" />
              <Alert text="12 Medicines Near Expiry" color="orange" />
              <Alert text="Revenue Target Achieved" color="green" />
            </div>
          </div>
        </>
      )}

      {/* DOCTOR */}
      {activeTab === "doctor" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">👨⚕️ Doctor Utilization</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-3">Doctor</th>
                  <th className="py-3">Patients</th>
                  <th className="py-3">Utilization</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b"><td className="py-3">Dr Sharma</td><td className="py-3">142</td><td className="py-3 text-green-600 font-bold">94%</td></tr>
                <tr className="border-b"><td className="py-3">Dr Rao</td><td className="py-3">118</td><td className="py-3 text-green-600 font-bold">88%</td></tr>
                <tr className="border-b"><td className="py-3">Dr Patel</td><td className="py-3">103</td><td className="py-3 text-orange-500 font-bold">81%</td></tr>
                <tr><td className="py-3">Dr Mohanty</td><td className="py-3">96</td><td className="py-3 text-red-500 font-bold">75%</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMISSION */}
      {activeTab === "admission" && (
        <DragDropGrid items={opsAdmissionCards} renderItem={renderCard} storageKey="kims-ops-admission-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* ALOS */}
      {activeTab === "alos" && (
        <DragDropGrid items={opsAlosCards} renderItem={renderCard} storageKey="kims-ops-alos-order" className="grid md:grid-cols-4 gap-5" />
      )}

      {/* EMERGENCY */}
      {activeTab === "emergency" && (
        <DragDropGrid items={opsEmergencyCards} renderItem={renderCard} storageKey="kims-ops-emergency-order" className="grid md:grid-cols-4 gap-5" />
      )}

      {/* INSURANCE */}
      {activeTab === "insurance" && (
        <DragDropGrid items={opsInsuranceCards} renderItem={renderCard} storageKey="kims-ops-insurance-order" className="grid md:grid-cols-4 gap-5" />
      )}

      {/* PEAK HOURS */}
      {activeTab === "peak" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🕒 Peak Hour Analytics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={peakHourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.15)", fontSize: "13px" }}
                />
                <Bar dataKey="patients" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Hourly Breakdown</h2>
            <table className="w-full text-left text-gray-700">
              <tbody>
                {peakHourData.map((row) => (
                  <tr key={row.hour} className="border-b last:border-0">
                    <td className="py-3">{row.hour}</td>
                    <td className="py-3 font-bold text-right">{row.patients}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT */}
      {activeTab === "department" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">🏆 Department Efficiency</h2>
          <table className="w-full text-left text-gray-700">
            <tbody>
              <tr className="border-b"><td className="py-3">Cardiology</td><td className="py-3 font-bold text-green-600">96%</td></tr>
              <tr className="border-b"><td className="py-3">Orthopedics</td><td className="py-3 font-bold text-green-600">91%</td></tr>
              <tr className="border-b"><td className="py-3">Neurology</td><td className="py-3 font-bold text-green-600">88%</td></tr>
              <tr className="border-b"><td className="py-3">Radiology</td><td className="py-3 font-bold text-orange-500">84%</td></tr>
              <tr><td className="py-3">Emergency</td><td className="py-3 font-bold text-orange-500">82%</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Operations MIS Data" onDataLoaded={handleDataLoaded} />
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Required Format</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Date (DD-MM-YYYY)</li>
              <li>Department / Doctor Code</li>
              <li>Surgeries & Operations Count</li>
              <li>Admission & Discharge Data</li>
              <li>Emergency Case Logs</li>
            </ul>
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

function Alert({ text, color }) {
  const colors = {
    red: "bg-red-50 text-red-700 border border-red-200",
    orange: "bg-orange-50 text-orange-700 border border-orange-200",
    green: "bg-green-50 text-green-700 border border-green-200"
  };

  return (
    <div className={`p-4 rounded-lg font-medium flex items-center gap-3 ${colors[color]}`}>
      <span>{color === 'red' ? '🚨' : color === 'orange' ? '⚠️' : '✅'}</span>
      {text}
    </div>
  );
}
