import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
} from "@angular/core";
import { AdminService } from "../../admin.service";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { CardHistoryDto, UserAssessmentPillarDashboardRequstDto } from "../../../../core/models/cityHistoryDto";
import { CommonService } from "src/app/core/services/common.service";
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexLegend,
  ChartComponent,
  ApexAxisChartSeries,
  ApexDataLabels,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ApexStates,
} from "ng-apexcharts";
import { AiCityPillarDashboardResponseDto, CityPillarDashboardPillarValueDto } from "src/app/core/models/AiCityPillarDashboardResponseDto";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
};

export type PillarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string[];
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  legend: ApexLegend;
  fill: any;
  states: ApexStates;
  dataLabels: ApexDataLabels;
  stroke: any;
  markers: any;
  grid: any;
};

@Component({
  selector: "app-admin-dashboard",
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  selectedYear = new Date().getFullYear();
  assignedInvitations?: GetAssignedAssessmentResponseDto[] = [];
  assignedInvitation: number | any = null;
  cardHistory: CardHistoryDto | null = null;
  isLoader: boolean = false;
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  @ViewChild("chartPillar") chartPillar!: ChartComponent;
  public chartPillarOptions: Partial<PillarChartOptions> = {};

  assessmentHistoryResponse = signal<AiCityPillarDashboardResponseDto | null>(null);
  totalQuestions = computed(() =>
    Math.round(
      this.assessmentHistoryResponse()?.pillars?.reduce(
        (sum: number, x: CityPillarDashboardPillarValueDto) =>
          sum + (x.totalQuestions ?? 0),
        0
      ) ?? 0
    )
  );

  totalAns = computed(() =>
    Math.round(
      this.assessmentHistoryResponse()?.pillars?.reduce(
        (sum: number, x: CityPillarDashboardPillarValueDto) =>
          sum + (x.totalAns ?? 0),
        0
      ) ?? 0
    )
  );
  completionRate = computed(() => {
    const total = this.totalQuestions();
    return total > 0 ? (this.totalAns() * 100) / total : 0;
  });
  assessmentScore = computed(() => this.assessmentHistoryResponse()?.scoreProgress ?? 0);

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.getCardDetails();
    this.getAssignedInvitations();

  }

  ngAfterViewInit() { }

  getAssignedInvitations() {
    this.adminService
      .getAssignedInvitations()
      .subscribe({
        next: (res) => {
          this.assignedInvitations = res.result ?? [];
          // if (this.assignedInvitations && this.assignedInvitations.length > 0) {

          //      this.assignedInvitation = this.assignedInvitations?.[0]?.userAssessmentMappingID ?? null;

          // }
          this.getDashboardPillarHistory();
        },
      });
  }

  yearChanged() {
    this.getDashboardPillarHistory();
    this.getCardDetails();
  }

  getCardDetails() {
    this.adminService
      .getCardDetails()
      .subscribe({
        next: (res) => {
          this.cardHistory = res.result;         
          this.isLoader = false;
        },
        error: () => this.isLoader = false
      });
  }

  getDashboardPillarHistory() {

    if (
      this.userService?.userInfo?.userID == null
    ) {
      return;
    }
    let request: UserAssessmentPillarDashboardRequstDto = {
      userAssessmentMappingID: this.assignedInvitation ?? null,
    };
    this.adminService.getDashboardPillarHistory(request).subscribe({
      next: (res) => {       
        this.isLoader = false;
        this.assessmentHistoryResponse.set(res.result);
        if (this.assessmentHistoryResponse()) {
          this.buildPillarComparisonChart();
        }
      },
      error: (err) => {
        this.isLoader = false;
      },
    });
  }

  ExportCityPillar() {
    let invitation = this.assignedInvitations?.find((x) => x.userAssessmentMappingID == this.assignedInvitation);
    if (this.assessmentHistoryResponse()?.pillars && invitation) {
      var exportData = this.assessmentHistoryResponse()?.pillars.map((x) => {
        return {
          ['Geographic Reference']: invitation?.geographicReference,
          ['Year']: invitation?.year,
          ['Pillar Name']: x.pillarName,
          ['Score %']: x.scoreProgress?.toFixed(2),
          ['Completion Rate %']: x.completionRate?.toFixed(2),
          ['Total Answered']: x.totalAns?.toFixed(0),
          ['Total Questions']: x.totalQuestions?.toFixed(0)
        };
      }) as any;
      this.commonService.exportExcel(exportData);
    } else {
      this.toaster.showWarning("Please select city to export the records");
    }
  }


  buildPillarComparisonChart() {

    const data = [...(this.assessmentHistoryResponse()?.pillars ?? [])];

    const categories = this.buildUniqueCategories(data);
    const aiSeries = data.map(x => x.completionRate);
    const evaluatorSeries = data.map(x => x.scoreProgress);
    this.chartPillarOptions = {
      series: [{
        name: 'Completion Rate',
        data: aiSeries
      },
      {
        name: 'Score',
        data: evaluatorSeries
      }],

      chart: {
        type: 'area',
        height: 420,
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },

      dataLabels: {
        enabled: true,
        formatter: (val: number, opts) => {
          return `${Math.round(val)}%`;
        },
        offsetY: -10,
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: ['#032961']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          padding: 6,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#032961',
          opacity: 0.95
        }
      },

      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#4f91ee', '#0948a0']
      },

      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100],
          colorStops: [
            {
              offset: 0,
              color: '#8fb8ec',
              opacity: 0.8
            },
            {
              offset: 50,
              color: '#75a2dd',
              opacity: 0.5
            },
            {
              offset: 100,
              color: '#658fc0',
              opacity: 0.2
            }
          ]
        }
      },

      markers: {
        size: data.map(p => 4),
        colors: data.map(p => this.PillarColorByScore(p.completionRate)),
        strokeColors: '#8abfeb',
        strokeWidth: 2,
        hover: {
          size: 8,
          sizeOffset: 3
        }
      },

      xaxis: {
        categories: categories,
        labels: {
          rotateAlways: true,
          rotate: -45,
          style: {
            fontSize: '11px',
            fontWeight: 500,
            colors: '#7a97cf'
          }
        },
        axisBorder: {
          show: true,
          color: '#e5e7eb'
        },
        axisTicks: {
          show: true,
          color: '#e5e7eb'
        }
      },

      yaxis: {
        title: {
          text: 'Progress (%)',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#032961'
          }
        },
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          formatter: (val) => val >= 0 ? `${Math.round(val)}%` : '',
          style: {
            fontSize: '12px',
            colors: '#244586'
          }
        }
      },

      grid: {
        borderColor: '#4778da',
        strokeDashArray: 4,
        xaxis: {
          lines: { show: false }
        },
        yaxis: {
          lines: { show: true }
        }
      },

      tooltip: {
        enabled: true,
        custom: ({ dataPointIndex }) => {
          const pillar = data[dataPointIndex];

          const completionRate = pillar.completionRate ?? 0;
          const evaluatorProgressPercent = pillar.scoreProgress ?? 0;

          const completionRateColor = this.PillarColorByScore(completionRate);
          const evaluatorProgressColor = this.PillarColorByScore(evaluatorProgressPercent);

          const answeredPercent = pillar.totalQuestions
            ? (pillar.totalAns / pillar.totalQuestions) * 100
            : 0;

          const criticalPercent = pillar.totalCriticalQuestions
            ? (pillar.totalAnsweredCriticalQuestions / pillar.totalCriticalQuestions) * 100
            : 0;

          const statusText =
            evaluatorProgressPercent >= 75 ? 'Excellent Performance' :
              evaluatorProgressPercent >= 50 ? 'Strong Progress' :
                evaluatorProgressPercent >= 25 ? 'Steady Growth' : 'Early Stage';

          const statusIcon =
            evaluatorProgressPercent >= 75 ? '🌟' :
              evaluatorProgressPercent >= 50 ? '📈' :
                evaluatorProgressPercent >= 25 ? '⚡' : '🌱';

          return `
    <div style="
      padding: 18px 20px;
      min-width: 320px;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
      border-left: 4px solid ${completionRateColor};
      font-family: 'Inter', system-ui, sans-serif;
      position: relative;
      overflow: hidden;
    ">

      <!-- subtle background blob -->
      <div style="
        position: absolute;
        top: -30px;
        right: -30px;
        width: 120px;
        height: 120px;
        background: ${completionRateColor};
        opacity: 0.08;
        border-radius: 50%;
      "></div>

      <div style="position: relative; z-index: 1;">

        <!-- HEADER -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        ">
          <div>
            <div style="
              font-weight: 700;
              font-size: 16px;
              color: #111827;
              margin-bottom: 6px;
            ">
              ${pillar.pillarName}
            </div>

            <div style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 4px 10px;
              background: ${completionRateColor}15;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              color: ${completionRateColor};
            ">
              ${statusIcon} ${statusText}
            </div>
          </div>

          <div style="
            font-size: 28px;
            font-weight: 800;
            color: ${completionRateColor};
            line-height: 1;
          ">
            ${evaluatorProgressPercent.toFixed(0)}%
          </div>
        </div>

        <!-- SCORE BAR -->
        <div style="margin-bottom: 14px;">
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
            color: #6b7280;
          ">
            <span>Score</span>
            <span>${evaluatorProgressPercent.toFixed(1)}%</span>
          </div>

          <div style="
            width: 100%;
            height: 10px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
          ">
            <div style="
              width: ${evaluatorProgressPercent}%;
              height: 100%;
              background: linear-gradient(90deg, ${evaluatorProgressColor}, ${evaluatorProgressColor}cc);
              transition: width 0.6s ease;
            "></div>
          </div>
        </div>

        <!-- COMPLETION BAR -->
        <div style="margin-bottom: 14px;">
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 600;
            color: #6b7280;
          ">
            <span>Completion Rate</span>
            <span>${completionRate.toFixed(1)}%</span>
          </div>

          <div style="
            width: 100%;
            height: 10px;
            background: #e5e7eb;
            border-radius: 10px;
            overflow: hidden;
          ">
            <div style="
              width: ${completionRate}%;
              height: 100%;
              background: linear-gradient(90deg, ${completionRateColor}, ${completionRateColor}cc);
              transition: width 0.6s ease;
            "></div>
          </div>
        </div>

        <!-- METRIC CARDS -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        ">

          <!-- Answered -->
          <div style="
            padding: 12px;
            background: linear-gradient(135deg, ${completionRateColor}15, ${completionRateColor}05);
            border-radius: 10px;
            border: 1px solid ${completionRateColor}30;
          ">
            <div style="
              font-size: 11px;
              color: ${completionRateColor};
              font-weight: 600;
              margin-bottom: 6px;
            ">
              📊 Total Answered Questions
            </div>

            <div style="
              font-size: 11px;
              font-weight: 800;
              color: ${completionRateColor};
              margin-bottom: 6px;
            ">
              ${pillar.totalAns} / ${pillar.totalQuestions}
            </div>

            <div style="
              width: 100%;
              height: 6px;
              background: #e5e7eb;
              border-radius: 6px;
              overflow: hidden;
            ">
              <div style="
                width: ${answeredPercent}%;
                height: 100%;
                background: ${completionRateColor};
                transition: width 0.6s ease;
              "></div>
            </div>
          </div>

          <!-- Critical -->
          <div style="
            padding: 12px;
            background: linear-gradient(135deg, #ef444415, #ef444405);
            border-radius: 10px;
            border: 1px solid #ef444430;
          ">
            <div style="
              font-size: 11px;
              color: #dc2626;
              font-weight: 600;
              margin-bottom: 6px;
            ">
              ⚠️ Critical Answered Questions
            </div>

            <div style="
              font-size: 11px;
              font-weight: 800;
              color: ${completionRateColor};
              margin-bottom: 6px;
            ">
              ${pillar.totalAnsweredCriticalQuestions ?? 0} / ${pillar.totalCriticalQuestions ?? 0}
            </div>

            <div style="
              width: 100%;
              height: 6px;
              background: #fee2e2;
              border-radius: 6px;
              overflow: hidden;
            ">
              <div style="
                width: ${criticalPercent}%;
                height: 100%;
                background: #dc2626;
                transition: width 0.6s ease;
              "></div>
            </div>
          </div>

        </div>

      </div>
    </div>
    `;
        }
      },

      legend: {
        show: false
      }
    };
  }

  PillarColorByScore(score: any): string {
    const colors = [
      "#a4c2ec", "#7f9cc7", "#6faaf7", "#5291e4", "#3189fd",
      "#73a5e7", "#5c96e3", "#4587df", "#326cc1", "#28579b"
    ];

    if (score === null || score === undefined || isNaN(score)) {
      return "#d3d3d3";
    }

    const safeScore = Math.min(Math.max(score, 0), 100);
    const index = Math.min(Math.floor(safeScore / 10), colors.length - 1);
    return colors[index];
  }

  buildUniqueCategories(data: { pillarName: string }[]): string[] {
    const used = new Set<string>();
    return data.map(item => {
      if (!item.pillarName) return '';
      const words = item.pillarName.trim().split(/\s+/);
      let label = '';
      for (let i = 1; i <= words.length; i++) {
        const candidate = i < words.length ? words.slice(0, i).join(' ') : words.join(' ');
        if (!used.has(candidate)) {
          label = candidate + (i < words.length ? '...' : '');
          used.add(candidate);
          break;
        }
      }
      if (!label) label = words[0] + '...';
      return label;
    });
  }

}
