export type ScopeLevel = 'PLATFORM' | 'NATIONAL' | 'STATE' | 'DISTRICT' | 'PHC' | 'platform' | 'national' | 'state' | 'district' | 'phc';

export type RoleTier = 'L0' | 'L1' | 'L2' | 'L3' | 'L5';

export interface RoleInfo {
  id: string;
  name: string;
  description?: string;
}

export type ScopeLevelEnum = 'platform' | 'national' | 'state' | 'district' | 'phc';

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  scope_level: ScopeLevel;
  scope_id: string | null;
  roles: RoleInfo[];
  permissions: string[];
  created_at: string;
  updated_at: string;
  phone?: string | null;
  must_change_password?: boolean;
  language?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  scope_level: ScopeLevel;
  scope_id: string | null;
  roles: string[];
  permissions: string[];
  phone?: string | null;
  must_change_password?: boolean;
  language?: string;
}

export interface UserCreateRequest {
  email: string;
  full_name: string;
  password: string;
  phone?: string | null;
  is_active?: boolean;
  scope_level: ScopeLevelEnum;
  scope_id?: string | null;
  role_names: string[];
}

export interface UserUpdateRequest {
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  scope_level?: ScopeLevelEnum | null;
  scope_id?: string | null;
  role_names?: string[] | null;
}

