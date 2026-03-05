export interface CityVM extends AddUpdateCityDto {
  isActive: boolean;
  createdDate: string;   // ISO date string from backend
  updatedDate?: string | null;
  isDeleted: boolean;
  assignedBy?: string;
  image?: string;
  userAssessmentMappingID?:number;
  score?: number;
  progress?: number;
  aiScore?: number;
}
export interface AddUpdateCityDto {
  cityID: number;
  country: string;
  state: string;
  cityName: string;
  postalCode: string;
  region: string;
  imageFile: string;
  imageUrl: string;
  longitude: number;
  latitude: number;
}

export interface BulkAddCityDto {
  cities : CityVM[]
}