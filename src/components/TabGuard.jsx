import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { canAccessTab } from "../utils/authConfig";
import { getDefaultTabForPath, getVisibleTabsForPath } from "../utils/tabUtils";

export default function TabGuard({ currentUser, roles, modulePath, children }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get("tab");

  useEffect(() => {
    const visibleTabs = getVisibleTabsForPath(modulePath);
    const currentTab = activeTab || getDefaultTabForPath(modulePath);

    if (!currentTab) return;

    if (!canAccessTab(currentUser, modulePath, currentTab, roles)) {
      const allowed = visibleTabs.find((t) => canAccessTab(currentUser, modulePath, t.tab, roles));
      const fallback = allowed?.tab || getDefaultTabForPath(modulePath);
      navigate(`${modulePath}?tab=${fallback}`, { replace: true });
    }
  }, [activeTab, modulePath, currentUser, roles, navigate]);

  return children;
}
