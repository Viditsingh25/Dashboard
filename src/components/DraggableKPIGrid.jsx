import KPICard from "./KPICard";
import useDragReorder from "../hooks/useDragReorder";

export default function DraggableKPIGrid({ items, storageKey, className = "grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5" }) {
  const { reordered, getDragHandlers } = useDragReorder(items, storageKey);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {reordered.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.title} {...getDragHandlers(index)} className="cursor-grab active:cursor-grabbing transition-transform duration-200">
            <KPICard
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              trend={item.trend}
              icon={<Icon size={item.iconSize || 24} strokeWidth={1.5} />}
              colorClass={item.colorClass}
              bgClass={item.bgClass}
            />
          </div>
        );
      })}
    </div>
  );
}
