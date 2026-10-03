import {
  LoginResponse,
  UserProfileResponse,
  RefreshResponse,
  LogoutResponse,
  HealthResponse,
  ApiLogEntry,
  UserListResponse,
  UserResponse,
  UserCreate,
  UserUpdate,
  ResetPasswordResponse,
  RoleResponse,
  DrugResponse,
  DrugCreate,
  DrugCategoryEnum,
  DrugUnitEnum,
  InventoryBatchResponse,
  InventoryMyScopeResponse,
  StockReceiveRequest,
  StockDispenseRequest,
  StockWriteOffRequest,
  DispenseResponse,
  StockTransactionListResponse,
  TransactionTypeEnum,
  BatchStatusEnum,
  BedInventoryResponse,
  BedCreate,
  BedUpdate,
  BedMyScopeResponse,
  BedSummaryResponse,
  BedHistoryListResponse,
  BedTypeEnum,
  AttendanceResponse,
  AttendanceMarkRequest,
  AttendanceBulkMarkRequest,
  AttendanceCorrectionRequest,
  AttendanceMyScopeResponse,
  RosterItemResponse,
  AttendanceHistoryListResponse,
  AttendanceSummaryResponse,
  AttendanceStatusEnum,
  Truck,
  TruckCreate,
  TruckUpdate,
  TruckListResponse,
  FlRoundTriggerResponse,
  FlStatusResponse,
  FlRoundListResponse,
  FlRoundDetailResponse,
  FlModelResponse,
  FacilityForecastResponse,
  FacilityDrugForecastResponse,
} from '../types';
import { DEFAULT_BACKEND_URL, SEED_ACCOUNTS, DEFAULT_PASSWORD } from '../data/seedAccounts';

export class AuthApiService {
  private baseUrl: string;
  private onLogCallback?: (log: ApiLogEntry) => void;

