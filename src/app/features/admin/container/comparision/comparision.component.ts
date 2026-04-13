import { Component, OnInit } from "@angular/core";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { CommonService } from "src/app/core/services/common.service";
import { GetCityPillarHistoryRequestDto, GetCityPillarHistoryRequestNewDto } from "src/app/core/models/AssessmentRequest";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { MatTableDataSource } from "@angular/material/table";
import {
  PillarsHistoryResponse,
  PillarsTableRow,
  QuestionTableRow
} from "src/app/core/models/PillarsUserHistoryResponse";
import { QuestionsByUserPillarsResponsetDto } from "src/app/core/models/GetQuestionHistoryResponseDto ";
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexLegend,
  ApexPlotOptions,
  ApexGrid,
  ApexStroke,
  ApexResponsive,
  ApexFill
} from "ng-apexcharts";
import { AdminService } from "../../admin.service";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";

export type ChartOptions = {
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
};

@Component({
  selector: "app-comparision",
  templateUrl: "./comparision.component.html",
  styleUrl: "./comparision.component.css",
})
export class ComparisionComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  pillers: PillarsVM[] = [];
  pillersHistory: PillarsHistoryResponse[] = [];
  questionsByUserPillars: QuestionsByUserPillarsResponsetDto[] = [];
  invitations: GetAssignedAssessmentResponseDto[] | null = [];
  selectedinvitations: number | any = "";
  selectedPillarID: number | any = "";
  isLoader: boolean = false;
  isPillarHistroyDownloading: boolean = false;
  dataSource = new MatTableDataSource<PillarsTableRow>([]);
  displayedColumns: string[] = [];
  userMap = new Map<number, string>();
  expandedElement: PillarsTableRow | null = null;
  questionsPillars = new MatTableDataSource<QuestionTableRow>([]);
  displayedQuestionColumns: string[] = [];
  chartOptions!: Partial<ChartOptions>;
  pageSize: number = 28;
  currentPage: number = 1;
  totalRecords: number = 0;
  pillarColumns: string[] = [];

  /**
   * Blue-shade palette based on #326cc1.
   * Provides enough distinct shades for up to 14 users.
   */
  private readonly blueShades: string[] = [
    '#326cc1', // base blue
    '#1a4f9e', // dark navy blue
    '#4d85cc', // mid blue
    '#0d3b82', // deep blue
    '#6399d4', // lighter mid blue
    '#2557a7', // strong blue
    '#7aaee0', // soft blue
    '#1c4a8a', // dark medium blue
    '#5e90d8', // periwinkle blue
    '#3d78c8', // vibrant blue
    '#91bce8', // pale blue
    '#264e8f', // slate blue
    '#4a7bbf', // steel blue
    '#0a3070', // darkest blue
  ];

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.GetAllPillars();
    this.getAllinvitationsByUserId();
    this.initializeChart();
  }

  GetAllPillars() {
    this.adminService.getAllPillars().subscribe((p) => {
      this.pillers = p;
    });
  }

  getAllinvitationsByUserId() {
    this.adminService
      .getAssignedInvitations()
      .subscribe({
        next: (res) => {
          this.isLoader = false;
          this.invitations = res.result ?? [];
          if (this.invitations && this.invitations.length > 0) {
            this.selectedinvitations = this.invitations[0].userAssessmentMappingID;
            this.getResponsesByUserId();
          }
        },
        error: () => {
          this.isLoader = false;
        }
      });
  }

  getResponsesByUserId() {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedinvitations ||
      this.selectedinvitations === "" ||
      this.selectedinvitations == null
    ) {
      return;
    }
    this.isLoader = true;
    const payload: GetCityPillarHistoryRequestNewDto = {
      userId: this.userService?.userInfo?.userID,
      pillarID:
        this.selectedPillarID && this.selectedPillarID > 0
          ? this.selectedPillarID
          : null,
      userAssessmentMappingID: this.selectedinvitations,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear),
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };
    this.questionsByUserPillars = [];
    this.adminService.getResponsesByUserId(payload).subscribe({
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

  compareinvitations(event: any) {
    this.currentPage = event;
    this.getResponsesByUserId();
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
        row[userID] = "0";
      });

      pillar.users.forEach((u) => {
        row[u.userID] = u.scoreProgress;
      });

      return row;
    });
    this.dataSource = new MatTableDataSource<PillarsTableRow>(data);
  }

  loadPillarQuestion() {
    const data = this.questionsByUserPillars.map((question) => {
      const row: QuestionTableRow = {
        question: question.questionText,
      };
      this.userMap.forEach((userID) => {
        row[userID] = {
          score: null,
          justification: null,
          optionText: null,
        };
      });

      question.users.forEach((u) => {
        row[u.userID] = {
          score: u.score,
          justification: u.justification,
          optionText: u.optionText,
        };
      });
      return row;
    });

    this.displayedQuestionColumns = ["question", ...this.pillarColumns];
    this.questionsPillars = new MatTableDataSource<QuestionTableRow>(data);
  }

  getQuestionsHistoryByPillar(pillarID: number) {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedinvitations ||
      this.selectedinvitations === "" ||
      this.selectedinvitations == null
    ) {
      return;
    }
    this.questionsByUserPillars = [];
    const payload: GetCityPillarHistoryRequestDto = {
      userID: this.userService?.userInfo?.userID,
      pillarID: pillarID,
      cityID: this.selectedinvitations,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    };
    this.adminService.getQuestionsHistoryByPillar(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.questionsByUserPillars = res.result ?? [];
          this.loadPillarQuestion();
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("There is an error please try later");
      },
    });
  }

  exportPillarsHistoryByUserId() {
    if (
      this.userService?.userInfo?.userID == null ||
      !this.selectedinvitations ||
      this.selectedinvitations === "" ||
      this.selectedinvitations == null ||
      this.pillarColumns?.length == 0
    ) {
      return;
    }
    this.isPillarHistroyDownloading = true;
    const payload: GetCityPillarHistoryRequestDto = {
      userID: this.userService?.userInfo?.userID,
      cityID: this.selectedinvitations,
      updatedAt: this.commonService.getStartOfYearLocal(this.selectedYear)
    };
    if (this.selectedPillarID) {
      payload.pillarID = this.selectedPillarID;
    }
    this.adminService.exportPillarsHistoryByUserId(payload).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = "PillarQuestionHistory.xlsx";
        a.click();
        this.isPillarHistroyDownloading = false;
        this.toaster.showSuccess("Pillars History downloaded successfully");
      },
      error: () => {
        this.isPillarHistroyDownloading = false;
        this.toaster.showError("There is an error please try later");
      },
    });
  }

  toggleRow(element: any) {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement) {
      this.getQuestionsHistoryByPillar(element.pillarID);
    }
  }

  customSearchFn(term: string, item: GetAssignedAssessmentResponseDto) {
    term = term.toLowerCase();
    return (
      item.geographicReference?.toLowerCase()?.includes(term) ||
      item.assignedBy?.toLowerCase()?.includes(term) ||
      (item.year || '').toString().includes(term)
    );
  }

  /**
   * Builds a STACKED bar chart where:
   *  - X-axis = 14 pillars (always shown, even if no data).
   *  - Each series = one unique evaluator/user.
   *  - Each bar segment = that user's scoreProgress for that pillar.
   *  - Color = unique blue shade per user.
   *  - Tooltip = scoreProgress (%) + completionRate (%) + answered/total questions.
   */
  GetPillarBarOptions() {
    // ─── 1. Build a map: pillarID → { pillarName, evaluators: Map<userName, data> }
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

    // ─── 2. Unique evaluators (determines series count & color count)
    const uniqueEvaluators = Array.from(
      new Set(this.pillersHistory.flatMap(x => x.users).map(x => x.fullName))
    );

    // ─── 3. Categories = pillar names from the map (always 14 pillars)
    const categories = Array.from(pillarMap.values()).map(p => p.pillarName);

    // ─── 4. Tooltip raw data indexed by position for O(1) lookup in formatter
    const tooltipData = Array.from(pillarMap.values()).map(pillar => ({
      pillarName: pillar.pillarName,
      evaluators: Object.fromEntries(pillar.evaluators)
    }));

    // ─── 5. Build series — one per evaluator, stacked contribution per pillar
    const series: ApexAxisChartSeries = uniqueEvaluators.map(evaluator => ({
      name: evaluator,
      data: Array.from(pillarMap.values()).map(pillar => {
        const ev = pillar.evaluators.get(evaluator);
        // Each user contributes their own scoreProgress slice
        return ev ? Number(ev.compeletionRate) : 0;
      })
    }));

    // ─── 6. Assign blue shades — cycle if more users than palette entries
    const colors = uniqueEvaluators.map(
      (_, i) => this.blueShades[i % this.blueShades.length]
    );

    this.chartOptions = {
      series,

      chart: {
        type: 'bar',
        height: 500,
        stacked: true,          // ← KEY: stacked mode
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
        zoom: {
          enabled: false
        },
        fontFamily: 'Montserrat, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        }
      },

      // ─── Responsive: move legend to bottom on small screens
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
          borderRadiusApplication: 'end',        // only top of full stack rounded
          borderRadiusWhenStacked: 'last',        // round only the topmost segment
          dataLabels: {
            position: 'top',
            total: {
              enabled: true,                      // show total at top of stack
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
        enabled: false                            // individual segment labels off; total label above handles it
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
          style: {
            fontSize: '11px',
            fontWeight: 500,
            colors: '#64748b'
          },
          rotate: categories.length > 8 ? -45 : 0,
          rotateAlways: false,
          trim: true,
          maxHeight: 130
        },
        title: {
          text: 'Pillars',
          style: { fontSize: '13px', fontWeight: 600, color: '#475569' }
        }
      },

      yaxis: {
        title: {
          text: 'Score (%)',
          style: { fontSize: '13px', fontWeight: 600, color: '#475569' }
        },
        labels: {
          formatter: (val: number) => val.toFixed(0) + '%',
          style: { fontSize: '12px', colors: '#64748b' }
        },
        min: 0,
        max: 100
      },

      // ─── Tooltip: shows each user's scoreProgress + completionRate
      tooltip: {
        shared: true,
        intersect: false,
        style: { fontSize: '13px' },
        theme: 'light',
        y: {
          formatter: (val: number, opts: any) => {
            const seriesIndex: number   = opts?.seriesIndex ?? 0;
            const dataPointIndex: number = opts?.dataPointIndex ?? 0;

            const evaluatorName = uniqueEvaluators[seriesIndex];
            const pillarData    = tooltipData[dataPointIndex];

            if (!pillarData || val === 0) return '—';

            const ev = pillarData.evaluators[evaluatorName];
            if (!ev) return '—';

            const completion = typeof ev.compeletionRate === 'number'
              ? ev.compeletionRate.toFixed(1)
              : ev.compeletionRate;

            return (
              `Score: ${Number(val).toFixed(1)}%` +
              ` | Completion: ${completion}%` +
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
    this.chartOptions = {
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
}