import { GetCitySubmitionHistoryReponseDto } from "src/app/core/models/AssessmentResponse";

export interface CityHistoryDto {
  totalCity: number;
  totalAnalyst: number;
  totalEvaluator: number;
  activeCity: number;
  totalAccessCity: number;
  compeleteCity: number;
  inprocessCity: number;
  avgHighScore: number;
  avgLowerScore: number;
  overallVitalityScore: number;
  finalizeCity: number;
  unFinalize: number;
}

export interface CardHistoryDto {
  totalExecutives: number;
  totalAnalysts: number;
  totalEvaluators: number;

  totalAssessments: number;
  totalCompletedAssessments: number;
  totalInProgressAssessments: number;

  averagePillarScore: number;
  highestPillarScore: PillarCardDetailsDto;
  lowestPillarScore: PillarCardDetailsDto;
  totalOverdue: number;
  totalHighRisk: number;
  totalAtRisk: number;
  totalDueSoon: number;
  totalOnTrack: number;
  minimumCompletionRateEvaluator?: evaluatorCompletionSummaryDto;
  maximumCompletionRateEvaluator?: evaluatorCompletionSummaryDto;
  riskDetails: RiskDetailDto[];
  totalCriticalQuestions:number | 0;
  totalAnsweredCriticalQuestions:number | 0;
}
export interface RiskDetailDto {
  mappingId: number;
  assessmentName: string;
  ownerName: string;
  dueDate?: string | null;   // DateTime? → optional string (ISO date)
  progress: number;
  riskLevel: string;
  daysRemaining: number;
}

export interface evaluatorCompletionSummaryDto{
  evaluatorName: string;
  completionRate: number;
}
export interface PillarCardDetailsDto {
  pillarID: number;
  pillarName: string;
  value: number;
}

export interface GetCityQuestionHistoryReponseDto
  extends GetCitySubmitionHistoryReponseDto {
  pillars: CityPillarQuestionHistoryReponseDto[];
}

export interface CityPillarQuestionHistoryReponseDto {
  pillarID: number;
  pillarName: string;
  score: number;
  scoreProgress: number;
  ansPillar: number;
  totalQuestion: number;
  ansQuestion: number;
  imagePath: string;
  isAccess: boolean;
  totalCriticalQuestions: number;
  totalAnsweredCriticalQuestions: number;
}

export interface GetCitiesSubmitionHistoryReponseDto
  extends GetCitySubmitionHistoryReponseDto {
  cityName: string;
}
export interface CityPillarHistoryReponseDto
  extends CityPillarQuestionHistoryReponseDto {
  userID: number;
  fullName: string;
}

export interface UserCityRequstDto extends UserCityPillarDashboardRequstDto {
  userID: number;
}

export interface UserCityPillarDashboardRequstDto {
   
  updatedAt: string;
}

export interface UserAssessmentPillarDashboardRequstDto {
  userAssessmentMappingID?: number;
}