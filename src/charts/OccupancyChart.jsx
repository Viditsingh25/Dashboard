import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const defaultData = [
  { name: 'ICU', occupied: 45, total: 50 },
  { name: 'Gen Ward', occupied: 120, total: 150 },
  { name: 'Deluxe', occupied: 25, total: 30 },
  { name: 'Maternity', occupied: 35, total: 40 },
];

export default function OccupancyChart({ data = defaultData, title = "Bed Occupancy Status" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'transparent'}} />
            <Legend />
            <Bar dataKey="occupied" name="Occupied Beds" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total" name="Total Beds" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