  constructor() {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hsc_backend_url') : null;
    this.baseUrl = saved || import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    this.baseUrl = cleanUrl;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hsc_backend_url', cleanUrl);
    }
  }

  public resetBaseUrl(): void {
    this.setBaseUrl(DEFAULT_BACKEND_URL);
  }

  public setLogger(callback: (log: ApiLogEntry) => void): void {
    this.onLogCallback = callback;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    payload?: unknown
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const method = (options.method || 'GET') as ApiLogEntry['method'];

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

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
      this.onLogCallback?.(logEntry);
      throw new Error(`Connection failed to ${this.baseUrl}: ${networkErrorMsg}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let parsedBody: unknown = null;
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
      } else if (typeof rawText === 'string' && rawText.includes('Cloudflare Tunnel error')) {
        errorMessage = 'Cloudflare Tunnel Error 1033: Tunnel is unreachable or cloudflared is disconnected on the backend server.';
      } else if (rawText && rawText.length < 200) {
        errorMessage = rawText;
      }

      logEntry.error = errorMessage;
      this.onLogCallback?.(logEntry);
      throw new Error(errorMessage);
    }

    this.onLogCallback?.(logEntry);
    return parsedBody as T;
  }

  // ===================== AUTH ENDPOINTS =====================

  // 1. Health check
  public async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', { method: 'GET' });
  }

  // 2. Login
  public async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>(
      '/auth/login',
      { method: 'POST' },
      { email, password }
    );
  }

  // 3. User Profile (/auth/me)
  public async getMe(accessToken: string): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 4. Update own profile
  public async updateMe(
    accessToken: string,
    data: { full_name?: string; phone?: string }
  ): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>(
      '/auth/me',
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 5. Change own password
  public async changeMyPassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    return this.request<void>(
      '/auth/me/change-password',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      { current_password: currentPassword, new_password: newPassword }
    );
  }

  // 6. Token Refresh
  public async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    return this.request<RefreshResponse>(
      '/auth/refresh',
      { method: 'POST' },
      { refresh_token: refreshToken }
    );
  }

  // 7. Logout
  public async logout(refreshToken: string): Promise<LogoutResponse> {
    return this.request<LogoutResponse>(
      '/auth/logout',
      { method: 'POST' },
      { refresh_token: refreshToken }
    );
  }

  // 8. Test PHC Approval (RBAC test)
  public async testApprovePhcRequest(accessToken: string): Promise<{ status: string; action: string; user_id: string; scope_level: string }> {
    return this.request('/auth/test/approve-phc-request', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 9. Test District Data (Multi-tenant geographic isolation test)
  public async testDistrictData(accessToken: string, districtId: string): Promise<{ status: string; district_id: string; access: string; bypassed?: boolean }> {
    return this.request(`/auth/test/district-data/${districtId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // ===================== USER MANAGEMENT ENDPOINTS =====================

  // 10. List users
  public async listUsers(
    accessToken: string,
    params?: {
      scope_level?: string;
      role?: string;
      is_active?: boolean;
      search?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params?.scope_level) query.append('scope_level', params.scope_level);
    if (params?.role) query.append('role', params.role);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));

    const queryString = query.toString();
    return this.request<UserListResponse>(
      `/users${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 11. Create user
  public async createUser(accessToken: string, data: UserCreate): Promise<UserResponse> {
    return this.request<UserResponse>(
      '/users',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 12. Get user by ID
  public async getUser(accessToken: string, userId: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 13. Update user
  public async updateUser(
    accessToken: string,
    userId: string,
    data: UserUpdate
  ): Promise<UserResponse> {
    return this.request<UserResponse>(
      `/users/${userId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 14. Deactivate user
  public async deactivateUser(accessToken: string, userId: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}/deactivate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 15. Activate user
  public async activateUser(accessToken: string, userId: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}/activate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 16. Reset user password
  public async resetUserPassword(
    accessToken: string,
    userId: string
  ): Promise<ResetPasswordResponse> {
    return this.request<ResetPasswordResponse>(
      `/users/${userId}/reset-password`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 17. Get user roles
  public async getUserRoles(accessToken: string, userId: string): Promise<RoleResponse[]> {
    return this.request<RoleResponse[]>(`/users/${userId}/roles`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 18. Get user permissions
  public async getUserPermissions(accessToken: string, userId: string): Promise<string[]> {
    return this.request<string[]>(`/users/${userId}/permissions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // ===================== INVENTORY ENDPOINTS =====================

  // 19. List all drugs
  public async listDrugs(
    accessToken: string,
    params?: {
      category?: DrugCategoryEnum;
      unit?: DrugUnitEnum;
      is_active?: boolean;
      search?: string;
    }
  ): Promise<DrugResponse[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.unit) query.append('unit', params.unit);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request<DrugResponse[]>(
      `/inventory/drugs${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 20. Create drug
  public async createDrug(accessToken: string, data: DrugCreate): Promise<DrugResponse> {
    return this.request<DrugResponse>(
      '/inventory/drugs',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 21. Get inventory summary across scope
  public async getInventoryMyScope(
    accessToken: string,
    params?: {
      page?: number;
      page_size?: number;
      district_id?: string;
      drug_id?: string;
      search?: string;
    }
  ): Promise<InventoryMyScopeResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    if (params?.district_id) query.append('district_id', params.district_id);
    if (params?.drug_id) query.append('drug_id', params.drug_id);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request<InventoryMyScopeResponse>(
      `/inventory/my-scope${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 22. List facility stock batches
  public async listFacilityStock(
    accessToken: string,
    facilityId: string,
    params?: {
      drug_id?: string;
      status?: BatchStatusEnum;
      search?: string;
    }
  ): Promise<InventoryBatchResponse[]> {
    const query = new URLSearchParams();
    if (params?.drug_id) query.append('drug_id', params.drug_id);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request<InventoryBatchResponse[]>(
      `/inventory/facility/${facilityId}${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 23. Receive stock
  public async receiveStock(
    accessToken: string,
    facilityId: string,
    data: StockReceiveRequest
  ): Promise<InventoryBatchResponse> {
    return this.request<InventoryBatchResponse>(
      `/inventory/facility/${facilityId}/receive`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 24. Dispense stock
  public async dispenseStock(
    accessToken: string,
    facilityId: string,
    data: StockDispenseRequest
  ): Promise<DispenseResponse> {
    return this.request<DispenseResponse>(
      `/inventory/facility/${facilityId}/dispense`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 25. Write off stock
  public async writeOffStock(
    accessToken: string,
    facilityId: string,
    data: StockWriteOffRequest
  ): Promise<InventoryBatchResponse> {
    return this.request<InventoryBatchResponse>(
      `/inventory/facility/${facilityId}/write-off`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 26. Get expiring stock
  public async getExpiringStock(
    accessToken: string,
    facilityId: string,
    days: number = 30
  ): Promise<InventoryBatchResponse[]> {
    return this.request<InventoryBatchResponse[]>(
      `/inventory/facility/${facilityId}/expiring?days=${days}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 27. List stock transactions
  public async listStockTransactions(
    accessToken: string,
    facilityId: string,
    params?: {
      drug_id?: string;
      transaction_type?: TransactionTypeEnum;
      from_date?: string;
      to_date?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<StockTransactionListResponse> {
    const query = new URLSearchParams();
    if (params?.drug_id) query.append('drug_id', params.drug_id);
    if (params?.transaction_type) query.append('transaction_type', params.transaction_type);
    if (params?.from_date) query.append('from_date', params.from_date);
    if (params?.to_date) query.append('to_date', params.to_date);
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));

    const queryString = query.toString();
    return this.request<StockTransactionListResponse>(
      `/inventory/facility/${facilityId}/transactions${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // ===================== BEDS ENDPOINTS =====================

  // 28. Get beds summary across scope
  public async getBedsMyScope(
    accessToken: string,
    params?: {
      page?: number;
      page_size?: number;
      district_id?: string;
      search?: string;
    }
  ): Promise<BedMyScopeResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    if (params?.district_id) query.append('district_id', params.district_id);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request<BedMyScopeResponse>(
      `/beds/my-scope${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 29. List facility beds
  public async listFacilityBeds(
    accessToken: string,
    facilityId: string
  ): Promise<BedInventoryResponse[]> {
    return this.request<BedInventoryResponse[]>(`/beds/facility/${facilityId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 30. Add bed type
  public async addBedType(
    accessToken: string,
    facilityId: string,
    data: BedCreate
  ): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(
      `/beds/facility/${facilityId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 31. Get facility bed summary
  public async getFacilityBedSummary(
    accessToken: string,
    facilityId: string
  ): Promise<BedSummaryResponse> {
    return this.request<BedSummaryResponse>(
      `/beds/facility/${facilityId}/summary`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 32. Update bed
  public async updateBed(
    accessToken: string,
    facilityId: string,
    bedType: BedTypeEnum,
    data: BedUpdate
  ): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(
      `/beds/facility/${facilityId}/${bedType}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 33. Deactivate bed type
  public async deactivateBed(
    accessToken: string,
    facilityId: string,
    bedType: BedTypeEnum
  ): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(
      `/beds/facility/${facilityId}/${bedType}/deactivate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 34. Activate bed type
  public async activateBed(
    accessToken: string,
    facilityId: string,
    bedType: BedTypeEnum
  ): Promise<BedInventoryResponse> {
    return this.request<BedInventoryResponse>(
      `/beds/facility/${facilityId}/${bedType}/activate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 35. Get bed history
  public async getBedHistory(
    accessToken: string,
    facilityId: string,
    params?: {
      bed_type?: BedTypeEnum;
      from_date?: string;
      to_date?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<BedHistoryListResponse> {
    const query = new URLSearchParams();
    if (params?.bed_type) query.append('bed_type', params.bed_type);
    if (params?.from_date) query.append('from_date', params.from_date);
    if (params?.to_date) query.append('to_date', params.to_date);
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));

    const queryString = query.toString();
    return this.request<BedHistoryListResponse>(
      `/beds/facility/${facilityId}/history${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // ===================== ATTENDANCE ENDPOINTS =====================

  // 36. Get attendance summary across scope
  public async getAttendanceMyScope(
    accessToken: string,
    params?: {
      page?: number;
      page_size?: number;
      district_id?: string;
      date?: string;
      search?: string;
    }
  ): Promise<AttendanceMyScopeResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    if (params?.district_id) query.append('district_id', params.district_id);
    if (params?.date) query.append('date', params.date);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request<AttendanceMyScopeResponse>(
      `/attendance/my-scope${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 37. Get facility roster
  public async getFacilityRoster(
    accessToken: string,
    facilityId: string,
    date?: string
  ): Promise<RosterItemResponse[]> {
    const query = new URLSearchParams();
    if (date) query.append('date', date);

    const queryString = query.toString();
    return this.request<RosterItemResponse[]>(
      `/attendance/facility/${facilityId}/roster${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 38. Mark single attendance
  public async markAttendance(
    accessToken: string,
    facilityId: string,
    data: AttendanceMarkRequest
  ): Promise<AttendanceResponse> {
    return this.request<AttendanceResponse>(
      `/attendance/facility/${facilityId}/mark`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 39. Bulk mark attendance
  public async bulkMarkAttendance(
    accessToken: string,
    facilityId: string,
    data: AttendanceBulkMarkRequest
  ): Promise<AttendanceResponse[]> {
    return this.request<AttendanceResponse[]>(
      `/attendance/facility/${facilityId}/bulk-mark`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 40. Correct attendance
  public async correctAttendance(
    accessToken: string,
    facilityId: string,
    attendanceId: string,
    data: AttendanceCorrectionRequest
  ): Promise<AttendanceResponse> {
    return this.request<AttendanceResponse>(
      `/attendance/facility/${facilityId}/${attendanceId}/correct`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 41. Get attendance history
  public async getAttendanceHistory(
    accessToken: string,
    facilityId: string,
    params?: {
      user_id?: string;
      status?: AttendanceStatusEnum;
      from_date?: string;
      to_date?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<AttendanceHistoryListResponse> {
    const query = new URLSearchParams();
    if (params?.user_id) query.append('user_id', params.user_id);
    if (params?.status) query.append('status', params.status);
    if (params?.from_date) query.append('from_date', params.from_date);
    if (params?.to_date) query.append('to_date', params.to_date);
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));

    const queryString = query.toString();
    return this.request<AttendanceHistoryListResponse>(
      `/attendance/facility/${facilityId}/history${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 42. Get attendance summary
  public async getAttendanceSummary(
    accessToken: string,
    facilityId: string,
    fromDate: string,
    toDate: string
  ): Promise<AttendanceSummaryResponse> {
    return this.request<AttendanceSummaryResponse>(
      `/attendance/facility/${facilityId}/summary?from_date=${fromDate}&to_date=${toDate}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // ===================== TRUCK ENDPOINTS (New) =====================

  // 43. List all trucks
  public async listTrucks(
    accessToken: string,
    params?: {
      status?: string;
      search?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<TruckListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));

    const queryString = query.toString();
    // Note: This endpoint doesn't exist in the Swagger doc, but we'll add it
    // In a real scenario, you'd need to add this to your backend
    return this.request<TruckListResponse>(
      `/trucks${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 44. Create a new truck
  public async createTruck(accessToken: string, data: TruckCreate): Promise<Truck> {
    return this.request<Truck>(
      '/trucks',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 45. Get truck by ID
  public async getTruck(accessToken: string, truckId: string): Promise<Truck> {
    return this.request<Truck>(`/trucks/${truckId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // 46. Update truck
  public async updateTruck(
    accessToken: string,
    truckId: string,
    data: TruckUpdate
  ): Promise<Truck> {
    return this.request<Truck>(
      `/trucks/${truckId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      data
    );
  }

  // 47. Delete truck
  public async deleteTruck(accessToken: string, truckId: string): Promise<void> {
    return this.request<void>(`/trucks/${truckId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  // ===================== FEDERATED LEARNING ENDPOINTS =====================

  // 48. Trigger hierarchical FL round (Super Admin)
  public async triggerFlRound(accessToken: string): Promise<FlRoundTriggerResponse> {
    return this.request<FlRoundTriggerResponse>(
      '/fl/trigger-round',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 49. Get active FL status summary
  public async getFlStatus(accessToken: string): Promise<FlStatusResponse> {
    return this.request<FlStatusResponse>(
      '/fl/status',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 50. List paginated historical FL rounds
  public async listFlRounds(
    accessToken: string,
    params?: { page?: number; page_size?: number }
  ): Promise<FlRoundListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.request<FlRoundListResponse>(
      `/fl/rounds${qs}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 51. Get detailed metrics and per-node models for an FL round
  public async getFlRoundDetail(accessToken: string, roundId: string): Promise<FlRoundDetailResponse> {
    return this.request<FlRoundDetailResponse>(
      `/fl/rounds/${roundId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 52. Mark a stuck RUNNING round as failed (Super Admin recovery)
  public async abandonFlRound(accessToken: string, roundId: string): Promise<FlRoundDetailResponse> {
    return this.request<FlRoundDetailResponse>(
      `/fl/rounds/${roundId}/abandon`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 53. Get FL model metadata without exposing raw .pt weights
  public async getFlModel(accessToken: string, modelId: string): Promise<FlModelResponse> {
    return this.request<FlModelResponse>(
      `/fl/models/${modelId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // ===================== DEMAND FORECASTING ENDPOINTS =====================

  // 54. Get latest 7-day demand forecasts for a facility
  public async getFacilityForecast(
    accessToken: string,
    facilityId: string,
    days: number = 7
  ): Promise<FacilityForecastResponse> {
    const query = new URLSearchParams();
    if (days) query.append('days', String(days));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.request<FacilityForecastResponse>(
      `/forecast/facility/${facilityId}${qs}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // 55. Get demand forecast for a specific drug at a facility
  public async getFacilityDrugForecast(
    accessToken: string,
    facilityId: string,
    drugId: string,
    days: number = 7
  ): Promise<FacilityDrugForecastResponse> {
    const query = new URLSearchParams();
    if (days) query.append('days', String(days));
    const qs = query.toString() ? `?${query.toString()}` : '';

    return this.request<FacilityDrugForecastResponse>(
      `/forecast/facility/${facilityId}/drug/${drugId}${qs}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  // ===================== MOCK FALLBACK HANDLER =====================

  public mockLogin(email: string, password: string): LoginResponse {
    const account = SEED_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!account) {
      if (password !== DEFAULT_PASSWORD && password !== 'admin123' && password.length < 8) {
        throw new Error('Invalid email or password (min 8 characters)');
      }
    }

    const matchedAccount = account || {
      email,
      name: email.split('@')[0],
      role: 'Custom User',
      scope: 'NATIONAL' as const,
      description: 'Demo User Account',
      permissions: ['view_national', 'view_district'],
    };

    const dummyUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const mockAccessToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock.${btoa(
      JSON.stringify({
        sub: dummyUuid,
        email: matchedAccount.email,
        roles: [matchedAccount.role],
        scope_level: matchedAccount.scope,
        exp: Math.floor(Date.now() / 1000) + 15 * 60,
      })
    )}`;

    const mockRefreshToken = `rt_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const logEntry: ApiLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      method: 'POST',
      url: `${this.baseUrl}/auth/login [Mock Mode]`,
      status: 200,
      statusText: 'OK (Mocked)',
      durationMs: 45,
      requestPayload: { email, password: '••••••••' },
      responseBody: {
        access_token: '[MOCK_JWT_ACCESS_TOKEN]',
        token_type: 'bearer',
        user: {
          email: matchedAccount.email,
          full_name: matchedAccount.name,
          roles: [matchedAccount.role],
          scope_level: matchedAccount.scope,
        },
      },
    };
    this.onLogCallback?.(logEntry);

    return {
      access_token: mockAccessToken,
      refresh_token: mockRefreshToken,
      token_type: 'bearer',
      user: {
        id: dummyUuid,
        email: matchedAccount.email,
        full_name: matchedAccount.name,
        is_active: true,
        scope_level: matchedAccount.scope,
        scope_id: matchedAccount.scope === 'PLATFORM' ? null : 'd58e3e4a-921c-43f1-a185-123456789abc',
        must_change_password: false,
        roles: [
          {
            id: 'role-1',
            name: matchedAccount.role,
            description: matchedAccount.description,
          },
        ],
        permissions: matchedAccount.permissions,
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }
}

export const authApiService = new AuthApiService();