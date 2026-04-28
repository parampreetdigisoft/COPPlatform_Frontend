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

import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { AdminService } from "src/app/features/admin/admin.service";
import { ActivatedRoute } from "@angular/router";

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
  pillersWeeklyHistory: PillarsHistoryResponse[] | null;
  questionsByUserPillars: QuestionsByUserPillarsResponseDto[] = [];
  invitations: GetAssignedAssessmentResponseDto[] | null = [];
  selectedInvitations: number | any = "";
  queryInvitationId: number | any = null;
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
  timeOptions = [
    { label: 'Week 1', value: 'W1' },
    { label: 'Week 2', value: 'W2' },
    { label: 'Week 3', value: 'W3' },
    { label: 'Week 4', value: 'W4' },
  ];

  selectedPeriods: string[] = [];
  onPeriodChange() {    
    this.getResponsesByUserId()

  }
  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    public commonService: CommonService,
    private route: ActivatedRoute
  ) { this.pillersWeeklyHistory = [] as PillarsHistoryResponse[] }

  ngOnInit(): void {
    this.selectedPeriods = ['W1', 'W2'];
    this.isLoader = true;
    this.route.queryParams.subscribe(params => {
    this.queryInvitationId = params['id'];   // store it
  });
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
  this.adminService.getAssignedInvitations().subscribe({
    next: (res) => {
      this.isLoader = false;
      this.invitations = res.result ?? [];

      if (this.invitations && this.invitations.length > 0) {

        // ✅ If query param exists, use it
        if (this.queryInvitationId) {
          const match = this.invitations.find(
            x => x.userAssessmentMappingID == this.queryInvitationId
          );

          if (match) {
            this.selectedInvitations = match.userAssessmentMappingID;
            this.invitationsSelect = match;
          } else {
            // fallback
            this.selectedInvitations = this.invitations[0].userAssessmentMappingID;
            this.invitationsSelect = this.invitations[0];
          }
        } else {
          // default behavior
          this.selectedInvitations = this.invitations[0].userAssessmentMappingID;
          this.invitationsSelect = this.invitations[0];
        }

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
      !this.selectedInvitations
    ) {
      return;
    }

    // ✅ Validate periods
    if (!this.selectedPeriods || this.selectedPeriods.length === 0) {

      this.toaster.showError("Please select at least one Week");
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

      // ✅ NEW FIELD
      selectedPeriods: this.selectedPeriods
    };

    this.questionsByUserPillars = [];

    this.adminService.getResponsesByUserIdWeekly(payload).subscribe({
      next: (res) => {
        this.isLoader = false;

        this.pillersWeeklyHistory = res.result;       

        // 👇 backend may return combined or separated data
        // this.pillersHistory = this.pillersWeeklyHistory;

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

  const data = this.pillersWeeklyHistory || [];

  if (!data.length) return;

  // ─────────────────────────────
  // 1. Normalize
  // ─────────────────────────────
  const normalized = data.map(x => ({
    ...x,
    weekType: (x.weekType || '').toUpperCase(),
    users: Array.isArray(x.users) ? x.users : []
  }));

  // ─────────────────────────────
  // 2. Group by weekType
  // ─────────────────────────────
  const grouped: Record<string, any[]> = {};

  normalized.forEach(item => {
    if (!item.weekType) return;

    if (!grouped[item.weekType]) {
      grouped[item.weekType] = [];
    }
    grouped[item.weekType].push(item);
  });

  // ✅ SORT weeks properly (WEEK1, WEEK2, WEEK10 fix)
  const periods = Object.keys(grouped).sort((a, b) => {
    const numA = Number(a.replace(/\D/g, ''));
    const numB = Number(b.replace(/\D/g, ''));
    return numA - numB;
  });

  // ─────────────────────────────
  // 3. Sort & Prepare Pillars
  // ─────────────────────────────
  const sorted = [...normalized].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const pillarMap = new Map<number, string>();

  sorted.forEach(p => {
    if (p.pillarID != null) {
      pillarMap.set(Number(p.pillarID), p.pillarName);
    }
  });

  const pillarIDs = [...pillarMap.keys()];
  const categories = [...pillarMap.values()];

  // ─────────────────────────────
  // 4. Value Extractor
  // ─────────────────────────────
  const getValue = (obj: any): number => {
    return Number(
      obj?.compeletionRate ??
      obj?.scoreProgress ??
      0
    ) || 0;
  };

  // ─────────────────────────────
  // 5. Average Calculator
  // ─────────────────────────────
  const getAvg = (weekData: any[], pillarID: number) => {

    const rows = weekData.filter(x =>
      Number(x.pillarID) === Number(pillarID)
    );

    let total = 0;
    let count = 0;

    rows.forEach(r => {
      (r.users || []).forEach((u: any) => {
        total += getValue(u);
        count++;
      });
    });

    return count ? total / count : 0;
  };

  // ─────────────────────────────
  // 6. SERIES
  // ─────────────────────────────
  const series = periods.map(week => {
    const weekData = grouped[week] || [];

    return {
      name: week.replace('WEEK', 'Week '),
      data: pillarIDs.map(id => getAvg(weekData, id))
    };
  });

  // ─────────────────────────────
  // 7. Y AXIS
  // ─────────────────────────────
  const allValues = series.flatMap(s => s.data);
  const max = Math.max(...allValues, 0);
  const yAxisMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;

  // ─────────────────────────────
  // 8. TOOLTIP MAP
  // ─────────────────────────────
  const tooltipMap = pillarIDs.map(id => {

    const obj: any = {};

    periods.forEach(p => {
      const weekData = grouped[p] || [];

      const row = weekData.find(x =>
        Number(x.pillarID) === Number(id)
      );

      obj[p] = row?.users || [];
    });

    return obj;
  });

  // ─────────────────────────────
  // 9. COLORS
  // ─────────────────────────────
  const palette = [
    '#3b82f6',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4'
  ];

  const chartColors = periods.map((_, i) => palette[i % palette.length]);

  // ─────────────────────────────
  // 10. CHART CONFIG
  // ─────────────────────────────
  this.chartOptions = {
    series,

    chart: {
      type: 'line',
      height: 600,
      toolbar: { show: true },
      zoom: { enabled: false },
      fontFamily: 'Montserrat, sans-serif'
    },

    // ✅ FIXED HERE (SOLID LINES)
    stroke: {
      curve: 'smooth',
      width: 4,
      dashArray: 0
    },

    markers: {
      size: 6,
      shape: ['circle', 'square', 'triangle', 'diamond']
    },

    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
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
        min: 0,
        max: yAxisMax,
        labels: {
          formatter: (val: number) => `${val.toFixed(0)}%`
        },
        title: {
          text: 'Completion Rate (%)',
          style: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569'
          }
        }
      },

    colors: chartColors,

    legend: { position: 'top' },

    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4
    },

    tooltip: {
      shared: false,
      intersect: false,
      custom: ({ seriesIndex, dataPointIndex }: any) => {

        const weekKey = periods[seriesIndex];
        const users = tooltipMap[dataPointIndex]?.[weekKey] || [];
        const pillarName = categories[dataPointIndex] || 'Unknown';

        const themeColor = chartColors[seriesIndex];

        if (!users.length) {
          return `
          <div style="
            padding:10px;
            background:#fff;
            border-radius:8px;
            box-shadow:0 4px 12px rgba(0,0,0,0.1);
          ">
            <div style="font-weight:600;">${pillarName}</div>
            <div style="color:${themeColor}; font-size:12px;">${weekKey}</div>
            <div style="color:#94a3b8; font-size:12px;">No data</div>
          </div>
        `;
        }

        const sortedUsers = [...users].sort(
          (a: any, b: any) => getValue(b) - getValue(a)
        );

        const userHtml = sortedUsers.map((u: any) => {

          const completion = getValue(u).toFixed(1);
          const score = Number(u.scoreProgress || 0).toFixed(1);
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
            <span style="
              width:10px;
              height:10px;
              border-radius:50%;
              background:${userColor};
            "></span>

            <span style="color:#475569;">
              ${u.fullName}
            </span>

            <span style="color:#0f172a; font-weight:600;">
              Completion: ${completion}% 
              | Score: ${score}% 
              (${u.ansQuestion}/${u.totalQuestion})
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
          overflow:hidden;
        ">
          <div style="
            background:#f1f5f9;
            padding:8px 12px;
            font-weight:600;
            border-bottom:1px solid #e2e8f0;
          ">
            ${pillarName}
          </div>

          <div style="
            padding:6px 12px;
            font-weight:600;
            color:${themeColor};
          ">
            ${weekKey}
          </div>

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