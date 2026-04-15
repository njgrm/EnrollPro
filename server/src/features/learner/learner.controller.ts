import { Request, Response } from "express";

/**
 * Lookup learner records using LRN, Birthdate, and PIN.
 * POST /api/learner/lookup
 */
export const lookupLearner = async (req: Request, res: Response) => {
  return res.status(410).json({
    message:
      "Learner portal lookup is temporarily unavailable while migrating away from legacy applicant records.",
  });
};
