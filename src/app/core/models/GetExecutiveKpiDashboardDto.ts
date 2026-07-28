import { FiveLevelInterpretation, GetAnalyticalLayerResultDto } from "./GetAnalyticalLayerResultDto";

export interface GetExecutiveKpiDashboardResponseDto {
  summary: ExecutiveKpiDashboardSummaryDto;
  overallKpis: ExecutiveKpiLayerGroupDto[];
  pillarGroups: ExecutivePillarKpiGroupDto[];
}

export interface ExecutiveKpiDashboardSummaryDto {
  overallKpiCount: number;
  pillarCount: number;
  totalKpiRecords: number;
  overallReadinessScore: number;
  criticalCount: number;
  atRiskCount: number;
  onTrackCount: number;
}

export interface ExecutiveKpiLayerGroupDto {
  layerID: number;
  layerCode: string;
  layerName: string;
  purpose: string;
  calText?: string;
  interpretationID?: number | null;
  calValue?: number;
  condition?: string;
  conditionLevel: number;
  fiveLevelInterpretations: FiveLevelInterpretation[];
  detail?: GetAnalyticalLayerResultDto;
}

export interface ExecutivePillarKpiGroupDto {
  pillarID: number;
  pillarName: string;
  avgScore: number;
  kpiCount: number;
  kpis: ExecutiveKpiLayerGroupDto[];
}
