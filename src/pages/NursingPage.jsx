import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import useModuleKPIs from "../hooks/useModuleKPIs";
import DragDropGrid from "../components/DragDropGrid";
import UploadWidget from "../components/UploadWidget";
import MidnightCensusForm from "./MidnightCensusForm";

function Card({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">{value}</h2>
        </div>
        <div className="text-4xl bg-gray-50 p-2 rounded-lg">{icon || "📊"}</div>
      </div>
    </div>
  );
}

export default function NursingPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);

  const { module, kpis, getVal, handleDataLoaded } = useModuleKPIs("nursing");

  const kpiCards = useMemo(() => {
    if (!kpis.length) return [];
    return kpis.map((k) => ({
      key: k.name,
      title: k.label,
      value: getVal(k.name, k.default_value || "—"),
      icon: "🩺",
    }));
  }, [kpis, getVal]);

  if (activeTab === "midnight-census") {
    return <MidnightCensusForm />;
  }

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">🩺 Nursing Dashboard</h1>

      {activeTab === defaultTab && (
        <div className="space-y-6">
          {kpiCards.length > 0 ? (
            <DragDropGrid
              items={kpiCards}
              renderItem={(item) => <Card title={item.title} value={item.value} icon={item.icon} />}
              storageKey="kims-nursing-order"
              className="grid md:grid-cols-4 gap-5"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
              No KPIs configured yet. Add KPIs via Settings → Module Configuration.
            </div>
          )}
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
            Configure this module's KPIs and upload data to see analytics here.
          </div>
        </div>
      )}

      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Nursing Data" onDataLoaded={handleDataLoaded} />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">How it works</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Add KPIs for this module in Settings → Module Configuration</li>
              <li>Upload an Excel file with columns matching those KPIs' source_column names</li>
              <li>Data is aggregated server-side and KPI values update automatically</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
