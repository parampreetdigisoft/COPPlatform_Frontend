
export interface CityPillerRequestDto {
  cityID :number;
  userID: number;
  pillarID?: number;
}


export interface CityMappingPillerRequestDto {
  userAssessmentMappingID: number;
  pillarID?: number;
}