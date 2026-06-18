import { PaginationRequest } from "../PaginationRequest";

export interface AiCitySummeryRequestDto extends PaginationRequest {
  year?:number
}

export interface AiPillarQuetionsRequestDto extends AiCitySummeryRequestDto {
  pillarID?:number;
}