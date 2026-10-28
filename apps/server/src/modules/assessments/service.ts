import * as repo from './repository';
import { createError } from '../../middleware/error-handler';
import { issueCertificationOnPass } from '../certifications/service';

export async function listAssessments() {
  return repo.findAllAssessments();
}

export async function submitAssessment(
  assessmentId: string,
  userId: string,
  score: number
) {
  const assessment = await repo.findAssessmentById(assessmentId);
  if (!assessment) throw createError('Assessment not found', 404);

  // Check attempt count
  const attempts = await repo.countAttempts(assessmentId, userId);
  if (attempts >= assessment.max_attempts) {
    throw createError(`Maximum attempts (${assessment.max_attempts}) reached`, 409);
  }

  // Check not already passed
  const alreadyPassed = await repo.findPassingResultForUser(assessmentId, userId);
  if (alreadyPassed) throw createError('Assessment already passed', 409);

  const attemptNo = attempts + 1;
  const passed = score >= assessment.pass_score;

  const result = await repo.insertResult(assessmentId, userId, score, attemptNo, passed);

  // Auto-issue certification on pass
  if (passed) {
    await issueCertificationOnPass(userId, assessment.course_id);
  }

  return { ...result, passed, assessment };
}

export async function getResults(assessmentId: string) {
  const assessment = await repo.findAssessmentById(assessmentId);
  if (!assessment) throw createError('Assessment not found', 404);
  return repo.findResultsByAssessmentId(assessmentId);
}
