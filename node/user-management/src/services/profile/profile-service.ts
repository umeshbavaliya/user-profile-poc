import { Pool } from 'mysql2/promise';
import {
  Profile,
  ProfileModel,
} from '../../interfaces/profile/profile-interface';
import {
  GetAllProfilesResult,
  CreateProfileResult,
  UpdateProfileResult,
  DeleteProfileResult
} from '../../interfaces/profile/profile-interface';

export class ProfileService {
  constructor(private pool: Pool) {}

  /**
   * Fetch all profiles with optional search filter
   */
  async getAllProfiles(searchTerm?: string): Promise<GetAllProfilesResult> {
    try {
      let query = 'SELECT * FROM profiles';
      let params: string[] = [];

      if (searchTerm && searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query += ' WHERE first_name LIKE ? OR last_name LIKE ?';
        params = [term, term];
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await this.pool.execute(query, params);
      return {
        profiles: rows as Profile[],
        total: (rows as Profile[]).length
      };
    } catch (error) {
      console.error('Database error in getAllProfiles:', error);
      throw new Error('Failed to fetch profiles from database');
    }
  }

  /**
   * Create a new profile
   */
  async createProfile(payload: ProfileModel): Promise<CreateProfileResult> {
    try {
      // Check email uniqueness
      const [existing]: any = await this.pool.execute(
        'SELECT id FROM profiles WHERE email = ?',
        [payload.email.trim()]
      );

      if (existing.length > 0) {
        throw new Error('Email address is already registered.');
      }

      const query = `
        INSERT INTO profiles (first_name, last_name, dob, email, country, city) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result]: any = await this.pool.execute(query, [
        payload.first_name.trim(),
        payload.last_name.trim(),
        payload.dob,
        payload.email.trim(),
        payload.country,
        payload.city
      ]);

      return {
        id: result.insertId,
        email: payload.email.trim()
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('already registered')) {
        throw error;
      }
      console.error('Database error in createProfile:', error);
      throw new Error('Failed to create profile in database');
    }
  }

  /**
   * Update an existing profile
   */
  async updateProfile(id: string, payload: ProfileModel): Promise<UpdateProfileResult> {
    try {
      // Check if profile exists
      const [profile]: any = await this.pool.execute(
        'SELECT id FROM profiles WHERE id = ?',
        [id]
      );

      if (profile.length === 0) {
        throw new Error('Profile not found');
      }

      // Check email uniqueness (excluding current ID)
      const [emailCheck]: any = await this.pool.execute(
        'SELECT id FROM profiles WHERE email = ? AND id != ?',
        [payload.email.trim(), id]
      );

      if (emailCheck.length > 0) {
        throw new Error('Email is already taken by another account');
      }

      const query = `
        UPDATE profiles 
        SET first_name = ?, last_name = ?, dob = ?, email = ?, country = ?, city = ? 
        WHERE id = ?
      `;

      await this.pool.execute(query, [
        payload.first_name.trim(),
        payload.last_name.trim(),
        payload.dob,
        payload.email.trim(),
        payload.country,
        payload.city,
        id
      ]);

      return {
        success: true,
        message: 'Profile successfully updated'
      };
    } catch (error) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('already taken'))) {
        throw error;
      }
      console.error('Database error in updateProfile:', error);
      throw new Error('Failed to update profile in database');
    }
  }

  /**
   * Delete a profile
   */
  async deleteProfile(id: string): Promise<DeleteProfileResult> {
    try {
      // Check if profile exists
      const [profile]: any = await this.pool.execute(
        'SELECT id FROM profiles WHERE id = ?',
        [id]
      );

      if (profile.length === 0) {
        throw new Error('Profile to delete does not exist');
      }

      await this.pool.execute('DELETE FROM profiles WHERE id = ?', [id]);

      return {
        success: true,
        message: 'Profile deleted successfully'
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw error;
      }
      console.error('Database error in deleteProfile:', error);
      throw new Error('Failed to delete profile from database');
    }
  }
}
