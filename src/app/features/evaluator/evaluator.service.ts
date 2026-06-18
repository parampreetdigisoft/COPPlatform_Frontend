import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpService } from 'src/app/core/http/http.service';
import { AiCityPillarDashboardResponseDto } from 'src/app/core/models/AiCityPillarDashboardResponseDto';
import { SendRequestMailToUpdateCity } from 'src/app/core/models/AnalystVM';
import { AddAssessmentDto, GetAssessmentQuestionRequestDto, GetAssessmentRequestDto } from 'src/app/core/models/AssessmentRequest';
import { AssessmentWithProgressVM, GetAssessmentQuestionResponseDto, GetAssessmentResponse } from 'src/app/core/models/AssessmentResponse';
import { CardHistoryDto, CityHistoryDto, GetCityQuestionHistoryReponseDto, UserAssessmentPillarDashboardRequstDto, UserCityRequstDto } from 'src/app/core/models/cityHistoryDto';
import { CityVM } from 'src/app/core/models/CityVM';
import { CompareCityRequestDto } from 'src/app/core/models/CompareCityRequestDto';
import { CompareCityResponseDto } from 'src/app/core/models/CompareCityResponseDto';
import { GetAnalyticalLayerRequestDto, GetAnalyticalLayerResultDto, AnalyticalLayerResponseDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { GetAssignedAssessmentResponseDto } from 'src/app/core/models/GetAssignedAssessmentResponseDto ';
import { GetInviatationRequestDto, GetInviatationResponseDto } from 'src/app/core/models/GetInviatationRequestDto';
import { GetUserByRoleRequestDto, GetUserByRoleResponse } from 'src/app/core/models/GetUserByRoleResponse';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { PillarsVM } from 'src/app/core/models/PillersVM';
import { CityMappingPillerRequestDto } from 'src/app/core/models/QuestionRequest';
import { GetQuestionByCityMappingResponse } from 'src/app/core/models/QuestionResponse';
import { ResultResponseDto } from 'src/app/core/models/ResultResponseDto';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {

  constructor(private http: HttpService) { }

  public userCityMappingIDSubject$ = new BehaviorSubject<number | null>(null);

  public sendMailForEditAssessment(data: SendRequestMailToUpdateCity) {
    return this.http.post(`Auth/sendMailForEditAssessment`, data).pipe(map(x => x as ResultResponseDto<string>));
  }

  public getCities(request: PaginationUserRequest) {
    return this.http.getWithQueryParams(`City/cities`, request).pipe(map(x => x as PaginationResponse<CityVM>));;
  }
  public getAllCitiesByUserId(userId: number) {
    return this.http.get(`City/getAllCityByUserId/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getAiAccessCity(userId: number) {
    return this.http.get(`City/getAiAccessCity`).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getCityByUserIdForAssessment(userId: number) {
    return this.http.get(`City/getCityByUserIdForAssessment/` + userId).pipe(map(x => x as ResultResponseDto<CityVM[]>));;
  }
  public getCityHistory(userID: number, updatedAt: string) {
    return this.http.get(`City/getCityHistory/` + updatedAt).pipe(map(x => x as ResultResponseDto<CityHistoryDto>));
  }
  public getEvaluator(request: GetUserByRoleRequestDto) {
    return this.http.getWithQueryParams(`User/GetUserByRoleWithAssignedCity`, request).pipe(map(x => x as PaginationResponse<GetUserByRoleResponse>));
  }

  public getAllPillars() {
    return this.http.get(`Pillar/Pillars`).pipe(map(x => x as PillarsVM[]));
  }
  public getPillarsByUserAssessmentMappingId(userAssessmentMappingID: number) {
    return this.http
      .getWithQueryParams(`Pillar/GetPillarsByUserAssessmentMappingId`, { userAssessmentMappingId: userAssessmentMappingID })
      .pipe(map((x) => x as PillarsVM[]));
  }

  public saveAssessment(payload: AddAssessmentDto) {
    return this.http.post(`AssessmentResponse/saveAssessment`, payload).pipe(map(x => x as ResultResponseDto<string>));
  }
  public getAssessmentResults(payload: GetAssessmentRequestDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getAssessmentResults`, payload).pipe(map(x => x as PaginationResponse<GetAssessmentResponse>));
  }
  public getAssessmentQuestoins(payload: GetAssessmentQuestionRequestDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getAssessmentQuestions`, payload).pipe(map(x => x as PaginationResponse<GetAssessmentQuestionResponseDto>));
  }
  public ImportAssessment(formData: FormData) {
    return this.http.UploadFile(`AssessmentResponse/ImportAssessment`, formData).pipe(map(x => x as ResultResponseDto<string>));;
  }
  public getAssessmentProgressHistory(assessmentID: number) {
    return this.http.get(`AssessmentResponse/getAssessmentProgressHistory/` + assessmentID).pipe(map(x => x as ResultResponseDto<AssessmentWithProgressVM>));
  }
  public getCityQuestionHistory(request: UserCityRequstDto) {
    return this.http.getWithQueryParams(`AssessmentResponse/getCityQuestionHistory`, request).pipe(map(x => x as GetCityQuestionHistoryReponseDto));
  }

  public getAssignedInvitations() {
    return this.http.get(`AssessmentResponse/getAssignedInvitations`).pipe(map(x => x as ResultResponseDto<GetAssignedAssessmentResponseDto[]>));
  }

  public getInviations(request: GetInviatationRequestDto) {
    return this.http
      .getWithQueryParams(`User/getInviations`, request)
      .pipe(map((x) => x as PaginationResponse<GetInviatationResponseDto>));
  }
  public getQuestionsByCityId(payload: CityMappingPillerRequestDto) {
    return this.http.getWithQueryParams(`Question/getQuestionsByAssessmentMappingId`, payload).pipe(map(x => x as ResultResponseDto<GetQuestionByCityMappingResponse>));
  }
  public ExportQuestions(userAssessmentMappingID: number) {
    return this.http.ImportFile(`Question/ExportAssessment/` + userAssessmentMappingID);
  }
  public GetAnalyticalLayerResults(request: GetAnalyticalLayerRequestDto) {
    return this.http.getWithQueryParams(`Kpi/GetAnalyticalLayerResults`, request).pipe(map(x => x as PaginationResponse<GetAnalyticalLayerResultDto>));;
  }
  public GetAllKpi() {
    return this.http.get(`Kpi/GetAllKpi`).pipe(map(x => x as ResultResponseDto<AnalyticalLayerResponseDto[]>));;
  }


  public getDashboardPillarHistory(request: UserAssessmentPillarDashboardRequstDto) {

    const queryParams: any = {};

    if (request?.userAssessmentMappingID != null) {
      queryParams.userAssessmentMappingID = request.userAssessmentMappingID;
    }

    return this.http.getWithQueryParams(
      `AssessmentResponse/getDashboardPillarHistory`,
      queryParams
    ).pipe(
      map(x => x as ResultResponseDto<AiCityPillarDashboardResponseDto>)
    );
  }
  public getCardDetails() {
    return this.http
      .get(`City/GetCardDetails`)
      .pipe(map((x) => x as ResultResponseDto<CardHistoryDto>));
  }
}
