import { describe, it, expect } from 'vitest';
import { validatePayload } from './validation';

describe('validatePayload', () => {
  it('returns valid for a complete and correct payload', () => {
    const payload = {
      first_name: 'John',
      last_name: 'Smith',
      dob: '1990-12-31',
      email: 'john.smith@example.com',
      country: 'India',
      city: 'Mumbai'
    };

    const result = validatePayload(payload as any);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns errors for missing required fields', () => {
    const payload = {
      first_name: '',
      last_name: '',
      dob: '',
      email: '',
      country: 'US',
      city: ''
    };

    const result = validatePayload(payload as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toMatchObject({
      first_name: 'First name is mandatory.',
      last_name: 'Last name is mandatory.',
      dob: 'Date of birth is mandatory.',
      email: 'Email address is mandatory.',
      city: expect.any(String)
    });
  });

  it('returns an error for invalid email format', () => {
    const payload = {
      first_name: 'John',
      last_name: 'Smith',
      dob: '1990-12-31',
      email: 'invalid-email',
      country: 'US',
      city: 'New York'
    };

    const result = validatePayload(payload as any);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe('Email structure is invalid.');
  });

  it('returns an error when city does not match country', () => {
    const payload = {
      first_name: 'John',
      last_name: 'Smith',
      dob: '1990-12-31',
      email: 'john@example.com',
      country: 'India',
      city: 'New York'
    };

    const result = validatePayload(payload as any);

    expect(result.isValid).toBe(false);
    expect(result.errors.city).toContain('City is mandatory and must belong to selected country');
  });
});
