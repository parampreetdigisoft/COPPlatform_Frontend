export interface GetQuestionHistoryResponseDto {
  questionID: number;
  pillarID: number;
  questionText: string;
  displayOrder: number;
}

export interface QuestionsByUserInfo {
  userID: number;
  fullName: string;
  score?: number | null; // nullable in C#
  justification: string;
  optionText:string;
}

export interface QuestionsByUserPillarsResponseDto extends GetQuestionHistoryResponseDto {
  users: QuestionsByUserInfo[];
}

