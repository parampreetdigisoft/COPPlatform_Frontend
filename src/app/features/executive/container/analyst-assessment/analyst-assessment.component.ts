import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { CityVM } from "src/app/core/models/CityVM";
import { UserService } from "src/app/core/services/user.service";
import { CityMappingPillerRequestDto } from "src/app/core/models/QuestionRequest";
import { GetQuestionByCityMappingRespones } from "src/app/core/models/QuestonResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import {
  AddAssessmentDto,
  AddAssessmentResponseDto,
} from "src/app/core/models/AssessmentRequest";

import { environment } from "src/environments/environment";
import { CommonService } from "src/app/core/services/common.service";
import { GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { ExecutiveService } from "../../executive.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";

@Component({
  standalone: true,
  selector: "app-analyst-assessment",
  templateUrl: "./analyst-assessment.component.html",
  styleUrls: ["./analyst-assessment.component.css"],
  imports: [CommonModule, SharedModule]
})
export class AnalystAssessmentComponent implements OnInit, OnDestroy {
  pillars: PillarsVM[] = [];
  cities: CityVM[] = []; // ✅ fixed type
  userAssessmentMappingID: number = 0;
  pillerQuestions: GetQuestionByCityMappingRespones | null = null;
  form!: FormGroup;
  pillarDisplayOrder: number = 1;
  selectedPillar?: PillarsVM;
  @ViewChild("scrollContainer") scrollContainer!: ElementRef;
  isloading = false;
  isUploading = false;
  isLoader: boolean = false;
  urlBase = environment.apiUrl;
  assignedInvitations: GetAssignedAssessmentResponseDto[] = []
  selectedInvitation: any;

  constructor(
    private adminService: ExecutiveService,
    private userService: UserService,
    private toaster: ToasterService,
    private fb: FormBuilder,
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.isLoader = true;
    this.formInitialized();
    this.getAssignedInvitations();
  }

  get questions() {
    return this.pillerQuestions?.questions ?? [];
  }

  formInitialized() {
    this.form = this.fb.group({
      questions: this.fb.array([]),
    });
  }

  get questionsArray(): FormArray {
    return this.form.get("questions") as FormArray;
  }

  loadQuestions() {
    this.pillerQuestions?.questions.forEach((q) => {
      let option = q.questionOptions.find((x) => x.isSelected);
      this.questionsArray.push(
        this.fb.group({
          questionID: [q.questionID, Validators.required],
          responseID: [q.responseID],
          assessmentID: [this.pillerQuestions?.assessmentID],
          questionOptionID: [
            q.isSelected ? option?.optionID : "",
            Validators.required,
          ],
          historyQuestionOptionID: [""],
          score: [q.isSelected ? option?.scoreValue : ""],
          justification: [
            q.isSelected ? option?.justification : "",
            Validators.required,
          ],
          source: [q.isSelected ? option?.source : ""],
        })
      );
    });
  }

  onOptionChange(event: any, index: number) {
    const optionId = +event.target.value;
    const selectedOption = this.pillerQuestions?.questions[
      index
    ].questionOptions.find((o) => o.optionID === optionId);

    if (selectedOption) {
      const formGroup = this.questionsArray.at(index) as FormGroup;
      formGroup.patchValue({
        questionOptionID: selectedOption.optionID,
        score: selectedOption.scoreValue,
      });
    }
  }
  
  isDueSoon(dueDate: Date): boolean {
    if (!dueDate) return false;

    const today = new Date();
    const due = new Date(dueDate);

    const diffDays = (due.getTime() - today.getTime()) / (1000 * 3600 * 24);

    return diffDays <= 3; // highlight if within 3 days
  }

  getAssignedInvitations() {
    this.adminService.getAssignedInvitations().subscribe((res) => {
      if (res.succeeded) {
        this.assignedInvitations = res.result ?? [];
        if (this.assignedInvitations.length) {
          this.userAssessmentMappingID = this.assignedInvitations[0].userAssessmentMappingID;
          this.getQuestionsByCityId();
        }
      }
    });
  }
  pillarChanged(pillar?: PillarsVM) {
    if(this.isLoader) return;
    if (!this.userAssessmentMappingID || this.userAssessmentMappingID == 0) {
      this.toaster.showWarning("Please select invitation first");
      return;
    }

    if (pillar) {
      this.selectedPillar = pillar;
      this.getQuestionsByCityId();
    }
    else {
      this.selectedPillar = this.pillars.find((x) => x.pillarID == this.pillerQuestions?.pillarID);
      if (this.pillerQuestions && this.pillerQuestions?.submittedPillarDisplayOrder < (this.selectedPillar?.displayOrder ?? 0)) {
        this.pillarDisplayOrder = this.selectedPillar?.displayOrder ?? 1;
      }
    }
  }

  cityChanged() {
    this.selectedPillar = undefined;
    this.pillars = [];
    this.getQuestionsByCityId();
  }

  getQuestionsByCityId() {
    if (
      !this.userAssessmentMappingID ||
      this.userAssessmentMappingID == 0
    ) {
      this.toaster.showWarning("Please select invitaion first");
      return;
    }
    this.formInitialized();
    const payload: CityMappingPillerRequestDto = {
      userAssessmentMappingID: this.userAssessmentMappingID ?? 0,
    };
    if (this.selectedPillar) {
      payload.pillarID = this.selectedPillar.pillarID;
    }
    this.selectedInvitation = this.assignedInvitations.find(x => x.userAssessmentMappingID == this.userAssessmentMappingID);

    this.pillerQuestions = null;
    this.isLoader = true;
    this.adminService.getQuestionsByCityId(payload).subscribe({
      next: (res) => {
        this.isLoader = false;
        if (res.succeeded) {
          this.pillerQuestions = res.result;
          this.pillars = res.result?.pillars ?? [];
          this.pillarDisplayOrder = this.pillerQuestions?.submittedPillarDisplayOrder ?? 1;
          if (this.pillerQuestions && this.pillerQuestions?.assessmentID > 0) {
            this.getAssessmentProgressHistory();
          } else {
            this.userService.assessmentProgress.next(null);
          }
          this.pillarChanged();
          this.loadQuestions();
        } else {
          this.toaster.showWarning("invitaion's assessment is already submitted");
        }
      },
      error: () => {
        this.isLoader = false;
        this.toaster.showError("There is an error accure please try again");
      }
    });
  }

  get IsLastPillar() {
    var index = this.pillars.findIndex(x => x.displayOrder == Number(this.selectedPillar?.displayOrder));

    return index == this.pillars.length - 1;
  }

  SaveAssessment() {
    if (!this.userAssessmentMappingID || this.userAssessmentMappingID == 0) {
      this.toaster.showWarning("Please select invitaion first");
      return;
    }
    const validQuestions = this.questionsArray.controls
      .filter((ctrl) => ctrl.valid)
      .map((ctrl) => ctrl.value as AddAssessmentResponseDto);
    const payload: AddAssessmentDto = {
      userAssessmentMappingID: this.userAssessmentMappingID,
      assessmentID: this.pillerQuestions?.assessmentID ?? 0,
      pillarID: this.pillerQuestions?.pillarID ?? 0,
      responses: validQuestions ?? [],
      isAutoSave: false,
      isFinalized: false
    };
    if (this.pillerQuestions?.pillarID != null && this.pillerQuestions?.pillarID > 0) {
      this.adminService.saveAnalystAssessment(payload).subscribe({
        next: (res) => {
          setTimeout(() => {
            this.scrollContainer.nativeElement.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }, 300);
          if (res.succeeded) {
            if (this.IsLastPillar) {
              this.adminService.userCityMappingIDSubject$.next(null);
            } else {
              if (this.selectedPillar)
                this.selectedPillar = this.pillars.find(x => x.displayOrder > Number(this.selectedPillar?.displayOrder));
              this.getQuestionsByCityId();
            }
            this.toaster.showSuccess(res.messages.join(", "));
          } else {
            this.toaster.showError(res.errors.join(", "));
          }
        },
        error: () => {
          this.toaster.showError("Failed to save assessment. Try again.");
        },
      });
    } else {
      this.toaster.showWarning("Please refresh the page and try again");
    }
  }

  ngOnDestroy(): void {
    this.userService.assessmentProgress.next(null);
  }


  getAssessmentProgressHistory() {
    this.adminService
      .getAssessmentProgressHistory(this.pillerQuestions?.assessmentID ?? 0)
      .subscribe((res) => {
        if (res.succeeded) {
          this.userService.assessmentProgress.next(res.result);
        } else {
          this.toaster.showError("Failed to fetch assessment progress history");
        }
      });
  }

  autoSaveSingleAssessemnt(index: number) {

    if (!this.userAssessmentMappingID || this.userAssessmentMappingID == 0) {
      this.toaster.showWarning("Please select invitaion first");
      return;
    }

    if (this.questionsArray.controls[index].valid && this.questionsArray.controls[index].dirty) {

      const payload: AddAssessmentDto = {
        userAssessmentMappingID: this.userAssessmentMappingID,
        assessmentID: this.pillerQuestions?.assessmentID ?? 0,
        pillarID: this.pillerQuestions?.pillarID ?? 0,
        responses: [this.questionsArray.controls[index].value],
        isAutoSave: true,
        isFinalized: false
      };
      this.adminService.saveAnalystAssessment(payload).subscribe({
        next: (res) => {
          if (res.succeeded) {
            this.questionsArray.at(index).markAsPristine();
          }
        },
        error: () => {
          this.toaster.showError("Failed to save assessment. Try again.");
        },
      });
    }
  }

  decodeHtml(text: string | undefined): string {
    if (text) {
      const txt = document.createElement('textarea');
      txt.innerHTML = text;
      return txt.value.replace(/\u00a0/g, ' ');
    }
    return "";
  }

  customSearchFn(term: string, item: GetAssignedAssessmentResponseDto) {
    term = term.toLowerCase();
    return (
      item.geographicReference?.toLowerCase()?.includes(term) ||
      item.assignedBy?.toLowerCase()?.includes(term) ||
      (item.year || '').toString().includes(term)
    );
  }
  
  onHistoryOptionChange(event: any, index: number) {
    const userId = +event.target.value;
    const selectedOption = this.pillerQuestions?.questions[
      index
    ].history.find((o) => o.userID === userId);

    if (selectedOption) {
      const formGroup = this.questionsArray.at(index) as FormGroup;
      formGroup.patchValue({
        questionOptionID: selectedOption.optionID,
        score: selectedOption.scoreValue,
        source: selectedOption.source,
        justification: selectedOption.justification,
        historyQuestionOptionID: selectedOption.userID
      });
      this.autoSaveSingleAssessemnt(index);
    }
  }

}
