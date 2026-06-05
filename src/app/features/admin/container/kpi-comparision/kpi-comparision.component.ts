import { Component, OnInit, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexFill, ApexGrid, ApexLegend, ApexPlotOptions, ApexStroke, ApexTooltip, ApexXAxis, ApexYAxis, ChartComponent } from 'ng-apexcharts';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AdminService } from '../../admin.service';
import { AnalyticalLayerResponseDto, GetAnalyticalLayerResultDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { debounceTime, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/share.module';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { GetKpiLayerChartRequestDto, GetKpiLayerChartResponseDto } from 'src/app/core/models/GetKpiLayerChartDto';
import { GetAssignedAssessmentResponseDto } from 'src/app/core/models/GetAssignedAssessmentResponseDto ';
declare var bootstrap: any;

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  colors?: string[];
};

@Component({
  standalone: true,
  selector: 'app-kpi-comparision',
  templateUrl: './kpi-comparision.component.html',
  styleUrl: './kpi-comparision.component.css',
  imports: [CommonModule, SharedModule, CircularScoreComponent]
})
export class KpiComparisionComponent implements OnInit {
  userAssessmentMappingID?: number;
  selectedKpis: number[] = [];
  pageSize: number = 14;
  currentPage: number = 1;
  totalRecords: number = 0;
  kpis: AnalyticalLayerResponseDto[] = [];
  selectedKpi: GetAnalyticalLayerResultDto | null = null;
  chartMax = 100;
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> = {};
  kpiLayerChartData: GetKpiLayerChartResponseDto | null = null;
  isLoader: boolean = false;
  $kpiChanged = new Subject();
  assignedInvitations: GetAssignedAssessmentResponseDto[] = [];

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllKpi();
    this.getAssignedInvitations();
    this.$kpiChanged.pipe(debounceTime(500)).subscribe(() => {
      this.getKpiLayerChart();
    });
  }

  kpiChanged() {
    this.$kpiChanged.next(true);
  }

  getAssignedInvitations() {
    this.adminService.getAssignedInvitations().subscribe({
      next: (res) => {
        this.assignedInvitations = res.result ?? [];
        if (!this.assignedInvitations?.length) {
          this.isLoader = false;
          this.toaster.showWarning("You don't have any assigned assessments yet.");
        } else {
          this.userAssessmentMappingID = this.assignedInvitations[0].userAssessmentMappingID;
          this.getKpiLayerChart();
        }
      },
    });
  }

  GetAllKpi() {
    this.adminService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
        }
      }
    });
  }

  getKpiLayerChart(currentPage = 1) {
    if (!this.userAssessmentMappingID) {
      this.isLoader = false;
      this.kpiLayerChartData = null;
      this.chartOptions = {};
      return;
    }
    this.isLoader = true;
    this.currentPage = currentPage;

    const payload: GetKpiLayerChartRequestDto = {
      userAssessmentMappingID: this.userAssessmentMappingID,
      layerIDs: this.selectedKpis,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    this.adminService.getKpiLayerChart(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded && res.result) {
          this.kpiLayerChartData = res.result;
          this.totalRecords = res.result.totalRecords ?? 0;
          this.getChartOptions();
        } else {
          this.kpiLayerChartData = null;
          this.chartOptions = {};
          this.toaster.showInfo("No KPI chart data available for the selected assessment.");
        }
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("Failed to load KPI chart data.");
      }
    });
  }

  getChartMax(maxValue: number): number {
    if (maxValue <= 0) return 20;
    if (maxValue < 20) {
      return Math.ceil(maxValue / 10) * 10 + 10;
    }
    if (maxValue <= 80) {
      return Math.ceil(maxValue / 20) * 20;
    }
    return 100;
  }

  private truncateFromStart(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;

    return `${text.slice(0, maxLength - 3)}...`;
  }

  private getChartCategoryLabel(item: GetAnalyticalLayerResultDto): string {

    const name = this.truncateFromStart(item.layerName?.trim() || '', 15);
    return  name;
  }

  private buildChartCategories(
    items: GetAnalyticalLayerResultDto[],
    fallbackCategories: string[]
  ): string[] {
    if (items.length) {
      return items.map(item => this.getChartCategoryLabel(item));
    }

    return fallbackCategories.map(category => {
      const separatorIndex = category.indexOf(' - ');
      if (separatorIndex === -1) {
        return this.truncateFromStart(category, 15);
      }

      const name = this.truncateFromStart(category.slice(separatorIndex + 3).trim(), 15);
      return name;
    });
  }

  getChartOptions() {
    const chartData = this.kpiLayerChartData;
    if (!chartData?.categories?.length) {
      this.chartOptions = {};
      return;
    }

    const items = chartData.items ?? [];
    const colorPalette = this.commonService.kpiColors;
    const seriesData = chartData.series?.[0]?.data ?? [];
    const maxValue = Math.max(...seriesData, 0);
    this.chartMax = this.getChartMax(maxValue);
    const chartCategories = this.buildChartCategories(items, chartData.categories);
    const itemCount = chartCategories.length;
    const chartHeight = Math.max(460, itemCount * 36 + 120);

    const option: Partial<ChartOptions> = {
      series: [{
        name: chartData.series?.[0]?.name ?? 'KPI Score',
        data: seriesData
      }],
      chart: {
        height: chartHeight,
        type: 'bar',
        fontFamily: 'Poppins, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 700
        } as any
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '62%',
          distributed: true,
          dataLabels: {
            position: 'top'
          }
        }
      },
      colors: colorPalette,
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.35,
          gradientToColors: undefined,
          opacityFrom: 1,
          opacityTo: 0.88,
          stops: [0, 100]
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val?.toFixed?.(1) ?? `${val}`,
        offsetX: 28,
        style: {
          fontSize: '12px',
          fontWeight: 600,
          colors: ['#263238']
        }
      },
      stroke: {
        show: false
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#e8edf3',
        strokeDashArray: 4,
        xaxis: {
          lines: { show: true }
        },
        yaxis: {
          lines: { show: false }
        },
        padding: {
          top: 0,
          right: 24,
          bottom: 0,
          left: 30
        }
      },
      xaxis: {
        categories: chartCategories,
        min: 0,
        max: this.chartMax,
        tickAmount: Math.min(6, Math.ceil(this.chartMax / 10)),
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500,
            colors: '#546e7a'
          },
          formatter: (val: string) => parseFloat(val).toFixed(0)
        },
        axisBorder: { show: true, color: '#cfd8dc' },
        axisTicks: { show: true, color: '#cfd8dc' },
        title: {
          text: 'Score',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#37474f'
          }
        }
      },
      yaxis: {
        labels: {
          align: 'right',
          offsetX: -8,
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: ['#032961']
          }
        }
      },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ dataPointIndex }) => {
          const item = items[dataPointIndex];
          const score = seriesData[dataPointIndex] ?? 0;
          const condition = this.getConditionByid(item);
          const pillar = item?.pillarName || '';
          const layerLabel = item
            ? `${item.layerName} (${item.layerCode})`
            : chartData.categories[dataPointIndex];

          return `
            <div class="kpi-chart-tooltip">
              <div class="kpi-chart-tooltip__title">${layerLabel}</div>
              <div class="kpi-chart-tooltip__pillar">${pillar}</div>
              <div class="kpi-chart-tooltip__row">
                <span>Score</span>
                <strong>${score.toFixed(2)}</strong>
              </div>
              <div class="kpi-chart-tooltip__row">
                <span>Condition</span>
                <strong>${condition}</strong>
              </div>
            </div>
          `;
        }
      }
    };

    this.chartOptions = option;
  }

  viewDetails(kpi: GetAnalyticalLayerResultDto) {
    this.selectedKpi = kpi;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    offcanvas.show();
  }

  getConditionByid(layer?: GetAnalyticalLayerResultDto): string {
    if (!layer) return '-';
    return layer.fiveLevelInterpretations?.find(x => x.interpretationID === layer.interpretationID)?.condition || '-';
  }

  getSelectedAssessmentLabel(): string {
    const assessment = this.assignedInvitations.find(
      x => x.userAssessmentMappingID === this.userAssessmentMappingID
    );
    return assessment ? `${assessment.geographicReference}, ${assessment.year}` : '';
  }

  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
}
