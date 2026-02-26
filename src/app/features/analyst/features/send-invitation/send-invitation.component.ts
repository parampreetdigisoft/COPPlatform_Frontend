import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { UserService } from "src/app/core/services/user.service";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { CommonService } from "src/app/core/services/common.service";
import { PublicUserResponse } from "src/app/core/models/UserInfo";
import { UpdateInvitationUserDto } from "src/app/core/models/UpdateInviteUserDto";
import { GetInviatationResponseDto } from "src/app/core/models/GetInviatationRequestDto";

@Component({
  standalone:true,
  selector: "app-send-invitation",
  templateUrl: "./send-invitation.component.html",
  styleUrl: "./send-invitation.component.css",
  imports:[CommonModule,ReactiveFormsModule,SharedModule]
})
export class SendInvitationComponent implements OnInit {

  @Input() selectedYear = new Date().getFullYear();
  @Input() analyst: GetInviatationResponseDto | null = null;
  @Input() pillars: PillarsVM[] | null = [];
  @Input() users: PublicUserResponse[] | null = [];
  @Output() analystChange = new EventEmitter<UpdateInvitationUserDto | null>();
  @Output() closeAnalystModel = new EventEmitter<boolean>();
  @Input() loading: boolean = false;
  alertMsg = "";
  excelData: any;
  isSubmitted: boolean = false;
  requiredHeaders = ["FullName", "Email", "Phone", "CityName"];
  analystForm: FormGroup<any> = this.fb.group({});
  minDate:string=new Date().toISOString().split('T')[0];
  rolesList = [
    { name: "Analyst", role: UserRoleValue.Analyst }
  ];
  constructor(private fb: FormBuilder, private userService: UserService, public commonService:CommonService) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    const roleValue = UserRoleValue[this.analyst?.role  as keyof typeof UserRoleValue] ?? UserRoleValue.Analyst;
    const userDisabled=this.analyst && this.analyst?.userID > 0;

    this.analystForm = this.fb.group({
      userID: [{ value: this.analyst?.userID, disabled:  userDisabled }, [Validators.required]],
      role:[{ value: roleValue, disabled: true },  [Validators.required]],
      dueDate: [this.formatDate(this.analyst?.dueDate), [Validators.required]],
      year:[ { value: userDisabled ? this.analyst?.year  :this.selectedYear, disabled: userDisabled }, [Validators.required]],
      pillarIDs: [this.analyst?.pillars?.map((x) => x?.pillarID) ?? [], [Validators.required]],
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    return date.split('T')[0];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.alertMsg = "";
    this.isSubmitted = false;
    //this.initializeForm();
  } 

  onSubmit() {
    this.isSubmitted = true;
    if (this.analystForm.valid) {
      const cityData: UpdateInvitationUserDto = {
        ...this.analystForm.getRawValue(),
      };

      this.analystChange.emit(cityData);
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
