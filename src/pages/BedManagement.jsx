import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import OccupancyChart from '../charts/OccupancyChart';
import UploadWidget from '../components/UploadWidget';
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";

export default function BedManagement() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("beds");

  const bedMainCards = useMemo(() => [
    { key: "total", title: "Total Beds", value: getVal("total_beds", "850"), icon: "🛏️" },
    { key: "occupancy", title: "Overall Occupancy", value: getVal("overall_occupancy", "86%"), icon: "📊" },
    { key: "available", title: "Available Beds", value: getVal("available_beds", "119"), icon: "✅" },
    { key: "turnover", title: "Turnover Rate", value: getVal("turnover_rate", "2.4 Days"), icon: "🔄" },
  ], [getVal]);

  const bedWardCards = useMemo(() => [
    { key: "capacity", title: "Ward Capacity", value: getVal("ward_capacity", "500"), icon: "🏢" },
    { key: "ward-occ", title: "Ward Occupancy", value: getVal("ward_occupancy", "82%"), icon: "📉" },
    { key: "discharges", title: "Discharges Expected", value: getVal("discharges_expected", "45"), icon: "📤" },
  ], [getVal]);

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">🛏️ Bed Management</h1>

      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={bedMainCards} renderItem={renderCard} storageKey="kims-bed-main-order" className="grid md:grid-cols-4 gap-5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OccupancyChart />
            <ReportTable
              title="🔴 Critical Bed Alerts"
              data={[
                ["Medical ICU", "100% Full (0 Available)"],
                ["Surgical ICU", "95% Full (1 Available)"],
                ["NICU", "90% Full (2 Available)"]
              ]}
            />
          </div>
        </div>
      )}

      {activeTab === "icu" && (
        <ReportTable
          title="🚨 ICU Status Breakdown"
          data={[
            ["Medical ICU", "20/20 Occupied"],
            ["Surgical ICU", "19/20 Occupied"],
            ["Neuro ICU", "12/15 Occupied"],
            ["Cardiac ICU (CCU)", "14/15 Occupied"],
            ["NICU / PICU", "18/20 Occupied"]
          ]}
        />
      )}

      {activeTab === "ward" && (
        <DragDropGrid items={bedWardCards} renderItem={renderCard} storageKey="kims-bed-ward-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {activeTab === "deluxe" && (
        <ReportTable
          title="🏨 Private & Deluxe Rooms"
          data={[
            ["Super Deluxe Rooms", "15/20 Occupied"],
            ["Deluxe Rooms", "40/50 Occupied"],
            ["Twin Sharing", "80/100 Occupied"],
            ["Revenue Impact", "₹4.5 L/Day"]
          ]}
        />
      )}

      {activeTab === "ventilator" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">🫁 Ventilator & Equipment Status</h2>
          <div className="grid grid-cols-2 gap-8 text-gray-700">
            <div>
              <p className="flex justify-between py-2 border-b"><span>Total Ventilators</span> <span className="font-bold">{getVal("total_ventilators", "40")}</span></p>
              <p className="flex justify-between py-2 border-b"><span>In Use</span> <span className="font-bold text-red-500">{getVal("ventilator_in_use", "32")}</span></p>
              <p className="flex justify-between py-2 border-b"><span>Available</span> <span className="font-bold text-green-600">{getVal("ventilator_available", "6")}</span></p>
              <p className="flex justify-between py-2"><span>Under Maintenance</span> <span className="font-bold text-orange-500">{getVal("ventilator_maintenance", "2")}</span></p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "availability" && (
        <ReportTable
          title="✅ Live Bed Availability"
          data={[
            ["General Ward (Male)", "15 Beds Available"],
            ["General Ward (Female)", "12 Beds Available"],
            ["Orthopedic Ward", "5 Beds Available"],
            ["Maternity Ward", "8 Beds Available"]
          ]}
        />
      )}

      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Daily Census Report" onDataLoaded={handleDataLoaded} />
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Required Format</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Date (DD-MM-YYYY)</li>
              <li>Ward / Unit Name</li>
              <li>Total_Beds</li>
              <li>Occupied</li>
              <li>ICU_Beds</li>
              <li>ICU_Occupied</li>
              <li>ALOS_Days</li>
              <li>Active_Inpatients</li>
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
