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
}

export interface PillarsTableRow {
  callRecords?: any;
  pillarName: string;
  pillarID: number;
  [key: string]: string | number;
}
export interface QuestionTableRow {
  question: string;
  [key: string]: QuestionUserRow | any;
}

export interface QuestionUserRow {
  score?: number | null;
  justification:string | null;
}