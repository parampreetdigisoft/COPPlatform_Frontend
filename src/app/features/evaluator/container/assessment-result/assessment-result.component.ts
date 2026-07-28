import { Component, OnDestroy, OnInit } from "@angular/core";
import { CityVM } from "src/app/core/models/CityVM";
import { PaginationUserRequest } from "src/app/core/models/PaginationRequest";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { Router } from "@angular/router";
import { EvaluatorService } from "../../evaluator.service";
import { GetAssessmentResponse } from "src/app/core/models/AssessmentResponse";
import { GetAssessmentRequestDto } from "src/app/core/models/AssessmentRequest";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { CommonService } from "src/app/core/services/common.service";
import { AssessmentPhase } from "src/app/core/enums/AssessmentPhase";
import { SendRequestMailToUpdateCity } from "src/app/core/models/AnalystVM";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";

@Component({
  selector: "app-assessment-result",
  templateUrl: "./assessment-result.component.html",
  styleUrl: "./assessment-result.component.css",
})
export class AssessmentResultComponent implements OnInit {
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  userAssessmentMappingID: number | null = null;
  assessmentsResponse: PaginationResponse<GetAssessmentResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  isLoader: boolean = false;
  invitations: GetAssignedAssessmentResponseDto[] = [];

  constructor(
    private evaluatorService: EvaluatorService,
    public commonService: CommonService,
    private userService: UserService,
    private toaster: ToasterService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getAllCitiesByUserId();
    this.getAssessments();
  }
  

  goToAssessment(assessment: GetAssessmentResponse) {
    this.router.navigate([
      "/evaluator/assessment-result",
      assessment.userAssessmentMappingID,
      assessment.assessmentID,
      assessment.geographicReference
    ]);
  }

  ngOnDestroy(): void { }

  getAssessments(currentPage: number = 1) {
    this.isLoader = true;
    this.assessmentsResponse = undefined;
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
    this.evaluatorService
      .getAssessmentResults(payload)
      .subscribe((assessments) => {
        this.assessmentsResponse = assessments;
        this.totalRecords = assessments.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = assessments.pageSize;
        this.isLoader = false;
      });
  }
  getAllCitiesByUserId() {
    this.evaluatorService
      .getAssignedInvitations()
      .subscribe({
        next: (res) => {
          this.invitations = res.result ?? [];  
        },
      });
  }

  assessmentPhaseAction(assessment: GetAssessmentResponse) {
    let userRole = this.userService.userInfo.role;
    switch (assessment.assessmentPhase) {
      case AssessmentPhase.InProgress: {
        this.evaluatorService.userCityMappingIDSubject$.next(
          assessment.userAssessmentMappingID
        );
        this.router.navigate(["evaluator/make-assessment"]);
        break;
      }
      case AssessmentPhase.EditApproved: {
        this.evaluatorService.userCityMappingIDSubject$.next(
          assessment.userAssessmentMappingID
        );
        this.router.navigate(["evaluator/make-assessment"]);
        break;
      }
      case AssessmentPhase.EditRequested:
        break;
      case AssessmentPhase.EditRejected: {
        this.sendMailForEditAssessment(
          assessment.userAssessmentMappingID,
          assessment.userID
        );
        break;
      }
      case AssessmentPhase.Completed: {
        this.sendMailForEditAssessment(
          assessment.userAssessmentMappingID,
          assessment.userID
        );
        break;
      }

    }
  }

  sendMailForEditAssessment(userAssessmentMappingID: number, mailToUserID: number) {
    let payload: SendRequestMailToUpdateCity = {
      userID: this.userService.userInfo.userID,
      userAssessmentMappingID: userAssessmentMappingID,
      mailToUserID: mailToUserID,
    };
    this.evaluatorService.sendMailForEditAssessment(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.toaster.showSuccess(res.messages.join(", "));
          this.getAssessments(this.currentPage);
        } else {
          this.toaster.showError(res.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to provide access");
      },
    });
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
