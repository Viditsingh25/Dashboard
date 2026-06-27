import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import { canAccessKPI } from "../utils/authConfig";
import RevenueTrendChart from '../charts/RevenueTrendChart';
import RevenueDonutChart from '../charts/RevenueDonutChart';
import UploadWidget from '../components/UploadWidget';
import useModuleKPIs from "../hooks/useModuleKPIs";
import DragDropGrid from "../components/DragDropGrid";

export default function Revenue({ currentUser, roles }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const { getVal, handleDataLoaded } = useModuleKPIs("revenue");

  const renderCard = (item) => <Card title={item.title} value={item.value} icon={item.icon} />;

  const filterKPI = (tab, key) => canAccessKPI(currentUser, "/revenue", tab, key, roles);

  const mainCards = useMemo(() => [
    { key: "mtd", title: "MTD Revenue", value: getVal("mtd-revenue", "₹32.79 Cr"), icon: "📈" },
    { key: "yesterday", title: "Yesterday Revenue", value: getVal("yesterday-revenue", "₹97.86 L"), icon: "💵" },
    { key: "avg-daily", title: "Avg Daily Rev", value: getVal("avg-daily-revenue", "₹92.5 L"), icon: "📊" },
    { key: "projected", title: "Projected Revenue", value: getVal("projected-revenue", "₹35.2 Cr"), icon: "🎯" },
  ].filter((c) => filterKPI("overview", c.key)), [getVal, currentUser, roles]);

  const collectionCards = useMemo(() => [
    { key: "cash", title: "Cash Collection", value: getVal("cash-collection", "₹42 L"), icon: "💵" },
    { key: "card", title: "Card/UPI Collection", value: getVal("card-collection", "₹38 L"), icon: "💳" },
    { key: "tpa", title: "Pending TPA", value: getVal("pending-tpa", "₹17 L"), icon: "⏳" },
  ].filter((c) => filterKPI("collections", c.key)), [getVal, currentUser, roles]);

  const insuranceCards = useMemo(() => [
    { key: "submitted", title: "TPA Claims Submitted", value: getVal("tpa-claims-submitted", "₹2.4 Cr"), icon: "📤" },
    { key: "settled", title: "TPA Claims Settled", value: getVal("tpa-claims-settled", "₹1.8 Cr"), icon: "✅" },
    { key: "deductions", title: "TPA Deductions", value: getVal("tpa-deductions", "₹12 L"), icon: "✂️" },
  ].filter((c) => filterKPI("insurance", c.key)), [getVal, currentUser, roles]);

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="text-4xl font-bold text-green-700 mb-6">💰 Revenue Analytics</h1>

      {/* FIRST / DEFAULT TAB */}
      {activeTab === defaultTab && (
        <div className="space-y-6">
          <DragDropGrid items={mainCards} renderItem={renderCard} storageKey="kims-revenue-main-order" className="grid md:grid-cols-4 gap-5" />
          {filterKPI("overview", "trend-chart") && filterKPI("overview", "donut-chart") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filterKPI("overview", "trend-chart") && (
                <div className="col-span-2">
                  <RevenueTrendChart />
                </div>
              )}
              {filterKPI("overview", "donut-chart") && (
                <div className="col-span-1">
                  <RevenueDonutChart />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DAILY REVENUE */}
      {activeTab === "daily" && filterKPI("daily", "breakdown") && (
        <ReportTable
          title="📅 Daily Revenue Breakdown"
          data={[
            ["OPD Revenue", "₹22.45 L"],
            ["IPD Revenue", "₹56.30 L"],
            ["Pharmacy Revenue", "₹12.11 L"],
            ["Diagnostics", "₹7.00 L"],
            ["Total Yesterday", "₹97.86 L"]
          ]}
        />
      )}

      {/* DEPARTMENT */}
      {activeTab === "department" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {filterKPI("department", "share-chart") && <RevenueDonutChart title="Department Revenue Share" />}
          {filterKPI("department", "top-departments") && (
            <ReportTable
              title="🏆 Top Departments"
              data={[
                ["Cardiology", "₹4.2 Cr"],
                ["Neurology", "₹3.1 Cr"],
                ["Orthopedics", "₹2.8 Cr"],
                ["Oncology", "₹2.5 Cr"]
              ]}
            />
          )}
        </div>
      )}

      {/* COLLECTIONS */}
      {activeTab === "collections" && (
        <DragDropGrid items={collectionCards} renderItem={renderCard} storageKey="kims-revenue-collection-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* DISCOUNTS */}
      {activeTab === "discounts" && filterKPI("discounts", "table") && (
        <ReportTable
          title="✂️ Discounts Allowed"
          data={[
            ["Management Discounts", "₹1.2 L"],
            ["Staff Discounts", "₹0.4 L"],
            ["Camp Discounts", "₹2.1 L"],
            ["Total Discounts (MTD)", "₹3.7 L"]
          ]}
        />
      )}

      {/* REFUNDS */}
      {activeTab === "refunds" && filterKPI("refunds", "table") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold mb-5 text-gray-800">🔙 Refunds Processed</h2>
          <table className="w-full text-left text-gray-700">
            <tbody>
              <tr className="border-b"><td className="py-3">Pharmacy Returns</td><td className="py-3 font-bold text-red-500">₹45,000</td></tr>
              <tr className="border-b"><td className="py-3">IPD Deposit Refunds</td><td className="py-3 font-bold text-red-500">₹1,20,000</td></tr>
              <tr><td className="py-3">Advance Cancellations</td><td className="py-3 font-bold text-red-500">₹32,000</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* INSURANCE */}
      {activeTab === "insurance" && (
        <DragDropGrid items={insuranceCards} renderItem={renderCard} storageKey="kims-revenue-insurance-order" className="grid md:grid-cols-3 gap-5" />
      )}

      {/* UPLOAD */}
      {activeTab === "upload" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {filterKPI("upload", "widget") && <UploadWidget title="Upload Revenue MIS (Excel/CSV)" onDataLoaded={handleDataLoaded} />}
          {filterKPI("upload", "format-info") && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-800 mb-4">Required Format</h3>
               <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                 <li>Date (DD-MM-YYYY)</li>
                 <li>Department Code</li>
                 <li>OPD_Revenue</li>
                 <li>IPD_Revenue</li>
                 <li>Discount_Amount</li>
               </ul>
            </div>
          )}
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
