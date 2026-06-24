import { useState } from "react";

const defaultDepartments = [
  { name: "KSS 1ST FLR CABIN (KSS)", bedStrength: 21 },
  { name: "KSS 2ND FLR CABIN (KSS)", bedStrength: 40 },
  { name: "KSS 3RD FLR CABIN (KSS)", bedStrength: 33 },
  { name: "KSS GENERAL WARD(G -FLR)", bedStrength: 10 },
  { name: "KSS GENERAL WARD 1 ST FLR", bedStrength: 5 },
  { name: "KSS GENERAL WARD 2ND FLR", bedStrength: 8 },
  { name: "KSS GENERAL WARD 3RD FLR", bedStrength: 8 },
  { name: "KSS NEUROLOGY ICU", bedStrength: 10 },
  { name: "KSS MICU", bedStrength: 11 },
  { name: "KSS CICU", bedStrength: 7 },
  { name: "KSS GASTRO ICU", bedStrength: 6 },
  { name: "KSS 3RD FLOOR HDU", bedStrength: 7 },
  { name: "KSS SICU", bedStrength: 9 },
  { name: "KSS CTVS ICU", bedStrength: 7 },
  { name: "KCC 1ST FLR IP WARD", bedStrength: 21 },
  { name: "KCC 1ST FLR IP WARD -2", bedStrength: 18 },
  { name: "KCC 3RD FLR CABIN", bedStrength: 22 },
  { name: "KCC 4TH FLR CABIN", bedStrength: 4 },
  { name: "KCC ICU", bedStrength: 14 },
  { name: "KCC HDU", bedStrength: 6 },
  { name: "D1 GENERAL WARD(ONCO)", bedStrength: 30 },
  { name: "D 2 GENERAL WARD(GASTRO)", bedStrength: 30 },
  { name: "KCC 3RD FLOOR THERAPY WARD", bedStrength: 2 },
  { name: "PBSS CABIN 4TH FLR", bedStrength: 16 },
  { name: "TRANSPLANT ICU", bedStrength: 6 },
];

function createRow(dept) {
  return { ...dept, total: "", admission: "", transIn: "", transOut: "", discharge: "", death: "", tr: "" };
}

