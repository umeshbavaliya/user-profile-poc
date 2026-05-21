import { Request, Response } from 'express';
import { ProfileModel } from '../../models/profile/profile-model';
import { ApiResponse } from '../../interfaces/profile/profile-interface';
import { ProfileService } from '../../services/profile/profile-service';
import { validatePayload } from '../../utils/validation';

/**
 * CREATE A PROFILE (AC #1, AC #2, AC #3)
 */
export const createProfile = (profileService: ProfileService) => {
  return async (
    req: Request<{}, {}, ProfileModel>,
    res: Response
  ): Promise<void> => {
    try {
      // Validate payload
      const validation = validatePayload(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          message: 'Validation checks failed on server.',
          errors: validation.errors
        });
        return;
      }

      // Create profile via service
      const result = await profileService.createProfile(req.body);

      const response: ApiResponse = {
        message: 'Profile created successfully in database.',
        profileId: result.id,
        data: { id: result.id }
      };

      res.status(201).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('already registered')) {
        res.status(409).json({
          message: 'Email address is already registered.'
        });
      } else {
        console.error('Error in createProfile controller:', error);
        res.status(500).json({
          message: 'Database failure during profile insertion.'
        });
      }
    }
  };
};
