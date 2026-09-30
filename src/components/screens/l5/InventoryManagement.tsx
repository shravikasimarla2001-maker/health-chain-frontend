import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  Plus,
  QrCode,
  Calendar,
  CheckCircle2,
  Trash2,
  Send,
  Building,
  RefreshCw,
  Clock,
  History,
  X,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { healthChainApi } from '../../../services/healthChainApi';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  InventoryItem,
  DrugResponse,
  InventoryBatchResponse,
  StockTransactionResponse,
  WriteOffReasonEnum,
} from '../../../types';

interface InventoryManagementProps {
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[]) => void;
}

const KNOWN_PHCS = [
  { id: '150038ee-f99b-42ea-acb8-656fe0335361', name: 'Ormanjhi PHC (Ranchi)' },
  { id: 'a1b912f5-0abb-4bf9-b88c-8dd73234e33b', name: 'Kanke PHC (Ranchi)' },
  { id: 'a34855ee-eb73-40ff-adba-8f4e990a5b86', name: 'Patratu PHC (Ramgarh)' },
  { id: '46ba4355-9b57-45a4-91c1-a1f8de0f78cb', name: 'Gola PHC (Ramgarh)' },
  { id: 'c7fd5081-6dd9-434b-8217-ed4e48f16c2a', name: 'Hingna PHC (Nagpur)' },
  { id: '5682ba02-a5fd-429a-b6e1-f4de6d99c491', name: 'Kamptee PHC (Nagpur)' },
];

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  inventory = [],
  onUpdateInventory,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const initialFacilityId =
    (user?.scope_id && user.scope_id.length > 10 ? user.scope_id : null) ||
    '150038ee-f99b-42ea-acb8-656fe0335361';

  const [activeFacilityId, setActiveFacilityId] = useState<string>(initialFacilityId);
  const [activeTab, setActiveTab] = useState<'batches' | 'expiring' | 'transactions'>('batches');

  // Backend Data
  const [drugs, setDrugs] = useState<DrugResponse[]>([]);
  const [batches, setBatches] = useState<InventoryBatchResponse[]>([]);
  const [transactions, setTransactions] = useState<StockTransactionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scanning, setScanning] = useState(false);

  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [selectedBatchForAction, setSelectedBatchForAction] = useState<InventoryBatchResponse | null>(null);

  // Receive Form
  const [receiveDrugId, setReceiveDrugId] = useState<string>('');
  const [receiveBatchNo, setReceiveBatchNo] = useState<string>('BATCH-2026-');
  const [receiveQty, setReceiveQty] = useState<number>(500);
  const [receiveExpiry, setReceiveExpiry] = useState<string>('2027-08-31');
  const [isReceiving, setIsReceiving] = useState(false);

  // Dispense Form
  const [dispenseDrugId, setDispenseDrugId] = useState<string>('');
  const [dispenseQty, setDispenseQty] = useState<number>(20);
  const [dispenseReason, setDispenseReason] = useState<string>('OPD prescription dispensing');
  const [dispenseResult, setDispenseResult] = useState<any | null>(null);
  const [isDispensing, setIsDispensing] = useState(false);

  // Write-Off Form
  const [writeOffQty, setWriteOffQty] = useState<number>(10);
  const [writeOffCategory, setWriteOffCategory] = useState<WriteOffReasonEnum>('damaged');
  const [writeOffReason, setWriteOffReason] = useState<string>('Damaged during transit / inspection');
  const [isWritingOff, setIsWritingOff] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Fetch Master Catalog & Facility Batches
  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [fetchedDrugs, fetchedBatches] = await Promise.all([
        healthChainApi.getDrugs(),
        healthChainApi.getFacilityInventory(activeFacilityId),
      ]);
      setDrugs(fetchedDrugs || []);
      setBatches(fetchedBatches || []);
      if (fetchedDrugs?.length > 0 && !receiveDrugId) {
        setReceiveDrugId(fetchedDrugs[0].id);
        setDispenseDrugId(fetchedDrugs[0].id);
      }
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load inventory';
      setFetchError(msg);
      setDrugs([]);
      setBatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFacilityId, receiveDrugId]);

  // Load Transactions when tab opens
  const loadTransactions = useCallback(async () => {
    try {
      const res = await healthChainApi.getStockTransactions(activeFacilityId, { page_size: 50 });
      setTransactions(res?.items ?? []);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transactions';
      setFetchError(msg);
      setTransactions([]);
    }
  }, [activeFacilityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  // Handle Receive Stock
  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveDrugId || !receiveBatchNo || receiveQty <= 0 || !receiveExpiry) return;

    setIsReceiving(true);
    try {
      const res = await healthChainApi.receiveStock(activeFacilityId, {
        drug_id: receiveDrugId,
        batch_number: receiveBatchNo.trim(),
        quantity: Number(receiveQty),
        expiry_date: receiveExpiry,
        received_at: new Date().toISOString(),
      });
      showToast('success', `Stock batch ${res.batch_number} received (${res.quantity} units).`);
      setShowReceiveModal(false);
      setReceiveBatchNo(`BATCH-2026-${Math.floor(100 + Math.random() * 900)}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Stock receive failed';
      showToast('error', msg);
    } finally {
      setIsReceiving(false);
    }
  };

  // Handle Dispense Medicine
  const handleDispenseStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispenseDrugId || dispenseQty <= 0) return;

    setIsDispensing(true);
    try {
      const res = await healthChainApi.dispenseStock(activeFacilityId, {
        drug_id: dispenseDrugId,
        quantity: Number(dispenseQty),
        reason: dispenseReason.trim() || undefined,
      });
      setDispenseResult(res);
      showToast('success', `Dispensed ${res.total_dispensed} units via FEFO. Remaining: ${res.remaining_stock}`);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dispensing failed';
      showToast('error', msg);
    } finally {
      setIsDispensing(false);
    }
  };

  // Handle Write-Off Stock
  const handleWriteOffStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForAction || writeOffQty <= 0 || writeOffReason.length < 5) return;

    setIsWritingOff(true);
    try {
      await healthChainApi.writeOffStock(activeFacilityId, {
        batch_id: selectedBatchForAction.id,
        quantity: Number(writeOffQty),
        reason_category: writeOffCategory,
        reason: writeOffReason,
      });
      showToast('success', `Wrote off ${writeOffQty} units from batch ${selectedBatchForAction.batch_number}.`);
      setShowWriteOffModal(false);
      setSelectedBatchForAction(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Write-off failed';
      showToast('error', msg);
    } finally {
      setIsWritingOff(false);
    }
  };

  // Quick Barcode simulation
  const handleSimulateScan = async () => {
    setScanning(true);
    try {
      if (batches.length > 0) {
        const target = batches[0];
        await healthChainApi.receiveStock(activeFacilityId, {
          drug_id: target.drug_id,
          batch_number: `QR-SCAN-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: 100,
          expiry_date: '2027-12-31',
        });
        showToast('success', `Scanned Barcode: [${target.drug_name || 'Drug'}] +100 units registered.`);
        await loadData();
      } else if (drugs.length > 0) {
        await healthChainApi.receiveStock(activeFacilityId, {
          drug_id: drugs[0].id,
          batch_number: `QR-SCAN-${Math.floor(1000 + Math.random() * 9000)}`,
          quantity: 100,
          expiry_date: '2027-12-31',
        });
        showToast('success', `Scanned Barcode: [${drugs[0].name}] +100 units registered.`);
        await loadData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan simulation failed';
      showToast('error', msg);
    } finally {
      setScanning(false);
    }
  };

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = (b.drug_name || '').toLowerCase().includes(term);
    const batchMatch = (b.batch_number || '').toLowerCase().includes(term);
    const matchesSearch = !term || nameMatch || batchMatch;
    const matchesStatus = statusFilter === 'ALL' || b.status.toUpperCase() === statusFilter;
    if (activeTab === 'expiring') {
      return matchesSearch && (b.days_until_expiry !== undefined ? b.days_until_expiry <= 90 : true);
    }
    return matchesSearch && matchesStatus;
  });

  const totalStockUnits = batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
  const expiringCount = batches.filter((b) => (b.days_until_expiry ?? 999) <= 90).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10" id="inventory-management-screen">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-400" />
            {t('inventory.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('inventory.subtitle')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={refreshing}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {t('action.refresh')}
          </button>
          {/*
          <button
            type="button"
            onClick={handleSimulateScan}
            disabled={scanning}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-400" />
            {scanning ? t('action.loading') : 'Scan Intake'}
          </button>
          */}
          <button
            type="button"
            onClick={() => {
              setDispenseResult(null);
              setShowDispenseModal(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            {t('inventory.dispense_btn')}
          </button>
          <button
            type="button"
            onClick={() => setShowReceiveModal(true)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('inventory.receive_btn')}
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">
              Failed to load inventory data
            </div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="text-rose-300 hover:text-rose-100 text-[11px] font-semibold px-2 py-1 rounded border border-rose-700/60 hover:bg-rose-900/40 transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setFetchError(null)}
            className="text-rose-300 hover:text-rose-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Facility Switcher & Live Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Building className="w-3.5 h-3.5 text-teal-400" />
            <span>Target Facility:</span>
          </div>
          <select
            value={activeFacilityId}
            onChange={(e) => setActiveFacilityId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            {KNOWN_PHCS.map((phc) => (
              <option key={phc.id} value={phc.id}>
                {phc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Total Batches:</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{batches.length}</div>
          <div className="text-[11px] text-teal-400 mt-0.5">
            {totalStockUnits.toLocaleString()} total units
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Master Drugs:</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{drugs.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Approved formulary catalog</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Expiring in 90D:</span>
          <div
            className={`text-2xl font-bold mt-1 ${
              expiringCount > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {expiringCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">FEFO prioritized dispatch</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'batches'
              ? 'bg-teal-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          {t('inventory.batches_tab')} ({batches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'expiring'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t('inventory.expiring_tab')} ({expiringCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          {t('inventory.ledger_tab')}
        </button>
      </div>

      {/* Search and Filters for Batches */}
      {activeTab !== 'transactions' && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`${t('action.search')} drug name or batch number...`}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">🟢 Active</option>
              <option value="EXPIRED">🔴 Expired</option>
              <option value="QUARANTINED">🟡 Quarantined</option>
              <option value="DEPLETED">⚪ Depleted</option>
            </select>
          </div>
        </div>
      )}

      {/* Tab: Batches / Expiring Table */}
      {activeTab !== 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Drug &amp; Catalog ID</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Quantity in Stock</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Days Left</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                      Loading facility inventory batches...
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {fetchError
                        ? 'Unable to load batches. Please retry.'
                        : 'No medicine batches recorded for this facility yet. Click "Receive Stock" to add stock.'}
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const daysLeft = batch.days_until_expiry ?? 999;
                    const isExpiring = daysLeft <= 90;

                    return (
                      <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-100">
                          <div>{batch.drug_name || 'Medicine'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{batch.drug_id}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                          {batch.batch_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 text-sm">
                            {batch.quantity.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {batch.expiry_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              daysLeft < 30
                                ? 'bg-red-950/70 border-red-800 text-red-300'
                                : isExpiring
                                ? 'bg-amber-950/70 border-amber-800 text-amber-300'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${
                              batch.status === 'active'
                                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-400'
                                : batch.status === 'expired'
                                ? 'bg-red-950/70 border-red-800 text-red-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {batch.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {batch.received_at
                            ? new Date(batch.received_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBatchForAction(batch);
                              setWriteOffQty(Math.min(batch.quantity, 10));
                              setShowWriteOffModal(true);
                            }}
                            className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 rounded text-xs transition"
                            title="Write off batch"
                          >
                            Write-Off
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transactions Ledger */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Quantity Changed</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No stock transactions recorded yet for this facility.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                            tx.transaction_type === 'receive'
                              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                              : tx.transaction_type === 'dispense'
                              ? 'bg-blue-950/70 border-blue-800 text-blue-300'
                              : 'bg-red-950/70 border-red-800 text-red-300'
                          }`}
                        >
                          {tx.transaction_type === 'receive' && (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {tx.transaction_type === 'dispense' && (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          {tx.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {tx.drug_name || tx.drug_id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-100">
                        {tx.transaction_type === 'receive'
                          ? `+${tx.quantity}`
                          : `-${tx.quantity}`}
                      </td>
                      <td className="py-3 px-4 font-mono text-teal-300">
                        {tx.balance_after}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {tx.reason || 'Routine operation'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                        {tx.recorded_by}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Receive Stock */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                Receive Stock Batch (POST /inventory/facility/receive)
              </h3>
              <button
                type="button"
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Select Medicine *
                </label>
                <select
                  value={receiveDrugId}
                  onChange={(e) => setReceiveDrugId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                  required
                >
                  {drugs.length === 0 ? (
                    <option value="">No drugs available in catalog</option>
                  ) : (
                    drugs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category}, {d.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Batch Number * (Alphanumeric)
                  </label>
                  <input
                    type="text"
                    value={receiveBatchNo}
                    onChange={(e) => setReceiveBatchNo(e.target.value)}
                    placeholder="BATCH-2026-X1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Quantity Received * (&gt; 0)
                  </label>
                  <input
                    type="number"
                    value={receiveQty}
                    onChange={(e) => setReceiveQty(Number(e.target.value))}
                    min={1}
                    max={1000000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Expiry Date * (Strictly Future Date)
                </label>
                <input
                  type="date"
                  value={receiveExpiry}
                  onChange={(e) => setReceiveExpiry(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReceiving}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isReceiving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isReceiving ? 'Receiving...' : 'Record Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dispense Medicine */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Dispense Medicine via FEFO (POST /dispense)
              </h3>
              <button
                type="button"
                onClick={() => setShowDispenseModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispenseStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Select Medicine *
                </label>
                <select
                  value={dispenseDrugId}
                  onChange={(e) => setDispenseDrugId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                >
                  {drugs.length === 0 ? (
                    <option value="">No drugs available in catalog</option>
                  ) : (
                    drugs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.category}, {d.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Quantity to Dispense *
                </label>
                <input
                  type="number"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Clinical Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  value={dispenseReason}
                  onChange={(e) => setDispenseReason(e.target.value)}
                  placeholder="e.g. OPD patient prescription dispensing"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  maxLength={255}
                />
              </div>

              {dispenseResult && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg space-y-1.5 text-blue-200">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {dispenseResult.message}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Total Dispensed: <strong>{dispenseResult.total_dispensed}</strong> |
                    Remaining Facility Stock: <strong>{dispenseResult.remaining_stock}</strong>
                  </div>
                  {dispenseResult.batches_affected?.map((ba: any, idx: number) => (
                    <div key={idx} className="font-mono text-[10px] text-teal-300">
                      • Batch {ba.batch_number}: -{ba.deducted} units (remaining: {ba.remaining})
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDispenseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isDispensing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isDispensing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isDispensing ? 'Dispensing...' : 'Dispense Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Write-Off Stock */}
      {showWriteOffModal && selectedBatchForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Write-Off Stock Batch (POST /write-off)
              </h3>
              <button
                type="button"
                onClick={() => setShowWriteOffModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
              <div>
                Drug: <strong>{selectedBatchForAction.drug_name || 'Medicine'}</strong>
              </div>
              <div>
                Batch Number:{' '}
                <strong className="font-mono text-amber-300">
                  {selectedBatchForAction.batch_number}
                </strong>
              </div>
              <div>
                Available Quantity: <strong>{selectedBatchForAction.quantity}</strong>
              </div>
            </div>

            <form onSubmit={handleWriteOffStock} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Quantity to Write Off *
                  </label>
                  <input
                    type="number"
                    value={writeOffQty}
                    onChange={(e) => setWriteOffQty(Number(e.target.value))}
                    min={1}
                    max={selectedBatchForAction.quantity}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Reason Category *
                  </label>
                  <select
                    value={writeOffCategory}
                    onChange={(e) =>
                      setWriteOffCategory(e.target.value as WriteOffReasonEnum)
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="damaged">damaged</option>
                    <option value="expired">expired</option>
                    <option value="contaminated">contaminated</option>
                    <option value="recalled">recalled</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Detailed Explanation * (min 5 chars)
                </label>
                <textarea
                  value={writeOffReason}
                  onChange={(e) => setWriteOffReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-red-500"
                  required
                  minLength={5}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWriteOffModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWritingOff}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-1.5"
                >
                  {isWritingOff && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isWritingOff ? 'Writing Off...' : 'Confirm Write-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;