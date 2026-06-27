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
    roles: ["revenue"],
    name: "Revenue User",
    allowedSites: ["PBMH"],
    active: true,
  },
  {
    username: "ceo",
    password: "ceo@123",
    role: "ceo",
    roles: ["ceo"],
    name: "CEO User",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
  {
    username: "admin",
    password: "admin@123",
    role: "admin",
    roles: ["admin"],
    name: "Admin User",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
  {
    username: "superadmin",
    password: "super@123",
    role: "superadmin",
    roles: ["superadmin"],
    name: "Super Admin",
    allowedSites: ["PBMH", "KSSCC"],
    active: true,
  },
];

export function canAccessPath(user, path, roles = defaultRoleConfig) {
  if (user?.active === false) return false;
  const userRoles = user?.roles || [user?.role];
  for (const roleName of userRoles) {
    const role = roles[roleName];
    if (!role || role.active === false) continue;
    const permissions = role.allowedPaths || [];
    if (permissions.includes("*")) return true;
    if (permissions.includes(path)) return true;
    const tabPrefix = path === "/" ? "/tab/" : path + "/tab/";
    if (permissions.some((p) => p.startsWith(tabPrefix))) return true;
  }
  return false;
}

export function canAccessTab(user, modulePath, tabKey, roles = defaultRoleConfig) {
  if (user?.active === false) return false;
  const userRoles = user?.roles || [user?.role];
  for (const roleName of userRoles) {
    const role = roles[roleName];
    if (!role || role.active === false) continue;
    const permissions = role.allowedPaths || [];
    if (permissions.includes("*")) return true;

    const tabPrefix = modulePath === "/" ? "/tab/" : modulePath + "/tab/";
    const hasExplicitTabPermissions = permissions.some((p) => p.startsWith(tabPrefix));

    if (hasExplicitTabPermissions) {
      if (permissions.includes(tabPrefix + tabKey)) return true;
      if (permissions.some((p) => p.startsWith(tabPrefix + tabKey + "/"))) return true;
    } else if (permissions.includes(modulePath)) return true;
  }
  return false;
}

export function canAccessKPI(user, modulePath, tabKey, itemKey, roles = defaultRoleConfig) {
  if (user?.active === false) return false;
  const userRoles = user?.roles || [user?.role];
  for (const roleName of userRoles) {
    const role = roles[roleName];
    if (!role || role.active === false) continue;
    const permissions = role.allowedPaths || [];
    if (permissions.includes("*")) return true;

    const tabPrefix = modulePath === "/" ? "/tab/" : modulePath + "/tab/";
    const itemPrefix = tabPrefix + tabKey + "/";
    const hasExplicitItemPermissions = permissions.some((p) => p.startsWith(itemPrefix));

    if (hasExplicitItemPermissions) {
      if (permissions.includes(itemPrefix + itemKey)) return true;
    } else {
      const hasExplicitTabPermissions = permissions.some((p) => p.startsWith(tabPrefix));
      if (hasExplicitTabPermissions) {
        if (permissions.includes(tabPrefix + tabKey)) return true;
      } else if (permissions.includes(modulePath)) return true;
    }
  }
  return false;
}

export function getLandingPath(user, roles = defaultRoleConfig) {
  const userRoles = user?.roles || [user?.role];
  for (const roleName of userRoles) {
    const path = roles[roleName]?.landingPath;
    if (path) return path;
  }
  return "/";
}
