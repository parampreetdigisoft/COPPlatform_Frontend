import { PaginationRequest } from "./PaginationRequest";

export interface CompareCityRequestDto extends PaginationRequest{
  cities?: number[];
  userAssessmentMappingID?: number;
  Kpis?: number[];
  updatedAt?: Date; 
}
