import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { CommonService } from 'src/app/core/services/common.service';
import { UtcToLocalTooltipDirective } from '../../directives/utc-to-local-tooltip.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-date-viewer',
  standalone: true,
  imports: [CommonModule, UtcToLocalTooltipDirective, MatTooltipModule],
  templateUrl: './date-viewer.component.html',
  styleUrl: './date-viewer.component.css'
})
export class DateViewerComponent {
  date = input<Date>();
  public commonService = inject(CommonService);

  getDueTime(utcDate: string | Date | null | undefined): string {
    if (!utcDate) return 'N/A';

    // Ensure UTC parsing
    const utc =
      typeof utcDate === 'string' && !utcDate.endsWith('Z')
        ? utcDate + 'Z'
        : utcDate;

    const dueDate = new Date(utc);
    const now = new Date();

    const diffMs = dueDate.getTime() - now.getTime(); // 🔥 reversed
    const isOverdue = diffMs < 0;

    const absMs = Math.abs(diffMs);
    const diffMinutes = Math.floor(absMs / (1000 * 60));
    const diffHours = Math.floor(absMs / (1000 * 60 * 60));
    const diffDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

    // ⛔ OVERDUE
    if (isOverdue) {
      if (diffMinutes < 60) return `Overdue by ${diffMinutes} min`;
      if (diffHours < 24) return `Overdue by ${diffHours} hr`;

      const remainingHours = diffHours % 24;
      return remainingHours > 0
        ? `Overdue by ${diffDays} day ${remainingHours} hr`
        : `Overdue by ${diffDays} day`;
    }

    // ✅ UPCOMING

    // Less than 10 min
    if (diffMinutes < 10) {
      return 'Due soon';
    }

    // Less than 1 hour
    if (diffMinutes < 60) {
      return `Due in ${diffMinutes} min`;
    }

    // Less than 24 hours
    if (diffHours < 24) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes > 0
        ? `Due in ${diffHours} hr ${remainingMinutes} min`
        : `Due in ${diffHours} hr`;
    }

    // Days
    const remainingHours = diffHours % 24;
    return remainingHours > 0
      ? `Due in ${diffDays} day ${remainingHours} hr`
      : `Due in ${diffDays} day`;
  }


getDueStatusClass(utcDate: string | Date | null | undefined): string {
  if (!utcDate) return 'overdue';

  const utc =
    typeof utcDate === 'string' && !utcDate.endsWith('Z')
      ? utcDate + 'Z'
      : utcDate;

  const dueDate = new Date(utc);
  const now = new Date();

  const diffMs = dueDate.getTime() - now.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) return 'overdue';            // ❌ missed
  if (diffMinutes < 60) return 'urgent';       // 🔥 < 1 hr
  if (diffHours < 24) return 'due-soon';       // ⚠ < 1 day

  return 'on-track';                           // ✅ safe
}

}
