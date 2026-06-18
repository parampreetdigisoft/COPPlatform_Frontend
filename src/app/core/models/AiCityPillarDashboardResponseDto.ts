export interface AiCityPillarDashboardResponseDto {
   
  cityName: string;
  evaluationValue: number;
  aiValue: number;
  pillars: CityPillarDashboardPillarValueDto[];
}

export interface CityPillarDashboardPillarValueDto {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  evaluationValue: number;
  aiValue: number;
}


export interface AiCityPillarDashboardResponseDto {
  userAssessmentMappingID: number;
  geographicReference: string;
  scoreProgress: number;
  pillars: CityPillarDashboardPillarValueDto[];
}

export interface CityPillarDashboardPillarValueDto {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  totalScore: number;
  totalAns: number;
  totalQuestions: number;
  scoreProgress: number;
  completionRate: number;
  totalCriticalQuestions: number;
  totalAnsweredCriticalQuestions: number;
}
