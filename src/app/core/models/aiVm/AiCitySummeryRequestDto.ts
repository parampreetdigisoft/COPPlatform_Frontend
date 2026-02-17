import { PaginationRequest } from "../PaginationRequest";

export interface AiCitySummeryRequestDto extends PaginationRequest {
  cityID?:number;
  year?:number
}

export interface AiPillarQuetionsRequestDto extends AiCitySummeryRequestDto {
  pillarID?:number;
}