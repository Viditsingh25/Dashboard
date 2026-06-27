import { sidebarMenu } from "./sidebarMenu";
import { kpiRegistry } from "./kpiRegistry";

export function buildPermissionTree(dynamicModules = []) {
  const tree = [];

  for (const item of sidebarMenu) {
    if (!item.tabs || item.tabs.length === 0) {
      const moduleKpis = kpiRegistry[item.path]?.["overview"];
      tree.push({
        key: item.path.replace("/", "") || "dashboard",
        label: item.title,
        path: item.path,
        children: moduleKpis
          ? moduleKpis.map((kpi) => ({
              key: `${item.path.replace("/", "") || "dashboard"}-${kpi.key}`,
              label: kpi.label,
              path: `${item.path === "/" ? "" : item.path}/tab/overview/${kpi.key}`,
            }))
          : [],
      });
      continue;
    }
    const children = item.tabs
      .filter((t) => t.tab !== "overview")
      .map((t) => {
        const tabKpis = kpiRegistry[item.path]?.[t.tab];
        return {
          key: `${item.path.replace("/", "")}-${t.tab}`,
          label: t.title,
          path: `${item.path}/tab/${t.tab}`,
          children: tabKpis
            ? tabKpis.map((kpi) => ({
                key: `${item.path.replace("/", "")}-${t.tab}-${kpi.key}`,
                label: kpi.label,
                path: `${item.path}/tab/${t.tab}/${kpi.key}`,
              }))
            : [],
        };
      });
    tree.push({
      key: item.path.replace("/", "") || "dashboard",
      label: item.title,
      path: item.path,
      children,
    });
  }

  for (const mod of dynamicModules) {
    const key = mod.path.replace("/module/", "").replace("/", "");
    if (!tree.find((n) => n.key === key)) {
      tree.push({
        key,
        label: mod.label,
        path: mod.path,
        children: [],
      });
    }
  }

  return tree;
}

export function isTabPath(path) {
  return path.includes("/tab/");
}

export function isItemPath(path) {
  const rest = path.replace(/^\/[^/]+/, "");
  return rest.includes("/") && !rest.startsWith("/tab/");
}

export function getModulePathFromTab(tabPath) {
  return tabPath.split("/tab/")[0];
}

export function getTabKeyFromItemPath(itemPath) {
  const match = itemPath.match(/\/tab\/([^/]+)\//);
  return match ? match[1] : null;
}
