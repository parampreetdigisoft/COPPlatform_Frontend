import { Injectable } from '@angular/core';
import { HttpService } from '../http/http.service';
import { map } from 'rxjs';
import { AiCitySummeryDto } from '../models/aiVm/AiCitySummeryDto';
import { AiCitySummeryRequestDto, AiPillarQuetionsRequestDto } from '../models/aiVm/AiCitySummeryRequestDto';
import { PaginationResponse } from '../models/PaginationResponse';
import { AiCityPillarResponseDto } from '../models/aiVm/AiCityPillarResponseDto';
import { ResultResponseDto } from '../models/ResultResponseDto';
import { AITrustLevelVM } from '../models/aiVm/AITrustLevelVM';
import { AIEstimatedQuestionScoreDto } from '../models/aiVm/AIEstimatedQuestionScoreDto';
import { AiCrossCityResponseDto } from '../models/aiVm/AiCrossCityResponseDto';
import { ChangedAiCityEvaluationStatusDto } from '../models/aiVm/ChangedAiCityEvaluationStatusDto';
import { RegenerateAiSearchDto } from '../models/aiVm/RegenerateAiSearchDto';
import { AiCitySummeryRequestPdfDto } from '../models/aiVm/AiCitySummeryRequestPdfDto';

@Injectable({
  providedIn: 'root'
})
export class AiComputationService {

  constructor(private http: HttpService) { }

  public getAITrustLevels() {
    return this.http
      .get(`AiComputation/getAITrustLevels`)
      .pipe(map((x) => x as ResultResponseDto<AITrustLevelVM[]>));
  }

  public getAICities(request: AiCitySummeryRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICities`, request)
      .pipe(map((x) => x as PaginationResponse<AiCitySummeryDto>));
  }
  public getAICityPillars(request: AiCitySummeryRequestPdfDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAICityPillars`,request)
      .pipe(map((x) => x as ResultResponseDto<AiCityPillarResponseDto>));
  }
  public getAIPillarQuestions(request: AiPillarQuetionsRequestDto) {
    return this.http
      .getWithQueryParams(`AiComputation/getAIPillarQuestions`, request)
      .pipe(map((x) => x as PaginationResponse<AIEstimatedQuestionScoreDto>));
  }
  public aiCityDetailsReport(request:AiCitySummeryRequestPdfDto ) {
    return this.http
      .ImportFile(`AiComputation/aiCityDetailsReport`,request);
  }
  public aiPillarDetailsReport(request:AiCitySummeryRequestPdfDto) {
    return this.http
      .ImportFile(`AiComputation/aiPillarDetailsReport`,request);
  }
  public getAICrossCityPillars(ids: number[]) {
    let payload = { cityIDs: ids };
    return this.http.post(`AiComputation/getAICrossCityPillars`, payload).pipe(map(x => x as ResultResponseDto<AiCrossCityResponseDto>));;
  }
  public changedAiCityEvaluationStatus(payload: ChangedAiCityEvaluationStatusDto) {
    return this.http.post(`AiComputation/changedAiCityEvaluationStatus`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public regenerateAiSearch(payload: RegenerateAiSearchDto) {
    return this.http.post(`AiComputation/regenerateAiSearch`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public addComment(payload: any) {
    return this.http.post(`AiComputation/addComment`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
  public regenerateSinglePillarAiSearch(payload: RegenerateAiSearchDto) {
    return this.http.post(`AiComputation/regeneratePillarAiSearch`, payload).pipe(map(x => x as ResultResponseDto<boolean>));;
  }
}
