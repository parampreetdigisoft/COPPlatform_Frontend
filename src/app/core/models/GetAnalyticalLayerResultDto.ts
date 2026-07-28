import { CityVM } from "./CityVM";
import { PaginationUserRequest } from "./PaginationRequest";

export interface GetAnalyticalLayerRequestDto extends PaginationUserRequest {
  layerID?: number ;
  userAssessmentMappingID?:number;
  year?:number;
}

export interface GetAnalyticalLayerResultDto extends AnalyticalLayerResponseDto {
  userAssessmentMappingID: number;
  geographicReference: string; 
  interpretationID?: number | null;
  calValue?: number ;
  pillarID?: number ;
  pillarName?: string ;
  fiveLevelInterpretations: FiveLevelInterpretation[];
}

export interface AnalyticalLayerResponseDto {
  layerID: number;
  layerCode: string;
  layerName: string;
  purpose: string;
  calText: string;
}

export interface FiveLevelInterpretation {
  interpretationID: number;
  layerID: number;
  minRange: number;
  maxRange: number;
  condition: string;
  descriptor: string;
  strategicAction: string;
}
