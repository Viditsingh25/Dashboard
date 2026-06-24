import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchModules, fetchKPIs, computeKPIs } from "../lib/api";
import { useToastStore } from "../stores/toastStore";

export default function useModuleKPIs(moduleName) {
  const toast = useToastStore((s) => s);
  const [moduleId, setModuleId] = useState(null);
  const [module, setModule] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mods = await fetchModules();
        const mod = mods.find((m) => m.name === moduleName);
        if (mod) {
          setModule(mod);
          setModuleId(mod.id);
          const list = await fetchKPIs(mod.id);
          setKpis(list);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [moduleName]);

  const kpiMap = useMemo(() => {
    const map = {};
    for (const k of kpis) map[k.name] = k.current_value || k.default_value || "";
    return map;
  }, [kpis]);

  const getVal = useCallback((name, fallback = "—") => kpiMap[name] || fallback, [kpiMap]);

  const handleDataLoaded = useCallback(async (rows) => {
    if (!moduleId) return;
    try {
      const updated = await computeKPIs(moduleId, rows);
      setKpis((prev) => prev.map((k) => {
        const match = updated.find((u) => u.id === k.id);
        return match ? { ...k, current_value: match.value } : k;
      }));
      toast.success("KPIs updated from uploaded data");
    } catch (err) {
      toast.error(err.message);
    }
  }, [moduleId, toast]);

  return { module, kpis, kpiMap, getVal, handleDataLoaded, loaded };
}
