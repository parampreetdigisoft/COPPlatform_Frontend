import { UserRoleValue } from "../enums/UserRole";
import { PaginationRequest } from "./PaginationRequest";
import { PillarsVM } from "./PillersVM";
import { PublicUserResponse } from "./UserInfo";

export interface GetInviatationResponseDto  extends PublicUserResponse {
    userAssessmentMappingID : number;
    year : number;
    dueDate : Date | null;
    numOfUser : number;
    pillars: PillarsVM[];
    updatedAt:string;
        
    userID: number;
    fullName: string;
    email: string;
    role: string;
    createdByName?: string | null;
}

export interface GetInviatationRequestDto extends PaginationRequest {
  getUserRole?:UserRoleValue;
  year?:number;
}

export interface DeleteInvitationDto {
  userAssessmentMappingID:number;
  userID:number;
}