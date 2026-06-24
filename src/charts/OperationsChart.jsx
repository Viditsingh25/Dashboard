import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const defaultData = [
  { time: '08:00', surgeries: 2, staff: 15 },
  { time: '10:00', surgeries: 5, staff: 20 },
  { time: '12:00', surgeries: 8, staff: 22 },
  { time: '14:00', surgeries: 6, staff: 18 },
  { time: '16:00', surgeries: 4, staff: 14 },
  { time: '18:00', surgeries: 1, staff: 8 },
];

export default function OperationsChart({ data = defaultData, title = "OT Utilization & Staffing" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="surgeries" name="Surgeries" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line yAxisId="right" type="monotone" dataKey="staff" name="Active Staff" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
