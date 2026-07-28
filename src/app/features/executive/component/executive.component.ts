import { Component } from '@angular/core';
import { ExecutiveService } from '../executive.service';

@Component({
  selector: 'app-executive',
  templateUrl: './executive.component.html',
  styleUrls: ['./executive.component.css']
})
export class ExecutiveComponent {
  constructor(private executiveService: ExecutiveService) {}

  

} 