export interface UserListResponse {
  items: UserResponse[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ResetPasswordResponse {
  message: string;
  new_password?: string;
}

// ---------------- Backend Inventory API Types ----------------
export type DrugCategoryEnum = 'antibiotic' | 'analgesic' | 'antimalarial' | 'vaccine' | 'ors' | 'other';
export type DrugUnitEnum = 'tablet' | 'capsule' | 'ml' | 'vial' | 'sachet' | 'tube';
export type BatchStatusEnum = 'active' | 'expired' | 'quarantined' | 'depleted';
export type WriteOffReasonEnum = 'expired' | 'damaged' | 'contaminated' | 'recalled' | 'other';
export type TransactionTypeEnum = 'receive' | 'dispense' | 'write_off' | 'transfer_in' | 'transfer_out' | 'adjustment';

export interface DrugResponse {
  id: string;
  name: string;
  category: DrugCategoryEnum;
  unit: DrugUnitEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DrugCreateRequest {
  name: string;
  category: DrugCategoryEnum;
  unit: DrugUnitEnum;
}

export interface InventoryBatchResponse {
  id: string;
  facility_id: string;
  drug_id: string;
  drug_name?: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  received_at?: string;
  status: BatchStatusEnum;
  created_at: string;
  updated_at: string;
  days_until_expiry?: number;
}

export interface StockReceiveRequest {
  drug_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  received_at?: string | null;
}

export interface StockDispenseRequest {
  drug_id: string;
  quantity: number;
  reason?: string | null;
}

export interface DispenseResponse {
  message: string;
  total_dispensed: number;
  drug_id: string;
  facility_id: string;
  remaining_stock: number;
  batches_affected?: Array<{
    batch_id: string;
    batch_number: string;
    deducted: number;
    remaining: number;
    status: string;
  }>;
}

export interface StockWriteOffRequest {
  batch_id: string;
  quantity: number;
  reason_category: WriteOffReasonEnum;
  reason: string;
}

export interface StockTransactionResponse {
  id: string;
  facility_id: string;
  drug_id: string;
  batch_id?: string | null;
  transaction_type: TransactionTypeEnum;
  quantity: number;
  balance_after: number;
  reference_id?: string | null;
  reason?: string | null;
  recorded_by: string;
  created_at: string;
  drug_name?: string;
}

export interface InventoryMyScopeItem {
  facility_id: string;
  facility_name: string;
  facility_code: string;
  district_id: string;
  district_name: string;
  total_batches: number;
  total_quantity: number;
  expiring_30d_count: number;
}

// ---------------- Backend Bed API Types ----------------
export type BedTypeEnum = 'general' | 'icu' | 'oxygen' | 'maternity' | 'pediatric';

export interface BedInventoryResponse {
  id: string;
  facility_id: string;
  bed_type: BedTypeEnum;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BedSummaryResponse {
  facility_id: string;
  total_beds: number;
  total_occupied: number;
  total_available: number;
  by_type: BedInventoryResponse[];
}

export interface BedCreateRequest {
  bed_type: BedTypeEnum;
  total_beds: number;
}

export interface BedUpdateRequest {
  occupied_beds?: number | null;
  total_beds?: number | null;
}

export interface BedOccupancyLogResponse {
  id: string;
  facility_id: string;
  bed_type: BedTypeEnum;
  previous_occupied: number;
  new_occupied: number;
  previous_total: number;
  new_total: number;
  recorded_by: string;
  recorded_at: string;
}

// ---------------- Backend Attendance API Types ----------------
export type AttendanceStatusEnum = 'present' | 'absent' | 'leave' | 'half_day' | 'on_duty';

export interface RosterItemResponse {
  user_id: string;
  full_name: string;
  user_email: string;
  status: AttendanceStatusEnum | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
  attendance_id?: string | null;
}

export interface AttendanceMarkRequest {
  user_id: string;
  status: AttendanceStatusEnum;
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
  attendance_date: string;
}

export interface AttendanceBulkMarkRequest {
  attendance_date: string;
  entries: Array<{
    user_id: string;
    status: AttendanceStatusEnum;
    check_in_time?: string | null;
    check_out_time?: string | null;
    remarks?: string | null;
  }>;
}

export interface AttendanceCorrectionRequest {
  status: AttendanceStatusEnum;
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
  reason: string;
}

export interface AttendanceResponse {
  id: string;
  facility_id: string;
  user_id: string;
  attendance_date: string;
  status: AttendanceStatusEnum;
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
  recorded_by: string;
  recorded_at: string;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
}

export interface AttendanceSummaryResponse {
  facility_id: string;
  from_date: string;
  to_date: string;
  total_records: number;
  present_count: number;
  absent_count: number;
  leave_count: number;
  half_day_count: number;
  on_duty_count: number;
  attendance_rate: number;
}

export interface ApprovePhcRequestResponse {
  status: string;
  action: string;
  user_id: string;
  scope_level: string;
}

export type User = UserResponse | UserProfileResponse | {
  id?: string;
  email?: string;
  full_name?: string;
  scope_level?: ScopeLevel | string;
  scope_id?: string | null;
  roles?: Array<{ name: string } | string>;
  permissions?: string[];
  [key: string]: any;
};

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserResponse;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

export interface HealthResponse {
  status: string;
  service?: string;
  environment?: string;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  requestPayload?: unknown;
  responseBody?: unknown;
  error?: string;
  headers?: Record<string, string>;
}

// ---------------- Screen Navigation Types ----------------
export type CommonScreenKey = 'profile' | 'notifications';

export type L0ScreenKey =
  | 'admin_dashboard'
  | 'user_management'
  | 'fl_orchestration'
  | 'node_management'
  | 'system_settings';

export type L1ScreenKey =
  | 'national_dashboard'
  | 'cross_state_redistribution'
  | 'national_alerts'
  | 'national_forecast'
  | 'reports_analytics'
  | 'fl_overview';

export type L2ScreenKey =
  | 'state_dashboard'
  | 'state_redistribution'
  | 'state_alerts'
  | 'state_forecast'
  | 'district_management'
  | 'fl_participation';

export type L3ScreenKey =
  | 'district_dashboard'
  | 'redistribution_recommendations'
  | 'indent_approvals'
  | 'district_forecast'
  | 'phc_management'
  | 'district_alerts'
  | 'fl_node_status';

export type L5ScreenKey =
  | 'phc_dashboard'
  | 'inventory_stock' 
  | 'bed_management'
  | 'staff_attendance'
  | 'stock_request'
  | 'redistribution_requests'
  | 'forecast_view'
  | 'patient_footfall'
  | 'reports'
  | 'alerts';

export type ActiveScreen = CommonScreenKey | L0ScreenKey | L1ScreenKey | L2ScreenKey | L3ScreenKey | L5ScreenKey;

export interface NavItem {
  id: ActiveScreen;
  key?: string;
  label: string;
  labelHi?: string;
  labelBn?: string;
  icon: string;
  badge?: number | string;
  badgeColor?: string;
  section?: string;
}

// ---------------- Domain Data Types ----------------
export type StockStatus = 'CRITICAL' | 'REORDER' | 'ADEQUATE';

export interface InventoryItem {
  id: string;
  drugCode?: string;
  code?: string;
  name: string;
  category: string;
  dosage?: string;
  currentStock: number;
  minThreshold?: number;
  minRequired?: number;
  maxThreshold?: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  status: StockStatus;
  lastUpdated?: string;
  coldChain?: boolean;
  storageCondition?: string;
  daysOfSupply?: number;
}

export interface BedCategory {
  id: string;
  name: string;
  total: number;
  occupied: number;
  available: number;
  oxygenSupported?: boolean;
  ventilatorSupported?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Medical Officer' | 'Staff Nurse' | 'Pharmacist' | 'Lab Technician' | 'ANM / ASHA' | string;
  phone: string;
  status: 'PRESENT' | 'ON_DUTY' | 'ABSENT' | 'ON_LEAVE';
  shift: 'Morning' | 'Evening' | 'Night' | 'General' | string;
  checkInTime?: string;
  checkIn?: string;
}

export interface IndentRequest {
  id: string;
  indentNumber: string;
  phcId?: string;
  phcName: string;
  districtId?: string;
  districtName?: string;
  drugCode: string;
  drugName: string;
  requestedQty: number;
  recommendedQty: number;
  approvedQty?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
  createdAt: string;
  urgency: 'HIGH' | 'MEDIUM' | 'EMERGENCY' | 'URGENT' | 'ROUTINE' | string;
  notes?: string;
}

export interface RedistributionTransfer {
  id: string;
  transferNumber: string;
  tier: 'INTER_STATE' | 'INTRA_STATE' | 'INTER_PHC';
  sourceFacility: string;
  destinationFacility: string;
  item: string;
  quantity: number;
  unit: string;
  urgency: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'URGENT';
  status: 'RECOMMENDED' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED' | 'DELIVERED';
  distanceKm: number;
  costSavingsEst: string;
  createdAt: string;
  approvedBy?: string;
}

export interface AlertNotification {
  id: string;
  title: string;
  description: string;
  type: 'STOCK_OUT' | 'EXPIRY' | 'COLD_CHAIN' | 'OUTBREAK_SIGNAL' | 'TRANSFER_REQUEST' | 'SYSTEM' | 'COLD_CHAIN_EXCURSION' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
  facility?: string;
  district?: string;
  state?: string;
  isRead: boolean;
  actionRequired?: boolean;
}

export interface FlRound {
  roundNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'AGGREGATING';
  globalAccuracy: number;
  loss: number;
  participatingNodes: number;
  totalNodes: number;
  startTime: string;
  completedTime?: string;
  convergenceProgress: number;
}

// ---------------- Truck / Fleet Onboarding Types (Additions) ----------------

export type TruckStatusEnum = 'available' | 'in_transit' | 'maintenance' | 'inactive';

export interface Truck {
  id: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  status: TruckStatusEnum;
  current_location?: string;
  assigned_facility_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TruckCreate {
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  status?: TruckStatusEnum;
  current_location?: string;
  assigned_facility_id?: string | null;
}

export interface TruckUpdate {
  truck_number?: string;
  driver_name?: string;
  driver_phone?: string;
  capacity?: number;
  status?: TruckStatusEnum;
  current_location?: string;
  assigned_facility_id?: string | null;
}

export interface TruckListResponse {
  items: Truck[];
  pagination: PaginationMeta;
}

// ---------------- Pagination Meta (Extracted) ----------------

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

// ---------------- DrugCreate alias (matches component import) ----------------

// The component imports `DrugCreate`, but the file already exports `DrugCreateRequest`.
// This alias keeps backward-compatibility without renaming the existing type.
export type DrugCreate = DrugCreateRequest;

// ---------------- Additional Inventory Scope Response Wrappers ----------------

export interface InventoryMyScopeAggregate {
  total_facilities: number;
  total_batches: number;
  total_quantity: number;
  total_expiring_30d: number;
}

export interface InventoryMyScopeResponse {
  scope_level: string;
  scope_name: string;
  items: InventoryMyScopeItem[];
  aggregate: InventoryMyScopeAggregate;
  pagination: PaginationMeta;
}

export interface StockTransactionListResponse {
  items: StockTransactionResponse[];
  pagination: PaginationMeta;
}

// ---------------- Bed Scope Response Wrappers ----------------

export interface BedMyScopeItem {
  facility_id: string;
  facility_name: string;
  facility_code: string;
  district_id: string;
  district_name: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
}

export interface BedMyScopeAggregate {
  total_facilities: number;
  total_beds: number;
  total_occupied: number;
  total_available: number;
  overall_occupancy_rate: number;
}

export interface BedMyScopeResponse {
  scope_level: string;
  scope_name: string;
  items: BedMyScopeItem[];
  aggregate: BedMyScopeAggregate;
  pagination: PaginationMeta;
}

export interface BedHistoryListResponse {
  items: BedOccupancyLogResponse[];
  pagination: PaginationMeta;
}

// ---------------- Attendance Scope Response Wrappers ----------------

export interface AttendanceMyScopeItem {
  facility_id: string;
  facility_name: string;
  facility_code: string;
  district_id: string;
  district_name: string;
  total_staff: number;
  present_count: number;
  absent_count: number;
  leave_count: number;
  half_day_count: number;
  on_duty_count: number;
  marked_count: number;
  attendance_rate: number;
}

export interface AttendanceMyScopeAggregate {
  total_facilities: number;
  total_staff: number;
  total_present: number;
  total_absent: number;
  total_leave: number;
  total_half_day: number;
  total_on_duty: number;
  total_marked: number;
  overall_attendance_rate: number;
}

export interface AttendanceMyScopeResponse {
  scope_level: string;
  scope_name: string;
  items: AttendanceMyScopeItem[];
  aggregate: AttendanceMyScopeAggregate;
  pagination: PaginationMeta;
}

export interface AttendanceHistoryListResponse {
  items: AttendanceResponse[];
  pagination: PaginationMeta;
}


