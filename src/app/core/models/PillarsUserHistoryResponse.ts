export interface PillarsUserHistoryResponse {
  userID: number;
  fullName: string;
  scoreProgress: number;
  compeletionRate: number;
  totalQuestion: number;
  ansQuestion: number;  
}

export interface PillarsHistoryResponse {
  pillarID: number;
  pillarName: string;
  displayOrder: number;
  userAssessmentMappingID: number;
  users: PillarsUserHistoryResponse[];
  weekType:string;
}

export interface PillarsTableRow {
  callRecords?: any;
  pillarName: string;
  pillarID: number;
  [key: string]: string | number | object;
}
export interface QuestionTableRow {
  question: string;
  [key: string]: QuestionUserRow | any;
}

export interface QuestionUserRow {
  score?: number | null;
  justification:string | null;
}

export interface WeeklyPillarsHistoryResponseDto {
  week1: PillarsHistoryResponse[] | [];
  week2: PillarsHistoryResponse[] | [];
}