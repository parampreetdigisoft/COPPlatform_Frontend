import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SendEmailRequestDto } from 'src/app/core/models/GetInviatationRequestDto';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { AdminService } from 'src/app/features/admin/admin.service';

@Component({
  selector: 'app-send-email',
  // standalone: true,
  // imports: [CommonModule],
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.css'
})

export class SendEmailComponent {

  emailForm: FormGroup;
  submitted = false;
  isLoader:boolean = false;


  constructor(
    private fb: FormBuilder,
    private toaster: ToasterService,
    private adminService: AdminService,

  ) { this.emailForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(200), Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.maxLength(1000), Validators.minLength(10)]],
    }); }
  sendEmail() {
  this.isLoader = true;
  this.submitted = true;

  if (this.emailForm.invalid) return;

  const payload: SendEmailRequestDto = {
    emailSubject: this.emailForm.get('subject')?.value,
    emailMessage: this.emailForm.get('message')?.value
  };

  this.adminService.sendEmail(payload).subscribe({
    next: (res) => {
      if (res) {
        this.toaster.showSuccess("Email sent successfully");
        this.isLoader = false;
        // ✅ Reset form values
        this.emailForm.reset();

        // ✅ Reset validation state
        this.submitted = false;

        // ✅ Optional: mark form as pristine/untouched
        this.emailForm.markAsPristine();
        this.emailForm.markAsUntouched();

      } else {
        this.toaster.showError("Failed to send email");
        this.isLoader = false;
      }
    },
    error: () => {
      this.toaster.showError("Failed to send email");
      this.isLoader = false;
    }
  });
}
  get subject() {
  return this.emailForm.get('subject');
}

get message() {
  return this.emailForm.get('message');
}
}