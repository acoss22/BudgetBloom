export interface User { id: string; email: string; displayName: string; createdAtUtc: string; }
export interface Credentials { email: string; password: string; rememberMe?: boolean; }
export interface Registration extends Credentials { displayName: string; }
