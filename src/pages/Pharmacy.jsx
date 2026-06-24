import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import PharmacyChart from '../charts/PharmacyChart';
import UploadWidget from '../components/UploadWidget';
import DragDropGrid from "../components/DragDropGrid";
import useModuleKPIs from "../hooks/useModuleKPIs";





export default function Pharmacy() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("pharmacy");

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const pharmacyMainCards = [
    { key: "collection", title: "Today's Collection", value: getVal("collection", "₹18.11 L"), icon: "💳" },
    { key: "bills", title: "Total Bills", value: getVal("total-bills", "842"), icon: "🧾" },
    { key: "avg-bill", title: "Avg Bill Value", value: getVal("avg-bill-value", "₹2,150"), icon: "📊" },
    { key: "ipd-indents", title: "IPD Indents", value: getVal("ipd-indents", "145"), icon: "🏥" },
  ];

  const pharmacyExpiryCards = [
    { key: "30d", title: "Expiring in 30 Days", value: getVal("expiring-30d", "12 Batches"), icon: "⚠️" },
    { key: "90d", title: "Expiring in 90 Days", value: getVal("expiring-90d", "45 Batches"), icon: "📅" },
    { key: "risk", title: "Value at Risk", value: getVal("value-at-risk", "₹1.2 L"), icon: "📉" },
  ];

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">💊 Pharmacy Operations</h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={pharmacyMainCards} renderItem={renderCard} storageKey="kims-pharmacy-main-order" className="grid md:grid-cols-4 gap-5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PharmacyChart />
            <ReportTable
              title="⚠️ Stock Alerts"
              data={[
                ["Paracetamol 500mg", "Low Stock (Reorder Level Reached)"],
                ["Insulin Syringes", "Out of Stock (Emergency Restock)"],
                ["Near Expiry Items", "12 Batches expiring this month"]
              ]}
            />
          </div>
        </div>
      )}

      {/* SALES */}
      {activeTab === "sales" && (
        <ReportTable
          title="📈 Daily Sales Breakdown"
          data={[
            ["OPD Pharmacy Sales", "₹11.50 L"],
            ["IPD Pharmacy Sales", "₹6.61 L"],
            ["Cash Collection", "₹7.11 L"],
            ["Card/UPI Collection", "₹11.00 L"]
          ]}
        />
      )}

      {/* INVENTORY */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">📦 Inventory Status</h2>
          <table className="w-full text-left text-gray-700">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Stock Value</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-3 px-2">Antibiotics</td><td className="py-3 px-2 font-bold">₹12.5 L</td><td className="py-3 px-2 text-green-600">Optimal</td></tr>
              <tr className="border-b"><td className="py-3 px-2">Cardiovascular</td><td className="py-3 px-2 font-bold">₹8.2 L</td><td className="py-3 px-2 text-green-600">Optimal</td></tr>
              <tr className="border-b"><td className="py-3 px-2">Analgesics</td><td className="py-3 px-2 font-bold">₹2.1 L</td><td className="py-3 px-2 text-red-500">Low Stock</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* EXPIRY */}
      {activeTab === "expiry" && (
        <DragDropGrid items={pharmacyExpiryCards} renderItem={renderCard} storageKey="kims-pharmacy-expiry-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* REFUNDS */}
      {activeTab === "refunds" && (
        <ReportTable
          title="🔙 Pharmacy Returns & Refunds"
          data={[
            ["OPD Returns", "₹22,500 (15 Bills)"],
            ["IPD Returns (Discharge)", "₹45,000 (8 Bills)"],
            ["Total Refund Value", "₹67,500"],
            ["Return Rate", "3.7% of Sales"]
          ]}
        />
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <UploadWidget title="Upload Pharmacy Collections/Stock Data" onDataLoaded={handleDataLoaded} />
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
