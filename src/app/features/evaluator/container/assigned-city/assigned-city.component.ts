import { Component, OnDestroy, OnInit } from "@angular/core";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { CommonService } from "src/app/core/services/common.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { GetInviatationRequestDto, GetInviatationResponseDto } from "src/app/core/models/GetInviatationRequestDto";
import { EvaluatorService } from "../../evaluator.service";
import { DateViewerComponent } from "src/app/shared/standAlone/date-viewer/date-viewer.component";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, DateViewerComponent],
  selector: 'app-assigned-city',
  templateUrl: './assigned-city.component.html',
  styleUrl: './assigned-city.component.css'
})
export class AssignedCityComponent implements OnInit, OnDestroy {
  selectedYear = new Date().getFullYear();
  isLoader: boolean = false;
  selectedAnalyst: GetInviatationResponseDto | null = null;
  analystResponse: PaginationResponse<GetInviatationResponseDto> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  invitations: GetAssignedAssessmentResponseDto[] = [];
  userAssessmentMappingID: number | null = null;

  constructor(
    private evaluatorService: EvaluatorService,
    public commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.getInviations();
    this.getAllCitiesByUserId();
  }
  getAllCitiesByUserId() {
    this.evaluatorService
      .getAssignedInvitations()
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.invitations = res.result ?? [];
          }
        },
      });
  }
  getInviations(currentPage: number = 1) {
    this.analystResponse = undefined;
    this.isLoader = true;
    let payload: GetInviatationRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "UpdatedAt",
      pageNumber: currentPage,
      pageSize: this.pageSize
    };
    if (this.selectedYear) {
      payload.year = this.selectedYear;
    }

    this.evaluatorService.getInviations(payload).subscribe((anaylist: any) => {
      this.analystResponse = anaylist;
      this.totalRecords = anaylist.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = anaylist.pageSize;
      this.isLoader = false;
    });
  }
  ngOnDestroy(): void { }
  customSearchFn(term: string, item: GetAssignedAssessmentResponseDto) {
    term = term.toLowerCase();
    return (
      item.geographicReference?.toLowerCase()?.includes(term) ||
      item.assignedBy?.toLowerCase()?.includes(term) ||
      (item.year || '').toString().includes(term)
    );
  }

}