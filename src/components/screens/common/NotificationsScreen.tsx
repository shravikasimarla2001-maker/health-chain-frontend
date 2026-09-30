import React, { useState, useEffect, useCallback } from 'react';
import { AlertNotification, RoleTier } from '../../../types';
import { healthChainApi } from '../../../services/healthChainApi';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  Clock,
  CheckCheck,
  Filter,
  CheckCircle,
  Truck,
  Flame,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface NotificationsScreenProps {
  alerts?: AlertNotification[];
  tier?: RoleTier;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onNavigateToScreen?: (screenId: string) => void;
  onNavigate?: (screenId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  alerts,
  tier = 'L5',
  onMarkAsRead = (_id: string) => {},
  onMarkAllAsRead = () => {},
  onNavigateToScreen,
  onNavigate,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // ===================== DATA STATE =====================
  const [localAlerts, setLocalAlerts] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navigateFn = onNavigateToScreen || onNavigate || (() => {});

  // If parent passes alerts, use those; otherwise use locally-fetched list.
  const usingPropData = Array.isArray(alerts);
  const safeAlerts = usingPropData ? (alerts as AlertNotification[]) : localAlerts;

  // ===================== FETCH =====================
  const fetchAlerts = useCallback(async () => {
    // If parent owns the data, don't fetch here.
    if (usingPropData) return;

    setRefreshing(true);
    try {
      // TODO: replace with real endpoint when available:
      // const res = await healthChainApi.getAlerts({ tier });
      // setLocalAlerts(res.items ?? []);
      setLocalAlerts([]);
      setFetchError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch alerts';
      setLocalAlerts([]);
      setFetchError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [usingPropData, tier]);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  // ===================== ACTIONS =====================
  const handleMarkAsRead = async (id: string) => {
    setActionError(null);
    setActionLoading(`mark-read-${id}`);
    try {
      // If parent owns data, delegate to parent callback
      if (usingPropData) {
        onMarkAsRead(id);
      } else {
        // TODO: await healthChainApi.markAlertAsRead(id);
        setLocalAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark alert as read';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionError(null);
    setActionLoading('mark-all-read');
    try {
      if (usingPropData) {
        onMarkAllAsRead();
      } else {
        // TODO: await healthChainApi.markAllAlertsAsRead();
        setLocalAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark all alerts as read';
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ===================== FILTER =====================
  const filteredAlerts = safeAlerts.filter((a) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !a.isRead;
    if (filterType === 'CRITICAL') return a.severity === 'CRITICAL';
    if (filterType === 'STOCK_OUT') return a.type === 'STOCK_OUT';
    if (filterType === 'TRANSFERS') return a.type === 'TRANSFER_REQUEST';
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-950/70 border-red-800 text-red-300';
      case 'WARNING':
        return 'bg-amber-950/70 border-amber-800 text-amber-300';
      case 'INFO':
      default:
        return 'bg-blue-950/70 border-blue-800 text-blue-300';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'STOCK_OUT':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'COLD_CHAIN':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'TRANSFER_REQUEST':
        return <Truck className="w-5 h-5 text-emerald-400" />;
      case 'OUTBREAK_SIGNAL':
        return <AlertOctagon className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10" id="notifications-screen-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Alerts & Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time stock-out, cold chain excursions, batch expiry, and redistribution signals
            for your operational scope.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!usingPropData && (
            <button
              type="button"
              onClick={fetchAlerts}
              disabled={refreshing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh alerts"
              aria-label="Refresh alerts"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading === 'mark-all-read' || safeAlerts.length === 0}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'mark-all-read' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 text-emerald-400" />
            )}
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded-xl border bg-rose-950/80 border-rose-700/60 text-rose-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-100">Failed to load alerts</div>
            <div className="text-rose-300/90 mt-0.5">{fetchError}</div>
          </div>
          <button
            type="button"
            onClick={fetchAlerts}
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

      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl border bg-amber-950/70 border-amber-700/60 text-amber-200 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">Action failed</div>
            <div className="text-amber-300/90 mt-0.5">{actionError}</div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-amber-300 hover:text-amber-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
        <span className="text-slate-500 flex items-center gap-1 px-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'ALL', label: `All (${safeAlerts.length})` },
          {
            id: 'UNREAD',
            label: `Unread (${safeAlerts.filter((a) => !a.isRead).length})`,
          },
          {
            id: 'CRITICAL',
            label: `Critical (${safeAlerts.filter((a) => a.severity === 'CRITICAL').length})`,
          },
          { id: 'STOCK_OUT', label: 'Stock-outs' },
          { id: 'TRANSFERS', label: 'Transfers' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
            <RefreshCw className="w-6 h-6 text-emerald-400 mx-auto mb-3 animate-spin" />
            <div className="text-sm text-slate-400">Loading alerts...</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-semibold text-slate-200">No Notifications</h3>
            <p className="text-sm text-slate-400 mt-1">
              {fetchError
                ? 'Unable to load alerts. Please retry.'
                : 'All supply chain signals are normal for the selected filter.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.isRead
                  ? 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  : 'bg-slate-900 border-slate-700/80 text-slate-200 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    {getIcon(alert.type)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                        {alert.type.replace('_', ' ')}
                      </span>
                      {alert.facility && (
                        <span className="text-xs text-slate-400 font-medium">
                          📍 {alert.facility}
                        </span>
                      )}
                      {alert.district && (
                        <span className="text-xs text-slate-400">
                          {alert.district} District
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-semibold mt-1.5 ${
                        alert.isRead ? 'text-slate-300' : 'text-slate-100'
                      }`}
                    >
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {!alert.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(alert.id)}
                      disabled={actionLoading === `mark-read-${alert.id}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === `mark-read-${alert.id}` ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : null}
                      Mark Read
                    </button>
                  )}
                  {alert.actionRequired && (
                    <button
                      type="button"
                      onClick={() => {
                        if (tier === 'L5') navigateFn('inventory_management');
                        else if (tier === 'L3') navigateFn('redistribution_recommendations');
                        else if (tier === 'L2') navigateFn('state_redistribution');
                        else if (tier === 'L1') navigateFn('cross_state_redistribution');
                        else navigateFn('admin_dashboard');
                      }}
                      className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded border border-emerald-600/40 transition-colors"
                    >
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};