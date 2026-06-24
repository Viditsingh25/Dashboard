export const sites = ["PBMH", "KSSCC"];

export const moduleAccess = [
  { label: "Dashboard", path: "/" },
  { label: "Revenue", path: "/revenue" },
  { label: "Patients", path: "/patients" },
  { label: "Bed Management", path: "/beds" },
  { label: "Lab & Radiology", path: "/lab" },
  { label: "Pharmacy", path: "/pharmacy" },
  { label: "Kitchen & Diet", path: "/kitchen-diet" },
  { label: "Operations", path: "/operations" },
  { label: "Doctors Payout", path: "/doctors" },
  { label: "Nursing", path: "/nursing" },
  { label: "Reports", path: "/reports" },
  { label: "Settings", path: "/settings" },
];

export const defaultRoleConfig = {
  revenue: {
    label: "Revenue Department",
    landingPath: "/revenue",
    allowedPaths: ["/", "/revenue", "/reports"],
    active: true,
  },
  ceo: {
    label: "CEO",
    landingPath: "/",
    allowedPaths: ["/", "/revenue", "/patients", "/beds", "/lab", "/pharmacy", "/kitchen-diet", "/operations", "/reports"],
    active: true,
  },
  admin: {
    label: "Admin",
    landingPath: "/",
    allowedPaths: ["/", "/patients", "/beds", "/lab", "/pharmacy", "/kitchen-diet", "/operations", "/doctors", "/nursing", "/reports", "/settings"],
    active: true,
  },
  superadmin: {
    label: "Super Admin",
    landingPath: "/",
    allowedPaths: ["*"],
    active: true,
  },
};

export const defaultUsers = [
  {
    username: "revenue",
    password: "rev@123",
    role: "revenue",
    name: "Revenue User",
    allowedSites: ["PBMH"],
    active: true,
  },
  {
    username: "ceo",
    password: "ceo@123",
    role: "ceo",
    name: "CEO User",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
  {
    username: "admin",
    password: "admin@123",
    role: "admin",
    name: "Admin User",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
  {
    username: "superadmin",
    password: "super@123",
    role: "superadmin",
    name: "Super Admin",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
];

export function canAccessPath(user, path, roles = defaultRoleConfig) {
  const role = roles[user?.role];
  if (!role || role.active === false || user?.active === false) return false;
  const permissions = role.allowedPaths || [];
  if (permissions.includes("*")) return true;
  if (permissions.includes(path)) return true;
  // Check if user has any sub-tab permission under this module path
  if (permissions.some((p) => p.startsWith(path + "/tab/"))) return true;
  return false;
}

export function canAccessTab(user, modulePath, tabKey, roles = defaultRoleConfig) {
  const role = roles[user?.role];
  if (!role || role.active === false || user?.active === false) return false;
  const permissions = role.allowedPaths || [];
  if (permissions.includes("*")) return true;

  const tabPrefix = modulePath + "/tab/";
  const hasExplicitTabPermissions = permissions.some((p) => p.startsWith(tabPrefix));

  if (hasExplicitTabPermissions) {
    // Explicit tab permissions exist, check specific tab
    return permissions.includes(tabPrefix + tabKey);
  }

  // No explicit tab permissions, check module-level access (grants all tabs)
  if (permissions.includes(modulePath)) return true;
  return false;
}

export function getLandingPath(user, roles = defaultRoleConfig) {
  return roles[user?.role]?.landingPath || "/";
}
