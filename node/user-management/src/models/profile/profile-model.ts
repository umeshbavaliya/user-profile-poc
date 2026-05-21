/**
 * Profile Model - Represents the structure for profile data
 */
export interface ProfileModel {
  first_name: string;
  last_name: string;
  dob: string;
  email: string;
  country: 'US' | 'India';
  city: string;
}

/**
 * Validation response structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof ProfileModel, string>>;
}
