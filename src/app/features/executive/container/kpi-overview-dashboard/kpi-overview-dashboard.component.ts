import { Component, ViewEncapsulation } from "@angular/core";
import { CommonModule } from "@angular/common";
import { debounceTime, Subject } from "rxjs";
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
} from "ng-apexcharts";

import { SharedModule } from "src/app/shared/share.module";
import { CircularScoreComponent } from "src/app/shared/standAlone/circular-score/circular-score.component";
import { SparklineScoreComponent } from "src/app/shared/standAlone/sparkline-score/sparkline-score.component";
import { ExecutiveService } from "../../executive.service";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { CommonService } from "src/app/core/services/common.service";

import {
  AnalyticalLayerResponseDto,
  GetAnalyticalLayerResultDto,
} from "src/app/core/models/GetAnalyticalLayerResultDto";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { GetExecutiveOverviewKpisRequestDto } from "src/app/core/models/GetExecutiveOverviewKpisRequestDto";
import {
  ExecutiveKpiDashboardSummaryDto,
  ExecutiveKpiLayerGroupDto,
  ExecutivePillarKpiGroupDto,
  GetExecutiveKpiDashboardResponseDto,
} from "src/app/core/models/GetExecutiveKpiDashboardDto";

declare var bootstrap: any;

type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
};

type PerformanceLineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  fill: ApexFill;
  markers: ApexMarkers;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors: string[];
};

type PillarChartPoint = {
  pillarID: number;
  pillarName: string;
  avgScore: number;
  kpiCount: number;
  conditionCategory: "critical" | "atRisk" | "onTrack";
};

type ConditionCategory = PillarChartPoint["conditionCategory"];

const CONDITION_STATUS_COLORS: Record<ConditionCategory, string> = {
  critical: "#ff5c5c",
  atRisk: "#ffc84a",
  onTrack: "#4dd9b0",
};

const CONDITION_STATUS_LABELS: Record<ConditionCategory, string> = {
  critical: "Critical",
  atRisk: "At Risk",
  onTrack: "On Track",
};

