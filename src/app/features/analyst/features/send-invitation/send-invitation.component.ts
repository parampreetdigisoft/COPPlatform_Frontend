import {
  Component,
  EventEmitter,
  input,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { UserService } from "src/app/core/services/user.service";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { CommonService } from "src/app/core/services/common.service";
import { PublicUserResponse } from "src/app/core/models/UserInfo";
import { UpdateInvitationUserDto } from "src/app/core/models/UpdateInviteUserDto";
import { GetInviatationResponseDto } from "src/app/core/models/GetInviatationRequestDto";
import { AssignedAssessmentPillarMappingDto, GetAssignedAssessmentResponseDto } from "src/app/core/models/GetAssignedAssessmentResponseDto ";
import { ToasterService } from "src/app/core/services/toaster.service";

@Component({
  standalone:true,
  selector: "app-send-invitation",
  templateUrl: "./send-invitation.component.html",
  styleUrl: "./send-invitation.component.css",
  imports:[CommonModule,ReactiveFormsModule,SharedModule]
})
export class SendInvitationComponent implements OnInit,OnChanges {

  selectedYear = input<number>(new Date().getFullYear());
  @Input() analyst: GetInviatationResponseDto | null = null;
  pillars = signal<AssignedAssessmentPillarMappingDto[]>([]);
  @Input() users: PublicUserResponse[] | null = [];
  @Output() analystChange = new EventEmitter<UpdateInvitationUserDto | null>();
  @Output() closeAnalystModel = new EventEmitter<boolean>();
  @Input() loading: boolean = false;
  @Input() assingedAssessments:GetAssignedAssessmentResponseDto[] = [];

  alertMsg = "";
  excelData: any;
  isSubmitted: boolean = false;
  requiredHeaders = ["FullName", "Email", "Phone", "CityName"];
  analystForm: FormGroup<any> = this.fb.group({});
  minDate:string=new Date().toISOString().split('T')[0];
  rolesList = [
    { name: "Evaluator", role: UserRoleValue.Evaluator }
  ];
  constructor(private fb: FormBuilder, private toasterService: ToasterService, private userService: UserService, public commonService:CommonService) {}

  ngOnInit(): void {
      this.initializeForm();
  }
  ngOnChanges(changes: SimpleChanges): void {
        
  } 

  initializeForm() {
    const userDisabled = this.analyst && this.analyst?.userID > 0;
    const year = userDisabled ? this.analyst?.year  :this.selectedYear();
    this.setPillar(year ?? this.selectedYear());

    this.analystForm = this.fb.group({
      userAssessmentMappingID:[this.analyst?.userAssessmentMappingID,[Validators.required]],
      userID: [{ value: this.analyst?.userID, disabled:  userDisabled }, [Validators.required]],
      role:[{ value: UserRoleValue.Evaluator, disabled: true },  [Validators.required]],
      dueDate: [this.formatDate(this.analyst?.dueDate), [Validators.required]],
      year:[ { value: year, disabled: userDisabled }, [Validators.required]],
      pillarIDs: [this.analyst?.pillars?.map((x) => x?.pillarID) ?? [], [Validators.required]],
    });

    this.analystForm.get('year')?.valueChanges.subscribe(f=>{
      this.setPillar(f);
    });
  }

  setPillar(year:number){
    let selectedAssessments = this.assingedAssessments?.find(x=>x?.year ==year) ;
    if(selectedAssessments){
      let pillars = selectedAssessments.userPillarMappings.filter(x=>x?.year == year) ?? [];
      this.pillars.set(pillars);      
      setTimeout(() => {
        this.analystForm.get('userAssessmentMappingID')?.patchValue(selectedAssessments?.userAssessmentMappingID);
      }, 100);
    }else{
      this.pillars.set([]);
    }
    if(this.analyst && this.analyst?.userID > 0)
    this.analystForm.get('pillarIDs')?.reset();
  }

  formatDate(date: any): string {
    if (!date) return '';
    return date.split('T')[0];
  }


  onSubmit() {
    this.isSubmitted = true;
    if (this.analystForm.valid) {
      const cityData: UpdateInvitationUserDto = {
        ...this.analystForm.getRawValue(),
      };

      this.analystChange.emit(cityData);
    }
    else{
      this.toasterService.showInfo("Please refresh the page and try again");
    }
  }
  
  closeModel() {
    this.alertMsg = "";
    this.closeAnalystModel.emit(true);
  }
  openPicker(event: any) {
    event.target.showPicker?.();
  }

 
}
