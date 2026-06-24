import useDragReorder from "../hooks/useDragReorder";

export default function DragDropGrid({ items, renderItem, storageKey, className = "grid gap-5" }) {
  const { reordered, getDragHandlers } = useDragReorder(items, storageKey);

  if (items.length === 0) return null;

  return (
    <div className={className}>
      {reordered.map((item, index) => (
        <div
          key={item.key ?? item.title}
          {...getDragHandlers(index)}
          className="cursor-grab active:cursor-grabbing transition-transform duration-200"
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
