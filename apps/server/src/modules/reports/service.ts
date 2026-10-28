import * as repo from './repository';

export async function getComplianceReport(departmentId?: string) {
  return repo.getComplianceReport(departmentId);
}
