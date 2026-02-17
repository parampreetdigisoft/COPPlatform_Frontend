import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityVM } from '../../../../core/models/CityVM';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CommonService } from 'src/app/core/services/common.service';
import { debounceTime } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-update-city',
  templateUrl: './add-update-city.component.html',
  styleUrls: ['./add-update-city.component.css']
})
export class AddUpdateCityComponent implements OnChanges, OnInit {
  urlBase = environment.apiUrl;
  selectedFile: File | null = null;
  @Input() city: CityVM | null | undefined = null;
  @Output() cityChange = new EventEmitter<FormData>();
  @Output() bulkImport = new EventEmitter<CityVM[]>();
  @Output() closeModal = new EventEmitter<boolean>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Input() loading: boolean = false;
  isSubmitted = false;
  cityForm!: FormGroup;
  bulkImportData: CityVM[] | null = null;
  alertMsg = '';

  constructor(private fb: FormBuilder, private commonService: CommonService) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm() {
    this.isSubmitted = false;
    this.cityForm = this.fb.group({
      state: [this.city?.state, Validators.required],
      cityName: [this.city?.cityName, Validators.required],
      region: [this.city?.region, Validators.required],
      country: [this.city?.country, Validators.required],
      postalCode: [this.city?.postalCode, Validators.required],
      latitude: [this.city?.latitude, Validators.required],
      longitude: [this.city?.longitude, Validators.required],
      imageFile: [''],
    });
    this.onFormChange();
    if(this.cityForm.get('latitude')?.invalid && this.cityForm.get('cityName')?.valid && this.cityForm.get('state')?.valid && this.cityForm.get('country')?.valid){
      this.getLatitudeLongitude();
    }
  }
  onFormChange() {
    this.cityForm.valueChanges.pipe(debounceTime(500)).subscribe({
      next: (r) => {
        if(this.cityForm.get('latitude')?.invalid && this.cityForm.get('cityName')?.valid && this.cityForm.get('state')?.valid && this.cityForm.get('country')?.valid){
          this.getLatitudeLongitude();
        }
      }
    })
  }
  getLatitudeLongitude(){
    let c = {
          city: this.cityForm.get('cityName')?.value,
          region: this.cityForm.get('region')?.value,
          state: this.cityForm.get('state')?.value,
          country: this.cityForm.get('country')?.value,
          postalCode: this.cityForm.get('postalCode')?.value,
          format:'json'
        }
        this.commonService.getLatitudeLongitude(c).subscribe({
        next: (r) => {
          if(r.length){
            this.cityForm.patchValue({
              latitude: r[0].lat,
              longitude : r[0].lon
            });
          }
        }
    })
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.alertMsg = '';
    //this.initializeForm();
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    this.selectedFile = event.target.files[0];
  }
  onSubmit() {
    this.isSubmitted = true;
    if (this.cityForm.invalid) return;

    const formData = new FormData();

    // Append all form values (capitalized keys)
    formData.append('State', this.cityForm.get('state')?.value);
    formData.append('CityName', this.cityForm.get('cityName')?.value);
    formData.append('Region', this.cityForm.get('region')?.value);
    formData.append('Country', this.cityForm.get('country')?.value);
    formData.append('PostalCode', this.cityForm.get('postalCode')?.value);
    formData.append('Longitude', this.cityForm.get('longitude')?.value);
    formData.append('Latitude', this.cityForm.get('latitude')?.value);
    formData.append('CityID', (this.city?.cityID ?? 0).toString());
    if (this.selectedFile) {
      formData.append('ImageFile', this.selectedFile as Blob, this.selectedFile?.name);
    }

    // Include CityID if editing
    this.cityChange.emit(formData);
  }


  downloadTemplate() {
    const headers = ["Country", "CityName", "State", "PostalCode", "Region"];
    // One sample row
    const sampleRow = {
      Country: "Enter Country Name",
      CityName: "Enter City Name",
      State: "Enter State Name",
      Region: "Enter Region Name",
      PostalCode: "Enter Postal Code",
      Latitude: "Enter Latitude",
      Longitude: "Enter Longitude"
    };

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    ws['!cols'] = headers.map(() => ({ wch: 20 }));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CitiesTemplate');

    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'CityTemplate.xlsx');
  }

  // 👉 Handle file import
  handleFileImport(evt: any) {
    this.alertMsg = '';
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) return;

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      const jsonData = <any[]>XLSX.utils.sheet_to_json(ws, { defval: "" });

      // ✅ Header validation
      const requiredHeaders = ["CityName", "State", "Region", "Country", "PostalCode", "Latitude", "Longitude"];
      const headers = Object.keys(jsonData[0] || {});
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        this.alertMsg = `Invalid file format. Missing headers: ${missingHeaders.join(", ")}`;
        this.fileInput.nativeElement.value = "";
        return;
      }

      const excelData: CityVM[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];

        const cityName = String(row["CityName"] || "").trim();
        const state = String(row["State"] || "").trim();
        const region = String(row["Region"] || "").trim();
        const country = String(row["Country"] || "").trim();
        const postalCode = String(row["PostalCode"] || "").trim();
        const latitude = Number(row["Latitude"] || "");
        const longitude = Number(row["Longitude"] || "");


        const isCompletelyBlank = !cityName && !state && !region;

        if (isCompletelyBlank) {
          continue;
        }

        // ✅ Required field check
        if (!cityName || !state) {
          this.alertMsg = `Row ${i + 2}: All fields (CityName, State) are required.`;
          this.fileInput.nativeElement.value = "";
          return;
        }
        if (cityName.toLowerCase() == "Enter City Name".toLowerCase()) {
          continue;
        }

        // ✅ Prevent duplicate cityName in same file
        if (excelData.some(c => c.cityName.toLowerCase() === cityName.toLowerCase())) {
          this.alertMsg = `Row ${i + 2}: Duplicate city name (${cityName}).`;
          this.fileInput.nativeElement.value = "";
          return;
        }

        // ✅ Construct DTO
        const dto = { cityName, state, region, country, postalCode, latitude, longitude } as CityVM;
        excelData.push(dto);
      }

      this.bulkImportData = excelData;
      if (excelData.length == 0) {
        this.fileInput.nativeElement.value = "";
        this.alertMsg = "No record found"
      }
    };
    reader.readAsBinaryString(target.files[0]);
  }


  bulkImportCity() {

    if (this.bulkImportData && this.bulkImportData.length && this.fileInput.nativeElement.value != "") {
      this.bulkImport.emit(this.bulkImportData);
      this.bulkImportData = [];
    }
    this.fileInput.nativeElement.value = "";
  }

  closeModel() {
    if (this.fileInput?.nativeElement?.value)
      this.fileInput.nativeElement.value = "";
    this.alertMsg = '';
    this.closeModal.emit(true);
  }
    onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/noImageAvailable.png';
  }
}
