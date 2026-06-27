import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import { canAccessKPI } from "../utils/authConfig";
import DiagnosticsChart from '../charts/DiagnosticsChart';
import UploadWidget from '../components/UploadWidget';
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";





export default function LabRadiology({ currentUser, roles }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("lab");
  const filterKPI = (tab, key) => canAccessKPI(currentUser, "/lab", tab, key, roles);

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const labMainCards = [
    { key: "tests", title: "Total Tests Today", value: getVal("total-tests", "1,245"), icon: "🔬" },
    { key: "scans", title: "Scans Today", value: getVal("total-scans", "342"), icon: "🏥" },
    { key: "tat", title: "Average TAT", value: getVal("average-tat", "3.5 Hrs"), icon: "⏱️" },
    { key: "revenue", title: "Diagnostics Rev.", value: getVal("diagnostics-revenue", "₹12.5 L"), icon: "💰" },
  ].filter((c) => filterKPI("overview", c.key));

  const labRadiologyCards = [
    { key: "xray", title: "X-Ray", value: getVal("xray-scans", "180 Scans"), icon: "🦴" },
    { key: "usg", title: "Ultrasound (USG)", value: getVal("usg-scans", "95 Scans"), icon: "👶" },
    { key: "mri", title: "MRI / CT Scan", value: getVal("mri-ct-scans", "67 Scans"), icon: "🧠" },
  ].filter((c) => filterKPI("radiology", c.key));

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">🧪 Lab & Radiology</h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={labMainCards} renderItem={renderCard} storageKey="kims-lab-main-order" className="grid md:grid-cols-4 gap-5" />
          { (filterKPI("overview", "volumes-chart") || filterKPI("overview", "alerts")) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filterKPI("overview", "volumes-chart") && <DiagnosticsChart />}
              {filterKPI("overview", "alerts") && (
                <ReportTable
                  title="⚠️ Alerts & Outliers"
                  data={[
                    ["Critical Values Reported", "14 Cases"],
                    ["Pending > 24Hrs", "5 Routine Tests"],
                    ["Machine Calibration", "MRI Scanner due at 5 PM"]
                  ]}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* PATHOLOGY */}
      {activeTab === "pathology" && filterKPI("pathology", "table") && (
        <ReportTable
          title="🔬 Pathology Sub-Departments"
          data={[
            ["Biochemistry", "650 Tests"],
            ["Hematology", "420 Tests"],
            ["Microbiology", "120 Tests"],
            ["Histopathology", "55 Tests"]
          ]}
        />
      )}

      {/* RADIOLOGY */}
      {activeTab === "radiology" && (
        <DragDropGrid items={labRadiologyCards} renderItem={renderCard} storageKey="kims-lab-radiology-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* TAT */}
      {activeTab === "tat" && filterKPI("tat", "table") && (
        <ReportTable
          title="⏱️ Turnaround Time Analytics"
          data={[
            ["Routine Bloods", "Target: 4 Hrs | Actual: 3.2 Hrs"],
            ["Urgent / STAT", "Target: 1 Hr | Actual: 55 Mins"],
            ["X-Ray Reports", "Target: 2 Hrs | Actual: 1.5 Hrs"],
            ["MRI Reports", "Target: 24 Hrs | Actual: 18 Hrs"]
          ]}
        />
      )}

      {/* PENDING */}
      {activeTab === "pending" && filterKPI("pending", "table") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">⏳ Pending Reports Queue</h2>
          <table className="w-full text-left text-gray-700">
            <tbody>
              <tr className="border-b"><td className="py-3">IPD Patient Tests</td><td className="py-3 font-bold text-orange-500">24 Pending</td></tr>
              <tr className="border-b"><td className="py-3">OPD Patient Tests</td><td className="py-3 font-bold text-gray-900">112 Pending</td></tr>
              <tr><td className="py-3">Outsourced Tests</td><td className="py-3 font-bold text-orange-500">8 Pending</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && filterKPI("upload", "widget") && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload LIS/PACS Data" onDataLoaded={handleDataLoaded} />
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
