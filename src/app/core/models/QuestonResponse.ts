import { PaginationRequest } from "./PaginationRequest";
import { PillarsVM } from "./PillersVM";

export interface GetQuestionRequest extends PaginationRequest {
  pillarID?: number;
}
export interface GetQuestionByCityMappingResponse extends PillarsVM {
  assessmentID: number;
  userAssessmentMappingID: number;
  submittedPillarDisplayOrder: number;
  questions:AssessmentQuestionResponse[];
  pillars : PillarsVM[];
}

export interface GetQuestionByCityResponse extends GetQuestionResponse {
  assessmentID: number;
  pillarDisplayOrder: number;
}

export interface GetQuestionResponse extends AddQuestionRequest {
  displayOrder: number;
  pillarName: string;
}

export interface QuestionOption {
  optionID: number;
  questionID: number;
  optionText: string;
  scoreValue?: number;
  displayOrder?: number;
}

export interface AddQuestionRequest {
  questionID: number;
  pillarID: number;
  questionText: string;
  isCritical : boolean;
  questionOptions: QuestionOption[];
}
export interface AddBulkQuestionsDto {
  questions: AddQuestionRequest[]
}

export interface AssessmentQuestionResponse {
  questionID: number;
  pillarID: number;
  responseID: number;
  questionText: string;
  isSelected: boolean;
  isCritical : boolean;
  questionOptions: AssessmentQuestionOptionResponse[];
  history: AssessmentQuestionOptionResponse[];
}

export interface AssessmentQuestionOptionResponse  extends QuestionOption {
  isSelected: boolean;
  justification:string
  source:string
  userID:number
  fullName:string
}