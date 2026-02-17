import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { EvaluatorComponent } from './evaluator/evaluator.component';
import { AssessmentResultComponent } from './container/assessment-result/assessment-result.component';
import { MakeAssessmentComponent } from './container/make-assessment/make-assessment.component';
import { SharedModule } from 'src/app/shared/share.module';
import { AssignedCityComponent } from './container/assigned-city/assigned-city.component';
import { AssessmentViewResultComponent } from './container/assessment-view-result/assessment-view-result.component';
import { EvaluatorDashboardComponent } from './container/evaluator-dashboard/evaluator-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: EvaluatorComponent,
    data: { roles: [] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, 
      { path: 'dashboard', component: EvaluatorDashboardComponent },
      { path: 'assigned-city', component: AssignedCityComponent },
      { path: 'make-assessment', component: MakeAssessmentComponent },
      { path: 'assessment-result', component: AssessmentResultComponent },
      { path: 'assessment-result/:assessmentID/:userName', component: AssessmentViewResultComponent }
    ]
  }
];

@NgModule({
  declarations: [
    EvaluatorComponent,
    AssessmentResultComponent,
    MakeAssessmentComponent,
    AssignedCityComponent,
    EvaluatorDashboardComponent,
    AssessmentViewResultComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class EvaluatorModule { } 