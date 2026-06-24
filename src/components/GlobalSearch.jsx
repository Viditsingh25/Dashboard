import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { sidebarMenu } from "../utils/sidebarMenu";

const searchData = sidebarMenu.map((item) => ({
  title: item.title,
  path: item.path,
  icon: item.icon,
  keywords: item.title.toLowerCase(),
  type: "page",
}));

const quickLinks = [
  { title: "Change Password", path: "/settings?tab=security", keywords: "password change security", type: "action" },
  { title: "Settings", path: "/settings", keywords: "settings configuration", type: "action" },
  { title: "Reports", path: "/reports", keywords: "reports export", type: "action" },
];

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const allItems = [...searchData, ...quickLinks];

  const filtered = query.trim()
    ? allItems.filter((item) => item.keywords.includes(query.toLowerCase()))
    : allItems;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].path);
        setIsOpen(false);
      }
    },
    [filtered, selectedIndex, navigate]
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60" onClick={() => setIsOpen(false)} />
      <div
        className="fixed left-1/2 top-[15%] z-[101] w-full max-w-xl -translate-x-1/2 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-label="Global search"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <Search size={20} className="shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, settings..."
            className="w-full bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400 sm:inline-block">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No results found</div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon || ArrowRight;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.title + item.path}
                  onClick={() => { navigate(item.path); setIsOpen(false); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    isSelected ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${
                    isSelected ? "border-green-200 bg-green-100" : "border-gray-100 bg-gray-50"
                  }`}>
                    <Icon size={16} strokeWidth={1.5} className={isSelected ? "text-green-700" : "text-gray-500"} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.type === "page" ? "Page" : "Action"}</p>
                  </div>
                  <ArrowRight size={16} className={`shrink-0 ${isSelected ? "text-green-600" : "text-gray-300"}`} />
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-2 text-xs text-gray-400">
          <span className="font-semibold">↑↓</span> Navigate <span className="ml-3 font-semibold">↵</span> Open <span className="ml-3 font-semibold">Esc</span> Close
        </div>
      </div>
    </>
  );
}
