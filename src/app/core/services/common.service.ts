import { Injectable } from "@angular/core";
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { ResultResponseDto } from "../models/ResultResponseDto";
import { UserService } from "./user.service";
import { BehaviorSubject, catchError, from, map, Observable, switchMap, tap } from "rxjs";
import { HttpService } from "../http/http.service";
import { UpdateUserResponseDto, UserInfo } from "../models/UserInfo";
import { CityVM } from "../models/CityVM";
import { GetNearestCityRequestDto } from "../models/GetNearestCityRequestDto";
import { ToasterService } from "./toaster.service";

@Injectable({
  providedIn: "root",
})
export class CommonService {
  latitude = 0;
  longitude = 0;

  private years = new BehaviorSubject<number[]>(this.getYearList(2025));

  constructor(private http: HttpService, private userService: UserService, private toaster: ToasterService) { }


  public getUserInfo() {
    return this.http
      .get(`User/getUserInfo`)
      .pipe(map((x) => x as ResultResponseDto<UserInfo>));
  }

  public updateUser(formData: FormData) {
    return this.http
      .UploadFile(`User/updateUser`, formData)
      .pipe(map((x) => x as ResultResponseDto<UpdateUserResponseDto>));
  }
  public refreshToken() {
    this.userService.isTokenRefresh = new Date(Date.now() + 35 * 60 * 1000);
    let userRes = this.userService?.userInfo;
    if (userRes == null) {
      this.userService.RedirectBasedOnRole();
    }
    return this.http.post(`Auth/refreshToken`, { userID: userRes?.userID })
      .pipe(
        map(x => x as ResultResponseDto<UserInfo | any>),
        tap((user) => {
          if (user) {
            var rememberMe = userRes?.rememberMe;
            user.result.rememberMe = rememberMe;
            this.userService.userInfo = user.result;
          }
        }));
  }
  get applicateYears() {
    return this.years.value;
  }
  getStartOfYearLocal(year: number): string {
    return `${year}-01-01T00:00:00`;
  }
  exportExcel(data: any[]): void {
    // Convert JSON to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Set column width dynamically (based on longest value)
    const objectMaxLength: number[] = [];
    data.forEach((record) => {
      Object.keys(record).forEach((key, i) => {
        const columnLength = record[key] ? record[key].toString().length : 10;
        objectMaxLength[i] = Math.max(objectMaxLength[i] || 10, columnLength);
      });
    });

    worksheet["!cols"] = objectMaxLength.map((w) => ({ wch: w + 5 }));

    // Create workbook and add worksheet
    const workbook: XLSX.WorkBook = {
      Sheets: { "Pillars Data": worksheet },
      SheetNames: ["Pillars Data"],
    };

    // Generate Excel buffer
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Save file
    const fileName = `Pillars_Data_${new Date().getTime()}.xlsx`;
    FileSaver.saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      fileName
    );
  }

  GetPadding(n: number) {
    let paddingInner = 0.2;
    let paddingOuter = 0.1;

    if (n === 1) {
      // Special case: one pillar → center the bar
      paddingInner = 0.8;
      paddingOuter = 0.41;
    } else if (n < 15) {
      // Smoothly reduce padding from ~0.8 (for 2) down to ~0.25 (for 14)
      paddingInner = Math.max(0.25, 1 - n * 0.1); // e.g. 2→0.88, 10→0.4, 14→0.25
      paddingOuter = Math.max(0.1, 0.6 - n * 0.06); // e.g. 2→0.54, 10→0.3, 14→0.18
    } else if (n < 50) {
      paddingInner = 0.25;
      paddingOuter = 0.15;
    } else {
      paddingInner = 0.05;
      paddingOuter = 0.05;
    }
    return { paddingInner, paddingOuter };
  }
  getYearList(startYear: number): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    for (let year = startYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }
  public getLatitudeLongitude(city: any) {
    return this.http
      .getExternalApi('https://nominatim.openstreetmap.org/search', city)
      .pipe(map((x) => x as any[]));
  }
    
  get PillarColors() {
    return [
      "#a3c6f7",
      "#94b9ec",
      "#79a3e4",
      "#578ad8",
      "#5b8dd8",
      "#326cc1", 
      "#2b5da8",
      "#244e8f",
      "#1d3f76",
      "#162f5d"
    ];
  }


  get kpiColors() {
    return [
      '#6685a7', // blue
      '#dc3545', // red
      '#28a745', // green
      '#f1d47d', // yellow
      '#17a2b8', // cyan
      '#725e97', // purple
      '#b99e88', // orange
      '#2a7760', // teal
      '#7e767a', // pink
      '#343a40'  // dark gray
    ];
  }

}
