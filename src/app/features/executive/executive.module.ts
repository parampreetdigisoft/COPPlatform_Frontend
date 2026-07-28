import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExecutiveComponent } from './component/executive.component';
import {  ExecutiveRoutingModule } from './executive-routing.module';
import { SharedModule } from 'src/app/shared/share.module';
import { AssesmentComponent } from './container/assesment/assesment.component';
import { EvaluatoinResponseViewComponent } from './container/evaluatoin-response-view/evaluatoin-response-view.component';
import { ExecutiveDashboardComponent } from './container/executive-dashboard/executive-dashboard.component';
import { ComparisionComponent } from './container/comparision/comparision.component';
import { DateViewerComponent } from 'src/app/shared/standAlone/date-viewer/date-viewer.component';
import { ComparisionWeeklyComponent } from './container/comparision-weekly/comparision-weekly.component';
import { SendEmailComponent } from './container/send-email/send-email.component';

@NgModule({
  declarations: [
    ExecutiveComponent,
    AssesmentComponent,
    EvaluatoinResponseViewComponent,
    ExecutiveDashboardComponent,
    ComparisionComponent,
    ComparisionWeeklyComponent,
    SendEmailComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ExecutiveRoutingModule,
    DateViewerComponent    
  ],
  //bootstrap: [AdminComponent]
})
export class ExecutiveModule { } 