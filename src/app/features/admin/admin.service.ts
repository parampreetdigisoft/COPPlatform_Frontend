import { map, Subject, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { CityVM } from '../../core/models/CityVM';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { HttpService } from 'src/app/core/http/http.service';
import { UserService } from 'src/app/core/services/user.service';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';
import { CityPillerRequestDto } from 'src/app/core/models/QuestionRequest';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { CompareCityResponseDto } from 'src/app/core/models/CompareCityResponseDto';
import { GetAssignUserDto, PublicUserResponse } from 'src/app/core/models/UserInfo';
import { PillarsHistoryResponse } from 'src/app/core/models/PillarsUserHistoryResponse';
import { InviteBulkUserDto, InviteUserDto, RegisterDto, UpdateInviteUserDto } from '../../core/models/AnalystVM';
import { CityHistoryDto, UserCityPillarDashboardRequstDto } from '../../core/models/cityHistoryDto';
import { QuestionsByUserPillarsResponsetDto } from 'src/app/core/models/GetQuestionHistoryResponseDto ';
import { AiCityPillarDashboardResponseDto } from 'src/app/core/models/AiCityPillarDashboardResponseDto';
import { GetUserByRoleRequestDto, GetUserByRoleResponse, GetUserByRoleResponseVM } from '../../core/models/GetUserByRoleResponse';
import { AddBulkQuestionsDto, AddQuestionRequest, GetQuestionRequest, GetQuestionResponse } from 'src/app/core/models/QuestonResponse';
import { AssessmentWithProgressVM, GetAssessmentQuestionResponseDto, GetAssessmentResponse } from 'src/app/core/models/AssessmentResponse';
import { AnalyticalLayerResponseDto, GetAnalyticalLayerRequestDto, GetAnalyticalLayerResultDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { ChangeAssessmentStatusRequestDto, GetAssessmentQuestoinRequestDto, GetAssessmentRequestDto, GetCityPillarHistoryRequestDto, GetCityPillarHistoryRequestNewDto, TransferAssessmentRequestDto } from 'src/app/core/models/AssessmentRequest';
import { GetMutiplekpiLayerRequestDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerRequestDto';
import { GetMutiplekpiLayerResultsDto } from 'src/app/core/models/aiVm/GetMutiplekpiLayerResultsDto';
import { DeleteInvitationDto, GetInviatationRequestDto, GetInviatationResponseDto } from 'src/app/core/models/GetInviatationRequestDto';
import { UpdateInvitationUserDto } from 'src/app/core/models/UpdateInviteUserDto';

@Injectable({
  providedIn: "root",
})
export class AdminService {
  public errorMessage: Subject<any> = new Subject<any>();

  constructor(private http: HttpService, private userService: UserService) { }

  public login(email: string, password: string) {
    const data = JSON.stringify({ email, password });
    return this.http.post(`Auth/login`, data).pipe(
      tap((user: any) => {
        if (user) this.userService.userInfo = user;
      })
    );
  }

  public getCities(request: PaginationUserRequest) {
    return this.http
      .getWithQueryParams(`City/cities`, request)
      .pipe(map((x) => x as PaginationResponse<CityVM>));
  }
  public getAllCitiesByUserId(userId: number) {
    return this.http
      .get(`City/getAllCityByUserId/` + userId)
      .pipe(map((x) => x as ResultResponseDto<CityVM[]>));
  }

  public addBulkCity(data: any) {
    return this.http
      .post(`City/addBulkCity`, data)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public AddUpdateCity(formdata: FormData) {
    return this.http
      .UploadFile(`City/AddUpdateCity`, formdata)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }

  public editCity(id: number, data: any) {
    return this.http
      .put(`City/edit/` + id, data)
      .pipe(map((x) => x as ResultResponseDto<CityVM>));
  }

  public deleteCity(id: number) {
    return this.http
      .delete(`City/delete/` + id)
      .pipe(map((x) => x as ResultResponseDto<boolean>));
  }
  public getCityHistory(userID: number, updatedAt: string) {
    return this.http
      .get(`City/getCityHistory/` + updatedAt)
      .pipe(map((x) => x as ResultResponseDto<CityHistoryDto>));
  }
  public exportCities() {
    return this.http.ImportFile(`City/exportCities`);
  }

  public getAnalyst(request: GetUserByRoleRequestDto) {
    return this.http
      .getWithQueryParams(`User/GetUserByRoleWithAssignedCity`, request)
      .pipe(map((x) => x as PaginationResponse<GetUserByRoleResponseVM>));
  }
  public addUpdateStaffUser(data: RegisterDto) {
    return this.http
      .post(`Auth/addUpdateStaffUser`, data)
      .pipe(map((x) => x as ResultResponseDto<unknown>));
  }
  public addBulkAnalyst(data: InviteBulkUserDto) {
    return this.http
      .post(`Auth/InviteBulkUser`, data)
      .pipe(map((x) => x as ResultResponseDto<unknown>));
  }
  public addUpdateInvitation(data: UpdateInvitationUserDto) {
    return this.http
      .post(`Auth/addUpdateInvitation`, data)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }

  public deleteUser(id: number) {
    return this.http
      .delete(`Auth/deleteUser/` + id)
      .pipe(map((x) => x as ResultResponseDto<unknown>));
  }
  public getAllPillars() {
    return this.http.get(`Pillar/Pillars`).pipe(map((x) => x as PillarsVM[]));
  }
  public editAllPillars(id: number, data: PillarsVM) {
    return this.http.put(`Pillar/` + id, data).pipe(map((x) => x as PillarsVM));
  }
  public getResponsesByUserId(request: GetCityPillarHistoryRequestNewDto) {
    return this.http.post(`Pillar/GetResponsesByUserId`, request).pipe(map(x => x as PaginationResponse<PillarsHistoryResponse>));
  }
  public getPillarsHistoryByUserId(request: GetCityPillarHistoryRequestDto) {
    return this.http
      .post(`Pillar/GetPillarsHistoryByUserId`, request)
      .pipe(map((x) => x as ResultResponseDto<PillarsHistoryResponse[]>));
  }
  public exportPillarsHistoryByUserId(request: GetCityPillarHistoryRequestDto) {
    return this.http.ImportFile(`Pillar/ExportPillarsHistoryByUserId`, request);
  }
  public getQuestions(data: GetQuestionRequest) {
    return this.http
      .getWithQueryParams(`Question/getQuestions`, data)
      .pipe(map((x) => x as PaginationResponse<GetQuestionResponse>));
  }

  public addUpdateQuestion(data: AddQuestionRequest) {
    return this.http
      .post(`Question/addUpdateQuestion`, data)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public addBulkQuestions(data: AddBulkQuestionsDto) {
    return this.http
      .post(`Question/addBulkQuestions`, data)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public deleteQuestion(id: number) {
    return this.http
      .delete(`Question/delete/` + id)
      .pipe(map((x) => x as boolean));
  }
  public getQuestionsHistoryByPillar(request: GetCityPillarHistoryRequestDto) {
    return this.http
      .getWithQueryParams(`Question/getQuestionsHistoryByPillar`, request)
      .pipe(
        map((x) => x as ResultResponseDto<QuestionsByUserPillarsResponsetDto[]>)
      );
  }
  public saveAssessment(payload: CityPillerRequestDto) {
    return this.http
      .post(`AssessmentResponse/saveAssessment`, payload)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public getAssessmentResults(payload: GetAssessmentRequestDto) {
    return this.http
      .getWithQueryParams(`AssessmentResponse/getAssessmentResults`, payload)
      .pipe(map((x) => x as PaginationResponse<GetAssessmentResponse>));
  }
  public getAssessmentQuestoins(payload: GetAssessmentQuestoinRequestDto) {
    return this.http
      .getWithQueryParams(`AssessmentResponse/getAssessmentQuestoins`, payload)
      .pipe(
        map((x) => x as PaginationResponse<GetAssessmentQuestionResponseDto>)
      );
  }
  public getAssessmentProgressHistory(assessmentID: number) {
    return this.http
      .get(`AssessmentResponse/getAssessmentProgressHistory/` + assessmentID)
      .pipe(map((x) => x as ResultResponseDto<AssessmentWithProgressVM>));
  }

  public getCityPillarHistory(request: UserCityPillarDashboardRequstDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getCityPillarHistory`, request).pipe(map(x => x as ResultResponseDto<AiCityPillarDashboardResponseDto>));
  }
  public changeAssessmentStatus(request: ChangeAssessmentStatusRequestDto) {
    return this.http
      .post(`AssessmentResponse/changeAssessmentStatus`, request)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public transferAssessment(request: TransferAssessmentRequestDto) {
    return this.http
      .post(`AssessmentResponse/transferAssessment`, request)
      .pipe(map((x) => x as ResultResponseDto<string>));
  }
  public getUsersAssignedToCity(cityID: number) {
    return this.http
      .get(`User/getUsersAssignedToCity/` + cityID)
      .pipe(map((x) => x as ResultResponseDto<GetAssessmentResponse[]>));
  }
  public getAccessUsers(payload: GetAssignUserDto) {
    return this.http
      .getWithQueryParams(`User/getAccessUsers`, payload)
      .pipe(map((x) => x as ResultResponseDto<PublicUserResponse[]>));
  }

  public getInviations(request: GetInviatationRequestDto) {
    return this.http
      .getWithQueryParams(`User/getInviations`, request)
      .pipe(map((x) => x as PaginationResponse<GetInviatationResponseDto>));
  }
  public deleteInvitation(request: DeleteInvitationDto) {
    return this.http
      .post(`User/deleteInvitation`,request)
      .pipe(map((x) => x as ResultResponseDto<unknown>));
  }

  public GetAnalyticalLayerResults(request: GetAnalyticalLayerRequestDto) {
    return this.http
      .getWithQueryParams(`Kpi/GetAnalyticalLayerResults`, request)
      .pipe(map((x) => x as PaginationResponse<GetAnalyticalLayerResultDto>));
  }
  public GetAllKpi() {
    return this.http
      .get(`Kpi/GetAllKpi`)
      .pipe(map((x) => x as ResultResponseDto<AnalyticalLayerResponseDto[]>));
  }
  public compareCities(request: CompareCityRequestDto) {
    return this.http.post(`Kpi/compareCities`, request).pipe(map(x => x as ResultResponseDto<CompareCityResponseDto>));
  }
  public getMutiplekpiLayerResults(payload: GetMutiplekpiLayerRequestDto) {
    return this.http.post(`kpi/getMutiplekpiLayerResults`, payload).pipe(map(x => x as ResultResponseDto<GetMutiplekpiLayerResultsDto>));;
  }
}
