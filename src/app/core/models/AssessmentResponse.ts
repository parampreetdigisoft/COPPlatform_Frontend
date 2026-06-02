import { AssessmentPhase } from "../enums/AssessmentPhase";

export interface GetAssessmentResponse {
  assessmentID:number;
  userAssessmentMappingID:number
  createdAt:Date | string;
  geographicReference: string;
  role: string;
  year: number;
  userID: number;
  dueDate: Date;
  analystName: string;
  assessmentPhase?:AssessmentPhase;
  score?: number |null;   
}

export interface GetAssessmentQuestionResponseDto {
  assessmentID: number;
  userID: number;
  pillarID: number;
  pillarName:string;
  questionID: number;  // keeping same spelling as C#; can rename to questionID if desired
  questionText: string;
  questionOptionText: string;
  justification: string;
  source: string;
  score: number | null;   // nullable enum
  showComment?: boolean;
  showSource?: boolean;
}

export interface AssessmentWithProgressVM {
  assessmentID: number;
  score: number;
  totalAnsPillar: number;
  totalPillar: number;
  totalQuestion: number;
  totalAnsQuestion: number;
  currentProgress:number
}

export interface GetCitySubmitionHistoryReponseDto {
  cityID: number;
  totalAssessment: number;
  score: number;
  aiScore: number;
  scoreProgress: number;
  totalPillar: number;
  totalAnsPillar: number;
  totalQuestion: number;
  ansQuestion: number;
}

