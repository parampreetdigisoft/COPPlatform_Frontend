export interface UpdateInvitationUserDto {
  userID: number;
  dueDate?: Date | null;
  year: number;
  pillarIDs: number[];
  userAssessmentMappingID?:number;
}