import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./component/admin.component";
import { CityComponent } from "./container/city/city.component";
import { PillarComponent } from "./container/pillar/pillar.component";
import { QuestionComponent } from "./container/question/question.component";
import { AssesmentComponent } from "./container/assesment/assesment.component";
import { AnalystViewComponent } from "./container/analyst-view/analyst-view.component";
import { AdminDashboardComponent } from "./container/admin-dashboard/admin-dashboard.component";
import { ComparisionComponent } from "./container/comparision/comparision.component";
import { KpiLayersComponent } from "./container/kpi-layers/kpi-layers.component";
import { EvaluatoinResponseViewComponent } from "./container/evaluatoin-response-view/evaluatoin-response-view.component";

const routes: Routes = [
  {
    path: "",
    component: AdminComponent,
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      { path: "dashboard", component: AdminDashboardComponent },
      { path: "city", component: CityComponent },
      { path: "users", component: AnalystViewComponent },
      { path: "pillar", component: PillarComponent },
      { path: "question", component: QuestionComponent },
      { path: "assesment", component: AssesmentComponent },
      { path: "assesment/:roleID/:cityID", component: AssesmentComponent },
      {
        path: "assessment-result/:assessmentID/:userName",
        component: EvaluatoinResponseViewComponent,
      },
      { path: "viewUser/:roleID", component: AnalystViewComponent },
      { path: "evaluator-Comparision", component: ComparisionComponent },
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
        path: "invitations",
        loadComponent: () =>
          import("./container/invitations/invitations.component").then(
            (m) => m.InvitationsComponent
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
export class AdminRoutingModule {}
