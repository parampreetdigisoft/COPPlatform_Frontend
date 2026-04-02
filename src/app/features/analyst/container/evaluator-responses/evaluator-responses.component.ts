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
} from "src/app/core/models/AssessmentRequest";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { AnalystService } from "../../analyst.service";
import {
  GetAssignUserDto,
  PublicUserResponse,
} from "src/app/core/models/UserInfo";
import {
  AssessmentPhase
} from "src/app/core/enums/AssessmentPhase";
import { CommonService } from "src/app/core/services/common.service";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { GetAssignedAssessmentResponseDto } from 'src/app/core/models/GetAssignedAssessmentResponseDto ';

@Component({
  selector: "app-evaluator-responses",
  templateUrl: "./evaluator-responses.component.html",
  styleUrl: "./evaluator-responses.component.css",
})
export class EvaluatorResponsesComponent implements OnInit {
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedcityID: number | any = "";
  selecteduserID: number | any = "";
  selectedAssessment: GetAssessmentResponse | any = "";
  changeAssessment: ChangeAssessmentStatusRequestDto | any = "";
  assessmentsResponse: PaginationResponse<GetAssessmentResponse> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  evaluators: PublicUserResponse[] | null = [];
  assessmentUserID: number | any = 0;
  isLoader: boolean = false;
  invitations: GetAssignedAssessmentResponseDto[] = [];

  constructor(
    private analystService: AnalystService,
    private userService: UserService,
    private toaster: ToasterService,
    public commonService: CommonService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.assessmentUserID = params.get("assessmentUserID");
      let uid = params.get("userID");
      let cid = params.get("cityID");
      if (uid && cid && !this.assessmentUserID) {
        this.selectedcityID = cid;
        this.selecteduserID = uid;
      }
    });
    this.getAllCitiesByUserId();

    if (!this.assessmentUserID) {
      this.GetEvaluatorByAnalyst();
    }
    this.getAssessments();
  }

  goToAssessment(assessment: GetAssessmentResponse) {
    this.router.navigate([
      "/analyst/assessment-result",
      assessment.assessmentID,
      assessment.geographicReference,
    ]);
  }

  ngOnDestroy(): void { }

  assessmentPhaseAction(assessment: GetAssessmentResponse) {
    switch (assessment.assessmentPhase) {
      case AssessmentPhase.InProgress: {
        if (this.assessmentUserID) {
          this.analystService.userCityMappingIDSubject$.next(
            assessment.userAssessmentMappingID
          );
          this.router.navigate(["analyst/analyst-assessment"]);
        }
        break;
      }
    }
  }
  getAssessments(currentPage: number = 1) {
    this.assessmentsResponse = undefined;
    this.isLoader = true;
    let payload: GetAssessmentRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "createdAt",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID,
      userAssessmentMappingID: this.selectedcityID,
      year: this.selectedYear,
    };
    this.analystService
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
    this.analystService
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
  GetEvaluatorByAnalyst() {
    let payload: GetAssignUserDto = {
      searchedUserID: this.userService.userInfo.userID,
      userRole: UserRoleValue.Evaluator
    };
    this.analystService.GetEvaluatorByAnalyst(payload).subscribe({
      next: (res) => {
        this.evaluators = res.result;
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


  selectAssessement(selectedAssessment: GetAssessmentResponse) {
    this.selectedAssessment = selectedAssessment;
  }

}
