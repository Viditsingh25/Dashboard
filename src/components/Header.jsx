import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Search, RefreshCw, Sun, Moon } from "lucide-react";
import { sidebarMenu } from "../utils/sidebarMenu";
import { useToastStore } from "../stores/toastStore";
import { useThemeStore } from "../stores/themeStore";

const notifications = [
  { id: 1, title: "ICU Occupancy Critical", desc: "Medical ICU is at 100% capacity", time: "2 min ago", type: "critical" },
  { id: 2, title: "Revenue Target Update", desc: "MTD revenue is 15% above target", time: "15 min ago", type: "success" },
  { id: 3, title: "Stock Alert", desc: "Paracetamol 500mg reorder level reached", time: "1 hr ago", type: "warning" },
  { id: 4, title: "Daily Backup Complete", desc: "System backup completed successfully", time: "2 hrs ago", type: "info" },
];

const modes = ["light", "dark", "system"];

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const effectiveTheme = useThemeStore((s) => s.effectiveTheme);

  const cycleMode = () => {
    const idx = modes.indexOf(mode);
    setMode(modes[(idx + 1) % modes.length]);
  };

  const isDark = effectiveTheme === "dark";

  return (
    <button
      onClick={cycleMode}
      className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
      title={`Theme: ${mode} (click to cycle)`}
    >
      {isDark ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
      {mode === "system" && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-green-600">
          S
        </span>
      )}
    </button>
  );
}

export default function Header({ currentUser, onLogout, roles }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = sidebarMenu.find((m) => m.path === location.pathname);
  const pageTitle = currentPage?.title || "Dashboard";

  const searchIndex = useMemo(() => {
    const items = [];
    sidebarMenu.forEach((menu) => {
      items.push({ type: "page", label: menu.title, path: menu.path, tab: null, icon: "page" });
      (menu.tabs || []).forEach((tab) => {
        items.push({ type: "tab", label: tab.title, path: menu.path, tab: tab.tab, parent: menu.title, icon: "tab" });
      });
    });
    return items;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex
      .filter((item) => item.label.toLowerCase().includes(q) || item.parent?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [searchQuery, searchIndex]);

  const handleSearchSelect = (item) => {
    setSearchQuery("");
    setSearchFocused(false);
    setSelectedIndex(-1);
    const path = item.tab ? `${item.path}?tab=${item.tab}` : item.path;
    navigate(path);
  };

  useEffect(() => {
    if (!searchFocused) setSelectedIndex(-1);
  }, [searchFocused]);

  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setSearchQuery("");
    setSearchFocused(false);
  }, [location.pathname]);

  const handleKeyDown = (e) => {
    if (!searchFocused || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSearchSelect(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleRefresh = () => {
    useToastStore.getState().success("Dashboard data refreshed");
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl shadow-xl border border-green-100/60 rounded-b-3xl px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-20 gap-4 md:gap-0">
      <div className="flex items-center gap-2">
        <div>
          <h1 className="text-xl font-bold text-green-800">{pageTitle}</h1>
          <p className="text-xs font-medium text-gray-500">
            {roles[currentUser?.role]?.label || currentUser?.role} | {currentUser?.site}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-3">
          <div className="relative cursor-pointer">
            <input
              id="from-date"
              type="date"
              aria-label="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={`rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 ${!fromDate ? 'date-empty' : ''}`}
            />
            {!fromDate && (
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 cursor-pointer"
                onClick={() => document.getElementById('from-date')?.focus()}
              >
                From Date
              </span>
            )}
          </div>

          <div className="relative cursor-pointer">
            <input
              id="to-date"
              type="date"
              aria-label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={`rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 ${!toDate ? 'date-empty' : ''}`}
            />
            {!toDate && (
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 cursor-pointer"
                onClick={() => document.getElementById('to-date')?.focus()}
              >
                To Date
              </span>
            )}
          </div>
        </div>

        <div ref={searchRef} data-tour="header-search" className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchFocused(true); setSelectedIndex(-1); }}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, reports, settings..."
            className="pl-10 pr-4 py-2 bg-green-50 border border-green-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-72 transition-all shadow-sm"
          />
          {searchFocused && searchQuery.trim() && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden fade-in">
              {searchResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No results found</div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {(() => {
                    let lastType = null;
                    return searchResults.map((item, i) => {
                      const showHeader = item.type !== lastType;
                      lastType = item.type;
                      return (
                        <div key={`${item.path}-${item.tab || ""}`}>
                          {showHeader && (
                            <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              {item.type === "page" ? "Pages" : "Tabs"}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSearchSelect(item)}
                            onMouseEnter={() => setSelectedIndex(i)}
                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                              i === selectedIndex ? "bg-green-50 text-green-800" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span className="font-medium">{item.label}</span>
                            {item.parent && (
                              <span className="ml-2 text-xs text-gray-400">in {item.parent}</span>
                            )}
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
          title="Refresh data"
        >
          <RefreshCw size={20} strokeWidth={1.5} />
        </button>

        <ThemeToggle />

        <div data-tour="header-notifications" className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden fade-in">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  <span className="text-xs text-gray-400">{notifications.length} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          n.type === "critical" ? "bg-red-500" :
                          n.type === "warning" ? "bg-amber-500" :
                          n.type === "success" ? "bg-green-500" : "bg-blue-500"
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                          <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div data-tour="header-user" className="flex items-center gap-2">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="h-13 w-13 rounded-full object-cover border-2 border-green-200"
            />
          ) : (
            <span className="grid h-13 w-13 place-items-center rounded-full bg-green-100 text-lg font-bold text-green-700 border-2 border-green-200">
              {(currentUser?.name || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-green-50 hover:text-green-700"
          >
            <LogOut size={16} strokeWidth={1.5} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}
