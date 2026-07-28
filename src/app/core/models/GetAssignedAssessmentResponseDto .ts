export interface GetAssignedAssessmentResponseDto {
  userAssessmentMappingID: number;
  year: number;
  userID: number;
  dueDate?: string | null;      // DateTime? → string (ISO) or null
  updatedAt?: string | null;
  assignedBy?: string | null;
  geographicReference: string;
  userPillarMappings: AssignedAssessmentPillarMappingDto[];
}
export interface AssignedAssessmentPillarMappingDto {
  userPillarMappingID: number;
  year: number;
  userID: number;
  dueDate?: string | null;
  pillarID: number;
  pillarName: string;
  description: string;
  displayOrder: number;
  imagePath: string;
  totalScore: number;
  totalAnsweredQuestions: number;
  totalQuestions: number;
  scoreProgress: number;
  completionRate: number;
}


export interface GetExecutiveAssignedAssessmentResponseDto {
  userAssessmentMappingID: number;
  year: number;
  userID: number;
  dueDate?: string | null;
  updatedAt?: string | null;
  assignedBy: string;
  geographicReference: string;
  avgTotalScore: number;
  totalAnsweredQuestions: number;
  totalQuestions: number;
  totalCriticalAnsweredQuestions: number;
  totalCriticalQuestions: number;
  avgScoreProgress: number;
  avgCompletionRate: number;
  bestPerformingPillar?: string;
  worstPerformingPillar?: string;
  bestCompletionRate: number;
  worstCompletionRate: number;
  riskLevel: string;
  daysRemaining: number;
  progress: number;
  onTrackPercent: number;
  offTrackPercent: number;
  atRiskPercent: number;
}