export type UserRole = 'admin' | 'compliance_officer' | 'support_staff';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard',
    'view_cases',
    'view_case_detail',
    'approve_case',
    'reject_case',
    'flag_case',
    'add_notes',
    'run_aml_screening',
    'user_lookup',
    'view_settings',
    'manage_users',
    'view_audit_logs',
    'export_data',
    'view_analytics',
    'view_verifications',
    'create_verification',
    'review_verification',
    'view_kyb',
    'create_kyb',
    'review_kyb',
    'manage_api_keys',
    'manage_webhooks',
    'manage_gdpr',
    'view_monitoring',
    'manage_sanctions',
  ],
  compliance_officer: [
    'view_dashboard',
    'view_cases',
    'view_case_detail',
    'approve_case',
    'reject_case',
    'flag_case',
    'add_notes',
    'run_aml_screening',
    'user_lookup',
    'view_settings',
    'view_analytics',
    'view_audit_logs',
    'view_verifications',
    'create_verification',
    'review_verification',
    'view_kyb',
    'view_monitoring',
  ],
  support_staff: [
    'view_dashboard',
    'view_cases',
    'view_case_detail',
    'add_notes',
    'user_lookup',
    'view_settings',
    'view_verifications',
    'view_kyb',
  ]
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  compliance_officer: 'Compliance Officer',
  support_staff: 'Support Staff'
};
