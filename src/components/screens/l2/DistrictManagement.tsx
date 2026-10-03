import React from 'react';
import { Building2, Server, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { resolveUserState, getDistrictsForState } from '../../../data/geoConstants';
import { useAuth } from '../../../context/AuthContext';

export const DistrictManagement: React.FC = () => {
  const { user } = useAuth();
  const stateGeo = resolveUserState(user);
  const stateDistricts = getDistrictsForState(stateGeo.id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="district-management-screen">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
            L2 — {stateGeo.name} State
          </span>
          <span className="text-xs text-slate-400">
            Region: {stateGeo.region} &bull; Code: {stateGeo.code}
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          {stateGeo.name} State District Health Clusters & Nodes
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor district health clusters, federated edge node status, and primary health centre facilities operating across {stateDistricts.length} districts in {stateGeo.name} State.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stateDistricts.map((dist) => (
          <div key={dist.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {dist.name} District Health Office
                </span>
                <span className="text-xs text-slate-500 font-mono">{dist.code} &bull; {stateGeo.name} State</span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Connected Facilities:</span>
                <div className="font-semibold text-slate-200 mt-0.5">{dist.phcs.length} PHCs</div>
              </div>
              <div>
                <span className="text-slate-500">Headquarters:</span>
                <div className="font-semibold text-slate-200 mt-0.5">{dist.headquarters || dist.name}</div>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              <span className="text-slate-500">Registered PHC Facilities: </span>
              <span className="text-slate-300 font-medium">
                {dist.phcs.map((p) => p.name).join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistrictManagement;
