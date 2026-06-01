import { Component, OnInit } from "@angular/core";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { CommonService } from "src/app/core/services/common.service";
import { GetCityPillarHistoryRequestDto, GetCityPillarHistoryRequestNewDto, GetQuesiontAssessmentHistoryRequestDto } from "src/app/core/models/AssessmentRequest";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { MatTableDataSource } from "@angular/material/table";
import {
  PillarsHistoryResponse,
  PillarsTableRow,
  QuestionTableRow
} from "src/app/core/models/PillarsUserHistoryResponse";
import { QuestionsByUserPillarsResponseDto } from "src/app/core/models/GetQuestionHistoryResponseDto ";
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
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { AdminService } from "src/app/features/admin/admin.service";

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
  questionsByUserPillars: QuestionsByUserPillarsResponseDto[] = [];
  invitations: GetAssignedAssessmentResponseDto[] | null = [];
  selectedInvitations: number | any = "";
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
  invitationsSelect?:GetAssignedAssessmentResponseDto | null;  
  /**
   * Blue-shade palette based on #326cc1.
   * Provides enough distinct shades for up to 14 users.
   */
 private readonly blueShades: string[] = [
  '#bd13df', // blue
  '#e7eb0b', // deep blue
  '#9b59b6', // purple
  '#0772e4', // steel blue (distinct from primary blue)
  '#527191', // dark blue-grey
  '#7eaf0b', // dark teal
  '#8e44ad', // deep purple
  '#062f86', // strong blue
  '#e9d19d', // light sky blue (new distinct tone)
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
            this.selectedInvitations = this.invitations[0].userAssessmentMappingID;
            this.invitationsSelect = this.invitations.find(x => x.userAssessmentMappingID == this.selectedInvitations);
            this.getResponsesByUserId();
          }
          else{
            this.isLoader = false;
            this.toaster.showWarning("You don’t have any assigned assessments yet. Please reach out to the analyst.");
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
      !this.selectedInvitations ||
      this.selectedInvitations === "" ||
      this.selectedInvitations == null
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
      userAssessmentMappingID: this.selectedInvitations,
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
      !this.selectedInvitations ||
      this.selectedInvitations === "" ||
      this.selectedInvitations == null
    ) {
      return;
    }
    this.questionsByUserPillars = [];
    const payload: GetQuesiontAssessmentHistoryRequestDto = {
      pillarID: pillarID,
      userAssessmentMappingID: this.selectedInvitations
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
      !this.selectedInvitations ||
      this.selectedInvitations === "" ||
      this.selectedInvitations == null ||
      this.pillarColumns?.length == 0
    ) {
      return;
    }
    this.isPillarHistroyDownloading = true;
    const payload: GetCityPillarHistoryRequestDto = {
      userID: this.userService?.userInfo?.userID,
      userAssessmentMappingID: this.selectedInvitations,
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
  this.chartOptions = {
    series,

    chart: {
      type: 'bar',
      height: 500,
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
  isDueSoon(dueDate?: string): boolean {
    if (!dueDate) return false;

    const today = new Date();
    const due = new Date(dueDate);

    const diffDays = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);

    return diffDays <= 3; // highlight if within 3 days
  }
}