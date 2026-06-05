import { GetAnalyticalLayerResultDto, AnalyticalLayerResponseDto, GetAnalyticalLayerRequestDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { SparklineScoreComponent } from 'src/app/shared/standAlone/sparkline-score/sparkline-score.component';
import { CircularScoreComponent } from 'src/app/shared/standAlone/circular-score/circular-score.component';
import { GetAssignedAssessmentResponseDto } from 'src/app/core/models/GetAssignedAssessmentResponseDto ';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CommonService } from 'src/app/core/services/common.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { UserService } from 'src/app/core/services/user.service';
import { SharedModule } from 'src/app/shared/share.module';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { Component } from '@angular/core';
declare var bootstrap: any; // 👈 use Bootstrap JS API
import { AnalystService } from "../../analyst.service";

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule, SparklineScoreComponent, CircularScoreComponent],
  selector: 'app-kpi-layers',
  templateUrl: './kpi-layers.component.html',
  styleUrl: './kpi-layers.component.css'
})
export class KpiLayersComponent {
    selectedKpi: GetAnalyticalLayerResultDto | null | undefined = null;

  userAssessmentMappingID?: number;
    selectedkpiLayerID?: number;
    kpiLayersResponse: PaginationResponse<GetAnalyticalLayerResultDto> | undefined;
    totalRecords: number = 0;
    pageSize: number = 10;
    currentPage: number = 1;
    loading: boolean = false;
    isLoader: boolean = false;
    kpis: AnalyticalLayerResponseDto[] = [];
    $kpiChanged = new Subject();
    assignedInvitations: GetAssignedAssessmentResponseDto[] = [];
  
  
    constructor(private analystService: AnalystService, private toaster: ToasterService, private userService: UserService, public commonService: CommonService) { }
  
    ngOnInit(): void {
      this.GetAnalyticalLayerResults(1);
      this.GetAllKpi();
      this.$kpiChanged.pipe(debounceTime(1000)).subscribe(x => {
        this.GetAnalyticalLayerResults();
      });
      this.getAssignedInvitations();
    }
    kpiChanged() {
      this.$kpiChanged.next(true);
    }
    getAssignedInvitations() {
      this.analystService
        .getAssignedInvitations()
        .subscribe({
          next: (res) => {
            this.assignedInvitations = res.result ?? [];
            if (this.assignedInvitations && this.assignedInvitations.length > 0) {
  
            }
            else {
              this.isLoader = false;
              this.toaster.showWarning("You don’t have any assigned assessments yet.");
            }
          },
        });
    }
  
    GetAnalyticalLayerResults(currentPage: any = 1) {
      this.kpiLayersResponse = undefined;
      this.isLoader = true;
      let payload: GetAnalyticalLayerRequestDto = {
        sortDirection: SortDirection.DESC,
        sortBy: 'CalValue',
        pageNumber: currentPage,
        pageSize: this.pageSize,
        userId: this.userService?.userInfo?.userID
      }
      if (this.userAssessmentMappingID != undefined && this.userAssessmentMappingID != 0) {
        payload.userAssessmentMappingID = this.userAssessmentMappingID;
      }
      if (this.selectedkpiLayerID != undefined && this.selectedkpiLayerID != 0) {
        payload.layerID = this.selectedkpiLayerID;
      }
  
    this.analystService.GetAnalyticalLayerResults(payload).subscribe(kpiLayers => {
      this.kpiLayersResponse = kpiLayers;
      this.totalRecords = kpiLayers.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = kpiLayers.pageSize;
      this.isLoader = false;
    });
  }

  ngOnDestroy(): void {

  }

  viewDetails(city: GetAnalyticalLayerResultDto) {
    this.selectedKpi = city;
    const sidebarEl = document.getElementById('kpiLayerSidebar');
    const offcanvas = new bootstrap.Offcanvas(sidebarEl);
    offcanvas.show();
  }
  GetAllKpi() {
    this.analystService.GetAllKpi().subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.kpis = res.result ?? [];
        }
      }
    });
  }
  
  getConditionByid(layer: GetAnalyticalLayerResultDto): string {
    return layer?.fiveLevelInterpretations?.find(x => x.interpretationID == layer.interpretationID)?.condition || '-';
  }

  getConditionClass(layer: GetAnalyticalLayerResultDto): string {
    if (!layer?.interpretationID || !layer.fiveLevelInterpretations?.length) {
      return 'condition_empty';
    }

    const sorted = [...layer.fiveLevelInterpretations].sort((a, b) => a.minRange - b.minRange);
    const index = sorted.findIndex(x => x.interpretationID === layer.interpretationID);
    return index === -1 ? 'condition_empty' : `condition_level_${index + 1}`;
  }
  customSearchFn(term: string, item: any) {
    term = term.toLowerCase();
    return (
      item.layerCode?.toLowerCase().includes(term) ||
      item.layerName?.toLowerCase().includes(term)
    );
  }
}
