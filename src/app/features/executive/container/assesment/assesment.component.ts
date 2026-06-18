import { Component, OnInit } from "@angular/core";
import { CityVM } from "src/app/core/models/CityVM";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { ActivatedRoute, Router } from "@angular/router";
import { GetAssessmentResponse } from "src/app/core/models/AssessmentResponse";
import {
  ChangeAssessmentStatusRequestDto,
  GetAssessmentRequestDto,
  TransferAssessmentRequestDto,
} from "src/app/core/models/AssessmentRequest";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { PublicUserResponse } from "src/app/core/models/UserInfo";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { ExecutiveService } from "../../executive.service";
import { AssessmentPhase } from "src/app/core/enums/AssessmentPhase";
import { CommonService } from "src/app/core/services/common.service";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
declare var bootstrap: any;
@Component({
  selector: "app-assesment",
  templateUrl: "./assesment.component.html",
  styleUrl: "./assesment.component.css",
})
export class AssesmentComponent implements OnInit {
  selectedYear = new Date().getFullYear();
  isLoader: boolean = false;
  isOpendialog = false;
  userAssessmentMappingID: number | null = null;
  selectedRoleID: UserRoleValue | any = "";
  selectedAssessment: GetAssessmentResponse | any = "";
  changeAssessment: ChangeAssessmentStatusRequestDto | any = "";
  assessmentsResponse: PaginationResponse<GetAssessmentResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  cities: CityVM[] | null = [];
  loading: boolean = false;
  evaluators: PublicUserResponse[] | null = [];
  userofSelecteCityResponse: GetAssessmentResponse[] = [];
  invitations: GetAssignedAssessmentResponseDto[] = [];
  
  rolesList = [
    { name: "Analyst", role: UserRoleValue.Analyst },
    { name: "Evaluator", role: UserRoleValue.Evaluator },
  ];

  constructor(
    private adminService: ExecutiveService,
    private userService: UserService,
    private toaster: ToasterService,
    private router: Router,
    private route: ActivatedRoute,
    public commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.getAllCitiesByUserId();
    this.route.paramMap.subscribe((params) => {
      let rid = params.get("roleID");
      let cid = params.get("userAssessmentMappingID");
      if (rid && cid) {
        this.selectedRoleID = rid;
        this.userAssessmentMappingID = Number(cid);
      }
    });
    this.getAssessments();
  }

  goToAssessment(assessment: GetAssessmentResponse) {
    this.router.navigate([
      "/executive/assessment-result",
      assessment.userAssessmentMappingID,
      assessment.assessmentID,
      assessment.geographicReference,
    ]);
  }

  ngOnDestroy(): void { }

  getAssessments(currentPage: number = 1) {
    this.assessmentsResponse = undefined;
    this.isLoader = true;
    let payload: GetAssessmentRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "createdAt",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID,
      year: this.selectedYear,
    };
    if(this.userAssessmentMappingID){
      payload.userAssessmentMappingID = this.userAssessmentMappingID;
    }
    this.adminService.getAssessmentResults(payload).subscribe((assessments) => {
      this.assessmentsResponse = assessments;
      this.totalRecords = assessments.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = assessments.pageSize;
      this.isLoader = false;
    });
  }
  getAllCitiesByUserId() {
    this.adminService
      .getAssignedInvitations()
      .subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.invitations = res.result ?? [];
          } else {
            this.toaster.showWarning(res.errors.join(', '));
          }
        },
      });
  }

  selectChangedAssessment(assessmentPhase: AssessmentPhase, assessmentID: number) {
    this.changeAssessment = {
      userID: this.userService.userInfo.userID,
      assessmentPhase: assessmentPhase,
      assessmentID: assessmentID,
    } as ChangeAssessmentStatusRequestDto;
  }
  
  opendialog() {
    this.isOpendialog = true;
    setTimeout(() => {
      const modalEl = document.getElementById("exampleModal");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show(); // ✅ use show()
      }
    }, 100);
  }
  closeModal() {
    this.loading = false;
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    this.isOpendialog = false;
  }
  
    customSearchFn(term: string, item: GetAssignedAssessmentResponseDto) {
    term = term.toLowerCase();
    return (
      item.geographicReference?.toLowerCase()?.includes(term) ||
      item.assignedBy?.toLowerCase()?.includes(term) ||
      (item.year || '').toString().includes(term)
    );
  }
}
