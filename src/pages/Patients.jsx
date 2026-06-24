import { useSearchParams, useLocation } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import PatientChart from '../charts/PatientChart';
import UploadWidget from '../components/UploadWidget';
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";

const genderData = [
  { name: "Male", value: 52, count: 6452, color: "#3b82f6" },
  { name: "Female", value: 48, count: 5955, color: "#22c55e" },
];

const ageData = [
  { name: "0-18 Years", value: 15, count: 1861, color: "#8b5cf6" },
  { name: "19-45 Years", value: 35, count: 4342, color: "#3b82f6" },
  { name: "46-60 Years", value: 28, count: 3474, color: "#f59e0b" },
  { name: "60+ Years", value: 22, count: 2730, color: "#ef4444" },
];

function DemographicsCard({ title, data, total }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
      <div className="flex items-center gap-6">
        <div className="shrink-0 h-52 w-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={62} outerRadius={85} dataKey="value" paddingAngle={2}>
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                formatter={(value, name, item) => [`${value}%`, item.payload.name]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.15)', fontSize: '13px' }}
              />
              <text x="50%" y="48%" textAnchor="middle" fill="#1f2937" fontSize="24" fontWeight="bold" dominantBaseline="middle">
                {total.toLocaleString("en-IN")}
              </text>
              <text x="50%" y="60%" textAnchor="middle" fill="#9ca3af" fontSize="11" dominantBaseline="middle">
                Total
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between border-b border-gray-50 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-800">{entry.count.toLocaleString("en-IN")}</span>
                <span className="text-xs text-gray-400 ml-1.5">({entry.value}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





export default function Patients() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("patients");

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const patientMainCards = [
    { key: "visits", title: "Total Visits (MTD)", value: getVal("total-visits", "12,407"), icon: "🏥" },
    { key: "opd", title: "OPD Visits", value: getVal("opd-visits", "5,589"), icon: "🚶" },
    { key: "ipd", title: "IPD Admissions", value: getVal("ipd-admissions", "1,245"), icon: "🛏️" },
    { key: "emergency", title: "Emergency Cases", value: getVal("emergency-cases", "284"), icon: "🚑" },
  ];

  const patientRetentionCards = [
    { key: "new", title: "New Patients", value: getVal("new-patients", "45%"), icon: "🆕" },
    { key: "repeat", title: "Repeat Patients", value: getVal("repeat-patients", "55%"), icon: "🔄" },
    { key: "satisfaction", title: "Patient Satisfaction", value: getVal("patient-satisfaction", "4.6/5"), icon: "⭐" },
  ];

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">👨⚕️ Patient Analytics</h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={patientMainCards} renderItem={renderCard} storageKey="kims-patients-main-order" className="grid md:grid-cols-4 gap-5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PatientChart />
            <ReportTable
              title="🏆 Top Specialties by Footfall"
              data={[
                ["General Medicine", "3,420"],
                ["Pediatrics", "2,150"],
                ["Orthopedics", "1,840"],
                ["Cardiology", "1,200"]
              ]}
            />
          </div>
        </div>
      )}

      {/* OPD */}
      {activeTab === "opd" && (
        <ReportTable
          title="🚶 OP Patient Analytics"
          data={[
            ["Average Daily OPD", "420"],
            ["Peak OPD Hour", "10:00 AM - 12:00 PM"],
            ["Avg Wait Time", "18 Mins"],
            ["Conversion to IPD", "12%"]
          ]}
        />
      )}

      {/* IPD */}
      {activeTab === "ipd" && (
        <ReportTable
          title="🛏️ IP Patient Analytics"
          data={[
            ["Current Inpatients", "482"],
            ["Avg Length of Stay", "4.2 Days"],
            ["Discharges Today", "45"],
            ["Planned Admissions", "32"]
          ]}
        />
      )}

      {/* NEW VS REPEAT */}
      {activeTab === "retention" && (
        <DragDropGrid items={patientRetentionCards} renderItem={renderCard} storageKey="kims-patients-retention-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* DEMOGRAPHICS */}
      {activeTab === "demographics" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <DemographicsCard
            title="👤 By Gender"
            data={genderData}
            total={genderData.reduce((s, d) => s + d.count, 0)}
          />
          <DemographicsCard
            title="📊 By Age Group"
            data={ageData}
            total={ageData.reduce((s, d) => s + d.count, 0)}
          />
        </div>
      )}

      {/* DOCTOR LOAD */}
      {activeTab === "doctor" && (
        <ReportTable
          title="👨⚕️ Top Doctor Consulting Load"
          data={[
            ["Dr. Sharma (Cardiology)", "42 Patients/Day"],
            ["Dr. Patel (Pediatrics)", "38 Patients/Day"],
            ["Dr. Rao (General)", "55 Patients/Day"],
            ["Dr. Mohanty (Ortho)", "30 Patients/Day"]
          ]}
        />
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Patient Registration Data" onDataLoaded={handleDataLoaded} />
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
