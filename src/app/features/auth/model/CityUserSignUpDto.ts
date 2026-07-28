import { UserRoleValue } from "src/app/core/enums/UserRole";

export interface CityUserSignUpDto extends LoginRequestDto{
  fullName: string;
  phone: string;
  // 
  role: UserRoleValue;
  isConfrimed:boolean;
  is2FAEnabled:boolean;
}
export interface LoginRequestDto
{
  email: string;
  password: string;
}
