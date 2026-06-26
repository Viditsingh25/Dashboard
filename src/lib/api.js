const API_BASE = import.meta.env.DEV ? "/api" : "https://dashboard-j8t3.onrender.com/api";

function getToken() {
  return localStorage.getItem("kims-dashboard-token");
}

function setToken(token) {
  if (token) {
    localStorage.setItem("kims-dashboard-token", token);
  } else {
    localStorage.removeItem("kims-dashboard-token");
  }
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

// Auth
export async function login(username, password) {
  const data = await request("POST", "/auth/login", { username, password });
  if (data.token) setToken(data.token);
  if (data.passwordExpired) {
    return { ...data.user, _passwordExpired: true, _expiredMessage: data.message };
  }
  return data.user;
}

export async function selectSite(site) {
  const data = await request("PUT", "/auth/select-site", { site });
  if (data.token) setToken(data.token);
  return data;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const data = await request("GET", "/auth/me");
    return data.user;
  } catch {
    setToken(null);
    return null;
  }
}

export async function changePassword(currentPassword, newPassword) {
  const data = await request("PUT", "/auth/change-password", { currentPassword, newPassword });
  if (data.token) setToken(data.token);
  return data;
}

export function logout() {
  setToken(null);
}

// Users
export async function fetchUsers() {
  const data = await request("GET", "/users");
  return data.users;
}

export async function createUser(userData) {
  const data = await request("POST", "/users", userData);
  return data.user;
}

export async function updateUser(id, userData) {
  const data = await request("PUT", `/users/${id}`, userData);
  return data.user;
}

export async function resetPassword(id, password, skipValidation = false) {
  await request("PUT", `/users/${id}/reset-password`, { password, skipValidation });
}

export async function deleteUser(id) {
  const data = await request("DELETE", `/users/${id}`);
  return data;
}

export async function restoreUser(id) {
  await request("POST", `/users/${id}/restore`);
}

// Roles
export async function fetchRoles() {
  const data = await request("GET", "/roles");
  return data.roles;
}

export async function createRole(roleData) {
  const data = await request("POST", "/roles", roleData);
  return data.role;
}

export async function updateRole(id, roleData) {
  const data = await request("PUT", `/roles/${id}`, roleData);
  return data.role;
}

export async function updateRolePermissions(id, allowedPaths) {
  const data = await request("PUT", `/roles/${id}/permissions`, { allowedPaths });
  return data.role;
}

export async function deleteRole(id) {
  const data = await request("DELETE", `/roles/${id}`);
  return data;
}

export async function restoreRole(id) {
  await request("POST", `/roles/${id}/restore`);
}

// Password Policies
export async function fetchPasswordPolicies() {
  const data = await request("GET", "/settings/password-policies");
  return data;
}

export async function updatePasswordPolicies(policies) {
  const data = await request("PUT", "/settings/password-policies", policies);
  return data;
}

// Avatar
export async function updateAvatarUrl(avatarUrl) {
  const data = await request("PUT", "/auth/avatar", { avatarUrl });
  return data;
}

// Profile (name, email, phone)
export async function updateProfile({ name, email, phone }) {
  const data = await request("PUT", "/auth/profile", { name, email, phone });
  return data.user;
}

// Privacy policy acceptance
export async function acceptPrivacy() {
  const data = await request("PUT", "/auth/privacy-accept");
  return data;
}

// Modules
export async function fetchModules() {
  const data = await request("GET", "/modules");
  return data.modules;
}

export async function createModule(modData) {
  const data = await request("POST", "/modules", modData);
  return data.module;
}

export async function updateModule(id, modData) {
  const data = await request("PUT", `/modules/${id}`, modData);
  return data.module;
}

export async function deleteModule(id) {
  await request("DELETE", `/modules/${id}`);
}

// KPIs
export async function fetchKPIs(moduleId) {
  const data = await request("GET", `/kpis?module_id=${moduleId}`);
  return data.kpis;
}

export async function createKPI(kpiData) {
  const data = await request("POST", "/kpis", kpiData);
  return data.kpi;
}

export async function updateKPI(id, kpiData) {
  const data = await request("PUT", `/kpis/${id}`, kpiData);
  return data.kpi;
}

export async function deleteKPI(id) {
  await request("DELETE", `/kpis/${id}`);
}

export async function computeKPIs(moduleId, rows) {
  const data = await request("POST", "/kpis/compute", { module_id: moduleId, rows });
  return data.kpis;
}

// System Logs
export async function fetchLogs({ page = 1, limit = 50, level, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (level) params.set("level", level);
  if (search) params.set("search", search);
  const data = await request("GET", `/settings/logs?${params}`);
  return data;
}

// Token helper (used by App.jsx to check if logged in)
export { getToken, setToken };
