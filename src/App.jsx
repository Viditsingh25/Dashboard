import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastContainer from "./components/Toast";
import Tour from "./components/Tour";
import GlobalSearch from "./components/GlobalSearch";
import RouteTransition from "./components/RouteTransition";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Revenue from "./pages/Revenue";
import Patients from "./pages/Patients";
import BedManagement from "./pages/BedManagement";
import LabRadiology from "./pages/LabRadiology";
import Pharmacy from "./pages/Pharmacy";
import KitchenDiet from "./pages/KitchenDiet";
import Operations from "./pages/Operations";
import NursingPage from "./pages/NursingPage";
import DoctorsPayout from "./pages/DoctorsPayout";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import DynamicModulePage from "./pages/DynamicModulePage";
import { canAccessPath, getLandingPath } from "./utils/authConfig";
import { fetchMe, fetchUsers, fetchRoles, fetchModules, logout as apiLogout, acceptPrivacy, selectSite } from "./lib/api";
import MaintenancePage from "./pages/MaintenancePage";
import TabGuard from "./components/TabGuard";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [modules, setModules] = useState([]);
  const [pendingSiteSelection, setPendingSiteSelection] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    } catch {
      // silently fail
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const fetchedRoles = await fetchRoles();
      const rolesMap = Object.fromEntries(
        fetchedRoles.map((r) => [
          r.name,
          {
            id: r.id,
            label: r.label,
            landingPath: r.landing_path,
            allowedPaths: r.allowed_paths,
            active: r.active,
          },
        ])
      );
      setRoles(rolesMap);
    } catch {
      // silently fail
    }
  }, []);

  const loadModules = useCallback(async () => {
    try {
      const mods = await fetchModules();
      setModules(mods);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const user = await fetchMe();
      if (user) {
        setCurrentUser(user);
        loadUsers();
        loadRoles();
        loadModules();
      }
      setLoading(false);
    };
    init();
  }, [loadUsers, loadRoles, loadModules]);

  const handleLogin = async (user) => {
    localStorage.setItem("kims-dashboard-user", JSON.stringify(user));
    const allowedSites = user.allowedSites || [];
    if (allowedSites.length <= 1) {
      const site = allowedSites[0] || "";
      const updatedUser = { ...user, site };
      try { await selectSite(site); } catch {}
      const landingPath = updatedUser.landingPath || "/";
      window.history.replaceState(null, "", landingPath);
      setCurrentUser(updatedUser);
      setRoles((prev) => ({
        ...prev,
        [user.role]: {
          label: user.roleLabel,
          landingPath: user.landingPath,
          allowedPaths: user.allowedPaths,
          active: true,
        },
      }));
      loadUsers();
      loadRoles();
      loadModules();
    } else {
      setPendingSiteSelection(user);
    }
  };

  const handleSiteSelect = async (site) => {
    if (!pendingSiteSelection) return;
    try {
      await selectSite(site);
    } catch {}
    const user = { ...pendingSiteSelection, site };
    localStorage.setItem("kims-dashboard-user", JSON.stringify(user));
    const landingPath = user.landingPath || "/";
    window.history.replaceState(null, "", landingPath);
    setCurrentUser(user);
    setRoles((prev) => ({
      ...prev,
      [user.role]: {
        label: user.roleLabel,
        landingPath: user.landingPath,
        allowedPaths: user.allowedPaths,
        active: true,
      },
    }));
    setPendingSiteSelection(null);
    loadUsers();
    loadRoles();
    loadModules();
  };

  const handleLogout = () => {
    apiLogout();
    localStorage.removeItem("kims-dashboard-user");
    setCurrentUser(null);
    setUsers([]);
    setRoles({});
  };

  const handlePrivacyAccept = async () => {
    try {
      await acceptPrivacy();
    } catch (err) {
      console.error("Privacy accept API error:", err);
    }
    const now = new Date().toISOString();
    setCurrentUser((prev) => {
      if (prev?.username) localStorage.setItem(`kims-privacy-${prev.username}`, now);
      return { ...prev, privacyAcceptedAt: now };
    });
    setShowPrivacy(false);
  };

  const needsPrivacyAccept = (user) => {
    if (user?.privacyAccepted) return false;
    const ts = user?.privacyAcceptedAt;
    if (!ts) {
      const local = user?.username ? localStorage.getItem(`kims-privacy-${user.username}`) : null;
      if (!local) return true;
      const daysSinceAccept = (Date.now() - new Date(local).getTime()) / 86400000;
      return daysSinceAccept >= 30;
    }
    if (user?.username) localStorage.setItem(`kims-privacy-${user.username}`, ts);
    const daysSinceAccept = (Date.now() - new Date(ts).getTime()) / 86400000;
    return daysSinceAccept >= 30;
  };

  // Show privacy modal after login if not accepted in last 30 days
  useEffect(() => {
    if (currentUser && needsPrivacyAccept(currentUser)) {
      setShowPrivacy(true);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-700 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser && !pendingSiteSelection) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <ToastContainer />
      </>
    );
  }

  if (pendingSiteSelection) {
    return <SiteSelectModal user={pendingSiteSelection} onSelect={handleSiteSelect} onCancel={() => { setPendingSiteSelection(null); apiLogout(); }} />;
  }

  const moduleStatusMap = Object.fromEntries(
    modules.map((m) => [m.path.startsWith("/") ? m.path : `/${m.path}`, { maintenance: m.maintenance, coming_soon: m.coming_soon, label: m.label }])
  );

  const renderRoute = (path, element) => {
    const status = path === "/settings" ? null : moduleStatusMap[path];
    if (status?.maintenance) return <ErrorBoundary><MaintenancePage type="maintenance" title={status.label} /></ErrorBoundary>;
    if (status?.coming_soon) return <ErrorBoundary><MaintenancePage type="coming_soon" title={status.label} /></ErrorBoundary>;
    if (canAccessPath(currentUser, path, roles)) return <ErrorBoundary>{element}</ErrorBoundary>;
    return <Navigate to={getLandingPath(currentUser, roles)} replace />;
  };

  const renderModuleRoute = (path, element) =>
    renderRoute(path, <TabGuard currentUser={currentUser} roles={roles} modulePath={path}>{element}</TabGuard>);

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden font-sans app-shell">
        <Sidebar currentUser={currentUser} roles={roles} modules={modules} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header currentUser={currentUser} onLogout={handleLogout} roles={roles} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 app-content">
            <RouteTransition>
              <Routes>
                <Route path="/" element={renderRoute("/", <Dashboard currentUser={currentUser} />)} />
                <Route path="/revenue" element={renderModuleRoute("/revenue", <Revenue />)} />
                <Route path="/patients" element={renderModuleRoute("/patients", <Patients />)} />
                <Route path="/beds" element={renderModuleRoute("/beds", <BedManagement />)} />
                <Route path="/lab" element={renderModuleRoute("/lab", <LabRadiology />)} />
                <Route path="/pharmacy" element={renderModuleRoute("/pharmacy", <Pharmacy />)} />
                <Route path="/kitchen-diet" element={renderModuleRoute("/kitchen-diet", <KitchenDiet />)} />
                <Route path="/operations" element={renderModuleRoute("/operations", <Operations />)} />
                <Route path="/doctors" element={renderModuleRoute("/doctors", <DoctorsPayout />)} />
                <Route path="/nursing" element={renderModuleRoute("/nursing", <NursingPage />)} />
                <Route path="/reports" element={renderModuleRoute("/reports", <Reports />)} />
                <Route
                  path="/settings"
                  element={renderRoute(
                    "/settings",
                    <Settings
                      currentUser={currentUser}
                      setCurrentUser={setCurrentUser}
                      roles={roles}
                      setRoles={setRoles}
                      users={users}
                      setUsers={setUsers}
                      onModulesChange={loadModules}
                    />
                  )}
                />
                <Route path="/module/:moduleName" element={renderRoute("/module/:moduleName", <DynamicModulePage />)} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </RouteTransition>
          </main>
        </div>
      </div>
      <ToastContainer />
      <Tour />
      <GlobalSearch />
      {showPrivacy && (
        <PrivacyPolicyModal
          onAccept={handlePrivacyAccept}
          onSkip={() => setShowPrivacy(false)}
        />
      )}
    </BrowserRouter>
  );
}

