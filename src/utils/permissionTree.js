import { sidebarMenu } from "./sidebarMenu";

export function buildPermissionTree(dynamicModules = []) {
  const tree = [];

  for (const item of sidebarMenu) {
    if (!item.tabs || item.tabs.length === 0) {
      tree.push({
        key: item.path.replace("/", "") || "dashboard",
        label: item.title,
        path: item.path,
        children: [],
      });
      continue;
    }
    const children = item.tabs
      .filter((t) => t.tab !== "overview")
      .map((t) => ({
        key: `${item.path.replace("/", "")}-${t.tab}`,
        label: t.title,
        path: `${item.path}/tab/${t.tab}`,
      }));
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

export function getModulePathFromTab(tabPath) {
  return tabPath.split("/tab/")[0];
}