export default function MidnightCensusForm() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [summary, setSummary] = useState({
    totalAdmission: "",
    totalDischarge: "",
    totalOPD: "",
    totalOT: "",
    petCT: "",
    totalDialysis: "",
    totalCathLab: "",
    totalOncoDaycare: "",
    gastroOT: "",
    totalRadiationTherapy: "",
    gamma: "",
    brachyTherapy: "",
    ctStimulation: "",
    totalEmergencyVisit: "",
    previousOccupancy: "",
    currentPatient: "",
    death: "",
    totalEmerAdmission: "",
  });
  const [rows, setRows] = useState(defaultDepartments.map(createRow));
  const [signature1, setSignature1] = useState("");
  const [signature2, setSignature2] = useState("");
  const [showReport, setShowReport] = useState(false);

  const updateSummary = (field, value) => {
    setSummary((prev) => ({ ...prev, [field]: value }));
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow({ name: "", bedStrength: "" })]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + (Number(r.total) || 0),
      admission: acc.admission + (Number(r.admission) || 0),
      transIn: acc.transIn + (Number(r.transIn) || 0),
      transOut: acc.transOut + (Number(r.transOut) || 0),
      discharge: acc.discharge + (Number(r.discharge) || 0),
      death: acc.death + (Number(r.death) || 0),
      tr: acc.tr + (Number(r.tr) || 0),
      bedStrength: acc.bedStrength + (Number(r.bedStrength) || 0),
    }),
    { total: 0, admission: 0, transIn: 0, transOut: 0, discharge: 0, death: 0, tr: 0, bedStrength: 0 }
  );

  const handlePrint = () => {
    window.print();
  };

  if (showReport) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">KSSCC MIDNIGHT CENSUS</h1>
            <p className="text-lg">DATE: {date || "__________"}</p>
          </div>

          <div className="border border-black p-4 mb-6 text-sm">
            <div className="grid grid-cols-5 gap-4 mb-3">
              <div>TOTAL ADMISSION: <strong>{summary.totalAdmission || "—"}</strong></div>
              <div>TOTAL DISCHARGE: <strong>{summary.totalDischarge || "—"}</strong></div>
              <div>TOTAL OPD: <strong>{summary.totalOPD || "—"}</strong></div>
              <div>TOTAL OT: <strong>{summary.totalOT || "—"}</strong></div>
              <div>PET CT: <strong>{summary.petCT || "—"}</strong></div>
            </div>
            <div className="grid grid-cols-5 gap-4 mb-3">
              <div>TOTAL DIALYSIS: <strong>{summary.totalDialysis || "—"}</strong></div>
              <div>TOTAL CATH LAB: <strong>{summary.totalCathLab || "—"}</strong></div>
              <div>TOTAL ONCO DAYCARE: <strong>{summary.totalOncoDaycare || "—"}</strong></div>
              <div>GASTRO-OT: <strong>{summary.gastroOT || "—"}</strong></div>
              <div>TOTAL RADIATION THERAPY: <strong>{summary.totalRadiationTherapy || "—"}</strong></div>
            </div>
            <div className="grid grid-cols-5 gap-4 mb-3">
              <div>GAMMA: <strong>{summary.gamma || "—"}</strong></div>
              <div>BRACHY-THERAPY: <strong>{summary.brachyTherapy || "—"}</strong></div>
              <div>CT STIMULATION: <strong>{summary.ctStimulation || "—"}</strong></div>
              <div>TOTAL EMERGENCY VISIT: <strong>{summary.totalEmergencyVisit || "—"}</strong></div>
              <div></div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div>PREVIOUS OCCUPANCY: <strong>{summary.previousOccupancy || "—"}</strong></div>
              <div>CURRENT PATIENT: <strong>{summary.currentPatient || "—"}</strong></div>
              <div>DEATH: <strong>{summary.death || "—"}</strong></div>
              <div>TOTAL EMER ADMISSION: <strong>{summary.totalEmerAdmission || "—"}</strong></div>
              <div></div>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-xs mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-2 py-1">SL NO</th>
                <th className="border border-black px-2 py-1">DEPARTMENT</th>
                <th className="border border-black px-2 py-1">BED STRENGTH</th>
                <th className="border border-black px-2 py-1">TOTAL</th>
                <th className="border border-black px-2 py-1">ADMISSION</th>
                <th className="border border-black px-2 py-1">TRANS-IN</th>
                <th className="border border-black px-2 py-1">TRANS OUT</th>
                <th className="border border-black px-2 py-1">DISCHARGE</th>
                <th className="border border-black px-2 py-1">DEATH</th>
                <th className="border border-black px-2 py-1">T/R</th>
                <th className="border border-black px-2 py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-black px-2 py-1">{row.name}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.bedStrength}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.total || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.admission || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.transIn || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.transOut || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.discharge || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.death || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right">{row.tr || "—"}</td>
                  <td className="border border-black px-2 py-1 text-right font-bold">{row.tr || "—"}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-black px-2 py-1" colSpan={2}>TOTAL</td>
                <td className="border border-black px-2 py-1 text-right">{totals.bedStrength}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.total}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.admission}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.transIn}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.transOut}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.discharge}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.death}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.tr}</td>
                <td className="border border-black px-2 py-1 text-right">{totals.tr}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-sm mb-6">KCC TRANSIT BED - 51 (PHYSICALLY PATIENT ARE NOT PRESENT)</p>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div className="text-center">
              <p className="font-semibold">SIGN OF NIGHT SUPERVISER</p>
              <div className="mt-8 border-t border-black pt-2">{signature1}</div>
            </div>
            <div className="text-center">
              <p className="font-semibold">SIGN OF NIGHT SUPERVISER</p>
              <div className="mt-8 border-t border-black pt-2">{signature2}</div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8 no-print">
            <button onClick={() => setShowReport(false)} className="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700">Edit</button>
            <button onClick={handlePrint} className="rounded-lg bg-green-700 px-6 py-2 text-white hover:bg-green-800">Print</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-50 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-2">KSSCC Midnight Census</h1>
        <p className="text-gray-600 mb-6">Fill in the details and generate the midnight census report.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-48" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Summary Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <InputField label="Total Admission" value={summary.totalAdmission} onChange={(v) => updateSummary("totalAdmission", v)} />
            <InputField label="Total Discharge" value={summary.totalDischarge} onChange={(v) => updateSummary("totalDischarge", v)} />
            <InputField label="Total OPD" value={summary.totalOPD} onChange={(v) => updateSummary("totalOPD", v)} />
            <InputField label="Total OT" value={summary.totalOT} onChange={(v) => updateSummary("totalOT", v)} />
            <InputField label="PET CT" value={summary.petCT} onChange={(v) => updateSummary("petCT", v)} />
            <InputField label="Total Dialysis" value={summary.totalDialysis} onChange={(v) => updateSummary("totalDialysis", v)} />
            <InputField label="Total Cath Lab" value={summary.totalCathLab} onChange={(v) => updateSummary("totalCathLab", v)} />
            <InputField label="Total Onco Daycare" value={summary.totalOncoDaycare} onChange={(v) => updateSummary("totalOncoDaycare", v)} />
            <InputField label="Gastro-OT" value={summary.gastroOT} onChange={(v) => updateSummary("gastroOT", v)} />
            <InputField label="Total Radiation Therapy" value={summary.totalRadiationTherapy} onChange={(v) => updateSummary("totalRadiationTherapy", v)} />
            <InputField label="Gamma" value={summary.gamma} onChange={(v) => updateSummary("gamma", v)} />
            <InputField label="Brachy-Therapy" value={summary.brachyTherapy} onChange={(v) => updateSummary("brachyTherapy", v)} />
            <InputField label="CT Stimulation" value={summary.ctStimulation} onChange={(v) => updateSummary("ctStimulation", v)} />
            <InputField label="Total Emergency Visit" value={summary.totalEmergencyVisit} onChange={(v) => updateSummary("totalEmergencyVisit", v)} />
            <InputField label="Previous Occupancy" value={summary.previousOccupancy} onChange={(v) => updateSummary("previousOccupancy", v)} />
            <InputField label="Current Patient" value={summary.currentPatient} onChange={(v) => updateSummary("currentPatient", v)} />
            <InputField label="Death" value={summary.death} onChange={(v) => updateSummary("death", v)} />
            <InputField label="Total Emer Admission" value={summary.totalEmerAdmission} onChange={(v) => updateSummary("totalEmerAdmission", v)} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Department-wise Occupancy</h2>
            <button onClick={addRow} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">+ Add Row</button>
          </div>
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-green-50">
                <th className="p-2 text-left text-xs font-bold text-green-800">SL NO</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">DEPARTMENT</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">BED STRENGTH</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">TOTAL</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">ADMISSION</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">TRANS-IN</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">TRANS OUT</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">DISCHARGE</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">DEATH</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">T/R</th>
                <th className="p-2 text-left text-xs font-bold text-green-800">TOTAL</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-1">{i + 1}</td>
                  <td className="p-1">
                    <input value={row.name} onChange={(e) => updateRow(i, "name", e.target.value)}
                      className="w-48 rounded border border-gray-200 px-2 py-1 text-sm" />
                  </td>
                  <td className="p-1"><input type="number" value={row.bedStrength} onChange={(e) => updateRow(i, "bedStrength", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.total} onChange={(e) => updateRow(i, "total", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.admission} onChange={(e) => updateRow(i, "admission", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.transIn} onChange={(e) => updateRow(i, "transIn", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.transOut} onChange={(e) => updateRow(i, "transOut", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.discharge} onChange={(e) => updateRow(i, "discharge", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.death} onChange={(e) => updateRow(i, "death", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1"><input type="number" value={row.tr} onChange={(e) => updateRow(i, "tr", e.target.value)} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm" /></td>
                  <td className="p-1 font-bold text-right">{row.tr || "—"}</td>
                  <td className="p-1">
                    <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 font-bold">
                <td className="p-2" colSpan={2}>TOTAL</td>
                <td className="p-2">{totals.bedStrength}</td>
                <td className="p-2">{totals.total}</td>
                <td className="p-2">{totals.admission}</td>
                <td className="p-2">{totals.transIn}</td>
                <td className="p-2">{totals.transOut}</td>
                <td className="p-2">{totals.discharge}</td>
                <td className="p-2">{totals.death}</td>
                <td className="p-2">{totals.tr}</td>
                <td className="p-2">{totals.tr}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Night Supervisor Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Sign of Night Supervisor 1</label>
              <input value={signature1} onChange={(e) => setSignature1(e.target.value)}
                placeholder="Enter name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Sign of Night Supervisor 2</label>
              <input value={signature2} onChange={(e) => setSignature2(e.target.value)}
                placeholder="Enter name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={() => setShowReport(true)}
            className="rounded-lg bg-green-700 px-8 py-3 text-lg font-semibold text-white shadow hover:bg-green-800">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
    </div>
  );
}
