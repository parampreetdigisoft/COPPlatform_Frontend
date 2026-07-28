import { Component, OnDestroy, OnInit } from "@angular/core";
import { AdminService } from "../../admin.service";
import { PaginationResponse } from "src/app/core/models/PaginationResponse";
import { ToasterService } from "src/app/core/services/toaster.service";
import { UserService } from "src/app/core/services/user.service";
import { UserRole, UserRoleValue } from "src/app/core/enums/UserRole";
import { GetUserByRoleRequestDto, GetUserByRoleResponseVM } from "../../../../core/models/GetUserByRoleResponse";
import {
  InviteBulkUserDto,
  RegisterDto,
  UpdateInviteUserDto,
} from "../../../../core/models/AnalystVM";
import { SortDirection } from "src/app/core/enums/SortDirection";
import { ActivatedRoute } from "@angular/router";
import { PillarsVM } from "src/app/core/models/PillersVM";
import { CommonService } from "src/app/core/services/common.service";
declare var bootstrap: any;

@Component({
  selector: "app-analyst-view",
  templateUrl: "./analyst-view.component.html",
  styleUrl: "./analyst-view.component.css",
})
export class AnalystViewComponent implements OnInit, OnDestroy {
  selectedYear = new Date().getFullYear();
  isLoader: boolean = false;
  selectedAnalyst: GetUserByRoleResponseVM | null = null;
  analystResponse: PaginationResponse<GetUserByRoleResponseVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  pillars: PillarsVM[] | null = [];
  loading: boolean = false;
  isOpendialog: boolean = false;
  roleId: number | any = 0;
  selectedRoleID: UserRoleValue = UserRoleValue.Analyst;
  selectedIndex?:number;
  rolesList = [
    { name: "Analyst", role: UserRoleValue.Analyst },
    { name: "Executive", role: UserRoleValue.Executive },
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
    this.getAnalyst();
  }

  getAnalyst(currentPage: number = 1) {
    this.analystResponse = undefined;
    this.isLoader = true;
    let payload: GetUserByRoleRequestDto = {
      sortDirection: SortDirection.DESC,
      sortBy: "userID",
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userID: this.userService?.userInfo?.userID,
      getUserRole:this.selectedRoleID
    };

    this.adminService.getAnalyst(payload).subscribe((anaylist) => {
      this.analystResponse = anaylist;
      this.totalRecords = anaylist.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = anaylist.pageSize;
      this.isLoader = false;
    });
  }

  editAnalyst(analyst: GetUserByRoleResponseVM | null, isOpen: boolean = true) {
    this.selectedAnalyst = analyst;
    if (isOpen) {
      this.opendialog();
    }
  }
  deleteAnalyst() {
    if (this.selectedAnalyst === null) {
      this.toaster.showError("No analyst selected for deletion");
      return;
    }
    this.adminService.deleteUser(this.selectedAnalyst.userID).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getAnalyst(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(", "));
        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.toaster.showError("Failed to delete analyst");
      },
    });
  }

  ResendInvitaion(analyst: GetUserByRoleResponseVM, i :number) {
    if(analyst.role == UserRole.Evaluator) {
      this.toaster.showError("You don't have permission");
      return;
    }
    this.selectedIndex =i;
    let payload: RegisterDto = {
      fullName: analyst.fullName,
      email: analyst.email,
      phone: analyst.phone ?? "",
      password: "",
      role: UserRoleValue[analyst.role as keyof typeof UserRoleValue]
    };
    this.addUpdateStaffUser(payload);
  }

  addUpdateStaffUser(analyst: RegisterDto | null) {
    if (!analyst) {
      return;
    }
    this.loading = true;
    let payload: RegisterDto = {
      fullName: analyst.fullName,
      email: analyst.email,
      phone: analyst.phone,
      password: analyst.password,
      role: analyst.role
    };
    this.adminService.addUpdateStaffUser(payload).subscribe({
        next: (res) => {
          this.closeModal();
          if (res.succeeded) {
            this.getAnalyst();
            this.toaster.showSuccess(res?.messages.join(", "));
          } else {
            this.toaster.showError(res?.errors.join(", "));
          }
        },
        error: () => {
          this.closeModal();
          this.toaster.showError("Failed to add analyst");
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

  addBulkAnalyst(analysts: UpdateInviteUserDto[] | null) {
    if (!analysts) return;
    let payload: InviteBulkUserDto = {
      users: analysts,
    };
    this.loading = true;
    this.adminService.addBulkAnalyst(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getAnalyst();
          this.toaster.showSuccess(res?.messages.join(", "));
        } else {
          this.toaster.showError(res?.errors.join(", "));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError("Failed to add Users");
      },
    });
  }
}
