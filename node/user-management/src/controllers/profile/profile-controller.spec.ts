import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProfile } from './create-profile';
import { getAllProfiles } from './get-all-profiles';
import { updateProfile } from './update-profile';
import { deleteProfile } from './delete-profile';

const createResMock = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as any;
};

const buildService = (overrides: Partial<Record<string, any>> = {}) => ({
  createProfile: vi.fn(),
  getAllProfiles: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
  ...overrides
});

describe('Profile controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProfile', () => {
    it('returns 201 when profile is created successfully', async () => {
      const profileService = buildService({
        createProfile: vi.fn().mockResolvedValue({ id: 10, email: 'test@example.com' })
      });
      const req = { body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'New York'
      }} as any;
      const res = createResMock();

      await createProfile(profileService as any)(req, res);

      expect(profileService.createProfile).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ profileId: 10, message: expect.any(String) }));
    });

    it('returns 400 when validation fails', async () => {
      const profileService = buildService();
      const req = { body: {
        first_name: '',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'invalid-email',
        country: 'India',
        city: 'Mumbai'
      }} as any;
      const res = createResMock();

      await createProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.objectContaining({ first_name: expect.any(String), email: expect.any(String) }) }));
    });

    it('returns 409 when email is already registered', async () => {
      const profileService = buildService({
        createProfile: vi.fn().mockRejectedValue(new Error('Email address is already registered.'))
      });
      const req = { body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'New York'
      }} as any;
      const res = createResMock();

      await createProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email address is already registered.' });
    });

    it('returns 500 on unexpected service failures', async () => {
      const profileService = buildService({
        createProfile: vi.fn().mockRejectedValue(new Error('Unexpected db error'))
      });
      const req = { body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'New York'
      }} as any;
      const res = createResMock();

      await createProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database failure during profile insertion.' });
    });
  });

  describe('getAllProfiles', () => {
    it('returns 200 and the profile list when service succeeds', async () => {
      const result = { profiles: [{ id: 1, first_name: 'Jane', last_name: 'Doe', dob: '1990-01-01', email: 'test@example.com', country: 'US', city: 'New York' }], total: 1 };
      const profileService = buildService({
        getAllProfiles: vi.fn().mockResolvedValue(result)
      });
      const req = { query: { search: 'Jane' } } as any;
      const res = createResMock();

      await getAllProfiles(profileService as any)(req, res);

      expect(profileService.getAllProfiles).toHaveBeenCalledWith('Jane');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('returns 500 when the service throws', async () => {
      const profileService = buildService({
        getAllProfiles: vi.fn().mockRejectedValue(new Error('db failure'))
      });
      const req = { query: {} } as any;
      const res = createResMock();

      await getAllProfiles(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error while retrieving profiles.' });
    });
  });

  describe('updateProfile', () => {
    it('returns 200 when profile is updated successfully', async () => {
      const profileService = buildService({
        updateProfile: vi.fn().mockResolvedValue({ success: true, message: 'Profile successfully updated' })
      });
      const req = { params: { id: '1' }, body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'India',
        city: 'Mumbai'
      }} as any;
      const res = createResMock();

      await updateProfile(profileService as any)(req, res);

      expect(profileService.updateProfile).toHaveBeenCalledWith('1', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile successfully updated' });
    });

    it('returns 400 when validation fails', async () => {
      const profileService = buildService();
      const req = { params: { id: '1' }, body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'bad-email',
        country: 'US',
        city: 'New York'
      }} as any;
      const res = createResMock();

      await updateProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.objectContaining({ email: expect.any(String) }) }));
    });

    it('returns 404 when profile does not exist', async () => {
      const profileService = buildService({
        updateProfile: vi.fn().mockRejectedValue(new Error('Profile not found'))
      });
      const req = { params: { id: '999' }, body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'Chicago'
      }} as any;
      const res = createResMock();

      await updateProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile not found.' });
    });

    it('returns 409 when email is already taken', async () => {
      const profileService = buildService({
        updateProfile: vi.fn().mockRejectedValue(new Error('Email is already taken by another account'))
      });
      const req = { params: { id: '1' }, body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'New York'
      }} as any;
      const res = createResMock();

      await updateProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is already taken by another account.' });
    });

    it('returns 500 when an unexpected error occurs', async () => {
      const profileService = buildService({
        updateProfile: vi.fn().mockRejectedValue(new Error('Unexpected db issue'))
      });
      const req = { params: { id: '1' }, body: {
        first_name: 'Jane',
        last_name: 'Doe',
        dob: '1990-01-01',
        email: 'test@example.com',
        country: 'US',
        city: 'Chicago'
      }} as any;
      const res = createResMock();

      await updateProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database failure during profile edit.' });
    });
  });

  describe('deleteProfile', () => {
    it('returns 200 when delete succeeds', async () => {
      const profileService = buildService({
        deleteProfile: vi.fn().mockResolvedValue({ success: true, message: 'Profile deleted successfully' })
      });
      const req = { params: { id: '1' } } as any;
      const res = createResMock();

      await deleteProfile(profileService as any)(req, res);

      expect(profileService.deleteProfile).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile deleted successfully' });
    });

    it('returns 404 when profile does not exist', async () => {
      const profileService = buildService({
        deleteProfile: vi.fn().mockRejectedValue(new Error('Profile to delete does not exist'))
      });
      const req = { params: { id: '999' } } as any;
      const res = createResMock();

      await deleteProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile to delete does not exist.' });
    });

    it('returns 500 when delete fails unexpectedly', async () => {
      const profileService = buildService({
        deleteProfile: vi.fn().mockRejectedValue(new Error('Unexpected db issue'))
      });
      const req = { params: { id: '1' } } as any;
      const res = createResMock();

      await deleteProfile(profileService as any)(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database failure during profile deletion.' });
    });
  });
});