@Component({
  standalone: true,
  selector: "app-kpi-overview-dashboard",
  imports: [CommonModule, SharedModule, CircularScoreComponent, SparklineScoreComponent],
  templateUrl: "./kpi-overview-dashboard.component.html",
  styleUrl: "./kpi-overview-dashboard.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class KpiOverviewDashboardComponent {
  assignedInvitations: GetAssignedAssessmentResponseDto[] = [];
  userAssessmentMappingID?: number;
  selectedkpiLayerID?: number;
  kpis: AnalyticalLayerResponseDto[] = [];

  dashboard: GetExecutiveKpiDashboardResponseDto | null = null;
  summary: ExecutiveKpiDashboardSummaryDto | null = null;
  overallKpis: ExecutiveKpiLayerGroupDto[] = [];
  pillarGroups: ExecutivePillarKpiGroupDto[] = [];

  isLoader = false;
  $kpiChanged = new Subject<void>();
  selectedKpi: GetAnalyticalLayerResultDto | null = null;

  conditionChartOptions: Partial<DonutChartOptions> = {};
  performanceLineChartOptions: Partial<PerformanceLineChartOptions> = {};
  hasPerformanceChartData = false;

  constructor(
    private executiveService: ExecutiveService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllKpi();
    this.getAssignedInvitations();
    this.$kpiChanged.pipe(debounceTime(600)).subscribe(() => this.loadDashboard());
  }

  kpiChanged() {
    this.$kpiChanged.next();
  }

  GetAllKpi() {
    this.executiveService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) this.kpis = res.result ?? [];
      },
    });
  }

  getAssignedInvitations() {
    this.executiveService.getAssignedInvitations().subscribe({
      next: (res) => {
        this.assignedInvitations = res.result ?? [];
        if (!this.assignedInvitations.length) {
          this.isLoader = false;
          this.toaster.showWarning("You don't have any assigned assessments yet.");
          return;
        }
        this.userAssessmentMappingID = this.assignedInvitations[0].userAssessmentMappingID;
        this.loadDashboard();
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("Failed to load assessments.");
      },
    });
  }

  onAssessmentChange() {
    this.selectedkpiLayerID = undefined;
    this.loadDashboard();
  }

  loadDashboard() {
    if (!this.userAssessmentMappingID) return;

    this.isLoader = true;
    const payload: GetExecutiveOverviewKpisRequestDto = {
      userId: this.userService?.userInfo?.userID,
      userAssessmentMappingID: this.userAssessmentMappingID,
      pageNumber: 1,
      pageSize: 250,
    };
    if (this.selectedkpiLayerID) payload.layerID = this.selectedkpiLayerID;

    this.executiveService.getExecutiveKpiDashboard(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (!res.succeeded || !res.result) {
          this.dashboard = null;
          this.toaster.showInfo("No KPI dashboard data available.");
          return;
        }
        this.dashboard = res.result;
        this.summary = res.result.summary;
        this.overallKpis = res.result.overallKpis ?? [];
        this.pillarGroups = res.result.pillarGroups ?? [];
        this.buildCharts();
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("Failed to load KPI dashboard data.");
      },
    });
  }

  buildCharts() {
    const s = this.summary;
    if (!s) return;

    this.buildPerformanceLineChart();
    this.conditionChartOptions = {
      series: [s.criticalCount, s.atRiskCount, s.onTrackCount],
      chart: { type: "donut", height: 260, fontFamily: "Poppins, sans-serif" },
      labels: ["Critical", "At Risk", "On Track"],
      colors: ["#ff5c5c", "#ffc84a", "#4dd9b0"],
      legend: { position: "bottom", fontSize: "12px", labels: { colors: "#607d8b" } },
      dataLabels: { enabled: true, style: { fontSize: "11px", fontWeight: 600, colors: ["#ffffff"] } },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              name: { color: "#607d8b" },
              value: { color: "#032961", fontWeight: 700 },
              total: {
                show: true,
                label: "Scored Indicators",
                color: "#607d8b",
                formatter: () => `${s.overallKpiCount}`,
              },
            },
          },
        },
      },
      tooltip: { theme: "light" },
    };
  }

  private getPillarsForChart(): PillarChartPoint[] {
    const points: PillarChartPoint[] = [];

    if (this.overallKpis.length) {
      const avgScore =
        this.overallKpis.reduce((sum, kpi) => sum + Number(kpi.calValue ?? 0), 0) /
        this.overallKpis.length;
      points.push({
        pillarID: 0,
        pillarName: "Overall",
        avgScore,
        kpiCount: this.overallKpis.length,
        conditionCategory: this.getPillarConditionCategory(this.overallKpis),
      });
    }

    [...this.pillarGroups]
      .sort((a, b) => a.pillarID - b.pillarID)
      .forEach((pillar) => {
        points.push({
          pillarID: pillar.pillarID,
          pillarName: pillar.pillarName,
          avgScore: Number(pillar.avgScore ?? 0),
          kpiCount: pillar.kpiCount,
          conditionCategory: this.getPillarConditionCategory(pillar.kpis),
        });
      });

    return points;
  }

  private getPillarConditionCategory(
    kpis: ExecutiveKpiLayerGroupDto[]
  ): ConditionCategory {
    const levels = kpis.map((kpi) => kpi.conditionLevel).filter((level) => level > 0);
    if (!levels.length) return "atRisk";
    if (levels.some((level) => level === 1)) return "critical";
    if (levels.some((level) => level === 2 || level === 3)) return "atRisk";
    return "onTrack";
  }

  private getConditionStatusColor(category: ConditionCategory): string {
    return CONDITION_STATUS_COLORS[category];
  }

  buildPerformanceLineChart() {
    const points = this.getPillarsForChart();
    this.hasPerformanceChartData = points.length > 0;

    if (!points.length) {
      this.performanceLineChartOptions = {};
      return;
    }

    const categories = points.map((p) => this.truncate(p.pillarName, 22));
    const data = points.map((p) => Math.round(p.avgScore));
    const markerColors = points.map((p) => this.getConditionStatusColor(p.conditionCategory));

    const maxVal = Math.max(...data, 0);
    const yAxisMax = maxVal > 0 ? Math.min(100, Math.ceil(maxVal / 10) * 10) : 100;

    this.performanceLineChartOptions = {
      series: [{ name: "Pillar Performance", data }],
      chart: {
        type: "line",
        height: 300,
        fontFamily: "Poppins, sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, easing: "easeinout", speed: 600 },
      },
      colors: ["#326cc1"],
      stroke: {
        curve: "smooth",
        width: 3,
        colors: ["#326cc1"],
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.35,
          opacityTo: 0.04,
          stops: [0, 90, 100],
        },
      },
      markers: {
        size: 5,
        colors: markerColors,
        strokeColors: "#ffffff",
        strokeWidth: 2,
        hover: { size: 7, sizeOffset: 2 },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        tickPlacement: "on",
        labels: {
          rotate: categories.length > 5 ? -35 : 0,
          rotateAlways: categories.length > 5,
          hideOverlappingLabels: false,
          trim: true,
          maxHeight: 100,
          style: {
            fontSize: "11px",
            fontWeight: 600,
            colors: "#032961",
          },
        },
        title: {
          text: "Pillars",
          style: { fontSize: "11px", fontWeight: 600, color: "#607d8b" },
        },
        axisBorder: { show: true, color: "#e2e8f0" },
        axisTicks: { show: true, color: "#e2e8f0" },
        crosshairs: {
          show: true,
          stroke: { color: "#c9daf5", width: 1, dashArray: 4 },
        },
      },
      yaxis: {
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        forceNiceScale: true,
        decimalsInFloat: 0,
        labels: {
          formatter: (val: number) => {
            if (val == null || Number.isNaN(val)) return "";
            return `${Math.round(val)}`;
          },
          style: { fontSize: "11px", colors: "#607d8b" },
        },
        title: {
          text: "Performance",
          style: { fontSize: "12px", fontWeight: 600, color: "#032961" },
        },
      },
      grid: {
        borderColor: "#e8eef5",
        strokeDashArray: 4,
        padding: { left: 8, right: 16 },
      },
      tooltip: { theme: "light" },
    };
  }

  getPillarScoreColor(score: number): string {
    const colors = this.commonService.PillarColors;
    if (score >= 90) return colors[9];
    if (score >= 80) return colors[8];
    if (score >= 70) return colors[7];
    if (score >= 60) return colors[6];
    if (score >= 50) return colors[5];
    if (score >= 40) return colors[4];
    if (score >= 30) return colors[3];
    if (score >= 20) return colors[2];
    if (score >= 10) return colors[1];
    return colors[0];
  }

  formatPillarScore(score: number): string {
    if (score == null || isNaN(score)) return "NA";
    return score === 100 || score === 0 ? score.toFixed(0) : score.toFixed(1);
  }

  getPillarRelativeWidth(score: number): number {
    const scores = this.pillarGroups.map((p) => p.avgScore ?? 0);
    const maxScore = Math.max(...scores, 0);
    if (maxScore <= 0) return 0;
    return Math.max(8, (score / maxScore) * 100);
  }

  viewDetails(kpi: ExecutiveKpiLayerGroupDto) {
    if (!kpi.detail) return;
    this.selectedKpi = kpi.detail;
    const sidebarEl = document.getElementById("kpiLayerSidebar");
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    offcanvas.show();
  }

  getConditionClass(level: number): string {
    return level ? `condition_level_${level}` : "condition_empty";
  }

  truncate(text: string, max: number): string {
    if (!text) return "";
    return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
  }

  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
}
