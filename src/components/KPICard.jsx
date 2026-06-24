export default function KPICard({ title, value, subtitle, trend, icon, colorClass = "text-green-600", bgClass = "bg-green-100" }) {
  return (
    <div className="bg-white rounded-[28px] shadow-[0_18px_60px_-24px_rgba(15,23,42,0.18)] border border-gray-100/90 p-6 flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-[0_20px_80px_-30px_rgba(15,23,42,0.22)] transition-all duration-300">
      <div className={`p-3 rounded-lg ${bgClass} ${colorClass} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-800">{value}</span>
          {trend && (
            <span className={`text-xs font-semibold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
