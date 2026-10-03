import {
  UserListResponse,
  UserResponse,
  UserCreateRequest,
  UserUpdateRequest,
  ResetPasswordResponse,
  DrugResponse,
  DrugCreateRequest,
  InventoryBatchResponse,
  StockReceiveRequest,
  StockDispenseRequest,
  DispenseResponse,
  StockWriteOffRequest,
  StockTransactionResponse,
  InventoryMyScopeItem,
  BedSummaryResponse,
  BedInventoryResponse,
  BedCreateRequest,
  BedUpdateRequest,
  BedOccupancyLogResponse,
  RosterItemResponse,
  AttendanceMarkRequest,
  AttendanceBulkMarkRequest,
  AttendanceCorrectionRequest,
  AttendanceResponse,
  AttendanceSummaryResponse,
  ApprovePhcRequestResponse,
  ApiLogEntry,
  FlRoundTriggerResponse,
  FlStatusResponse,
  FlRoundListResponse,
  FlRoundDetailResponse,
  FlModelResponse,
  FacilityForecastResponse,
  FacilityDrugForecastResponse,
} from '../types';
import { authApiService } from './authApi';

class HealthChainApiService {
  private get baseUrl(): string {
    return authApiService.getBaseUrl();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    payload?: unknown,
    token?: string | null
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const method = (options.method || 'GET') as ApiLogEntry['method'];

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('hsc_access_token') : null;
      if (storedToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
    }

    if (payload && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    let durationMs = 0;

    try {
      response = await fetch(fullUrl, {
        ...options,
        headers,
        body: payload ? JSON.stringify(payload) : options.body,
      });
      durationMs = Math.round(performance.now() - startTime);
    } catch (err: unknown) {
      durationMs = Math.round(performance.now() - startTime);
      const networkErrorMsg = err instanceof Error ? err.message : 'Network request failed';
      const logEntry: ApiLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        method,
        url: fullUrl,
        status: 0,
        statusText: 'Network Error',
        durationMs,
        requestPayload: payload,
        error: networkErrorMsg,
      };
      // Log via the authApiService logger
      (authApiService as any).onLogCallback?.(logEntry);
      throw new Error(`Connection failed to ${this.baseUrl}: ${networkErrorMsg}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let parsedBody: any = null;
    let rawText = '';

    try {
      if (contentType.includes('application/json')) {
        parsedBody = await response.json();
      } else {
        rawText = await response.text();
        parsedBody = rawText;
      }
    } catch (parseError) {
      console.warn('Failed to parse response body', parseError);
    }

    const logEntry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method,
      url: fullUrl,
      status: response.status,
      statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
      durationMs,
      requestPayload: payload,
      responseBody: parsedBody,
    };

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (typeof parsedBody === 'object' && parsedBody !== null && 'detail' in parsedBody) {
        const detail = (parsedBody as { detail: unknown }).detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
        } else {
          errorMessage = JSON.stringify(detail);
        }
      } else if (rawText && rawText.length < 200) {
        errorMessage = rawText;
      }
      logEntry.error = errorMessage;
      (authApiService as any).onLogCallback?.(logEntry);
      throw new Error(errorMessage);
    }

    (authApiService as any).onLogCallback?.(logEntry);
    return parsedBody as T;
  }

  // ==========================================
  // 1. USER ENDPOINTS
  // ==========================================

  public async getUsers(params?: {
    search?: string;
    scope_level?: string;
    role?: string;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<UserListResponse> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.scope_level && params.scope_level !== 'ALL') q.append('scope_level', params.scope_level.toLowerCase());
    if (params?.role) q.append('role', params.role);
    if (typeof params?.is_active === 'boolean') q.append('is_active', String(params.is_active));
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<UserListResponse>(`/users${qs}`, { method: 'GET' });
  }

  public async createUser(data: UserCreateRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/users', { method: 'POST' }, data);
  }

  public async getUser(userId: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}`, { method: 'GET' });
  }

  public async updateUser(userId: string, data: UserUpdateRequest): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}`, { method: 'PATCH' }, data);
  }

  public async deactivateUser(userId: string): Promise<{ message: string; user_id: string; is_active: boolean }> {
    return this.request(`/users/${userId}/deactivate`, { method: 'POST' });
  }

  public async activateUser(userId: string): Promise<{ message: string; user_id: string; is_active: boolean }> {
    return this.request(`/users/${userId}/activate`, { method: 'POST' });
  }

  public async resetUserPassword(userId: string): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>(`/users/${userId}/reset-password`, { method: 'POST' });
  }

  public async getUserRoles(userId: string): Promise<any[]> {
    return this.request<any[]>(`/users/${userId}/roles`, { method: 'GET' });
  }

  public async getUserPermissions(userId: string): Promise<string[]> {
    return this.request<string[]>(`/users/${userId}/permissions`, { method: 'GET' });
  }

  // ==========================================
  // 2. MEDICINE INVENTORY ENDPOINTS
  // ==========================================

  public async getDrugs(params?: {
    category?: string;
    unit?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<DrugResponse[]> {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.unit) q.append('unit', params.unit);
    if (typeof params?.is_active === 'boolean') q.append('is_active', String(params.is_active));
    if (params?.search) q.append('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<DrugResponse[]>(`/inventory/drugs${qs}`, { method: 'GET' });
  }

  public async createDrug(data: DrugCreateRequest): Promise<DrugResponse> {
    return this.request<DrugResponse>('/inventory/drugs', { method: 'POST' }, data);
  }

  public async getMyScopeInventory(params?: {
    page?: number;
    page_size?: number;
    district_id?: string;
    drug_id?: string;
    search?: string;
  }): Promise<{ scope_level: string; items: InventoryMyScopeItem[]; aggregate: any }> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));
    if (params?.district_id) q.append('district_id', params.district_id);
    if (params?.drug_id) q.append('drug_id', params.drug_id);
    if (params?.search) q.append('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/inventory/my-scope${qs}`, { method: 'GET' });
  }

  public async getFacilityInventory(
    facilityId: string,
    params?: { drug_id?: string; status?: string; search?: string }
  ): Promise<InventoryBatchResponse[]> {
    const q = new URLSearchParams();
    if (params?.drug_id) q.append('drug_id', params.drug_id);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<InventoryBatchResponse[]>(`/inventory/facility/${facilityId}${qs}`, { method: 'GET' });
  }

  public async receiveStock(facilityId: string, data: StockReceiveRequest): Promise<InventoryBatchResponse> {
    return this.request<InventoryBatchResponse>(`/inventory/facility/${facilityId}/receive`, { method: 'POST' }, data);
  }

  public async dispenseStock(facilityId: string, data: StockDispenseRequest): Promise<DispenseResponse> {
    return this.request<DispenseResponse>(`/inventory/facility/${facilityId}/dispense`, { method: 'POST' }, data);
  }

  public async writeOffStock(facilityId: string, data: StockWriteOffRequest): Promise<any> {
    return this.request(`/inventory/facility/${facilityId}/write-off`, { method: 'POST' }, data);
  }

  public async getExpiringStock(facilityId: string, days = 90): Promise<InventoryBatchResponse[]> {
    return this.request<InventoryBatchResponse[]>(`/inventory/facility/${facilityId}/expiring?days=${days}`, { method: 'GET' });
  }

  public async getStockTransactions(
    facilityId: string,
    params?: { drug_id?: string; transaction_type?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }
  ): Promise<{ items: StockTransactionResponse[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.drug_id) q.append('drug_id', params.drug_id);
    if (params?.transaction_type) q.append('transaction_type', params.transaction_type);
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size || 50));

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/inventory/facility/${facilityId}/transactions${qs}`, { method: 'GET' });
  }

  // ==========================================
  // 3. BEDS ENDPOINTS
  // ==========================================

  public async getMyScopeBeds(params?: {
    page?: number;
    page_size?: number;
    district_id?: string;
    search?: string;
  }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));
    if (params?.district_id) q.append('district_id', params.district_id);
    if (params?.search) q.append('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/beds/my-scope${qs}`, { method: 'GET' });
  }

  public async getFacilityBeds(facilityId: string): Promise<BedInventoryResponse[]> {
    return this.request<BedInventoryResponse[]>(`/beds/facility/${facilityId}`, { method: 'GET' });
  }

  public async getFacilityBedSummary(facilityId: string): Promise<BedSummaryResponse> {
    return this.request<BedSummaryResponse>(`/beds/facility/${facilityId}/summary`, { method: 'GET' });
  }

  public async addBedType(facilityId: string, data: BedCreateRequest): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(`/beds/facility/${facilityId}`, { method: 'POST' }, data);
  }

  public async updateBedOccupancy(
    facilityId: string,
    bedType: string,
    data: BedUpdateRequest
  ): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(`/beds/facility/${facilityId}/${bedType}`, { method: 'PATCH' }, data);
  }

  public async deactivateBed(facilityId: string, bedType: string): Promise<any> {
    return this.request(`/beds/facility/${facilityId}/${bedType}/deactivate`, { method: 'POST' });
  }

  public async activateBed(facilityId: string, bedType: string): Promise<any> {
    return this.request(`/beds/facility/${facilityId}/${bedType}/activate`, { method: 'POST' });
  }

  public async getBedHistory(
    facilityId: string,
    params?: { bed_type?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }
  ): Promise<{ items: BedOccupancyLogResponse[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.bed_type) q.append('bed_type', params.bed_type);
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size || 50));

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/beds/facility/${facilityId}/history${qs}`, { method: 'GET' });
  }

  // ==========================================
  // 4. ATTENDANCE ENDPOINTS
  // ==========================================

  public async getMyScopeAttendance(params?: {
    page?: number;
    page_size?: number;
    district_id?: string;
    date?: string;
    search?: string;
  }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));
    if (params?.district_id) q.append('district_id', params.district_id);
    if (params?.date) q.append('date', params.date);
    if (params?.search) q.append('search', params.search);

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/attendance/my-scope${qs}`, { method: 'GET' });
  }

  public async getFacilityRoster(facilityId: string, date?: string): Promise<RosterItemResponse[]> {
    const q = new URLSearchParams();
    if (date) q.append('date', date);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<RosterItemResponse[]>(`/attendance/facility/${facilityId}/roster${qs}`, { method: 'GET' });
  }

  public async markAttendance(facilityId: string, data: AttendanceMarkRequest): Promise<AttendanceResponse> {
    return this.request<AttendanceResponse>(`/attendance/facility/${facilityId}/mark`, { method: 'POST' }, data);
  }

  public async bulkMarkAttendance(facilityId: string, data: AttendanceBulkMarkRequest): Promise<AttendanceResponse[]> {
    return this.request<AttendanceResponse[]>(`/attendance/facility/${facilityId}/bulk-mark`, { method: 'POST' }, data);
  }

  public async correctAttendance(
    facilityId: string,
    attendanceId: string,
    data: AttendanceCorrectionRequest
  ): Promise<AttendanceResponse> {
    return this.request<AttendanceResponse>(`/attendance/facility/${facilityId}/${attendanceId}/correct`, { method: 'POST' }, data);
  }

  public async getFacilityAttendanceSummary(
    facilityId: string,
    fromDate: string,
    toDate: string
  ): Promise<AttendanceSummaryResponse> {
    const q = new URLSearchParams({ from_date: fromDate, to_date: toDate });
    return this.request<AttendanceSummaryResponse>(`/attendance/facility/${facilityId}/summary?${q.toString()}`, { method: 'GET' });
  }

  public async getFacilityAttendanceHistory(
    facilityId: string,
    params?: { user_id?: string; status?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }
  ): Promise<{ items: AttendanceResponse[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.user_id) q.append('user_id', params.user_id);
    if (params?.status) q.append('status', params.status);
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size || 50));

    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/attendance/facility/${facilityId}/history${qs}`, { method: 'GET' });
  }

  // ==========================================
  // 5. APPROVAL & RBAC INTEGRATION
  // ==========================================

  public async approvePhcRequest(): Promise<ApprovePhcRequestResponse> {
    return this.request<ApprovePhcRequestResponse>('/auth/test/approve-phc-request', { method: 'POST' });
  }

  public async testDistrictData(districtId: string): Promise<any> {
    return this.request(`/auth/test/district-data/${districtId}`, { method: 'GET' });
  }

    // ==========================================
  // 6. ADMIN DASHBOARD ENDPOINTS
  // ==========================================

  public async getAdminMetrics(): Promise<{
    activeNodes: number | null;
    totalNodes: number | null;
    globalModelAccuracy: number | null;
    accuracyDelta: number | null;
    registeredUsers: number | null;
  }> {
    return this.request('/admin/metrics', { method: 'GET' });
  }

  public async getServiceHealth(): Promise<
    Array<{ name: string; status: string; latency: string; load: string }>
  > {
    return this.request('/admin/services/health', { method: 'GET' });
  }

  // ==========================================
  // 7. FEDERATED LEARNING ENDPOINTS (OpenAPI)
  // ==========================================

  public async triggerFlRound(): Promise<FlRoundTriggerResponse> {
    return this.request<FlRoundTriggerResponse>('/fl/trigger-round', { method: 'POST' });
  }

  public async getFlStatus(): Promise<FlStatusResponse> {
    return this.request<FlStatusResponse>('/fl/status', { method: 'GET' });
  }

  public async listFlRounds(params?: {
    page?: number;
    page_size?: number;
  }): Promise<FlRoundListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<FlRoundListResponse>(`/fl/rounds${qs}`, { method: 'GET' });
  }

  public async getFlRoundDetail(roundId: string): Promise<FlRoundDetailResponse> {
    return this.request<FlRoundDetailResponse>(`/fl/rounds/${roundId}`, { method: 'GET' });
  }

  public async abandonFlRound(roundId: string): Promise<FlRoundDetailResponse> {
    return this.request<FlRoundDetailResponse>(`/fl/rounds/${roundId}/abandon`, { method: 'POST' });
  }

  public async getFlModel(modelId: string): Promise<FlModelResponse> {
    return this.request<FlModelResponse>(`/fl/models/${modelId}`, { method: 'GET' });
  }

  public async getCurrentFlRound(): Promise<{
    roundNumber: number | null;
    convergencePct: number | null;
    participatingNodes: number | null;
    totalNodes: number | null;
    loss: number | null;
    etaMinutes: number | null;
  }> {
    return this.request('/fl/rounds/current', { method: 'GET' });
  }

  public async getFlRounds(): Promise<{ items: any[] }> {
    return this.request('/fl/rounds', { method: 'GET' });
  }

  public async pauseFlRound(roundNumber: number): Promise<void> {
    return this.request(`/fl/rounds/${roundNumber}/pause`, { method: 'POST' });
  }

  public async resumeFlRound(roundNumber: number): Promise<void> {
    return this.request(`/fl/rounds/${roundNumber}/resume`, { method: 'POST' });
  }

  // ==========================================
  // 8. EDGE NODE MANAGEMENT ENDPOINTS
  // ==========================================

  public async getEdgeNodes(params?: {
    tier?: string;
    state_id?: string;
    district_id?: string;
    search?: string;
  }): Promise<{ items: any[] }> {
    const q = new URLSearchParams();
    if (params?.tier) q.append('tier', params.tier);
    if (params?.state_id) q.append('state_id', params.state_id);
    if (params?.district_id) q.append('district_id', params.district_id);
    if (params?.search) q.append('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/nodes${qs}`, { method: 'GET' });
  }

  public async approveNode(nodeId: string): Promise<void> {
    return this.request(`/nodes/${nodeId}/approve`, { method: 'POST' });
  }

  public async registerNode(data: {
    tier: string;
    state_id: string;
    district_id?: string;
    phc_id?: string;
    name?: string;
    ip_address: string;
    hardware_profile?: string;
  }): Promise<{ id: string; name: string; token: string; ip_address: string }> {
    return this.request('/nodes', { method: 'POST' }, data);
  }

  // ==========================================
  // 9. ALERTS & NOTIFICATIONS ENDPOINTS
  // ==========================================

  public async getAlerts(params?: { tier?: string }): Promise<{ items: any[] }> {
    const q = new URLSearchParams();
    if (params?.tier) q.append('tier', params.tier);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/alerts${qs}`, { method: 'GET' });
  }

  public async markAlertAsRead(alertId: string): Promise<void> {
    return this.request(`/alerts/${alertId}/read`, { method: 'POST' });
  }

  public async markAllAlertsAsRead(): Promise<void> {
    return this.request('/alerts/read-all', { method: 'POST' });
  }

  // Scope-specific alert feeds
  public async getNationalAlerts(): Promise<{ items: any[] }> {
    return this.request('/alerts/national', { method: 'GET' });
  }

  public async getStateAlerts(): Promise<{ items: any[] }> {
    return this.request('/alerts/state', { method: 'GET' });
  }

  public async getDistrictAlerts(): Promise<{ items: any[] }> {
    return this.request('/alerts/district', { method: 'GET' });
  }

  public async getPhcAlerts(): Promise<{ items: any[] }> {
    return this.request('/alerts/phc', { method: 'GET' });
  }

  public async dispatchNationalAdvisory(alertId: string): Promise<void> {
    return this.request(`/alerts/national/${alertId}/dispatch`, { method: 'POST' });
  }

  // ==========================================
  // 10. DASHBOARD SUMMARY ENDPOINTS
  // ==========================================

  public async getNationalDashboardSummary(): Promise<{ states: any[] }> {
    return this.request('/dashboard/national/summary', { method: 'GET' });
  }

  public async getStateDashboardSummary(): Promise<{ districts: any[] }> {
    return this.request('/dashboard/state/summary', { method: 'GET' });
  }

  public async getDistrictDashboardSummary(): Promise<{ phcs: any[] }> {
    return this.request('/dashboard/district/summary', { method: 'GET' });
  }

  // ==========================================
  // 11. FORECAST ENDPOINTS (OpenAPI)
  // ==========================================

  public async getFacilityForecast(
    facilityId: string,
    days: number = 7
  ): Promise<FacilityForecastResponse> {
    const query = new URLSearchParams();
    if (days) query.append('days', String(days));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<FacilityForecastResponse>(`/forecast/facility/${facilityId}${qs}`, {
      method: 'GET',
    });
  }

  public async getFacilityDrugForecast(
    facilityId: string,
    drugId: string,
    days: number = 7
  ): Promise<FacilityDrugForecastResponse> {
    const query = new URLSearchParams();
    if (days) query.append('days', String(days));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<FacilityDrugForecastResponse>(
      `/forecast/facility/${facilityId}/drug/${drugId}${qs}`,
      { method: 'GET' }
    );
  }

  public async getNationalForecast(): Promise<{
    aggregate: any;
    states: any[];
  }> {
    return this.request('/forecast/national', { method: 'GET' });
  }

  public async getStateForecast(): Promise<{ districts: any[] }> {
    return this.request('/forecast/state', { method: 'GET' });
  }

  public async getDistrictForecast(): Promise<{ phcs: any[] }> {
    return this.request('/forecast/district', { method: 'GET' });
  }

  public async getPhcForecast(): Promise<{ items: any[] }> {
    return this.request('/forecast/phc', { method: 'GET' });
  }

  // ==========================================
  // 12. PHC FACILITY ENDPOINTS
  // ==========================================

  public async getPhcInventory(): Promise<any[]> {
    return this.request('/phc/inventory', { method: 'GET' });
  }

  public async getPhcBeds(): Promise<any[]> {
    return this.request('/phc/beds', { method: 'GET' });
  }

  public async getPhcStaff(): Promise<any[]> {
    return this.request('/phc/staff', { method: 'GET' });
  }

  public async getDistrictPhcs(): Promise<{ items: any[] }> {
    return this.request('/district/phcs', { method: 'GET' });
  }

  public async updatePhcMoPhone(phcId: string, phone: string): Promise<void> {
    return this.request(
      `/district/phcs/${phcId}/mo-phone`,
      { method: 'PATCH' },
      { mo_phone: phone }
    );
  }

  // ==========================================
  // 13. TRUCK / FLEET ENDPOINTS (Pending backend)
  // ==========================================

  public async listTrucks(params?: {
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: any[]; pagination: any }> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/trucks${qs}`, { method: 'GET' });
  }

  public async createTruck(data: any): Promise<any> {
    return this.request('/trucks', { method: 'POST' }, data);
  }

  public async updateTruck(truckId: string, data: any): Promise<any> {
    return this.request(`/trucks/${truckId}`, { method: 'PATCH' }, data);
  }

  public async deleteTruck(truckId: string): Promise<void> {
    return this.request(`/trucks/${truckId}`, { method: 'DELETE' });
  }
}

export const healthChainApi = new HealthChainApiService();
