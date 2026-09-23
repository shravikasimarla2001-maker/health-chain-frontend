import React, { useState } from 'react';
import {
  Settings,
  Save,
  Sliders,
  CheckCircle2,
  ShieldAlert,
  Thermometer,
  Calendar,
  Package,
  Building,
  Plus,
  Trash2,
  Globe2,
} from 'lucide-react';

interface DrugMasterItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  minThreshold: number;
}

const INITIAL_DRUG_MASTER: DrugMasterItem[] = [
  { id: 'dm-1', code: 'DRUG-PCM-500', name: 'Paracetamol 500mg Tablets', category: 'Analgesic', unit: 'Tablets', minThreshold: 1000 },
  { id: 'dm-2', code: 'DRUG-AMX-500', name: 'Amoxicillin 500mg Capsules', category: 'Antibiotic', unit: 'Capsules', minThreshold: 500 },
  { id: 'dm-3', code: 'DRUG-INS-REG', name: 'Human Insulin Regular 100IU/ml', category: 'Endocrine', unit: 'Vials', minThreshold: 200 },
  { id: 'dm-4', code: 'DRUG-ORS-SCH', name: 'Oral Rehydration Salts (ORS)', category: 'Essential Supplies', unit: 'Sachets', minThreshold: 800 },
  { id: 'dm-5', code: 'DRUG-VAC-BCG', name: 'BCG Vaccine (Tuberculosis)', category: 'Vaccine / Cold Chain', unit: 'Doses', minThreshold: 300 },
];

export const SystemSettings: React.FC = () => {
  const [minBufferDays, setMinBufferDays] = useState(14);
  const [emergencyBufferDays, setEmergencyBufferDays] = useState(3);
  const [coldChainMinTemp, setColdChainMinTemp] = useState(2);
  const [coldChainMaxTemp, setColdChainMaxTemp] = useState(8);
  const [expiryWarningDays, setExpiryWarningDays] = useState(60);
  const [flMinQuorum, setFlMinQuorum] = useState(75);

  const [drugs, setDrugs] = useState<DrugMasterItem[]>(INITIAL_DRUG_MASTER);
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugCode, setNewDrugCode] = useState('');
  const [newDrugCategory, setNewDrugCategory] = useState('Analgesic');

  const [appliedToAll, setAppliedToAll] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleApplyToAllPhcs = () => {
    setAppliedToAll(true);
    setTimeout(() => setAppliedToAll(false), 3500);
  };

  const handleAddDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugName || !newDrugCode) return;
    const newItem: DrugMasterItem = {
      id: `dm-${Date.now()}`,
      code: newDrugCode.toUpperCase(),
      name: newDrugName,
      category: newDrugCategory,
      unit: 'Units',
      minThreshold: 500,
    };
    setDrugs([...drugs, newItem]);
    setNewDrugName('');
    setNewDrugCode('');
  };

  const handleDeleteDrug = (id: string) => {
    setDrugs(drugs.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="system-settings-screen">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300 border border-purple-700/50">
              L0 — Super Admin Settings
            </span>
            <span className="text-xs text-slate-400">Global Configuration & Master Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">Global Settings & Master Catalogs</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Configure platform safety thresholds, master drug catalogs, facility masters, and propagate settings to all PHCs nationwide.
          </p>
        </div>

        <button
          type="button"
          onClick={handleApplyToAllPhcs}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Globe2 className="w-4 h-4" />
          Apply to All PHCs
        </button>
      </div>

      {appliedToAll && (
        <div className="p-4 bg-purple-950/80 border border-purple-700/60 rounded-xl text-purple-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>
              <strong>Global Rules Applied!</strong> Master settings & safety thresholds successfully pushed to all 16,190 PHC facilities.
            </span>
          </div>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          System settings saved and synchronized across edge clusters.
        </div>
      )}

      {/* Drug Master Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Package className="w-4 h-4 text-purple-400" />
          National Drug Master Catalog
        </h2>

        {/* Add New Master Drug Form */}
        <form onSubmit={handleAddDrug} className="p-4 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            placeholder="Drug Code (e.g. DRUG-AZI-250)"
            value={newDrugCode}
            onChange={(e) => setNewDrugCode(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="Drug Name (e.g. Azithromycin 250mg)"
            value={newDrugName}
            onChange={(e) => setNewDrugName(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
          />
          <select
            value={newDrugCategory}
            onChange={(e) => setNewDrugCategory(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="Analgesic">Analgesic</option>
            <option value="Antibiotic">Antibiotic</option>
            <option value="Endocrine">Endocrine</option>
            <option value="Essential Supplies">Essential Supplies</option>
            <option value="Vaccine / Cold Chain">Vaccine / Cold Chain</option>
          </select>
          <button
            type="submit"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold flex items-center justify-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add to Catalog
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Drug Code</th>
                <th className="py-2.5 px-3">Drug Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Standard Unit</th>
                <th className="py-2.5 px-3">Min Safety Threshold</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {drugs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-100">{d.code}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium">{d.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{d.category}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300">{d.unit}</td>
                  <td className="py-2.5 px-3 font-mono text-purple-300 font-bold">{d.minThreshold}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteDrug(d.id)}
                      className="p-1 hover:bg-red-950 text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thresholds Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4 text-purple-400" />
            Inventory & Safety Buffer Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Standard Safety Stock Buffer (Days)</label>
              <input
                type="number"
                value={minBufferDays}
                onChange={(e) => setMinBufferDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Facilities below this enter 🟡 Reorder status.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Critical Emergency Threshold (Days)</label>
              <input
                type="number"
                value={emergencyBufferDays}
                onChange={(e) => setEmergencyBufferDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Facilities below this trigger 🔴 Critical Stock-out alert.</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            Cold Chain & Storage Limits (°C)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Minimum Safe Temperature (°C)</label>
              <input
                type="number"
                value={coldChainMinTemp}
                onChange={(e) => setColdChainMinTemp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Maximum Safe Temperature (°C)</label>
              <input
                type="number"
                value={coldChainMaxTemp}
                onChange={(e) => setColdChainMaxTemp(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleApplyToAllPhcs}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Globe2 className="w-4 h-4" />
            Apply Settings to All PHCs
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
