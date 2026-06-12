import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { EmailLogRequestDto } from 'src/app/core/models/aiVm/EmailLogRequestDto';
import { EmailLogResponseDto } from 'src/app/core/models/aiVm/EmailLogResponseDto';
import { SendEmailRequestDto } from 'src/app/core/models/GetInviatationRequestDto';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { CommonService } from 'src/app/core/services/common.service';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { AdminService } from 'src/app/features/admin/admin.service';

type EmailLogDisplay = EmailLogResponseDto & {
  subjectShowToggle: boolean;
  messageShowToggle: boolean;
};

@Component({
  selector: 'app-send-email',
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.css'
})

export class SendEmailComponent implements OnInit {

  emailForm: FormGroup;
  submitted = false;
  isLoader: boolean = false;
  loading: boolean = false;
  selectedYear = new Date().getFullYear();
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  isModalOpen = false;
  isEditCase = false;
  selectedLog: EmailLogResponseDto | null = null;
  emailLogsResponse: PaginationResponse<EmailLogDisplay> | undefined;
  isSent: boolean | null = null;
  fromDate: string = '';
  toDate: string = '';
  receiverEmail: string = '';
  private years = new BehaviorSubject<number[]>(this.getYearList(2025));
  constructor(
    private fb: FormBuilder,
    private toaster: ToasterService,
    private adminService: AdminService,
    public commonService: CommonService,
    private userService: UserService,


  ) {
    this.emailForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200), Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }
  ngOnInit(): void {
    this.getEmailLogs();
  }
  sendEmail() {
    if (this.isEditCase) return;

    this.submitted = true;

    if (this.emailForm.invalid) return;

    this.loading = true;

    const payload: SendEmailRequestDto = {
      emailSubject: this.emailForm.get('subject')?.value,
      emailMessage: this.emailForm.get('message')?.value
    };

    this.adminService.sendEmail(payload).subscribe({
      next: (res) => {
        if (res) {
          this.toaster.showSuccess("Email sent successfully");
          this.loading = false;
          this.closeModal();
          this.getEmailLogs();
          this.submitted = false;
          this.emailForm.markAsPristine();
          this.emailForm.markAsUntouched();
        } else {
          this.toaster.showError("Failed to send email");
          this.loading = false;
          this.getEmailLogs();
        }
      },
      error: () => {
        this.toaster.showError("Failed to send email");
        this.loading = false;
        this.closeModal();
        this.getEmailLogs();
      }
    });
  }

  isLongText(text: string): boolean {
    if (!text) return false;
    const trimmed = text.trim();
    return trimmed.length > 120 || trimmed.split(/\s+/).filter(Boolean).length > 25;
  }

  isLongSubject(text: string): boolean {
    if (!text) return false;
    return text.trim().length > 60;
  }

  private mapEmailLogsForDisplay(logs: EmailLogResponseDto[]): EmailLogDisplay[] {
    return logs.map(log => ({
      ...log,
      subjectShowToggle: this.isLongSubject(log.subject),
      messageShowToggle: this.isLongText(log.message),
    }));
  }
  get subject() {
    return this.emailForm.get('subject');
  }

  get message() {
    return this.emailForm.get('message');
  }
  get applicateYears() {
    return this.years.value;
  }

  getYearList(startYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }


  openModal() {
    this.isModalOpen = true;
    this.isEditCase = false;
    this.selectedLog = null;
    this.emailForm.reset();
    this.submitted = false;
    this.emailForm.markAsPristine();
    this.emailForm.markAsUntouched();
  }

  closeModal() {
    this.isModalOpen = false;
    this.loading = false;
    this.emailForm.reset();
    this.isEditCase = false;
    this.selectedLog = null;
  }

  getEmailLogs(currentPage: number = 1) {
    this.emailLogsResponse = undefined;
    this.isLoader = true;

    const payload: any = {
      pageNumber: currentPage,
      pageSize: this.pageSize
    };

    // ✅ senderUserId
    if (this.userService?.userInfo?.userID) {
      payload.senderUserId = this.userService.userInfo.userID;
    }

    // ✅ receiverEmail (only if not empty)
    if (this.receiverEmail?.trim()) {
      payload.receiverEmail = this.receiverEmail.trim();
    }

    // ✅ isSent (only if selected)
    if (this.isSent !== null && this.isSent !== undefined) {
      payload.isSent = this.isSent;
    }

    // ✅ dates (only if present)
    if (this.fromDate) {
      payload.fromDate = new Date(this.fromDate).toISOString();
    }

    if (this.toDate) {
      payload.toDate = new Date(this.toDate).toISOString();
    }

    this.adminService.getEmailLogs(payload).subscribe({
      next: (logs) => {
        this.emailLogsResponse = {
          ...logs,
          data: this.mapEmailLogsForDisplay(logs.data)
        };
        this.totalRecords = logs.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = logs.pageSize;
        this.isLoader = false;
      },
      error: () => {
        this.isLoader = false;
      }
    });
  }
  viewLogs(logs: EmailLogResponseDto) {
    this.selectedLog = logs;
    this.isEditCase = true;
    this.isModalOpen = true;
    this.submitted = false;
    this.emailForm.patchValue({
      subject: logs.subject,
      message: logs.message
    });
  }

}