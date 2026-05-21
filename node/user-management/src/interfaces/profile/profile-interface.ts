import { ProfileModel, ValidationResult } from '../../models/profile/profile-model';

// Profile data structure (database model)
export interface Profile {
  id?: number;
  first_name: string;
  last_name: string;
  dob: string;
  email: string;
  country: 'US' | 'India';
  city: string;
  created_at?: string;
  updated_at?: string;
}

// Re-export ProfileModel and ValidationResult from models
export type { ProfileModel, ValidationResult } from '../../models/profile/profile-model';

// API Response structure
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  errors?: Record<string, string>;
  profileId?: number;
}

// Database query result types
export interface GetAllProfilesResult {
  profiles: Profile[];
  total?: number;
}

export interface CreateProfileResult {
  id: number;
  email: string;
}

export interface UpdateProfileResult {
  success: boolean;
  message: string;
}

export interface DeleteProfileResult {
  success: boolean;
  message: string;
}
