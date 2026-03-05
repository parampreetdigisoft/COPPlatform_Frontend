import { Component } from "@angular/core";
import { AdminService } from "../../admin.service";
import { CityVM } from "../../../../core/models/CityVM";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { UserRoleValue } from "src/app/core/enums/UserRole";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { ActivatedRoute } from "@angular/router";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { CommonService } from "src/app/core/services/common.service";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/share.module";
import { SendInvitationComponent } from "../../features/send-invitation/send-invitation.component";
import { DeleteInvitationDto, GetInviatationRequestDto, GetInviatationResponseDto } from "src/app/core/models/GetInviatationRequestDto";
import { GetAssignUserDto, PublicUserResponse } from "src/app/core/models/UserInfo";
import { UpdateInvitationUserDto } from "src/app/core/models/UpdateInviteUserDto";
declare var bootstrap: any;

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, SendInvitationComponent],
  selector: 'app-invitations',
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css'
})
export class InvitationsComponent {
  selectedYear = new Date().getFullYear();
  isLoader: boolean = false;
  selectedAnalyst: GetInviatationResponseDto | null = null;
  selectedCity: CityVM | null = null;
  analystResponse: PaginationResponse<GetInviatationResponseDto> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  pillars: PillarsVM[] | null = [];
  users: PublicUserResponse[] | null = [];
  loading: boolean = false;
  isOpendialog: boolean = false;
  roleId: number | any = 0;
  selectedRoleID: UserRoleValue = UserRoleValue.Analyst;;
  selectedIndex?:number;
  rolesList = [
    { name: "Analyst", role: UserRoleValue.Analyst },
    { name: "Evaluator", role: UserRoleValue.Evaluator },
  ];

  constructor(
    private adminService: AdminService,
    private toaster: ToasterService,
    private userService: UserService,
    private route: ActivatedRoute,
    public commonService:CommonService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.roleId = params.get("roleID");
      if(this.roleId)
      this.selectedRoleID = this.roleId;
    });
    this.getInviations();
    this.getAllPillars();
    this.getAccessUsers();
  }

  getAllPillars() {
    this.adminService
      .getAllPillars()
      .subscribe({
        next: (res) => {
          this.pillars = res ?? [];
        },
      });
  }

  getAccessUsers() {
    let payload:GetAssignUserDto ={
      userRole:UserRoleValue.Analyst
    }
    this.adminService
      .getAccessUsers(payload)
      .subscribe({
        next: (res) => {
          this.users = res.result ?? [];
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
      pageSize: this.pageSize,
      getUserRole:this.selectedRoleID
    };
    if(this.selectedYear){
      payload.year = this.selectedYear;
    }

    this.adminService.getInviations(payload).subscribe((anaylist) => {
      this.analystResponse = anaylist;
      this.totalRecords = anaylist.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = anaylist.pageSize;
      this.isLoader = false;
    });
  }

  editAnalyst(analyst: GetInviatationResponseDto | null, isOpen: boolean = true) {
    this.selectedAnalyst = analyst;
    if (isOpen) {
      this.opendialog();
    }
  }
  deleteInvitation() {
    if (!this.selectedAnalyst || this.selectedAnalyst.userAssessmentMappingID < 1) {
      this.toaster.showError("No assessment selected for deletion");
      return;
    }
    let payload:DeleteInvitationDto ={
      userID :this.selectedAnalyst.userID,
      userAssessmentMappingID:this.selectedAnalyst.userAssessmentMappingID
    }
    this.adminService.deleteInvitation(payload).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getInviations(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(", "));
        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to delete invitation");
      },
    });
  }

  addUpdateInvitation(analyst: UpdateInvitationUserDto | null) {
    if (!analyst) {
      return;
    }
    this.loading = true;
    let payload: UpdateInvitationUserDto = {
      userID: analyst.userID,
      dueDate: analyst.dueDate,
      year: analyst.year,
      pillarIDs: analyst.pillarIDs,
      userAssessmentMappingID:analyst.userAssessmentMappingID
    };
    this.adminService.addUpdateInvitation(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.getInviations();
            this.toaster.showSuccess(res?.messages.join(", "));
          } else {
            this.toaster.showError(res?.errors.join(", "));
          }
        },
        error: () => {
          this.closeModal();
          this.toaster.showError("Failed to add/update invitation ");
        },
      });
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
    this.selectedIndex =undefined;
    this.loading = false;
    const homeTab = document.querySelector("#pills-home-tab") as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById("exampleModal");
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    this.isOpendialog = false;
  }
  ngOnDestroy(): void {}
}
