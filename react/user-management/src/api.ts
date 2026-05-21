import type { GetProfilesResponse, ProfileForm } from './types';

const toJson = async (response: Response) => {
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(parsed?.message || response.statusText || 'API request failed');
  }
  return parsed;
};

export const getProfilesApi = async (search?: string): Promise<GetProfilesResponse> => {
  const url = new URL('/api/profiles', window.location.origin);
  if (search) url.searchParams.set('search', search);

  const response = await fetch(url.toString());
  return toJson(response);
};

export const createProfileApi = async (payload: ProfileForm) => {
  const response = await fetch('/api/profiles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return toJson(response);
};

export const updateProfileApi = async (id: number, payload: ProfileForm) => {
  const response = await fetch(`/api/profiles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return toJson(response);
};

export const deleteProfileApi = async (id: number) => {
  const response = await fetch(`/api/profiles/${id}`, {
    method: 'DELETE'
  });
  return toJson(response);
};
