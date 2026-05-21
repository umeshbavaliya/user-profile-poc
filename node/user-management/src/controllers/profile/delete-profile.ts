import { Request, Response } from 'express';
import { ApiResponse } from '../../interfaces/profile/profile-interface';
import { ProfileService } from '../../services/profile/profile-service';

/**
 * DELETE A PROFILE (CRUD - DELETE)
 */
export const deleteProfile = (profileService: ProfileService) => {
  return async (
    req: Request<{ id: string }>,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Delete profile via service
      const result = await profileService.deleteProfile(id);

      const response: ApiResponse = {
        message: result.message
      };

      res.status(200).json(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('does not exist')) {
        res.status(404).json({
          message: 'Profile to delete does not exist.'
        });
      } else {
        console.error('Error in deleteProfile controller:', error);
        res.status(500).json({
          message: 'Database failure during profile deletion.'
        });
      }
    }
  };
};
