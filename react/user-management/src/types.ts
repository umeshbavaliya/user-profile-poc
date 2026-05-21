export type Country = 'US' | 'India';

export interface ProfileForm {
  first_name: string;
  last_name: string;
  dob: string | Date;
  email: string;
  country: Country;
  city: string;
}

export interface Profile extends ProfileForm {
  id: number;
  created_at?: string;
  updated_at?: string;
}

export type ValidationErrors = Partial<Record<keyof ProfileForm, string>>;

export interface GetProfilesResponse {
  profiles: Profile[];
  total?: number;
}
