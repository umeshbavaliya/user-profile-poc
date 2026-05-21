import { ProfileModel, ValidationResult } from '../models/profile/profile-model';

/**
 * Server-side validation Helper conforming to Acceptance Criteria #2
 */
export const validatePayload = (payload: ProfileModel): ValidationResult => {
  const { first_name, last_name, dob, email, country, city } = payload;
  const errors: Partial<Record<keyof ProfileModel, string>> = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!first_name || !first_name.trim()) errors.first_name = 'First name is mandatory.';
  if (!last_name || !last_name.trim()) errors.last_name = 'Last name is mandatory.';
  if (!dob) errors.dob = 'Date of birth is mandatory.';
  
  if (!email || !email.trim()) {
    errors.email = 'Email address is mandatory.';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Email structure is invalid.';
  }

  if (!country || !['US', 'India'].includes(country)) {
    errors.country = 'Country is mandatory and restricted to US or India.';
  }

  const validCities: Record<'US' | 'India', string[]> = {
    'US': ['New York', 'Los Angeles', 'Chicago'],
    'India': ['Mumbai', 'Delhi', 'Bangalore']
  };

  if (country && (!city || !validCities[country].includes(city))) {
    errors.city = `City is mandatory and must belong to selected country (${country}).`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
