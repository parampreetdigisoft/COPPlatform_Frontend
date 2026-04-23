import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { ExecutiveComponent } from "./component/executive.component";
import { AssesmentComponent } from "./container/assesment/assesment.component";
import { ExecutiveDashboardComponent } from "./container/executive-dashboard/executive-dashboard.component";
import { ComparisionComponent } from "./container/comparision/comparision.component";
import { EvaluatoinResponseViewComponent } from "./container/evaluatoin-response-view/evaluatoin-response-view.component";
import { ComparisionWeeklyComponent } from "./container/comparision-weekly/comparision-weekly.component";

const routes: Routes = [
  {
    path: "",
    component: ExecutiveComponent,
    children: [
      { path: "", redirectTo: "assessment", pathMatch: "full" },
      { path: "dashboard", component: ExecutiveDashboardComponent },

      { path: "assessment", component: AssesmentComponent },
      { path: "assessment/:roleID/:cityID", component: AssesmentComponent },
      {
        path: "assessment-result/:assessmentID/:userName",
        component: EvaluatoinResponseViewComponent,
      },

      { path: "evaluator-Comparision", component: ComparisionComponent },
      { path: "evaluator-Comparision-Weekly", component: ComparisionWeeklyComponent },
      {
        path: "kpi-layers",
        loadComponent: () =>
          import("./container/kpi-layers/kpi-layers.component").then(
            (m) => m.KpiLayersComponent
          ),
      },
      {
        path: "kpi-comparision",
        loadComponent: () =>
          import("./container/kpi-comparision/kpi-comparision.component").then(
            (m) => m.KpiComparisionComponent
          ),
      },      
      {
        path: "edit-assesment",
        loadComponent: () =>
          import("./container/analyst-assessment/analyst-assessment.component").then(
            (m) => m.AnalystAssessmentComponent
          ),
      }                 
    ],
  },
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExecutiveRoutingModule {}
