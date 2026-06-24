import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Save, X, ChevronDown, ChevronRight, GripVertical, Wrench, Clock } from "lucide-react";
import { fetchModules, createModule, updateModule, deleteModule, fetchKPIs, createKPI, updateKPI, deleteKPI } from "../lib/api";
import { useToastStore } from "../stores/toastStore";
import ConfirmDialog from "./ConfirmDialog";

const valueTypes = [
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency (₹)" },
  { value: "percentage", label: "Percentage" },
  { value: "string", label: "Text" },
];

const aggregations = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "count", label: "Count" },
  { value: "max", label: "Max" },
  { value: "min", label: "Min" },
  { value: "latest", label: "Latest Value" },
  { value: "none", label: "Manual / Formula" },
];

export default function ModuleConfiguration({ onModulesChange }) {
  const toast = useToastStore((s) => s);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({ name: "", label: "", path: "", icon: "" });

  const updateModuleForm = (field, value) => {
    setModuleForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "label" && !prev.name && !prev.path) {
        const slug = value.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
        next.name = slug;
        next.path = `/${slug}`;
      }
      return next;
    });
  };
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [kpiForm, setKpiForm] = useState({ label: "", value_type: "number", source_column: "", aggregation: "sum", formula: "" });
  const [expandedModule, setExpandedModule] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, type: "", id: null, label: "" });

  const loadModules = async () => {
    try {
      const data = await fetchModules();
      setModules(data);
    } catch { /* silently fail */ }
  };

  const loadKPIs = async (moduleId) => {
    try {
      const data = await fetchKPIs(moduleId);
      setKpis(data);
    } catch { /* silently fail */ }
  };

  useEffect(() => { loadModules(); }, []);

  useEffect(() => {
    if (selectedModuleId) loadKPIs(selectedModuleId);
    else setKpis([]);
  }, [selectedModuleId]);

  const handleSaveModule = async () => {
    if (!moduleForm.label || !moduleForm.name || !moduleForm.path) {
      toast.error("Label, name, and path are required");
      return;
    }
    try {
      if (editingModule) {
        const updated = await updateModule(editingModule.id, moduleForm);
        setModules((prev) => prev.map((m) => (m.id === editingModule.id ? updated : m)));
        toast.success("Module updated");
      } else {
        const created = await createModule(moduleForm);
        setModules((prev) => [...prev, created]);
        toast.success("Module created");
      }
      setShowModuleForm(false);
      setEditingModule(null);
      setModuleForm({ name: "", label: "", path: "/", icon: "" });
      onModulesChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleModuleFlag = async (id, flag, value) => {
    try {
      const payload = { [flag]: value };
      if (value) payload[flag === "maintenance" ? "coming_soon" : "maintenance"] = false;
      const updated = await updateModule(id, payload);
      setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
      toast.success(value ? `${flag === "maintenance" ? "Maintenance" : "Coming Soon"} enabled` : "Disabled");
      onModulesChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteModule = (id) => {
    const mod = modules.find((m) => m.id === id);
    setConfirm({ open: true, type: "module", id, label: mod?.label || "this module" });
  };

  const executeDeleteModule = async (id) => {
    try {
      await deleteModule(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
      if (selectedModuleId === id) { setSelectedModuleId(null); setKpis([]); }
      toast.success("Module deleted");
      onModulesChange?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveKPI = async () => {
    if (!kpiForm.label) {
      toast.error("KPI label is required");
      return;
    }
    const payload = { ...kpiForm, module_id: selectedModuleId };
    try {
      if (editingKPI) {
        const updated = await updateKPI(editingKPI.id, payload);
        setKpis((prev) => prev.map((k) => (k.id === editingKPI.id ? updated : k)));
        toast.success("KPI updated");
      } else {
        const created = await createKPI(payload);
        setKpis((prev) => [...prev, created]);
        toast.success("KPI created");
      }
      setShowKPIForm(false);
      setEditingKPI(null);
      setKpiForm({ label: "", value_type: "number", source_column: "", aggregation: "sum", formula: "" });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteKPI = (id) => {
    const kpi = kpis.find((k) => k.id === id);
    setConfirm({ open: true, type: "kpi", id, label: kpi?.label || "this KPI" });
  };

  const executeDeleteKPI = async (id) => {
    try {
      await deleteKPI(id);
      setKpis((prev) => prev.filter((k) => k.id !== id));
      toast.success("KPI deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const editModule = (mod) => {
    setModuleForm({ name: mod.name, label: mod.label, path: mod.path, icon: mod.icon || "" });
    setEditingModule(mod);
    setShowModuleForm(true);
  };

  const editKPI = (kpi) => {
    setKpiForm({
      label: kpi.label,
      value_type: kpi.value_type || "number",
      source_column: kpi.source_column || "",
      aggregation: kpi.aggregation || "sum",
      formula: kpi.formula || "",
    });
    setEditingKPI(kpi);
    setShowKPIForm(true);
  };

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Module Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Manage modules, KPIs, and their data mapping</p>
        </div>
        {canManageModules && (
          <button onClick={() => { setEditingModule(null); setModuleForm({ name: "", label: "", path: "/", icon: "" }); setShowModuleForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            <Plus size={16} /> Add Module
          </button>
        )}
      </div>

      {showModuleForm && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{editingModule ? "Edit Module" : "New Module"}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
               <label className="block text-sm font-medium text-gray-600 mb-1">Module Name (slug)</label>
              <input value={moduleForm.name} onChange={(e) => updateModuleForm("name", e.target.value)}
                placeholder="auto-generated from label" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Display Label</label>
              <input value={moduleForm.label} onChange={(e) => updateModuleForm("label", e.target.value)}
                placeholder="e.g. Ambulance Services" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Route Path</label>
              <input value={moduleForm.path} onChange={(e) => updateModuleForm("path", e.target.value)}
                placeholder="auto-generated from label" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Icon Name (Lucide)</label>
              <input value={moduleForm.icon} onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })}
                placeholder="e.g. Truck" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSaveModule} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              <Save size={16} /> {editingModule ? "Update" : "Create"}
            </button>
            <button onClick={() => { setShowModuleForm(false); setEditingModule(null); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Module List */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h3 className="font-bold text-gray-700">Modules ({modules.length})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {modules.map((mod) => (
                <div key={mod.id}
                  className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-colors ${selectedModuleId === mod.id ? "bg-green-50" : "hover:bg-gray-50"}`}
                  onClick={() => { setSelectedModuleId(mod.id); setExpandedModule(expandedModule === mod.id ? null : mod.id); }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${mod.active ? "bg-green-500" : "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{mod.label}</p>
                      <p className="text-xs text-gray-400 truncate">{mod.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleModuleFlag(mod.id, "maintenance", !mod.maintenance); }}
                      className={`rounded-lg p-1.5 ${mod.maintenance ? "bg-amber-100 text-amber-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                      title={mod.maintenance ? "Disable maintenance mode" : "Mark as under maintenance"}>
                      <Wrench size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleModuleFlag(mod.id, "coming_soon", !mod.coming_soon); }}
                      className={`rounded-lg p-1.5 ${mod.coming_soon ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                      title={mod.coming_soon ? "Disable coming soon" : "Mark as coming soon"}>
                      <Clock size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); editModule(mod); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI List for selected module */}
        <div className="lg:col-span-8">
          {selectedModule ? (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                <h3 className="font-bold text-gray-700">KPIs — {selectedModule.label} ({kpis.length})</h3>
                <button onClick={() => { setEditingKPI(null); setKpiForm({ label: "", value_type: "number", source_column: "", aggregation: "sum", formula: "" }); setShowKPIForm(true); }}
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                  <Plus size={14} /> Add KPI
                </button>
              </div>

              {showKPIForm && (
                <div className="border-b border-gray-100 bg-gray-50 p-5">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">{editingKPI ? "Edit KPI" : "New KPI"}</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Label *</label>
                      <input value={kpiForm.label} onChange={(e) => setKpiForm({ ...kpiForm, label: e.target.value })}
                        placeholder="e.g. Total Beds" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Value Type</label>
                      <select value={kpiForm.value_type} onChange={(e) => setKpiForm({ ...kpiForm, value_type: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                        {valueTypes.map((vt) => <option key={vt.value} value={vt.value}>{vt.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Excel Source Column</label>
                      <input value={kpiForm.source_column} onChange={(e) => setKpiForm({ ...kpiForm, source_column: e.target.value })}
                        placeholder="e.g. Total_Beds" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Aggregation</label>
                      <select value={kpiForm.aggregation} onChange={(e) => setKpiForm({ ...kpiForm, aggregation: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
                        {aggregations.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                    {kpiForm.aggregation === "none" && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Formula (optional)</label>
                        <input value={kpiForm.formula} onChange={(e) => setKpiForm({ ...kpiForm, formula: e.target.value })}
                          placeholder="e.g. {total_beds} - {occupied_beds}" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={handleSaveKPI} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                      <Save size={14} /> {editingKPI ? "Update" : "Create"}
                    </button>
                    <button onClick={() => { setShowKPIForm(false); setEditingKPI(null); }} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {kpis.length === 0 && !showKPIForm ? (
                <div className="p-10 text-center text-sm text-gray-400">No KPIs configured. Click "Add KPI" to create one.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {kpis.map((kpi, i) => (
                    <div key={kpi.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-gray-300 w-5">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{kpi.label}</p>
                          <p className="text-xs text-gray-400">
                            {kpi.source_column ? `Column: ${kpi.source_column}` : "No source column"} &middot; {aggregations.find((a) => a.value === kpi.aggregation)?.label || kpi.aggregation}
                            &middot; <span className={kpi.current_value ? "text-green-600 font-medium" : "text-gray-400"}>{kpi.current_value || "—"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => editKPI(kpi)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteKPI(kpi.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-sm text-gray-400">
              Select a module to manage its KPIs
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirm.open}
        title={`Delete ${confirm.type === "module" ? "Module" : "KPI"}`}
        message={`Are you sure you want to delete "${confirm.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirm.type === "module") executeDeleteModule(confirm.id);
          else executeDeleteKPI(confirm.id);
          setConfirm({ open: false, type: "", id: null, label: "" });
        }}
        onCancel={() => setConfirm({ open: false, type: "", id: null, label: "" })}
      />
    </div>
  );
}

const canManageModules = true;
