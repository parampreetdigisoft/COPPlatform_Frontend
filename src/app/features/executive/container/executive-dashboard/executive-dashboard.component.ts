import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
} from "@angular/core";

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
  ApexGrid,
  ApexStroke,
  ApexResponsive,
  ApexFill,
  ApexMarkers,
} from "ng-apexcharts";
import { AiCityPillarDashboardResponseDto, CityPillarDashboardPillarValueDto } from "src/app/core/models/AiCityPillarDashboardResponseDto";
import { GetExecutiveAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { PillarsHistoryResponse, PillarsTableRow, QuestionTableRow } from "src/app/core/models/PillarsUserHistoryResponse";
import { GetCityPillarHistoryRequestNewDto } from "src/app/core/models/AssessmentRequest";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { ExecutiveService } from "../../executive.service";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
};

export type ChartOptionsBar = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  grid: ApexGrid;
  stroke: ApexStroke;
  colors: string[];
  responsive: ApexResponsive[];
  fill: ApexFill;
  markers: ApexMarkers;
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
  selector: "app-executive-dashboard",
  templateUrl: "./executive-dashboard.component.html",
  styleUrl: "./executive-dashboard.component.css",
  encapsulation: ViewEncapsulation.None,
})
export class ExecutiveDashboardComponent implements OnInit, AfterViewInit {
  selectedYear = new Date().getFullYear();
  assignedInvitations?: GetExecutiveAssignedAssessmentResponseDto[] = [];
  assignedInvitationsAll?: GetExecutiveAssignedAssessmentResponseDto[] = [];
  assignedInvitation: number | any = null;
  cardHistory: CardHistoryDto | null = null;
  isLoader: boolean = false;
  dataSource = new MatTableDataSource<PillarsTableRow>([]);
  displayedColumns: string[] = [];
  userMap = new Map<number, string>();
  expandedElement: PillarsTableRow | null = null;
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;
  public chartOptionsBar!: Partial<ChartOptionsBar>;
  @ViewChild("chartPillar") chartPillar!: ChartComponent;
  public chartPillarOptions: Partial<PillarChartOptions> = {};
  searchText: string = '';
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
  pageSize: number = 28;
  currentPage: number = 1;
  totalRecords: number = 0;
  pillarColumns: string[] = [];

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
    const total = this.cardHistory?.totalCriticalQuestions ?? 0;
    const totalAssessments = this.cardHistory?.totalAssessments ?? 1;
    const answered = this.cardHistory?.totalAnsweredCriticalQuestions ?? 0;    
    return total > 0 ? (answered * 100) / (total * totalAssessments) : 0;
  });
  assessmentScore = computed(() => this.assessmentHistoryResponse()?.scoreProgress ?? 0);
  pillersHistory: PillarsHistoryResponse[] = [];

  constructor(
    private executiveService: ExecutiveService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.initializeChart();
    this.getAssignedInvitations();
    this.getCardDetails();
  }

  ngAfterViewInit() { }

 getAssignedInvitations(refresh: boolean = true) {

  // Don't call API again
  if (!refresh) {

    const search = (this.searchText || '').toLowerCase().trim();

    this.assignedInvitations = this.assignedInvitationsAll!.filter(x =>
      !search ||
      x.geographicReference?.toLowerCase().includes(search) 
    );

    if (this.assignedInvitations.length > 0) {
      this.assignedInvitation =
        this.assignedInvitations[0].userAssessmentMappingID;
    }

    return;
  }

  this.isLoader = true;

  this.executiveService
    .getExecutiveAssignedInvitations(this.searchText)
    .subscribe({
      next: (res) => {
        this.isLoader = false;

        this.assignedInvitations = res.result ?? [];
        this.assignedInvitationsAll = res.result ?? [];

        if (this.assignedInvitations.length > 0) {
          this.assignedInvitation =
            this.assignedInvitations[0].userAssessmentMappingID;
        }

        this.getDashboardPillarHistory();
        this.getResponsesByUserId();
      },
      error: () => {
        this.isLoader = false;
      }
    });
}

  yearChanged() {
    this.getDashboardPillarHistory();
    this.getCardDetails();
  }

  getCardDetails() {
    this.executiveService
      .getExecutiveCardDetails()
      .subscribe({
        next: (res) => {
          this.cardHistory = res.result;          
        },
        error: () => this.isLoader = false
      });
  }

  getDashboardPillarHistory() {
    this.isLoader = true;

    if (
      this.userService?.userInfo?.userID == null
    ) {
      return;
    }
    let request: UserAssessmentPillarDashboardRequstDto = {
      userAssessmentMappingID: this.assignedInvitation ?? null,
    };
    this.executiveService.getDashboardPillarHistory(request).subscribe({
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
  private readonly blueShades: string[] = [
    '#d062e6', // blue
    '#e7eb0b', // deep blue
    '#782599', // purple
    '#0772e4', // steel blue (distinct from primary blue)
    '#527191', // dark blue-grey
    '#7eaf0b', // dark teal
    '#03767e', // deep purple
    '#062f86', // strong blue
    '#e9d19d', // light sky blue (new distinct tone)
  ];
  ExportCityPillar() {
    let invitation = this.assignedInvitations?.find((x) => x.userAssessmentMappingID == this.assignedInvitation);
    if (this.assessmentHistoryResponse()?.pillars && invitation) {
      var exportData = this.assessmentHistoryResponse()?.pillars.map((x) => {
        return {
          ['Geographic Reference']: invitation?.geographicReference,
          ['Year']: invitation?.year,
          ['Pillar Name']: x.pillarName,
          ['Score']: x.scoreProgress?.toFixed(2),
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

    const allValues = [
      ...aiSeries,
      ...evaluatorSeries
    ];

    // Prevent negative / NaN issues
    const safeValues = allValues.map(v => Number(v) || 0);

    const max = Math.max(...safeValues, 0);

    // Round up to nearest 10 (like your other chart)
    const yAxisMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;
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
        formatter: (val: number) => {
          return `${val.toFixed(1)}`;
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
          text: 'Progress',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#032961'
          }
        },
        min: 0,
        max: yAxisMax,
        tickAmount: 5,
        labels: {
          formatter: (val) => val >= 0 ? `${Math.round(val)}` : '',
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

          const completionRate = pillar.completionRate.toFixed(1) ?? 0;
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
            ${evaluatorProgressPercent.toFixed(0)}
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
            <span>${evaluatorProgressPercent.toFixed(1)}</span>
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
            <span>${completionRate}%</span>
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
              📊 Total Answered 
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
              ⚠️ Critical Answered
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

  onAssessmentSelect(item: any) {
    this.assignedInvitation = item.userAssessmentMappingID;
    this.getDashboardPillarHistory();
    this.getResponsesByUserId();
  }
  getShortName(name: string | null | undefined): string {
    if (!name) return '';

    const words = name.split(' ');

    // take first 2–3 words only
    return words.slice(0, 3).join(' ');
  }

  GetPillarBarOptions() {

    const pillarMap = new Map<number, {
      pillarName: string;
      evaluators: Map<string, {
        score: number;
        ansQuestion: number;
        totalQuestion: number;
        compeletionRate: number;
      }>;
    }>();

    this.pillersHistory.forEach((item: PillarsHistoryResponse) => {
      if (!pillarMap.has(item.pillarID)) {
        pillarMap.set(item.pillarID, {
          pillarName: item.pillarName,
          evaluators: new Map()
        });
      }

      const pillarEntry = pillarMap.get(item.pillarID)!;

      item.users.forEach(user => {
        pillarEntry.evaluators.set(user.fullName, {
          score: user.scoreProgress,
          compeletionRate: user.compeletionRate,
          ansQuestion: user.ansQuestion,
          totalQuestion: user.totalQuestion
        });
      });
    });

    // ─── Unique evaluators
    const uniqueEvaluators = Array.from(
      new Set(this.pillersHistory.flatMap(x => x.users).map(x => x.fullName))
    );

    // ─── Categories (pillars)
    const categories = Array.from(pillarMap.values()).map(p => p.pillarName);

    // ─── Tooltip data
    const tooltipData = Array.from(pillarMap.values()).map(pillar => ({
      pillarName: pillar.pillarName,
      evaluators: Object.fromEntries(pillar.evaluators)
    }));

    // ─── Series (stacked per evaluator)
    const series: ApexAxisChartSeries = uniqueEvaluators.map(evaluator => ({
      name: evaluator,
      data: Array.from(pillarMap.values()).map(pillar => {
        const ev = pillar.evaluators.get(evaluator);
        return ev ? Number(ev.compeletionRate) : 0;
      })
    }));

    // ─────────────────────────────
    // ✅ Y AXIS MAX (STACKED FIX)
    // ─────────────────────────────
    const stackedTotals = categories.map((_, dataIndex) => {
      return series.reduce((sum, s: any) => {
        return sum + (Number(s.data[dataIndex]) || 0);
      }, 0);
    });

    const maxStack = Math.max(...stackedTotals, 0);

    const yAxisMax = Math.min(
      100, // optional cap (remove if not needed)
      maxStack > 0 ? Math.ceil(maxStack / 10) * 10 : 100
    );

    // ─── Colors
    const colors = uniqueEvaluators.map(
      (_, i) => this.blueShades[i % this.blueShades.length]
    );

    // ─── Chart Options
    this.chartOptionsBar = {
      series,

      chart: {
        type: 'bar',
        height: 250,
        stacked: true,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        zoom: { enabled: false },
        fontFamily: 'Montserrat, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        }
      },

      responsive: [
        {
          breakpoint: 768,
          options: {
            legend: {
              position: 'bottom',
              offsetX: -10,
              offsetY: 0
            }
          }
        }
      ],

      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: categories.length <= 4 ? '25%' :
            categories.length <= 8 ? '45%' : '65%',
          borderRadius: 4,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top',
            total: {
              enabled: true,
              formatter: (val: any) => val > 0 ? val.toFixed(1) + '%' : '',
              style: {
                fontSize: '11px',
                fontWeight: 700,
                color: '#326cc1'
              }
            }
          }
        }
      },

      dataLabels: {
        enabled: false
      },

      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },

      fill: {
        opacity: 1
      },

      xaxis: {
        type: 'category',
        categories,
        labels: {
          hideOverlappingLabels: false,
          style: {
            fontSize: '11px',
            fontWeight: 500,
            colors: '#64748b'
          },
          rotate: categories.length > 8 ? -45 : 0,
          trim: true,
          maxHeight: 130
        },
        title: {
          text: 'Pillars',
          style: { fontSize: '13px', fontWeight: 600, color: '#475569' }
        }
      },

      yaxis: {
        min: 0,
        max: yAxisMax, // ✅ dynamic now
        title: {
          text: 'Completion Rate (%)',
          style: { fontSize: '13px', fontWeight: 600, color: '#475569' }
        },
        labels: {
          formatter: (val: number) => val.toFixed(0) + '%',
          style: { fontSize: '12px', colors: '#64748b' }
        }
      },

      tooltip: {
        shared: true,
        intersect: false,
        style: { fontSize: '13px' },
        theme: 'light',
        y: {
          formatter: (val: number, opts: any) => {
            const seriesIndex = opts?.seriesIndex ?? 0;
            const dataPointIndex = opts?.dataPointIndex ?? 0;

            const evaluatorName = uniqueEvaluators[seriesIndex];
            const pillarData = tooltipData[dataPointIndex];

            if (!pillarData || val === 0) return '—';

            const ev = pillarData.evaluators[evaluatorName];
            if (!ev) return '—';

            const score = Number(ev.score || 0).toFixed(1);

            return (
              `Completion: ${val.toFixed(1)}%` +
              ` | Score: ${score}` +
              ` (${ev.ansQuestion}/${ev.totalQuestion} questions)`
            );
          }
        }
      },

      legend: {
        position: 'top',
        horizontalAlign: 'center',
        offsetY: 4,
        fontSize: '13px',
        fontWeight: 500,
        markers: {
          width: 12,
          height: 12,
          radius: 3
        },
        itemMargin: { horizontal: 12, vertical: 8 }
      },

      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 20, bottom: 0, left: 10 }
      },

      colors
    };
  }

  private initializeChart() {
    this.chartOptionsBar = {
      series: [],
      chart: {
        type: 'bar',
        height: 500,
        stacked: true
      },
      xaxis: { categories: [] },
      responsive: [],
      fill: { opacity: 1 }
    };
  }

  getResponsesByUserId() {

    this.isLoader = true;
    const payload: GetCityPillarHistoryRequestNewDto = {
      userId: this.userService?.userInfo?.userID,
      pillarID: 0,
      userAssessmentMappingID: this.assignedInvitation,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    this.executiveService.getResponsesByUserIdData(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.pillersHistory = res.result ?? [];
        this.loadPillars();
        this.GetPillarBarOptions();
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("There is an error occur");
      }
    });
  }
  loadPillars() {
    this.userMap = new Map<number, string>();
    this.pillersHistory.forEach((pillar) => {
      pillar.users.forEach((u) => this.userMap.set(u.userID, u.fullName));
    });

    this.pillarColumns = Array.from(this.userMap.keys()).map((id) => id.toString());
    this.displayedColumns = ["pillarName", ...this.pillarColumns];

    const data = this.pillersHistory.map((pillar) => {
      const row: PillarsTableRow = {
        pillarName: pillar.pillarName,
        pillarID: pillar.pillarID,
      };

      this.userMap.forEach((_, userID) => {
        row[userID] = {};
      });

      pillar.users.forEach((u) => {
        row[u.userID] = {
          scoreProgress: u.scoreProgress,
          compeletionRate: u.compeletionRate
        };
      });

      return row;
    });
    this.dataSource = new MatTableDataSource<PillarsTableRow>(data);
  }

  onViewWeekly(item: any, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/executive/evaluator-Comparision-Weekly'], {
      queryParams: {
        id: item.userAssessmentMappingID,
      }
    });
  }

}
