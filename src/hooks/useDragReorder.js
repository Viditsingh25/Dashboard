import { useState, useCallback, useRef } from "react";

export default function useDragReorder(items, storageKey) {
  const [order, setOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : items.map((_, i) => i);
    } catch {
      return items.map((_, i) => i);
    }
  });

  const dragIndex = useRef(null);

  const saveOrder = useCallback(
    (newOrder) => {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    },
    [storageKey]
  );

  const reordered = order.map((i) => items[i]).filter(Boolean);

  const getDragHandlers = (index) => ({
    draggable: true,
    onDragStart: (e) => {
      dragIndex.current = index;
      e.dataTransfer.effectAllowed = "move";
      e.currentTarget.classList.add("opacity-50", "scale-95");
    },
    onDragEnd: (e) => {
      e.currentTarget.classList.remove("opacity-50", "scale-95");
      if (dragIndex.current !== null && dragIndex.current !== index) {
        const newOrder = [...order];
        const [removed] = newOrder.splice(dragIndex.current, 1);
        newOrder.splice(index, 0, removed);
        setOrder(newOrder);
        saveOrder(newOrder);
      }
      dragIndex.current = null;
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDragEnter: (e) => {
      e.preventDefault();
      e.currentTarget.classList.add("ring-2", "ring-green-400", "ring-offset-2");
    },
    onDragLeave: (e) => {
      e.currentTarget.classList.remove("ring-2", "ring-green-400", "ring-offset-2");
    },
    onDrop: (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("ring-2", "ring-green-400", "ring-offset-2");
      if (dragIndex.current !== null && dragIndex.current !== index) {
        const newOrder = [...order];
        const [removed] = newOrder.splice(dragIndex.current, 1);
        newOrder.splice(index, 0, removed);
        setOrder(newOrder);
        saveOrder(newOrder);
      }
      dragIndex.current = null;
    },
  });

  return { reordered, getDragHandlers };
}
