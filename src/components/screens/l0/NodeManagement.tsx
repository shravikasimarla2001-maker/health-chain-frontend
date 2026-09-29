import React, { useState, useMemo } from 'react';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Building,
  Radio,
  Cpu,
  X,
  KeyRound,
  Check,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ALL_STATES,
  ALL_DISTRICTS,
  ALL_PHCS,
  getDistrictsForState,
  getPhcsForDistrict,
  StateGeo,
  DistrictGeo,
  PhcGeo,
} from '../../../data/geoConstants';
import { useLanguage } from '../../../context/LanguageContext';

export interface EdgeNode {
  id: string;
  name: string;
  tier: 'STATE' | 'DISTRICT' | 'PHC';
  stateId: string;
  stateName: string;
  districtId?: string;
  districtName?: string;
  phcId?: string;
  phcName?: string;
  ipAddress: string;
  status: 'ONLINE' | 'STANDBY' | 'PENDING_APPROVAL';
  lastHeartbeat: string;
  dataFreshness: string;
  modelAccuracy: number;
  hardwareProfile?: string;
}

const INITIAL_NODES: EdgeNode[] = [
  {
    id: 'node-jh-state',
    name: 'Jharkhand State Aggregator Node',
    tier: 'STATE',
    stateId: ALL_STATES[0]?.id || 'state-jh',
    stateName: 'Jharkhand',
    ipAddress: '10.14.0.12',
    status: 'ONLINE',
    lastHeartbeat: '12s ago',
    dataFreshness: '2 mins ago',
    modelAccuracy: 93.8,
    hardwareProfile: 'Dell PowerEdge R750 (2x Xeon Gold, 128GB RAM)',
  },
  {
    id: 'node-jh-ran',
    name: 'Ranchi District Edge Node',
    tier: 'DISTRICT',
    stateId: ALL_STATES[0]?.id || 'state-jh',
    stateName: 'Jharkhand',
    districtId: ALL_STATES[0]?.districts[0]?.id || 'dist-ran',
    districtName: 'Ranchi',
    ipAddress: '10.14.1.20',
    status: 'ONLINE',
    lastHeartbeat: '8s ago',
    dataFreshness: '1 min ago',
    modelAccuracy: 92.4,
    hardwareProfile: 'Advantech MIC-770 V2 (i7-10700E, 32GB RAM)',
  },
  {
    id: 'node-jh-ran-orm',
    name: 'Ormanjhi PHC Local Edge Gateway',
    tier: 'PHC',
    stateId: ALL_STATES[0]?.id || 'state-jh',
    stateName: 'Jharkhand',
    districtId: ALL_STATES[0]?.districts[0]?.id || 'dist-ran',
    districtName: 'Ranchi',
    phcId: ALL_STATES[0]?.districts[0]?.phcs[0]?.id || 'phc-orm',
    phcName: 'Ormanjhi PHC',
    ipAddress: '192.168.12.5',
    status: 'ONLINE',
    lastHeartbeat: '4s ago',
    dataFreshness: '30s ago',
    modelAccuracy: 94.6,
    hardwareProfile: 'NVIDIA Jetson Orin Nano (8GB)',
  },
  {
    id: 'node-jh-ran-kan',
    name: 'Kanke PHC Local Edge Gateway',
    tier: 'PHC',
    stateId: ALL_STATES[0]?.id || 'state-jh',
    stateName: 'Jharkhand',
    districtId: ALL_STATES[0]?.districts[0]?.id || 'dist-ran',
    districtName: 'Ranchi',
    phcId: ALL_STATES[0]?.districts[0]?.phcs[1]?.id || 'phc-kan',
    phcName: 'Kanke PHC',
    ipAddress: '192.168.12.18',
    status: 'ONLINE',
    lastHeartbeat: '18s ago',
    dataFreshness: '4 mins ago',
    modelAccuracy: 91.8,
    hardwareProfile: 'NVIDIA Jetson Orin Nano (8GB)',
  },
  {
    id: 'node-jh-ram',
    name: 'Ramgarh District Edge Node',
    tier: 'DISTRICT',
    stateId: ALL_STATES[0]?.id || 'state-jh',
    stateName: 'Jharkhand',
    districtId: ALL_STATES[0]?.districts[1]?.id || 'dist-ram',
    districtName: 'Ramgarh',
    ipAddress: '10.14.3.40',
    status: 'STANDBY',
    lastHeartbeat: '45s ago',
    dataFreshness: '12 mins ago',
    modelAccuracy: 90.5,
    hardwareProfile: 'HPE Edgeline EL300 (4C Xeon E3)',
  },
  {
    id: 'node-mh-state',
    name: 'Maharashtra State Hub Node',
    tier: 'STATE',
    stateId: ALL_STATES[1]?.id || 'state-mh',
    stateName: 'Maharashtra',
    ipAddress: '10.20.0.15',
    status: 'ONLINE',
    lastHeartbeat: '6s ago',
    dataFreshness: '1 min ago',
    modelAccuracy: 95.1,
    hardwareProfile: 'Dell PowerEdge R750 (2x Xeon Gold, 256GB RAM)',
  },
  {
    id: 'node-mh-nag',
    name: 'Nagpur District Edge Node',
    tier: 'DISTRICT',
    stateId: ALL_STATES[1]?.id || 'state-mh',
    stateName: 'Maharashtra',
    districtId: ALL_STATES[1]?.districts[0]?.id || 'dist-nag',
    districtName: 'Nagpur',
    ipAddress: '10.20.1.33',
    status: 'ONLINE',
    lastHeartbeat: '10s ago',
    dataFreshness: '3 mins ago',
    modelAccuracy: 93.2,
    hardwareProfile: 'Advantech MIC-770 V2 (i7-10700E, 32GB RAM)',
  },
  {
    id: 'node-mh-pun-hav',
    name: 'Haveli PHC Local Edge Gateway',
    tier: 'PHC',
    stateId: ALL_STATES[1]?.id || 'state-mh',
    stateName: 'Maharashtra',
    districtId: ALL_STATES[1]?.districts[1]?.id || 'dist-pun',
    districtName: 'Pune',
    phcId: ALL_STATES[1]?.districts[1]?.phcs[0]?.id || 'phc-hav',
    phcName: 'Haveli PHC',
    ipAddress: '192.168.14.8',
    status: 'PENDING_APPROVAL',
    lastHeartbeat: '2m ago',
    dataFreshness: 'Pending mTLS validation',
    modelAccuracy: 89.2,
    hardwareProfile: 'Raspberry Pi 4 CM4 (8GB RAM)',
  },
];

