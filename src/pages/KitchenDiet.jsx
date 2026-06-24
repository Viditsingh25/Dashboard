import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import UploadWidget from "../components/UploadWidget";
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";



const mealProduction = [
  ["Morning Tea", "1,196"],
  ["Breakfast Time", "1,191"],
  ["Mid Morning", "1,205"],
  ["Lunch", "1,202"],
  ["Evening Tea", "1,208"],
  ["Snacks", "1,196"],
  ["Dinner", "1,196"],
];

const dietCategories = [
  ["Normal", "175"],
  ["Diabetes", "31"],
  ["Nasogastric Tube Feeding", "11"],
  ["Liquid", "15"],
  ["Renal", "8"],
  ["NBM/NPO", "19"],
  ["Semisolid", "8"],
  ["Soft", "1"],
  ["Unclassified", "75"],
];

export default function KitchenDiet() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("kitchen-diet");

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const kpis = [
    { key: "total-diet", title: "Total Diet Order", value: getVal("total-diet-order", "343"), icon: "DO" },
    { key: "patient-served", title: "Total Patient Served", value: getVal("total-patient-served", "1,186"), icon: "PS" },
    { key: "meal-prod", title: "Total Meal Production", value: getVal("total-meal-production", "8,394"), icon: "MP" },
    { key: "diet-mod", title: "Diet Modification Count", value: getVal("diet-modification-count", "555"), icon: "DM" },
    { key: "special-diet", title: "Special Diet Count", value: getVal("special-diet-count", "93"), icon: "SD" },
    { key: "normal-diet", title: "Normal Diet Count", value: getVal("normal-diet-count", "175"), icon: "ND" },
  ];

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">Kitchen & Diet</h1>

      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={kpis} renderItem={renderCard} storageKey="kims-kitchen-main-order" className="grid md:grid-cols-3 xl:grid-cols-6 gap-5" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportTable title="Meal Production Breakdown" data={mealProduction} />
            <ReportTable title="Diet Category Breakdown" data={dietCategories} />
          </div>
        </div>
      )}

      {activeTab === "production" && (
        <ReportTable title="Meal Production Breakdown" data={mealProduction} />
      )}

      {activeTab === "diet" && (
        <ReportTable title="Diet Category Breakdown" data={dietCategories} />
      )}

      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Kitchen/Diet Excel Data" onDataLoaded={handleDataLoaded} />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">KPI Source Files</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Kitchen Report morning tea.xls</li>
              <li>Kitchen Report breakfast.xls</li>
              <li>Kitchen Report mid morning.xls</li>
              <li>Kitchen Report lunch.xls</li>
              <li>Kitchen Report evening test.xls</li>
              <li>Kitchen Report evng tea.xls</li>
              <li>Kitchen Report dinner.xls</li>
              <li>Diet Prescription Report on dt.04-06-2026.xls</li>
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
      <div className="flex justify-between items-start gap-3">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gray-50 text-sm font-bold text-green-700">
          {icon}
        </div>
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
