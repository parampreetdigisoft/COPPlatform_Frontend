import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { BulkAddCityDto, CityVM } from '../../../../core/models/CityVM';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';
import { environment } from 'src/environments/environment';
declare var bootstrap: any;
@Component({
  selector: 'app-city',
  templateUrl: './city.component.html',
  styleUrl: './city.component.css'
})
export class CityComponent implements OnInit, OnDestroy {
  urlBase = environment.apiUrl;
  selectedCity: CityVM | null | undefined = null;
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  loading: boolean = false;
  isLoader: boolean = false;
  isOpendialog = false;
  isExporting: boolean = false;
  cities: CityVM[] = [];
  constructor(private adminService: AdminService, private toaster: ToasterService, private userService: UserService) { }

  ngOnInit(): void {
    this.getCities(1);
  }

  getCities(currentPage: number = 1) {
    this.citiesResponse = undefined;
    this.isLoader = true;
    let payload: PaginationUserRequest = {
      sortDirection: SortDirection.DESC,
      sortBy: 'score',
      pageNumber: currentPage,
      pageSize: this.pageSize,
      userId: this.userService?.userInfo?.userID
    }

    this.adminService.getCities(payload).subscribe(cities => {
      this.citiesResponse = cities;
      this.totalRecords = cities.totalRecords;
      this.currentPage = currentPage;
      this.pageSize = cities.pageSize;
      this.isLoader = false;
    });

  }

  editCity(city: CityVM | null) {
    this.selectedCity = city;
  }
  deleteCity() {
    if (this.selectedCity === null) {
      this.toaster.showError('No city selected for deletion');
      return;
    }
    this.adminService.deleteCity(this.selectedCity?.cityID ?? 0).subscribe({
      next: (res) => {
        if (res.succeeded) {
          this.getCities(this.currentPage);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.toaster.showError('Failed to delete city');
      }
    });
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
  addUpdateCity(formData: FormData) {
    this.loading = true;
    this.adminService.AddUpdateCity(formData).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getCities(this.currentPage);
          this.toaster.showSuccess(res?.messages?.join(', '));
        } else {
          this.toaster.showError(res?.errors?.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to edit city');
      }
    });
  }

  opendialog() {
    this.isOpendialog = true;
    setTimeout(() => {
      const modalEl = document.getElementById("exampleModal");
      if (modalEl) {
        let modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (!modalInstance) {
          modalInstance = new bootstrap.Modal(modalEl);
        }
        modalInstance.show(); // ✅ use show()
      }
    }, 100);
  }
  closeModal() {
    this.loading = false;
    const homeTab = document.querySelector('#pills-home-tab') as HTMLElement;
    if (homeTab) {
      homeTab.click();
    }
    const modalEl = document.getElementById('exampleModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance)
      modalInstance.hide();
    this.isOpendialog = false;
  }
  openCityModal(city: CityVM | null) {
    this.selectedCity = city ?? null;
    this.opendialog();
  }
  ngOnDestroy(): void {

  }
  bulkImport(city: CityVM[]) {
    this.loading = true;
    let payload: BulkAddCityDto = {
      cities: city
    }
    this.adminService.addBulkCity(payload).subscribe({
      next: (res) => {
        this.closeModal();
        if (res.succeeded) {
          this.getCities(1);
          this.toaster.showSuccess(res?.messages.join(', '));
        } else {
          this.toaster.showError(res?.errors.join(', '));
        }
      },
      error: () => {
        this.closeModal();
        this.toaster.showError('Failed to add cities');
      }
    });
  }

  exportCities() {
    this.isExporting =true;
    this.adminService.exportCities().subscribe({
      next: (res) => {
        this.isExporting =false;
        const formattedDate = new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');

        const url = window.URL.createObjectURL(res);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Cities_Progress_${formattedDate}.xlsx`;
        a.click();
        this.toaster.showSuccess("Pillars History downloaded successfully");
      },
      error: () => {
        this.isExporting =false;
        this.toaster.showError('Failed to download cities');
      }
    });
  }
}
