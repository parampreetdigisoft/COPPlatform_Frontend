import { UserRoleValue } from "../enums/UserRole";
import { PaginationRequest } from "./PaginationRequest";
import { PillarsVM } from "./PillersVM";
import { PublicUserResponse } from "./UserInfo";

export interface GetInviatationResponseDto  extends PublicUserResponse {
    userAssessmentMappingID : number;
    year : number;
    dueDate : Date;
    numOfUser : number;
    pillars: PillarsVM[];
    updatedAt:string;
    geographicReference:string;
    userID: number;
    fullName: string;
    email: string;
    role: string;
    assignedByName?: string | null;
}

export interface GetInviatationRequestDto extends PaginationRequest {
  getUserRole?:UserRoleValue;
  year?:number;
}

export interface DeleteInvitationDto {
  userAssessmentMappingID:number;
  userID:number;
}
export interface SendEmailRequestDto {
  emailSubject: string;
  emailMessage: string;
}