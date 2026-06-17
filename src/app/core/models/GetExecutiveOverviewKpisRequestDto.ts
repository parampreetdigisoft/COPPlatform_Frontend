import { PaginationUserRequest } from "./PaginationRequest";

export interface GetExecutiveOverviewKpisRequestDto extends PaginationUserRequest {
  userAssessmentMappingID: number;
  layerID?: number;
  includePillarKpis?: boolean; // future use; default false on backend
}

