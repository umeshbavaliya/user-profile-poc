import { Request, Response } from 'express';
import { ProfileService } from '../../services/profile/profile-service';

/**
 * GET ALL PROFILES WITH OPTIONAL QUERY FILTER (AC #4)
 */
export const getAllProfiles = (profileService: ProfileService) => {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;
      const searchTerm = search && typeof search === 'string' ? search : undefined;

      const result = await profileService.getAllProfiles(searchTerm);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllProfiles controller:', error);
      res.status(500).json({
        message: 'Internal server error while retrieving profiles.'
      });
    }
  };
};