export const NodeManagement: React.FC = () => {
  const { t } = useLanguage();
  const [nodes, setNodes] = useState<EdgeNode[]>(INITIAL_NODES);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'STATE' | 'DISTRICT' | 'PHC'>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');

  // Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newTier, setNewTier] = useState<'STATE' | 'DISTRICT' | 'PHC'>('PHC');
  const [selectedStateId, setSelectedStateId] = useState<string>(ALL_STATES[0]?.id || '');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    ALL_STATES[0]?.districts[0]?.id || ''
  );
  const [selectedPhcId, setSelectedPhcId] = useState<string>(
    ALL_STATES[0]?.districts[0]?.phcs[0]?.id || ''
  );
  const [nodeCustomName, setNodeCustomName] = useState('');
  const [nodeIp, setNodeIp] = useState('192.168.10.15');
  const [hardwareProfile, setHardwareProfile] = useState('NVIDIA Jetson Orin Nano (8GB)');
  const [registrationSuccessMsg, setRegistrationSuccessMsg] = useState<{
    nodeName: string;
    token: string;
    ip: string;
  } | null>(null);

  // Cascading lists for the registration form
  const availableDistricts = useMemo(() => {
    return getDistrictsForState(selectedStateId);
  }, [selectedStateId]);

  const availablePhcs = useMemo(() => {
    return getPhcsForDistrict(selectedDistrictId);
  }, [selectedDistrictId]);

  // When state changes in registration form
  const handleFormStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    const dists = getDistrictsForState(stateId);
    if (dists.length > 0) {
      setSelectedDistrictId(dists[0].id);
      const phcs = dists[0].phcs || [];
      if (phcs.length > 0) {
        setSelectedPhcId(phcs[0].id);
      }
    }
  };

  // When district changes in registration form
  const handleFormDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const phcs = getPhcsForDistrict(districtId);
    if (phcs.length > 0) {
      setSelectedPhcId(phcs[0].id);
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchSearch =
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.id.toLowerCase().includes(search.toLowerCase()) ||
        n.ipAddress.includes(search) ||
        n.stateName.toLowerCase().includes(search.toLowerCase()) ||
        (n.districtName && n.districtName.toLowerCase().includes(search.toLowerCase())) ||
        (n.phcName && n.phcName.toLowerCase().includes(search.toLowerCase()));

      const matchTier = tierFilter === 'ALL' || n.tier === tierFilter;
      const matchState = stateFilter === 'ALL' || n.stateId === stateFilter || n.stateName === stateFilter;
      const matchDistrict =
        districtFilter === 'ALL' || n.districtId === districtFilter || n.districtName === districtFilter;

      return matchSearch && matchTier && matchState && matchDistrict;
    });
  }, [nodes, search, tierFilter, stateFilter, districtFilter]);

  const handleApprove = (id: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'ONLINE', dataFreshness: 'Active' } : n))
    );
  };

  const handleRegisterNode = (e: React.FormEvent) => {
    e.preventDefault();
    const stateObj = ALL_STATES.find((s) => s.id === selectedStateId);
    const stateName = stateObj?.name || 'Unknown State';
    const districtObj = availableDistricts.find((d) => d.id === selectedDistrictId);
    const districtName = districtObj?.name;
    const phcObj = availablePhcs.find((p) => p.id === selectedPhcId);
    const phcName = phcObj?.name;

    let computedName = nodeCustomName.trim();
    if (!computedName) {
      if (newTier === 'STATE') computedName = `${stateName} State Hub Node`;
      else if (newTier === 'DISTRICT') computedName = `${districtName} District Edge Node`;
      else computedName = `${phcName || 'Facility'} Local Edge Gateway`;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `node-${newTier.toLowerCase()}-${randomSuffix}`;
    const generatedToken = `HSC-EDGE-${newTier}-${randomSuffix}-mTLS-TOKEN`;

    const newNode: EdgeNode = {
      id: generatedId,
      name: computedName,
      tier: newTier,
      stateId: selectedStateId,
      stateName,
      districtId: newTier !== 'STATE' ? selectedDistrictId : undefined,
      districtName: newTier !== 'STATE' ? districtName : undefined,
      phcId: newTier === 'PHC' ? selectedPhcId : undefined,
      phcName: newTier === 'PHC' ? phcName : undefined,
      ipAddress: nodeIp,
      status: 'ONLINE',
      lastHeartbeat: 'Just now',
      dataFreshness: 'Just registered',
      modelAccuracy: 92.0,
      hardwareProfile,
    };

    setNodes([newNode, ...nodes]);
    setIsRegisterOpen(false);
    setNodeCustomName('');
    setRegistrationSuccessMsg({
      nodeName: computedName,
      token: generatedToken,
      ip: nodeIp,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="node-management-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            {t('nodes.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('nodes.subtitle')} ({ALL_STATES.length} States, {ALL_DISTRICTS.length} Districts, {ALL_PHCS.length} PHCs).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRegistrationSuccessMsg(null);
            setIsRegisterOpen(true);
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('nodes.register_btn')}
        </button>
      </div>

      {/* Success Notification Banner */}
      {registrationSuccessMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-300">
                Node Registered Successfully: {registrationSuccessMsg.nodeName}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-1 font-mono flex items-center gap-2">
                <span>mTLS Token: {registrationSuccessMsg.token}</span>
                <span>•</span>
                <span>IP: {registrationSuccessMsg.ip}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRegistrationSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Geographic & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by node name, ID, IP address, state, district, or PHC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
            />
          </div>

          {/* Tier Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs shrink-0">
            {(['ALL', 'STATE', 'DISTRICT', 'PHC'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  tierFilter === t
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'All Tiers' : `${t} Nodes`}
              </button>
            ))}
          </div>
        </div>

        {/* Geographic Dropdowns Filter */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold text-slate-300">Geo Filter:</span>
          </div>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setDistrictFilter('ALL');
            }}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 text-xs"
          >
            <option value="ALL">All States ({ALL_STATES.length})</option>
            {ALL_STATES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.code})
              </option>
            ))}
          </select>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            disabled={stateFilter === 'ALL'}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="ALL">All Districts</option>
            {(stateFilter !== 'ALL' ? getDistrictsForState(stateFilter) : ALL_DISTRICTS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.stateName})
              </option>
            ))}
          </select>

          <span className="ml-auto text-[11px] text-slate-400">
            Showing <strong className="text-slate-200">{filteredNodes.length}</strong> of {nodes.length} registered nodes
          </span>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Node Name & Identifier</th>
                <th className="py-3.5 px-4">Cluster Tier</th>
                <th className="py-3.5 px-4">Geographic Hierarchy (Geo Constants)</th>
                <th className="py-3.5 px-4">Hardware Profile</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Heartbeat</th>
                <th className="py-3.5 px-4">Freshness</th>
                <th className="py-3.5 px-4">FL Local Acc</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No edge computation nodes found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-400" />
                        {node.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {node.id} • {node.ipAddress}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          node.tier === 'STATE'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                            : node.tier === 'DISTRICT'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                            : 'bg-teal-950/60 text-teal-300 border-teal-700/60'
                        }`}
                      >
                        {node.tier} TIER
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">
                        {node.phcName ? node.phcName : node.districtName ? `${node.districtName} District` : `${node.stateName} State`}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {node.phcName
                          ? `${node.districtName}, ${node.stateName}`
                          : node.districtName
                          ? `${node.stateName}`
                          : 'State Level Hub'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[180px] truncate" title={node.hardwareProfile}>
                      {node.hardwareProfile || 'Standard Edge Microserver'}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                          node.status === 'ONLINE'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : node.status === 'STANDBY'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                            : 'bg-purple-950/60 text-purple-300 border-purple-800'
                        }`}
                      >
                        {node.status === 'ONLINE' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {node.status === 'STANDBY' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {node.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{node.lastHeartbeat}</td>

                    <td className="py-3 px-4 text-slate-300 text-[11px]">{node.dataFreshness}</td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-xs">
                      {node.modelAccuracy}%
                    </td>

                    <td className="py-3 px-4 text-right">
                      {node.status === 'PENDING_APPROVAL' ? (
                        <button
                          type="button"
                          onClick={() => handleApprove(node.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Approve mTLS
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs font-medium">Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal using Unified Geo Constants */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                Register New Federated Node (Geo-Linked)
              </h3>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterNode} className="space-y-3.5 text-xs">
              {/* Cluster Tier Selection */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Node Hierarchy Tier *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STATE', 'DISTRICT', 'PHC'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setNewTier(tier)}
                      className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                        newTier === tier
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {tier} Tier
                    </button>
                  ))}
                </div>
              </div>

              {/* Geographic Jurisdictions Dropdowns from geoConstants */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>Geographic Binding (from geoConstants.ts):</span>
                </div>

                {/* State Dropdown (Always shown) */}
                <div>
                  <label className="block text-slate-400 mb-1">State *</label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleFormStateChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                    required
                  >
                    {ALL_STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) — {s.districts.length} Districts
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Dropdown (Shown for District and PHC tiers) */}
                {(newTier === 'DISTRICT' || newTier === 'PHC') && (
                  <div>
                    <label className="block text-slate-400 mb-1">District *</label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => handleFormDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                      required
                    >
                      {availableDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.phcs.length} PHCs registered)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* PHC Dropdown (Shown for PHC tier) */}
                {newTier === 'PHC' && (
                  <div>
                    <label className="block text-slate-400 mb-1">Primary Health Centre (PHC) *</label>
                    <select
                      value={selectedPhcId}
                      onChange={(e) => setSelectedPhcId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                      required
                    >
                      {availablePhcs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — {p.bedCapacity || 20} Beds
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Hardware Profile & IP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">IP Address / Static Hostname *</label>
                  <input
                    type="text"
                    value={nodeIp}
                    onChange={(e) => setNodeIp(e.target.value)}
                    placeholder="192.168.1.10"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 font-mono text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Hardware Profile</label>
                  <select
                    value={hardwareProfile}
                    onChange={(e) => setHardwareProfile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                  >
                    <option value="NVIDIA Jetson Orin Nano (8GB)">NVIDIA Jetson Orin Nano (Edge AI)</option>
                    <option value="Advantech MIC-770 V2 (i7, 32GB)">Advantech MIC-770 (District Hub)</option>
                    <option value="Dell PowerEdge R750 (Xeon, 128GB)">Dell PowerEdge R750 (State Aggregator)</option>
                    <option value="Raspberry Pi 4 CM4 (8GB)">Raspberry Pi 4 CM4 (Sub-Centre / Small PHC)</option>
                  </select>
                </div>
              </div>

              {/* Custom Name Override (Optional) */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Node Custom Label (Optional - auto-named if blank)
                </label>
                <input
                  type="text"
                  value={nodeCustomName}
                  onChange={(e) => setNodeCustomName(e.target.value)}
                  placeholder="e.g. Ranchi Core Analytics Node"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Issue Certificate & Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
