import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  PanelLeftClose,
  Menu,
  X,
  LayoutTemplate,
} from "lucide-react";
import { sidebarMenu } from "../utils/sidebarMenu";
import { getVisibleTabsForPath, getDefaultTabForPath } from "../utils/tabUtils";
import { canAccessPath, canAccessTab } from "../utils/authConfig";
import logoImage from "../assets/images.png";

export default function Sidebar({ currentUser, roles, modules: allModules }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const permittedMenu = sidebarMenu.filter((item) => canAccessPath(currentUser, item.path, roles));
  const prevPathRef = useRef(location.pathname);

  const hardcodedPaths = new Set(sidebarMenu.map((m) => m.path));

  const moduleStatusMap = Object.fromEntries(
    (allModules || []).map((m) => [m.path.startsWith("/") ? m.path : `/${m.path}`, m])
  );

  const getModuleStatus = (routePath) => {
    let mod = moduleStatusMap[routePath];
    if (!mod && routePath.startsWith("/module/")) {
      const nameFromPath = decodeURIComponent(routePath.replace(/^\/module\//, ""));
      mod = allModules.find((m) => m.name === nameFromPath);
    }
    if (!mod) return null;
    if (mod.maintenance) return "maintenance";
    if (mod.coming_soon) return "coming_soon";
    return null;
  };

  const statusBadge = (status) => {
    if (status === "maintenance")
      return <span className="ml-auto shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">Maint</span>;
    if (status === "coming_soon")
      return <span className="ml-auto shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">Soon</span>;
    return null;
  };

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsMobileOpen(false);
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const toggleSection = (path) => {
    setOpenSection((current) => (current === path ? null : path));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const defaultTab = getDefaultTabForPath(location.pathname);

    if (defaultTab && !tab) {
      if (canAccessTab(currentUser, location.pathname, defaultTab, roles)) {
        navigate(`${location.pathname}?tab=${defaultTab}`, { replace: true });
      } else {
        const visibleTabs = getVisibleTabsForPath(location.pathname);
        const firstAllowed = visibleTabs.find((t) => canAccessTab(currentUser, location.pathname, t.tab, roles));
        if (firstAllowed) {
          navigate(`${location.pathname}?tab=${firstAllowed.tab}`, { replace: true });
        }
      }
    }
  }, [location.pathname, location.search, navigate, currentUser, roles]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden grid h-10 w-10 place-items-center rounded-xl bg-green-800 text-white shadow-lg hover:bg-green-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {isMobileOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        data-tour="sidebar"
        className={`${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-50 flex flex-col bg-linear-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-[0_35px_60px_-30px_rgba(4,120,87,0.8)] transition-all duration-500 ease-in-out h-full ${
          isCollapsed ? "w-32" : "w-72"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 md:hidden grid h-8 w-8 place-items-center rounded-lg text-green-100 hover:bg-green-800"
          aria-label="Close menu"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="border-b border-green-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className={`flex min-w-0 items-center ${isCollapsed ? "" : "gap-3"}`}>
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-950/30">
                <img
                  src={logoImage}
                  alt="KIMS logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div
                className={`overflow-hidden transition-[width] duration-500 ease-in-out ${
                  isCollapsed ? "w-0" : "w-36"
                }`}
              >
                <h2 className="whitespace-nowrap text-2xl font-bold tracking-wider">
                  KIMS
                </h2>
                <p className="whitespace-nowrap text-xs text-green-300">
                  Executive Dashboard
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed((value) => !value)}
              className="hidden md:grid h-9 w-9 shrink-0 place-items-center rounded-lg text-green-100 transition-all duration-500 hover:bg-green-800 hover:text-white"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeftClose
                size={19}
                strokeWidth={1.5}
                className={`transition-transform duration-500 ease-in-out ${isCollapsed ? "rotate-180" : "rotate-0"}`}
              />
            </button>
          </div>
        </div>

      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="space-y-1 px-3">
          {permittedMenu.map((item) => {
            const Icon = item.icon;
            const isActivePath = location.pathname === item.path;
            const visibleTabs = getVisibleTabsForPath(item.path).filter(
  (tab) => tab.tab !== "overview" && canAccessTab(currentUser, item.path, tab.tab, roles)
);
            const defaultTab = getDefaultTabForPath(item.path);
            const hasTabs = visibleTabs.length > 0;
            const isOpen = openSection === item.path;
            const mainLink = hasTabs && defaultTab ? `${item.path}?tab=${defaultTab}` : item.path;
            const effectiveActiveTab = new URLSearchParams(location.search).get("tab") || (isActivePath && hasTabs ? defaultTab : undefined);

            return (
              <div
                key={item.title}
                className="overflow-hidden rounded-lg"
              >
                <div
                  className={`flex items-center rounded-lg transition-all duration-300 ${
                    isActivePath
                      ? "bg-green-700 text-white shadow-md shadow-green-950/20"
                      : "text-green-100 hover:bg-green-800 hover:text-white"
                  }`}
                >
                  <Link
                    to={mainLink}
                    title={isCollapsed ? item.title : undefined}
                    className={`group flex min-w-0 flex-1 items-center transition-all duration-500 ${
                      isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                    }`}
                  >
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className={`shrink-0 transition-all duration-500 group-hover:scale-110 ${
                        isCollapsed ? "mx-auto" : ""
                      }`}
                    />
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${
                        isCollapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className={`overflow-hidden transition-all duration-500 ease-in-out ${
                      isCollapsed ? "max-w-0 opacity-0" : "max-w-16 opacity-100"
                    }`}>
                      {statusBadge(getModuleStatus(item.path))}
                    </span>
                  </Link>

                  {!isCollapsed && hasTabs && (
                    <button
                      type="button"
                      onClick={() => toggleSection(item.path)}
                      className="mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-md text-green-100 transition-colors duration-300 hover:bg-green-800 hover:text-white"
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? "Hide" : "Show"} ${item.title} menu`}
                    >
                      <ChevronDown
                        size={17}
                        strokeWidth={1.5}
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  )}
                </div>

                {!isCollapsed && hasTabs && (
                  <div
                    className={`grid transition-all duration-500 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-7 mt-1 space-y-1 border-l border-green-700/70 pl-3">
                        {visibleTabs.map((tab) => {
                          const isActiveTab = isActivePath && effectiveActiveTab === tab.tab;

                          return (
                            <Link
                              key={tab.tab}
                              to={`${item.path}?tab=${tab.tab}`}
                              className={`block rounded-md px-3 py-2 text-sm transition-all duration-300 ${
                                isActiveTab
                                  ? "bg-green-100 font-semibold text-green-900"
                                  : "text-green-200 hover:bg-green-800 hover:text-white"
                              }`}
                            >
                              {tab.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {allModules.filter((m) => !hardcodedPaths.has(m.path) && m.active !== false && canAccessPath(currentUser, `/module/${encodeURIComponent(m.name)}`, roles)).map((mod) => {
            const modPath = `/module/${encodeURIComponent(mod.name)}`;
            const isActivePath = location.pathname === modPath;
            const status = getModuleStatus(modPath);

            return (
              <Link
                key={mod.id}
                to={`${modPath}?tab=overview`}
                title={isCollapsed ? mod.label : undefined}
                className={`group flex items-center transition-all duration-500 rounded-lg ${
                  isCollapsed
                    ? "justify-center py-3"
                    : "gap-3 px-3 py-3"
                } ${
                  isActivePath
                    ? "bg-green-700 font-medium text-white shadow-md shadow-green-950/20"
                    : "text-green-100 hover:bg-green-800 hover:text-white"
                }`}
              >
                <LayoutTemplate size={20} strokeWidth={1.5} className={`shrink-0 transition-all duration-500 group-hover:scale-110 ${isCollapsed ? "" : ""}`} />
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-500 ease-in-out ${
                  isCollapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"
                }`}>
                  {mod.label}
                </span>
                <span className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isCollapsed ? "max-w-0 opacity-0" : "max-w-16 opacity-100"
                }`}>
                  {status && statusBadge(status)}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-green-800 p-4">
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-lg font-bold">
            {(currentUser?.name || "U").split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div
            className={`overflow-hidden transition-[width] duration-500 ease-in-out ${
              isCollapsed ? "w-0" : "w-32"
            }`}
          >
            <p className="whitespace-nowrap text-sm font-medium">{currentUser?.name || "User"}</p>
            <p className="whitespace-nowrap text-xs text-green-300">
              {currentUser?.site || "KIMS"}
            </p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
