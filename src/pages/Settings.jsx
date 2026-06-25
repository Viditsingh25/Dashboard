import { useState, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Download, RefreshCw, Eye, EyeOff, Save, Trash2, KeyRound, Bell, Shield, Building2, HardDrive, FileText, Info, Search } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { getActiveTabFromSearchOrFirst, getDefaultTabForPath } from "../utils/tabUtils";
import { moduleAccess, sites } from "../utils/authConfig";
import { useToastStore } from "../stores/toastStore";

import PrivacyPolicyModal from "../components/PrivacyPolicyModal";
import { createUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, restoreUser, resetPassword, changePassword, fetchPasswordPolicies, updatePasswordPolicies, updateAvatarUrl, updateProfile, acceptPrivacy, fetchLogs } from "../lib/api";
import { createRole, updateRole as apiUpdateRole, updateRolePermissions, deleteRole as apiDeleteRole, restoreRole } from "../lib/api";
import { fetchModules, createModule, updateModule, deleteModule, fetchKPIs, createKPI, updateKPI, deleteKPI } from "../lib/api";
import ModuleConfiguration from "../components/ModuleConfiguration";
import ConfirmDialog from "../components/ConfirmDialog";
import { buildPermissionTree } from "../utils/permissionTree";

export default function Settings({ currentUser, setCurrentUser, roles, setRoles, users, setUsers, onModulesChange }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const defaultTab = getDefaultTabForPath(location.pathname);
  const activeTab = getActiveTabFromSearchOrFirst(searchParams, location.pathname);
  const canManageAccess = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperAdmin = currentUser?.role === "superadmin";
  const editableRoleEntries = Object.entries(roles).filter(([roleKey]) => isSuperAdmin || roleKey !== "superadmin");
  const [message, setMessage] = useState("");
  const [roleForm, setRoleForm] = useState({
    roleKey: "",
    label: "",
    landingPath: "/",
    allowedPaths: ["/"],
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    empId: "",
    username: "",
    password: "",
    role: editableRoleEntries[0]?.[0] || "revenue",
    allowedSites: [sites[0]],
  });
  const [editingRole, setEditingRole] = useState("");
  const [editingUser, setEditingUser] = useState("");
  const [openSections, setOpenSections] = useState({
    createRole: false,
    createUser: false,
    roleAccess: false,
    userConfig: false,
  });
  const [resetPwUser, setResetPwUser] = useState("");
  const [resetPwValue, setResetPwValue] = useState("");
  const [dynamicModuleAccess, setDynamicModuleAccess] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, type: "", id: null, label: "" });
  const [userSearch, setUserSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [rolePage, setRolePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [expandedRoles, setExpandedRoles] = useState({});
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    (async () => {
      try {
        const mods = await fetchModules();
        setDynamicModuleAccess(
          mods
            .filter((m) => !moduleAccess.some((a) => a.path === m.path) && m.active !== false)
            .map((m) => ({ path: `/module/${m.name}`, label: m.label || m.name }))
        );
      } catch {}
    })();
  }, []);

  const allModuleAccess = useMemo(() => [...moduleAccess, ...dynamicModuleAccess], [dynamicModuleAccess]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.emp_id || u.empId || "").toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredRoleEntries = useMemo(() => {
    if (!roleSearch.trim()) return editableRoleEntries;
    const q = roleSearch.toLowerCase();
    return editableRoleEntries.filter(([roleKey, role]) =>
      role.label.toLowerCase().includes(q) || roleKey.toLowerCase().includes(q)
    );
  }, [editableRoleEntries, roleSearch]);

  const filteredModuleAccess = useMemo(() => {
    if (!moduleSearch.trim()) return allModuleAccess;
    const q = moduleSearch.toLowerCase();
    return allModuleAccess.filter((m) => m.label.toLowerCase().includes(q));
  }, [allModuleAccess, moduleSearch]);

  const permissionTree = useMemo(() => buildPermissionTree(dynamicModuleAccess), [dynamicModuleAccess]);

  const filteredPermissionTree = useMemo(() => {
    if (!moduleSearch.trim()) return permissionTree;
    const q = moduleSearch.toLowerCase();
    return permissionTree
      .map((mod) => ({
        ...mod,
        children: mod.children.filter((c) => c.label.toLowerCase().includes(q)),
      }))
      .filter((mod) => mod.label.toLowerCase().includes(q) || mod.children.length > 0);
  }, [permissionTree, moduleSearch]);

  const toast = useToastStore.getState;

  const toggleSection = (section) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const addRole = async (event) => {
    event.preventDefault();
    const roleKey = roleForm.roleKey.trim().toLowerCase().replace(/\s+/g, "-");

    if (!roleKey || !roleForm.label.trim()) {
      setMessage("Enter role code and role name.");
      return;
    }
    if (roles[roleKey]) {
      setMessage("Role already exists.");
      return;
    }

    try {
      const role = await createRole({
        name: roleKey,
        label: roleForm.label.trim(),
        landingPath: roleForm.landingPath,
        allowedPaths: roleForm.allowedPaths,
      });
      setRoles((prev) => ({
        ...prev,
        [role.name]: {
          id: role.id,
          label: role.label,
          landingPath: role.landing_path,
          allowedPaths: role.allowed_paths,
          active: role.active,
        },
      }));
      setRoleForm({ roleKey: "", label: "", landingPath: "/", allowedPaths: ["/"] });
      setMessage("Role created.");
      toast().success("Role created");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const addUser = async (event) => {
    event.preventDefault();

    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.password.trim()) {
      setMessage("Enter name, username and password.");
      return;
    }
    if (!/^\d{10}$/.test(userForm.phone.trim())) {
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }

    try {
      const newUser = await createUser({
        username: userForm.username.trim(),
        password: userForm.password,
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        empId: userForm.empId.trim(),
        role: userForm.role,
        allowedSites: userForm.allowedSites,
      });
      setUsers((prev) => [...prev, { ...newUser, role: userForm.role, role_name: userForm.role }]);
      setUserForm({
        name: "",
        email: "",
        phone: "",
        empId: "",
        username: "",
        password: "",
        role: editableRoleEntries[0]?.[0] || "revenue",
        allowedSites: [sites[0]],
      });
      setMessage("User created.");
      toast().success("User created");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const toggleRoleFormPath = (path) => {
    const hasPath = roleForm.allowedPaths.includes(path);
    const isModulePath = !path.includes("/tab/");
    let allowedPaths;
    if (hasPath) {
      allowedPaths = roleForm.allowedPaths.filter((item) => item !== path);
      if (isModulePath) allowedPaths = allowedPaths.filter((item) => !item.startsWith(path + "/tab/"));
    } else {
      allowedPaths = [...roleForm.allowedPaths, path];
      if (isModulePath) {
        const mod = permissionTree.find((m) => m.path === path);
        if (mod) {
          for (const child of mod.children) {
            if (!allowedPaths.includes(child.path)) allowedPaths.push(child.path);
          }
        }
      }
    }
    setRoleForm({ ...roleForm, allowedPaths: allowedPaths.length ? allowedPaths : ["/"] });
  };

  const toggleRoleAccess = async (roleKey, path) => {
    const role = roles[roleKey];
    if (!role?.id) return;

    const currentPaths = role.allowedPaths.includes("*")
      ? permissionTree.flatMap((m) => [m.path, ...m.children.map((c) => c.path)])
      : role.allowedPaths;
    const hasPath = currentPaths.includes(path);
    const isModulePath = !path.includes("/tab/");
    let allowedPaths;
    if (hasPath) {
      allowedPaths = currentPaths.filter((item) => item !== path);
      if (isModulePath) allowedPaths = allowedPaths.filter((item) => !item.startsWith(path + "/tab/"));
    } else {
      allowedPaths = [...currentPaths, path];
      if (isModulePath) {
        const mod = permissionTree.find((m) => m.path === path);
        if (mod) {
          for (const child of mod.children) {
            if (!allowedPaths.includes(child.path)) allowedPaths.push(child.path);
          }
        }
      }
    }

    try {
      const updated = await updateRolePermissions(role.id, allowedPaths.length ? allowedPaths : ["/"]);
      setRoles((prev) => ({
        ...prev,
        [roleKey]: { ...prev[roleKey], allowedPaths: updated.allowed_paths },
      }));
    } catch (err) {
      toast().error(err.message);
    }
  };

  const updateRole = async (roleKey, field, value) => {
    const role = roles[roleKey];
    if (!role?.id) return;

    try {
      const updated = await apiUpdateRole(role.id, { [field === "active" ? "active" : field === "landingPath" ? "landingPath" : "label"]: value });
      setRoles((prev) => ({
        ...prev,
        [roleKey]: { ...prev[roleKey], [field]: value },
      }));
    } catch (err) {
      toast().error(err.message);
    }
  };

  const deleteRole = (roleKey) => {
    const role = roles[roleKey];
    if (!role?.id) return;

    if (roleKey === "superadmin" || roleKey === currentUser?.role) {
      setMessage("This role cannot be deleted while it is protected or in use by you.");
      return;
    }
    if (users.some((user) => user.role === roleKey)) {
      setMessage("Assign users to another role before deleting this role.");
      return;
    }

    setConfirm({ open: true, type: "role", id: role.id, label: role.label, meta: roleKey });
  };

  const executeDeleteRole = async (roleKey) => {
    const role = roles[roleKey];
    try {
      await apiDeleteRole(role.id);
      setRoles((prev) => {
        const next = { ...prev };
        delete next[roleKey];
        return next;
      });
      setEditingRole("");
      toast().success("Role deleted. Undo?", 10000, {
        label: "Undo",
        onClick: async () => {
          try {
            await restoreRole(role.id);
            setRoles((prev) => ({ ...prev, [roleKey]: role }));
            toast().success("Role restored");
          } catch {
            toast().error("Failed to restore role");
          }
        },
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateUser = async (username, field, value) => {
    if (field === "phone" && !/^\d{0,10}$/.test(value)) return;

    const user = users.find((u) => u.username === username);
    if (!user?.id) {
      setUsers((prev) => prev.map((u) => (u.username === username ? { ...u, [field]: value } : u)));
      return;
    }

    try {
      await apiUpdateUser(user.id, { [field === "name" ? "name" : field === "email" ? "email" : field === "phone" ? "phone" : field === "empId" ? "empId" : field === "role" ? "role" : field === "active" ? "active" : "name"]: value });
      setUsers((prev) => prev.map((u) => (u.username === username ? { ...u, [field]: value } : u)));
    } catch (err) {
      toast().error(err.message);
    }
  };

  const deleteUser = (username) => {
    const targetUser = users.find((user) => user.username === username);
    if (!targetUser) return;
    if (username === currentUser?.username || targetUser.role === "superadmin") {
      setMessage("This user cannot be deleted while protected or logged in.");
      return;
    }

    setConfirm({ open: true, type: "user", id: targetUser.id, label: targetUser.name || targetUser.username, meta: username });
  };

  const executeDeleteUser = async (username) => {
    const targetUser = users.find((user) => user.username === username);
    if (!targetUser) return;
    try {
      await apiDeleteUser(targetUser.id);
      setUsers((prev) => prev.filter((user) => user.username !== username));
      setEditingUser("");
      toast().success("User deleted. Undo?", 10000, {
        label: "Undo",
        onClick: async () => {
          try {
            await restoreUser(targetUser.id);
            setUsers((prev) => [...prev, { ...targetUser, active: true }]);
            toast().success("User restored");
          } catch {
            toast().error("Failed to restore user");
          }
        },
      });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleResetPassword = async (username) => {
    if (!resetPwValue.trim() || resetPwValue.length < 4) {
      setMessage("Password must be at least 4 characters.");
      return;
    }
    const targetUser = users.find((u) => u.username === username);
    if (!targetUser?.id) {
      setMessage("User not found.");
      return;
    }
    try {
      await resetPassword(targetUser.id, resetPwValue.trim());
      setResetPwUser("");
      setResetPwValue("");
      setMessage("Password reset successfully.");
      toast().success("Password reset for " + username);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const toggleUserSite = (username, site) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.username !== username) return user;
        const allowedSites = user.allowed_sites?.includes(site)
          ? user.allowed_sites.filter((item) => item !== site)
          : [...(user.allowed_sites || []), site];
        return { ...user, allowed_sites: allowedSites.length ? allowedSites : [site] };
      })
    );
  };

  const toggleUserFormSite = (site) => {
    const allowedSites = userForm.allowedSites.includes(site)
      ? userForm.allowedSites.filter((item) => item !== site)
      : [...userForm.allowedSites, site];
    setUserForm({ ...userForm, allowedSites: allowedSites.length ? allowedSites : [site] });
  };

  return (
    <div className="fade-in bg-green-50 p-6">
      <h1 className="mb-6 text-4xl font-bold text-green-700">Settings & Administration</h1>

      {activeTab === defaultTab && (
        <div className="grid gap-5 md:grid-cols-4">
          <Card title="Users" value={String(users.length)} />
          <Card title="Roles" value={String(Object.keys(roles).length)} />
          <Card title="Sites" value={String(sites.length)} />
          <Card title="System Health" value="99.8%" />
        </div>
      )}

      {activeTab === "modules" && <ModuleConfiguration onModulesChange={onModulesChange} />}
      {activeTab === "users" && (
        <div className="space-y-6">
          {!canManageAccess && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">
              Only Admin and Super Admin can create users, roles and privileges.
            </div>
          )}

          {canManageAccess && (
            <div className="grid gap-6 xl:grid-cols-2">
              <CollapsibleSection title="Create Role" isOpen={openSections.createRole} onToggle={() => toggleSection("createRole")}>
                <form onSubmit={addRole}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Role Code" value={roleForm.roleKey} onChange={(value) => setRoleForm({ ...roleForm, roleKey: value })} placeholder="finance-team" />
                    <Input label="Role Name" value={roleForm.label} onChange={(value) => setRoleForm({ ...roleForm, label: value })} placeholder="Finance Team" />
                  </div>
                  <label className="mt-4 block">
                    <span className="text-sm font-medium text-gray-600">Landing Page</span>
                    <select
                      value={roleForm.landingPath}
                      onChange={(event) => setRoleForm({ ...roleForm, landingPath: event.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {permissionTree.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
                    </select>
                  </label>
                  <ModuleTreeCheckboxes tree={permissionTree} selectedPaths={roleForm.allowedPaths} onToggle={toggleRoleFormPath} />
                  <button className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
                    Save Role
                  </button>
                </form>
              </CollapsibleSection>

              <CollapsibleSection title="Create User Login" isOpen={openSections.createUser} onToggle={() => toggleSection("createUser")}>
                <PasswordReqHint />
                <form onSubmit={addUser}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Name" value={userForm.name} onChange={(value) => setUserForm({ ...userForm, name: value })} />
                    <Input label="Email" value={userForm.email} onChange={(value) => setUserForm({ ...userForm, email: value })} />
                    <Input label="Phone Number" value={userForm.phone} onChange={(value) => /^\d{0,10}$/.test(value) && setUserForm({ ...userForm, phone: value })} />
                    <Input label="EMP ID" value={userForm.empId} onChange={(value) => setUserForm({ ...userForm, empId: value })} />
                    <Input label="Username" value={userForm.username} onChange={(value) => setUserForm({ ...userForm, username: value })} />
                    <Input label="Password" value={userForm.password} onChange={(value) => setUserForm({ ...userForm, password: value })} />
                    <label className="block">
                      <span className="text-sm font-medium text-gray-600">Role</span>
                      <select
                        value={userForm.role}
                        onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {editableRoleEntries.map(([roleKey, role]) => (
                          <option key={roleKey} value={roleKey}>{role.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <SiteCheckboxes selectedSites={userForm.allowedSites} onToggle={toggleUserFormSite} />
                  <button className="mt-5 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
                    Save User
                  </button>
                  {message && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">{message}</p>}
                </form>
              </CollapsibleSection>
            </div>
          )}

          <CollapsibleSection title="Role Access Design" isOpen={openSections.roleAccess} onToggle={() => toggleSection("roleAccess")}>
            <div className="mb-4">
              <div className="relative">
                <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={roleSearch}
                  onChange={(e) => { setRoleSearch(e.target.value); setRolePage(1); }}
                  placeholder="Search roles by name or code..."
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="space-y-5">
              {filteredRoleEntries.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No roles match your search</div>
              ) : (
                <>
                  {filteredRoleEntries.slice((rolePage - 1) * ITEMS_PER_PAGE, rolePage * ITEMS_PER_PAGE).map(([roleKey, role]) => {
                    const isExpanded = expandedRoles[roleKey] === true;
                    return (
                <div key={roleKey} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div
                    onClick={() => setExpandedRoles((prev) => ({ ...prev, [roleKey]: !prev[roleKey] }))}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ChevronDown
                        size={16}
                        strokeWidth={1.5}
                        className={`shrink-0 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900">{role.label}</h3>
                        <p className="text-xs text-gray-500">{roleKey} | Landing: {role.landingPath}</p>
                      </div>
                      <span className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${role.active === false ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        {role.active === false ? "Inactive" : "Active"}
                      </span>
                    </div>
                    {canManageAccess && roleKey !== "superadmin" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setEditingRole(editingRole === roleKey ? "" : roleKey); }}
                        className="shrink-0 rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                      >
                        {editingRole === roleKey ? "Close" : "Edit"}
                      </button>
                    )}
                  </div>
                  <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4">
                  {editingRole === roleKey && (
                    <div className="mb-4 grid gap-3 rounded-lg bg-green-50 p-4 md:grid-cols-4">
                      <Input label="Role Name" value={role.label} onChange={(value) => updateRole(roleKey, "label", value)} />
                      <label className="block">
                        <span className="text-sm font-medium text-gray-600">Landing Page</span>
                        <select
                          value={role.landingPath}
                          onChange={(event) => updateRole(roleKey, "landingPath", event.target.value)}
                          className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          {permissionTree.map((item) => <option key={item.path} value={item.path}>{item.label}</option>)}
                        </select>
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={role.active !== false}
                          disabled={roleKey === "superadmin"}
                          onChange={(event) => updateRole(roleKey, "active", event.target.checked)}
                          className="h-5 w-5"
                        />
                        Active Role{roleKey === "superadmin" && <span className="text-xs font-normal text-gray-400 ml-1">(locked)</span>}
                      </label>
                      <div className="flex items-end justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => deleteRole(roleKey)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <div className="relative w-full max-w-xs">
                      <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        placeholder="Filter modules..."
                        className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <ModuleTreeCheckboxes
                    tree={filteredPermissionTree}
                    disabled={!canManageAccess || editingRole !== roleKey || role.allowedPaths?.includes("*")}
                    selectedPaths={role.allowedPaths?.includes("*") ? permissionTree.flatMap((m) => [m.path, ...m.children.map((c) => c.path)]) : role.allowedPaths}
                    onToggle={(path) => toggleRoleAccess(roleKey, path)}
                  />
                  {moduleSearch && filteredPermissionTree.length === 0 && (
                    <div className="py-2 text-center text-xs text-gray-400">No modules match your search</div>
                  )}
                      </div>
                    </div>
                  </div>
                </div>
                    );
                  })}
                  <Pagination page={rolePage} total={filteredRoleEntries.length} perPage={ITEMS_PER_PAGE} onChange={setRolePage} />
                </>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="User Login Configuration" isOpen={openSections.userConfig} onToggle={() => toggleSection("userConfig")}>
            <div className="mb-4">
              <div className="relative">
                <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  placeholder="Search by name, username, email, role, phone, or emp ID..."
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm text-gray-700">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">EMP ID</th>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Sites</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400">No users match your search</td></tr>
                  ) : filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE).map((user) => {
                    const lockedSuperAdmin = user.role === "superadmin" && !isSuperAdmin;
                    const isEditing = editingUser === user.username;
                    return (
                      <tr key={user.username} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-4 font-medium">
                          {isEditing ? (
                            <input
                              value={user.name}
                              disabled={lockedSuperAdmin}
                              onChange={(event) => updateUser(user.username, "name", event.target.value)}
                              className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          ) : user.name}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <input
                              value={user.email || ""}
                              disabled={lockedSuperAdmin}
                              onChange={(event) => updateUser(user.username, "email", event.target.value)}
                              className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          ) : user.email || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <input
                              value={user.phone || ""}
                              disabled={lockedSuperAdmin}
                              onChange={(event) => updateUser(user.username, "phone", event.target.value)}
                              className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          ) : user.phone || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <input
                              value={user.emp_id || user.empId || ""}
                              disabled={lockedSuperAdmin}
                              onChange={(event) => updateUser(user.username, "empId", event.target.value)}
                              className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            />
                          ) : user.emp_id || user.empId || "-"}
                        </td>
                        <td className="px-4 py-4">{user.username}</td>
                        <td className="px-4 py-4">
                          <select
                            value={user.role}
                            disabled={!canManageAccess || lockedSuperAdmin || !isEditing}
                            onChange={(event) => updateUser(user.username, "role", event.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          >
                            {editableRoleEntries.map(([roleKey, role]) => (
                              <option key={roleKey} value={roleKey}>{role.label}</option>
                            ))}
                            {user.role === "superadmin" && <option value="superadmin">Super Admin</option>}
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {sites.map((site) => (
                              <label key={site} className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-800">
                                <input
                                  type="checkbox"
                                  disabled={!canManageAccess || lockedSuperAdmin || !isEditing}
                                  checked={(user.allowed_sites || user.allowedSites || []).includes(site)}
                                  onChange={() => toggleUserSite(user.username, site)}
                                />
                                {site}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {isEditing ? (
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <input
                                type="checkbox"
                                disabled={lockedSuperAdmin}
                                checked={user.active !== false}
                                onChange={(event) => updateUser(user.username, "active", event.target.checked)}
                              />
                              {user.active === false ? "Inactive" : "Active"}
                            </label>
                          ) : (
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.active === false ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                              {user.active === false ? "Inactive" : "Active"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={!canManageAccess || lockedSuperAdmin}
                              onClick={() => setEditingUser(isEditing ? "" : user.username)}
                              className="rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isEditing ? "Close" : "Edit"}
                            </button>
                            {isEditing && (
                              <>
                                {resetPwUser === user.username ? (
                                  <div className="flex flex-col gap-1">
                                    <PasswordReqHint />
                                    <div className="flex items-center gap-1">
                                    <input
                                      value={resetPwValue}
                                      onChange={(e) => setResetPwValue(e.target.value)}
                                      placeholder="New password"
                                      type="text"
                                      className="w-28 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleResetPassword(user.username)}
                                      className="rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setResetPwUser(""); setResetPwValue(""); }}
                                      className="rounded-lg bg-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => { setResetPwUser(user.username); setResetPwValue(""); }}
                                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                  >
                                    <KeyRound size={14} strokeWidth={1.5} className="inline mr-1" />
                                    Reset PW
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteUser(user.username)}
                                  className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination page={userPage} total={filteredUsers.length} perPage={ITEMS_PER_PAGE} onChange={setUserPage} />
            </div>
          </CollapsibleSection>
        </div>
      )}

      {activeTab === "profile" && <ProfileSettings currentUser={currentUser} setCurrentUser={setCurrentUser} />}
      {activeTab === "notifications" && <NotificationSettings />}
      {activeTab === "branch" && <BranchSettings />}
      {activeTab === "security" && <SecuritySettings />}
      {activeTab === "backup" && <BackupSettings />}
      {activeTab === "refresh" && <DataRefreshSettings />}
      {activeTab === "logs" && <SystemLogs />}

      <ConfirmDialog
        open={confirm.open}
        title={`Delete ${confirm.type === "role" ? "Role" : "User"}`}
        message={`Are you sure you want to delete "${confirm.label}"? This action can be undone within 10 seconds.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirm.type === "role") executeDeleteRole(confirm.meta);
          else if (confirm.type === "user") executeDeleteUser(confirm.meta);
          setConfirm({ open: false, type: "", id: null, label: "" });
        }}
        onCancel={() => setConfirm({ open: false, type: "", id: null, label: "" })}
      />
    </div>
  );
}

function CollapsibleSection({ title, isOpen, onToggle, children }) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-5 text-left text-2xl font-bold text-gray-800"
      >
        <span>{title}</span>
        <ChevronDown size={22} strokeWidth={1.5} className={`text-green-700 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </section>
  );
}

function ModuleTreeCheckboxes({ tree, selectedPaths, onToggle, disabled = false }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mt-2 space-y-1">
      {tree.map((mod) => {
        const modChecked = selectedPaths?.includes(mod.path);
        const hasChildren = mod.children && mod.children.length > 0;
        const isExpanded = expanded[mod.key] === true;
        const anyChildChecked = hasChildren && mod.children.some((c) => selectedPaths?.includes(c.path));

        return (
          <div key={mod.key}>
            <div className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
              modChecked || anyChildChecked ? "border-green-300 bg-green-50" : "border-gray-100 bg-white hover:bg-gray-50"
            } ${disabled ? "opacity-50" : ""}`}>
              {hasChildren ? (
                <button type="button" onClick={() => toggleExpand(mod.key)} className="text-gray-400 hover:text-gray-600 p-0.5">
                  <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`} />
                </button>
              ) : (
                <span className="w-5" />
              )}
              <input
                type="checkbox"
                disabled={disabled}
                checked={modChecked}
                onChange={() => onToggle(mod.path)}
                className="h-4 w-4 shrink-0 accent-green-600"
              />
              <button type="button" onClick={() => hasChildren && toggleExpand(mod.key)} className="flex-1 text-left text-sm font-semibold text-gray-800 hover:text-gray-600">
                {mod.label}
              </button>
              {hasChildren && (
                <span className="text-xs text-gray-400">
                  {mod.children.filter((c) => selectedPaths?.includes(c.path)).length}/{mod.children.length}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                {mod.children.map((child) => (
                  <label key={child.key} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    selectedPaths?.includes(child.path)
                      ? "border-green-200 bg-green-50/50 text-green-800"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={selectedPaths?.includes(child.path)}
                      onChange={() => onToggle(child.path)}
                      className="h-3.5 w-3.5 shrink-0 accent-green-600"
                    />
                    <span>{child.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SiteCheckboxes({ selectedSites, onToggle }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-600">Site Access</p>
      <div className="mt-3 flex flex-wrap gap-3">
        {sites.map((site) => (
          <label key={site} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
            <input type="checkbox" checked={selectedSites?.includes(site)} onChange={() => onToggle(site)} />
            {site}
          </label>
        ))}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </label>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-gray-800">{value}</h2>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    dailySummary: false,
    criticalAlerts: true,
    reportReady: true,
    systemUpdates: false,
  });

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    useToastStore.getState().success("Notification preferences saved");
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Bell size={24} className="text-green-700" />
        <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
      </div>

      <div className="space-y-4 max-w-lg">
        {[
          { key: "emailAlerts", label: "Email Alerts", desc: "Receive notifications via email" },
          { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },
          { key: "dailySummary", label: "Daily Summary", desc: "End-of-day summary report" },
          { key: "criticalAlerts", label: "Critical Alerts", desc: "ICU occupancy, stockouts, etc." },
          { key: "reportReady", label: "Report Ready", desc: "When scheduled reports are generated" },
          { key: "systemUpdates", label: "System Updates", desc: "Maintenance and version updates" },
        ].map((item) => (
          <label key={item.key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <input
              type="checkbox"
              checked={settings[item.key]}
              onChange={() => toggle(item.key)}
              className="h-5 w-5 rounded"
            />
          </label>
        ))}
      </div>

      <button onClick={handleSave} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
        <Save size={16} strokeWidth={1.5} /> Save Preferences
      </button>
    </div>
  );
}

function BranchSettings() {
  const [branches] = useState([
    { name: "PBMH", code: "PBMH001", address: "Kalinga Institute of Medical Sciences, Bhubaneswar", status: "Active", phone: "0674-2386000" },
    { name: "KSSCC", code: "KSSCC001", address: "Kalinga Institute of Medical Sciences, Bhubaneswar", status: "Active", phone: "0674-2386001" },
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Building2 size={24} className="text-green-700" />
          <h2 className="text-2xl font-bold text-gray-800">Branch Configuration</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-700">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-medium">Branch Name</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.code} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">{b.name}</td>
                  <td className="px-4 py-4">{b.code}</td>
                  <td className="px-4 py-4">{b.address}</td>
                  <td className="px-4 py-4">{b.phone}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PasswordReqHint() {
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    fetchPasswordPolicies().then((p) => {
      const r = [];
      r.push(`Minimum ${p.min_length} characters`);
      if (p.require_uppercase) r.push("At least 1 uppercase letter");
      if (p.require_number) r.push("At least 1 number");
      if (p.require_symbol) r.push("At least 1 special character");
      if (p.history_count > 0) r.push(`Cannot reuse last ${p.history_count} passwords`);
      setReqs(r);
    }).catch(() => {});
  }, []);

  if (reqs.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {reqs.map((r, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          <Info size={12} /> {r}
        </span>
      ))}
    </div>
  );
}

function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [policies, setPolicies] = useState(null);
  const [config, setConfig] = useState({
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    passwordMinLength: "6",
    requireUppercase: false,
    requireNumber: false,
    requireSymbol: false,
    expiryDays: "0",
    historyCount: "0",
    lockoutMinutes: "30",
    twoFactorAuth: false,
    ipRestriction: false,
  });
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const toast = useToastStore.getState;

  useEffect(() => {
    fetchPasswordPolicies().then((p) => {
      setPolicies(p);
      setConfig((prev) => ({
        ...prev,
        maxLoginAttempts: String(p.max_failed_attempts ?? 5),
        passwordMinLength: String(p.min_length ?? 6),
        requireUppercase: p.require_uppercase ?? false,
        requireNumber: p.require_number ?? false,
        requireSymbol: p.require_symbol ?? false,
        expiryDays: String(p.expiry_days ?? 0),
        historyCount: String(p.history_count ?? 0),
        lockoutMinutes: String(p.lockout_minutes ?? 30),
      }));
    }).catch(() => {});
  }, []);

  const handleSavePolicy = async () => {
    try {
      const updated = await updatePasswordPolicies({
        min_length: parseInt(config.passwordMinLength, 10) || 6,
        require_uppercase: config.requireUppercase || false,
        require_number: config.requireNumber || false,
        require_symbol: config.requireSymbol || false,
        expiry_days: parseInt(config.expiryDays, 10) || 0,
        history_count: parseInt(config.historyCount, 10) || 0,
        max_failed_attempts: parseInt(config.maxLoginAttempts, 10) || 5,
        lockout_minutes: parseInt(config.lockoutMinutes, 10) || 30,
      });
      setPolicies(updated);
      toast().success("Password policies saved");
    } catch (err) {
      toast().error(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setPwError("Passwords do not match.");
      return;
    }
    try {
      await changePassword(pwForm.current, pwForm.newPw);
      setPwForm({ current: "", newPw: "", confirm: "" });
      toast().success("Password changed successfully");
    } catch (err) {
      setPwError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Shield size={24} className="text-green-700" />
          <h2 className="text-2xl font-bold text-gray-800">Password Policy</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-2xl">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Min Password Length</p>
            <input
              type="number"
              min={4}
              max={64}
              value={config.passwordMinLength}
              onChange={(e) => setConfig({ ...config, passwordMinLength: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Max Login Attempts <span className="text-xs text-gray-400">(0 = unlimited)</span></p>
            <input
              type="number"
              min={0}
              max={20}
              value={config.maxLoginAttempts}
              onChange={(e) => setConfig({ ...config, maxLoginAttempts: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Lockout Duration (minutes)</p>
            <input
              type="number"
              min={1}
              max={1440}
              value={config.lockoutMinutes || "30"}
              onChange={(e) => setConfig({ ...config, lockoutMinutes: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Password Expiry (days) <span className="text-xs text-gray-400">(0 = never)</span></p>
            <input
              type="number"
              min={0}
              max={365}
              value={config.expiryDays || "0"}
              onChange={(e) => setConfig({ ...config, expiryDays: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Password History Count <span className="text-xs text-gray-400">(0 = off)</span></p>
            <input
              type="number"
              min={0}
              max={20}
              value={config.historyCount || "0"}
              onChange={(e) => setConfig({ ...config, historyCount: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Session Timeout (minutes)</p>
            <input
              type="number"
              min={5}
              max={1440}
              value={config.sessionTimeout}
              onChange={(e) => setConfig({ ...config, sessionTimeout: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Password Complexity Requirements</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireUppercase || false}
                onChange={() => setConfig({ ...config, requireUppercase: !config.requireUppercase })}
                className="h-5 w-5"
              />
              <div><p className="font-medium text-sm text-gray-800">Uppercase Letter</p><p className="text-xs text-gray-500">At least 1 uppercase</p></div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireNumber || false}
                onChange={() => setConfig({ ...config, requireNumber: !config.requireNumber })}
                className="h-5 w-5"
              />
              <div><p className="font-medium text-sm text-gray-800">Number</p><p className="text-xs text-gray-500">At least 1 digit</p></div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.requireSymbol || false}
                onChange={() => setConfig({ ...config, requireSymbol: !config.requireSymbol })}
                className="h-5 w-5"
              />
              <div><p className="font-medium text-sm text-gray-800">Special Character</p><p className="text-xs text-gray-500">At least 1 symbol</p></div>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {[
            { key: "twoFactorAuth", label: "Two-Factor Authentication", desc: "Require OTP on login from new devices" },
            { key: "ipRestriction", label: "IP Restriction", desc: "Restrict access to configured IP addresses" },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 cursor-pointer max-w-lg">
              <div>
                <p className="font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={config[item.key]}
                onChange={() => setConfig({ ...config, [item.key]: !config[item.key] })}
                className="h-5 w-5"
              />
            </label>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-400">Password expiry and lockout do not apply to superadmin accounts.</p>

        <button onClick={handleSavePolicy} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
          <Save size={16} strokeWidth={1.5} /> Save Security Settings
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <KeyRound size={24} className="text-green-700" />
          <h2 className="text-2xl font-bold text-gray-800">Change Your Password</h2>
        </div>

        {policies && (
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              policies.min_length > 0 && `Minimum ${policies.min_length} characters`,
              policies.require_uppercase && "At least 1 uppercase letter",
              policies.require_number && "At least 1 number",
              policies.require_symbol && "At least 1 special character",
              policies.history_count > 0 && `Cannot reuse last ${policies.history_count} passwords`,
            ].filter(Boolean).map((req, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Info size={12} /> {req}
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Current Password</p>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">New Password</p>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Confirm New Password</p>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {pwError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{pwError}</p>
          )}

          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
            <KeyRound size={16} strokeWidth={1.5} /> Change Password
          </button>
        </form>
      </div>
    </div>
  );
}

function BackupSettings() {
  const [backups] = useState([
    { id: 1, date: "15 Jun 2026, 02:00 AM", size: "48 MB", type: "Full", status: "Success" },
    { id: 2, date: "14 Jun 2026, 02:00 AM", size: "48 MB", type: "Full", status: "Success" },
    { id: 3, date: "13 Jun 2026, 02:00 AM", size: "47 MB", type: "Full", status: "Success" },
    { id: 4, date: "12 Jun 2026, 02:00 AM", size: "47 MB", type: "Full", status: "Success" },
  ]);

  const handleBackupNow = () => {
    useToastStore.getState().success("Backup started successfully");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <HardDrive size={24} className="text-green-700" />
          <h2 className="text-2xl font-bold text-gray-800">Backup & Restore</h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={handleBackupNow} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
            <Download size={16} strokeWidth={1.5} /> Backup Now
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Trash2 size={16} strokeWidth={1.5} /> Restore from Backup
          </button>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-4">Backup History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-700">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4">{b.date}</td>
                  <td className="px-4 py-4">{b.size}</td>
                  <td className="px-4 py-4">{b.type}</td>
                  <td className="px-4 py-4"><span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DataRefreshSettings() {
  const [interval, setInterval] = useState("5");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleRefreshNow = () => {
    useToastStore.getState().success("Dashboard data refreshed");
  };

  const handleSave = () => {
    useToastStore.getState().success("Refresh settings saved");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <RefreshCw size={24} className="text-green-700" />
          <h2 className="text-2xl font-bold text-gray-800">Data Refresh Configuration</h2>
        </div>

        <div className="space-y-4 max-w-md">
          <label className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 cursor-pointer">
            <div>
              <p className="font-medium text-gray-800">Auto Refresh</p>
              <p className="text-xs text-gray-500">Automatically refresh dashboard data</p>
            </div>
            <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} className="h-5 w-5" />
          </label>

          {autoRefresh && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-600">Refresh Interval (minutes)</p>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleRefreshNow} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors">
              <RefreshCw size={16} strokeWidth={1.5} /> Refresh Now
            </button>
            <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Save size={16} strokeWidth={1.5} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemLogs() {
  const toast = useToastStore.getState;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [level, setLevel] = useState("");
  const [search, setSearch] = useState("");
  const limit = 50;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogs({ page, limit, level: level || undefined, search: search || undefined });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      toast().error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, level, search]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleRefresh = () => loadLogs();

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-green-700" />
            <h2 className="text-2xl font-bold text-gray-800">System Logs</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">{total}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search messages..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
          <select
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-green-500"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-700">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50 text-sm">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatTime(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        log.level === "error" ? "bg-red-50 text-red-700" :
                        log.level === "warning" ? "bg-amber-50 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-3">{log.message}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {log.username || "—"}
                      {log.ip_address && <div className="text-gray-400">{log.ip_address}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={total} perPage={limit} onChange={setPage} />
      </div>
    </div>
  );
}

function ProfileSettings({ currentUser, setCurrentUser }) {
  const toast = useToastStore.getState;
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast().error("Image must be under 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setAvatarPreview(dataUrl);
      setUploading(true);
      try {
        await updateAvatarUrl(dataUrl);
        setCurrentUser((prev) => ({ ...prev, avatarUrl: dataUrl }));
        toast().success("Profile picture updated");
      } catch (err) {
        toast().error(err.message);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const [confirmAvatar, setConfirmAvatar] = useState(false);

  const handleRemoveAvatar = () => {
    setConfirmAvatar(true);
  };

  const executeRemoveAvatar = async () => {
    setAvatarPreview("");
    try {
      await updateAvatarUrl("");
      setCurrentUser((prev) => ({ ...prev, avatarUrl: "" }));
      toast().success("Profile picture removed");
    } catch (err) {
      toast().error(err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
      });
      setCurrentUser(updatedUser);
      setEditing(false);
      toast().success("Profile updated");
    } catch (err) {
      toast().error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
    });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Picture</h2>
        <div className="flex flex-wrap items-center gap-6">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile"
              className="h-24 w-24 rounded-full object-cover border-4 border-green-200"
            />
          ) : (
            <span className="grid h-24 w-24 place-items-center rounded-full bg-green-100 text-4xl font-bold text-green-700 border-4 border-green-200">
              {(currentUser?.name || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="space-y-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
              {uploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {avatarPreview && (
              <button
                onClick={handleRemoveAvatar}
                className="block text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove photo
              </button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG or GIF. Max 2 MB.</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Account Details</h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-green-200 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            ) : (
              <p className="font-medium text-gray-800">{currentUser?.name || "-"}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-medium text-gray-800">{currentUser?.username || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            {editing ? (
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-green-200 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            ) : (
              <p className="font-medium text-gray-800">{currentUser?.email || "-"}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            {editing ? (
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-green-200 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            ) : (
              <p className="font-medium text-gray-800">{currentUser?.phone || "-"}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium text-gray-800">{currentUser?.roleLabel || currentUser?.role || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Site</p>
            <p className="font-medium text-gray-800">{currentUser?.site || "-"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">HIPAA & NDHM Compliance</h2>
        <p className="text-sm text-gray-500 mb-4">Review the privacy policy and data handling practices.</p>
        <button
          onClick={() => setShowPolicy(true)}
          className="rounded-lg border border-green-200 px-5 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          Review Privacy Policy
        </button>
        {currentUser?.privacyAcceptedAt && (
          <p className="mt-3 text-xs text-green-600 font-medium">Privacy policy accepted</p>
        )}
      </div>

      {showPolicy && (
        <PrivacyPolicyModal
          onAccept={async () => {
            try {
              await acceptPrivacy();
              const now = new Date().toISOString();
              setCurrentUser((prev) => ({ ...prev, privacyAcceptedAt: now }));
              toast().success("Privacy policy accepted");
              setShowPolicy(false);
            } catch (err) {
              toast().error(err.message);
            }
          }}
          onSkip={() => setShowPolicy(false)}
        />
      )}

      <ConfirmDialog
        open={confirmAvatar}
        title="Remove Profile Picture"
        message="Are you sure you want to remove your profile picture?"
        confirmLabel="Remove"
        onConfirm={() => { setConfirmAvatar(false); executeRemoveAvatar(); }}
        onCancel={() => setConfirmAvatar(false)}
      />
    </div>
  );
}

function Pagination({ page, total, perPage, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">1</button>
          {start > 2 && <span className="px-1 text-xs text-gray-400">...</span>}
        </>
      )}
      {pages.map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            i === page
              ? "border-green-700 bg-green-700 text-white"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-xs text-gray-400">...</span>}
          <button onClick={() => onChange(totalPages)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">{totalPages}</button>
        </>
      )}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
