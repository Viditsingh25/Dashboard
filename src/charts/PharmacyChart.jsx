import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const defaultData = [
  { name: '1st', collection: 12.5 },
  { name: '5th', collection: 15.2 },
  { name: '10th', collection: 14.8 },
  { name: '15th', collection: 16.5 },
  { name: '20th', collection: 18.0 },
  { name: '25th', collection: 17.5 },
  { name: '28th', collection: 18.11 },
];

export default function PharmacyChart({ data = defaultData, title = "Pharmacy Collection (in Lakhs)" }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPharma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="collection" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorPharma)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
