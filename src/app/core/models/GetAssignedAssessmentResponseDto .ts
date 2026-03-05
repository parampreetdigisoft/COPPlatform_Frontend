export interface GetAssignedAssessmentResponseDto {
  userAssessmentMappingID: number;
  year: number;
  userID: number;
  dueDate?: string | null;      // DateTime? → string (ISO) or null
  updatedAt?: string | null;
  assignedBy?: string | null;
  userPillarMappings: AssignedAssessmentPillarMappingDto[] ;
}
export interface AssignedAssessmentPillarMappingDto {
  userPillarMappingID: number;
  year: number;
  userID: number;
  dueDate?: string | null;
  pillarID: number;
  pillarName: string;
  description: string;
  displayOrder: number;
  imagePath:string;
}