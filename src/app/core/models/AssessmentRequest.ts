import { AssessmentPhase } from "../enums/AssessmentPhase";
import { UserRoleValue } from "../enums/UserRole";
import { PaginationUserRequest } from "./PaginationRequest";


export interface AddAssessmentDto {
  assessmentID: number;
  userAssessmentMappingID: number;
  pillarID: number;
  responses: AddAssessmentResponseDto[];
  isAutoSave:boolean;
  isFinalized:boolean;
}

export interface AddAssessmentResponseDto {
  responseID: number;
  assessmentID: number;
  questionID: number;
  questionOptionID: number;
  score?: number | null;
  justification: string;
}

export interface GetAssessmentQuestionRequestDto extends PaginationUserRequest{
  pillarID?: number | null;
  assessmentID: number;
}


export interface GetAssessmentRequestDto extends PaginationUserRequest{
  userAssessmentMappingID?: number | null;
  role?: UserRoleValue | null;
  year?: number;
}


export interface GetCityPillarHistoryRequestDto {
  cityID: number;
  userID: number;
  pillarID?: number;
  updatedAt:string;
}
export interface GetCityPillarHistoryRequestNewDto extends PaginationUserRequest {
  userAssessmentMappingID: number;
  pillarID?: number;
  updatedAt:string;
  week1StartDate?: string;
  week1EndDate?: string;

  week2StartDate?: string;
  week2EndDate?: string;
}
export interface ChangeAssessmentStatusRequestDto {
  assessmentID: number;
  userID: number;
  assessmentPhase?: AssessmentPhase;
}
export interface TransferAssessmentRequestDto {
  assessmentID: number;
  transferToUserID: number;
}
export interface GetQuesiontAssessmentHistoryRequestDto {
  userAssessmentMappingID: number;
  pillarID: number;
}
