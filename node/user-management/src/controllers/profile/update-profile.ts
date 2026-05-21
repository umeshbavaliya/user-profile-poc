import { Request, Response } from 'express';
import { ProfileModel } from '../../models/profile/profile-model';
import { ApiResponse } from '../../interfaces/profile/profile-interface';
import { ProfileService } from '../../services/profile/profile-service';
import { validatePayload } from '../../utils/validation';

/**
 * UPDATE AN EXISTING PROFILE (CRUD - PUT)
 */
export const updateProfile = (profileService: ProfileService) => {
  return async (
    req: Request<{ id: string }, {}, ProfileModel>,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Validate payload
      const validation = validatePayload(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation checks failed on server.',
          errors: validation.errors
        });
        return;
      }

      // Update profile via service
      const result = await profileService.updateProfile(id, req.body);

      const response: ApiResponse = {
        message: result.message
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        res.status(404).json({
          message: 'Profile not found.'
        });
      } else if (errorMessage.includes('already taken')) {
        res.status(409).json({
          message: 'Email is already taken by another account.'
        });
      } else {
        console.error('Error in updateProfile controller:', error);
        res.status(500).json({
          message: 'Database failure during profile edit.'
        });
      }
    }
  };
};
