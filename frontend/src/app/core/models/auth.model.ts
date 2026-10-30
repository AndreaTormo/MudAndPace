export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  _id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  birthDate?: string | null;
  created_At?: string;
  updated_at?: string;
}

export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  isActive: boolean;
  emailVerified: boolean;
  profile?: UserProfile;
  created_At?: string;
  updated_at?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  birthDate?: string | null;
}

export interface UpdateUserPayload {
  name: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  city?: string;
  country?: string;
  birthDate?: string | null;
}
