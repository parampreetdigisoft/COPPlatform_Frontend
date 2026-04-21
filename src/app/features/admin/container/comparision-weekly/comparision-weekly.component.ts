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
  QuestionTableRow,
  WeeklyPillarsHistoryResponseDto
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
  ApexFill,
  ApexMarkers
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
  markers: ApexMarkers;
};

@Component({
  selector: "app-comparision",
  templateUrl: "./comparision-weekly.component.html",
  styleUrl: "./comparision-weekly.component.css",
})
export class ComparisionWeeklyComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  pillers: PillarsVM[] = [];
  pillersHistory: PillarsHistoryResponse[] = [];
  pillersWeeklyHistory: WeeklyPillarsHistoryResponseDto | null;
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
  invitationsSelect?: GetAssignedAssessmentResponseDto | null;
  latestStartDate: string = '';
  latestEndDate: string = '';
  oldEndDate: string = '';
  oldStartDate: string = '';
  minDate: Date = new Date();
  week1Range: Date[] = [];
  week2Range: Date[] = [];
  week1Error: string = '';
  week2Error: string = '';
  private readonly blueShades: string[] = [
    '#326cc1', // blue
    '#e74c3c', // red
    '#2ecc71', // green
    '#f39c12', // orange
    '#9b59b6', // purple
    '#1abc9c', // teal
    '#34495e', // dark blue-grey
    '#e67e22', // deep orange
    '#16a085', // dark teal
    '#c0392b', // dark red
    '#27ae60', // dark green
    '#8e44ad', // deep purple
    '#2980b9', // strong blue
    '#d35400', // burnt orange
  ];

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService
  ) { this.pillersWeeklyHistory = {} as WeeklyPillarsHistoryResponseDto }

  ngOnInit(): void {
    this.isLoader = true;
    this.setDefaultDates();
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

    // ==============================
    // ✅ VALIDATION BLOCK (IMPORTANT)
    // ==============================

    const week1 = this.week1Range;
    const week2 = this.week2Range;

    // Week1 validation
    if (
      (week1?.[0] && !week1?.[1]) ||
      (!week1?.[0] && week1?.[1])
    ) {
      this.toaster.showError("Please select complete First date range");
      return;
    }

    // Week2 validation
    if (
      (week2?.[0] && !week2?.[1]) ||
      (!week2?.[0] && week2?.[1])
    ) {
      this.toaster.showError("Please select complete Second date range");
      return;
    }
    const week1Selected =
      this.week1Range?.[0] && this.week1Range?.[1];

    const week2Selected =
      this.week2Range?.[0] && this.week2Range?.[1];

    // ===============================
    // ❌ CROSS VALIDATION RULE
    // ===============================

    // Week1 selected but Week2 missing
    if (week1Selected && !week2Selected) {
      this.toaster.showError("Second range is required when First range is selected");
      return;
    }

    // Week2 selected but Week1 missing
    if (week2Selected && !week1Selected) {
      this.toaster.showError("First range is required when Second range is selected");
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
      pageSize: this.pageSize,

      // Week 1
      week1StartDate: this.week1Range?.[0]?.toISOString() ?? null,
      week1EndDate: this.week1Range?.[1]?.toISOString() ?? null,

      // Week 2
      week2StartDate: this.week2Range?.[0]?.toISOString() ?? null,
      week2EndDate: this.week2Range?.[1]?.toISOString() ?? null,
    };

    this.questionsByUserPillars = [];

    this.adminService.getResponsesByUserIdWeekly(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        this.pillersWeeklyHistory = res.result;
        this.pillersHistory = this.pillersWeeklyHistory?.week1!;
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
      cityID: this.selectedInvitations,
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

    const week1 = this.pillersWeeklyHistory?.week1 ?? [];
    const week2 = this.pillersWeeklyHistory?.week2 ?? [];

    // ─── 1. Unique pillars
    const pillarMap = new Map<number, string>();

    [...week1, ...week2].forEach(p => {
      if (!pillarMap.has(p.pillarID)) {
        pillarMap.set(p.pillarID, p.pillarName);
      }
    });

    const pillarIDs = Array.from(pillarMap.keys());
    const categories = Array.from(pillarMap.values());

    // ─── 2. Helper → average completion per pillar
    const getAvg = (data: any[], pillarID: number) => {
      const pillar = data.find(p => p.pillarID === pillarID);
      if (!pillar || !pillar.users.length) return 0;

      const total = pillar.users.reduce(
        (sum: number, u: any) => sum + Number(u.compeletionRate || 0),
        0
      );

      return total / pillar.users.length;
    };
    const week1Values = pillarIDs.map(id => getAvg(week1, id));
    const week2Values = pillarIDs.map(id => getAvg(week2, id));

    const maxCompletion = Math.max(
      ...week1Values,
      ...week2Values,
      0
    );

    const yAxisMax = Math.ceil(maxCompletion / 10) * 10 ;
    const tooltipData = pillarIDs.map(id => {
      const w1 = week1.find(p => p.pillarID === id);
      const w2 = week2.find(p => p.pillarID === id);

      return {
        week1: w1?.users || [],
        week2: w2?.users || []
      };
    });

    // ─── 3. Series (ONLY 2 lines)
    const series: ApexAxisChartSeries = [
      {
        name: 'First Range Data',
        data: pillarIDs.map(id => getAvg(week1, id))
      },
      {
        name: 'Second Range Data',
        data: pillarIDs.map(id => getAvg(week2, id))
      }
    ];

    this.chartOptions = {
      series,

      chart: {
        type: 'line', // ✅ changed
        height: 500,
        toolbar: {
          show: true
        },
        zoom: { enabled: false },
        fontFamily: 'Montserrat, sans-serif'
      },

      stroke: {
        curve: 'smooth', // ✅ nice curve like your image
        width: 3
      },

      markers: {
        size: 5
      },

      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%'
      },

      xaxis: {
        categories,
        title: {
          text: 'Pillars'
        },
        labels: {
          rotate: -45,
          trim: true,
          maxHeight: 120,
          formatter: (val: string) => {
            if (!val) return ''; // ✅ prevent crash

            return val.length > 15
              ? val.substring(0, 15) + '...'
              : val;
          }
        }
      },

      yaxis: {
        min: 0,
        max: yAxisMax,
        title: {
          text: 'Completion Rate (%)'
        },
        labels: {
          formatter: (val: number) => val.toFixed(0) + '%'
        }
      },

      colors: ['#3b82f6', '#f59e0b'], // blue vs orange

      legend: {
        position: 'top'
      },

      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4
      },

      tooltip: {
        shared: false,
        intersect: false,
        custom: ({ seriesIndex, dataPointIndex, w }: any) => {

          const isWeek1 = seriesIndex === 0;
          const data = tooltipData[dataPointIndex];

          const users = isWeek1 ? data.week1 : data.week2;
          const weekLabel = isWeek1 ? 'First Range Data' : 'Second Range Data';
          const pillarName = categories[dataPointIndex] || 'Unknown';

          const themeColor = isWeek1 ? '#3b82f6' : '#f59e0b';

          if (!users || !users.length) {
            return `
        <div style="
          padding:10px;
          background:#fff;
          border-radius:8px;
          box-shadow:0 4px 12px rgba(0,0,0,0.1);
        ">
          <div style="font-weight:600;">${pillarName}</div>
          <div style="color:${themeColor}; font-size:12px;">${weekLabel}</div>
          <div style="color:#94a3b8; font-size:12px;">No data</div>
        </div>
      `;
          }

          // ✅ sort users
          const sortedUsers = [...users].sort(
            (a: any, b: any) =>
              Number(b.compeletionRate || 0) - Number(a.compeletionRate || 0)
          );

          const userHtml = sortedUsers.map((u: any) => {

            const completion = Number(u.compeletionRate || 0).toFixed(1);
            const score = Number(u.scoreProgress || 0).toFixed(1);

            // 🔥 UNIQUE COLOR PER USER
            const userColor = this.getUserColor(u.fullName);

            return `
        <div style="
          display:grid;
          grid-template-columns: 14px 110px 1fr;
          align-items:center;
          gap:6px;
          margin-bottom:6px;
          font-size:12px;
        ">

          <!-- Colored dot -->
          <span style="
            width:10px;
            height:10px;
            border-radius:50%;
            background:${userColor};
            display:inline-block;
          "></span>

          <!-- Name -->
          <span style="color:#475569;">
            ${u.fullName}
          </span>

          <!-- Values -->
          <span style="color:#0f172a; font-weight:600;">
            Completion: ${completion}% 
            | Score: ${score}% 
            (${u.ansQuestion}/${u.totalQuestion} questions)
          </span>

        </div>
      `;
          }).join('');

          return `
      <div style="
        background:#ffffff;
        border-radius:10px;
        box-shadow:0 6px 18px rgba(0,0,0,0.15);
        min-width:280px;
        font-family:Montserrat, sans-serif;
        overflow:hidden;
      ">

        <!-- Header -->
        <div style="
          background:#f1f5f9;
          padding:8px 12px;
          font-weight:600;
          font-size:13px;
          color:#1e293b;
          border-bottom:1px solid #e2e8f0;
        ">
          ${pillarName}
        </div>

        <!-- Week -->
        <div style="
          padding:6px 12px;
          font-size:12px;
          font-weight:600;
          color:${themeColor};
        ">
          ${weekLabel}
        </div>

        <!-- Users -->
        <div style="padding:8px 12px;">
          ${userHtml}
        </div>

      </div>
    `;
        }
      }
    };
  }
  getUserColor(name: string): string {
    const colors = [
      '#3b82f6', // blue
      '#f59e0b', // orange
      '#10b981', // green
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f43f5e', // pink
      '#84cc16'  // lime
    ];

    // simple hash from name → consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
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
  onStartDateChange() {
    // If end date is now before the new start date, reset it

  }
  validateWeek1() {
    if (!this.week1Range || this.week1Range.length !== 2) {
      this.week1Error = '';
      return;
    }

    const from = this.week1Range[0];
    const to = this.week1Range[1];

    if (!from || !to) {
      this.week1Error = '';
      return;
    }

    if (to.getTime() < from.getTime()) {
      this.week1Error = 'End date must be greater than or equal to start date';
      this.week1Range = [];
    } else {
      this.week1Error = '';
    }
  }
  validateWeek2() {
    if (!this.week2Range || this.week2Range.length !== 2) {
      this.week2Error = '';
      return;
    }

    const from = this.week2Range[0];
    const to = this.week2Range[1];

    if (!from || !to) {
      this.week2Error = '';
      return;
    }

    if (to.getTime() < from.getTime()) {
      this.week2Error = 'End date must be greater than or equal to start date';
      this.week2Range = [];
    } else {
      this.week2Error = '';
    }
  }
  setDefaultDates() {

    const today = new Date();

    // =========================
    // WEEK 1 (Current Week)
    // =========================
    const currentWeekStart = this.getWeekStart(today); // Monday
    const currentWeekEnd = today;

    this.week1Range = [currentWeekStart, currentWeekEnd];

    // =========================
    // WEEK 2 (Previous Week)
    // =========================
    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

    const prevWeekEnd = new Date(prevWeekStart);
    prevWeekEnd.setDate(prevWeekStart.getDate() + 6);

    this.week2Range = [prevWeekStart, prevWeekEnd];
  }
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay(); // Sunday = 0, Monday = 1

    // Convert to Monday-based week (like SQL DATEFIRST 1)
    const diff = (day === 0 ? -6 : 1 - day);

    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);

    return d;
  }
}