import { PaginationRequest } from './PaginationRequest';
import { GetAnalyticalLayerResultDto } from './GetAnalyticalLayerResultDto';

export interface GetKpiLayerChartRequestDto extends PaginationRequest {
  userAssessmentMappingID?: number;
  layerIDs?: number[];
}

export interface GetKpiLayerChartResponseDto {
  categories: string[];
  series: KpiLayerChartSeriesDto[];
  items: GetAnalyticalLayerResultDto[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  averageScore: number;
}

export interface KpiLayerChartSeriesDto {
  name: string;
  data: number[];
}
