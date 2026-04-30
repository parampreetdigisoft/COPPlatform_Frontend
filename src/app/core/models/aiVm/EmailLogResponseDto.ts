export interface EmailLogResponseDto {
  id: number;

  senderUserId?: number;
  senderEmail?: string;

  receiverEmail: string;

  subject: string;
  message: string;

  templateName?: string;

  isSent: boolean;
  errorMessage?: string;

  createdAt: Date;   // ISO date string
  sentAt?: Date;     // ISO date string (optional)
}