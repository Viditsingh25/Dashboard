import { useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { canAccessTab } from "../utils/authConfig";
import { getDefaultTabForPath, getVisibleTabsForPath } from "../utils/tabUtils";

export function useTabGuard(currentUser, roles, modulePath) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = searchParams.get("tab") || getDefaultTabForPath(modulePath);
  const visibleTabs = getVisibleTabsForPath(modulePath);

  useEffect(() => {
    if (!activeTab) return;
    if (!canAccessTab(currentUser, modulePath, activeTab, roles)) {
      const allowedTab = visibleTabs.find((t) => canAccessTab(currentUser, modulePath, t.tab, roles));
      const fallback = allowedTab?.tab || getDefaultTabForPath(modulePath);
      if (fallback) {
        navigate(`${location.pathname}?tab=${fallback}`, { replace: true });
      }
    }
  }, [activeTab, modulePath, currentUser, roles, visibleTabs, navigate, location.pathname]);

  if (!activeTab) return null;
  if (!canAccessTab(currentUser, modulePath, activeTab, roles)) return null;
  return activeTab;
}
