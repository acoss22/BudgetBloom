export interface User { id: string; email: string; displayName: string; createdAtUtc: string; }
export interface Credentials { email: string; password: string; rememberMe?: boolean; }
export interface Registration extends Credentials { displayName: string; }
export interface ProfileUpdate { displayName: string; email: string; }
export interface PasswordChange { currentPassword: string; newPassword: string; }