function SiteSelectModal({ user, onSelect, onCancel }) {
  const [selectedSite, setSelectedSite] = useState((user.allowedSites || [])[0] || "");

  return (
    <main className="flex h-screen items-center justify-center bg-[#f7fbf8] p-5">
      <div className="w-full max-w-md rounded-[22px] border border-green-100/80 bg-white/95 p-8 shadow-[0_34px_90px_-50px_rgba(15,23,42,0.42)] text-center">
        <div className="mb-4 flex items-center justify-center gap-4 text-green-800">
          <span className="h-px w-16 bg-green-700/45" />
          <span className="grid h-12 w-12 place-items-center rounded-full border-2 border-green-700">
            <Building2 size={24} strokeWidth={1.5} />
          </span>
          <span className="h-px w-16 bg-green-700/45" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Select Site</h2>
        <p className="mb-6 text-sm text-gray-500">
          Welcome, <span className="font-semibold text-gray-800">{user.name || user.username}</span>. Choose a site to continue.
        </p>
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="mb-6 h-12 w-full rounded-xl border border-green-200 px-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {(user.allowedSites || []).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={() => onSelect(selectedSite)}
          className="mb-3 flex h-12 w-full items-center justify-center rounded-xl bg-green-800 text-base font-bold tracking-wide text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
        >
          Continue
        </button>
        <button
          onClick={onCancel}
          className="flex w-full items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <LogOut size={14} strokeWidth={1.5} /> Logout
        </button>
      </div>
    </main>
  );
}

export default App;
