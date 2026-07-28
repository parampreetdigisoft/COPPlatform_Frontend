import { PaginationUserRequest } from "../PaginationRequest";

export interface EmailLogRequestDto extends PaginationUserRequest {
  senderUserId?: number;
  receiverEmail?: string;
  isSent?: boolean;

  fromDate?: Date | string | null;
  toDate?: Date | string | null;  
}