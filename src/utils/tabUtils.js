import { sidebarMenu } from "./sidebarMenu";

export function getVisibleTabsForPath(path) {
  const matched = sidebarMenu.find((m) => m.path === path);
  return matched?.tabs || [];
}

export function getDefaultTabForPath(path) {
  const visible = getVisibleTabsForPath(path);
  return visible[0]?.tab;
}

export function getActiveTabFromSearchOrFirst(searchParams, path) {
  const tab = searchParams.get("tab");
  if (tab) return tab;
  return getDefaultTabForPath(path);
}
