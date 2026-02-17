import { Component, OnDestroy, OnInit } from '@angular/core';
import { PaginationRequest, PaginationUserRequest } from 'src/app/core/models/PaginationRequest';
import { PaginationResponse } from 'src/app/core/models/PaginationResponse';
import { ToasterService } from 'src/app/core/services/toaster.service';
import { CityVM } from 'src/app/core/models/CityVM';
import { AnalystService } from '../../analyst.service';
import { UserService } from 'src/app/core/services/user.service';
import { SortDirection } from 'src/app/core/enums/SortDirection';

@Component({
  selector: 'app-assigned-city',
  templateUrl: './assigned-city.component.html',
  styleUrl: './assigned-city.component.css'
})
export class AssignedCityComponent implements OnInit, OnDestroy{
  citiesResponse: PaginationResponse<CityVM> | undefined;
  totalRecords: number = 0;
  pageSize: number = 10;
  currentPage: number = 1
  isLoader: boolean = false;  
 constructor(private analystService: AnalystService, private userService:UserService,private toaster: ToasterService) { }
  ngOnDestroy(): void {

  }
  ngOnInit(): void {
    this.getCities();
  }


    getCities(currentPage: number = 1 ) {  
      this.citiesResponse = undefined;
      this.isLoader = true;
      let payload: PaginationUserRequest = {
        sortDirection: SortDirection.DESC,
        sortBy: 'score',
        pageNumber: currentPage,
        pageSize: this.pageSize,
        userId:this.userService?.userInfo?.userID
      }
      this.analystService.getCities(payload).subscribe(cities => {
        this.citiesResponse = cities;
        this.totalRecords = cities.totalRecords;
        this.currentPage = currentPage;
        this.pageSize = cities.pageSize;
        this.isLoader = false;
      });
    }

}
