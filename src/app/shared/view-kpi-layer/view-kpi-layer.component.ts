import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { GetAnalyticalLayerResultDto } from 'src/app/core/models/GetAnalyticalLayerResultDto';
import { environment } from 'src/environments/environment';
import {
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill,
  ChartComponent,
  ApexStroke
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-view-kpi-layer',
  templateUrl: './view-kpi-layer.component.html',
  styleUrl: './view-kpi-layer.component.css'
})
export class ViewKpiLayerComponent implements OnInit, OnChanges {

  @Input() selectedLayer?: GetAnalyticalLayerResultDto | null = null;
  urlBase = environment.apiUrl;

  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions!: Partial<ChartOptions>;


  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void {
    this.ApexGetPieOptions();
  }
  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/images/Frame 1321315029.png';
  }

  getConditionByid() {
    let condition = this.selectedLayer?.fiveLevelInterpretations?.find(x => x.interpretationID == this.selectedLayer?.interpretationID)?.condition ?? 'NA';
    //condition = condition.split(' ')[0];
    return condition;
  }

  get interpretaions() {
    return this.selectedLayer?.fiveLevelInterpretations;
  }



  ApexGetPieOptions() {
    const score = this.selectedLayer?.calValue ?? 0

    this.chartOptions = {
      series: [score],
      chart: {
        height: 360,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            size: "55%"
          },
          track: {
            background: "#f2f2f2",
            strokeWidth: "100%"
          },
          dataLabels: {
            show: true,
            name: {
              fontSize: "14px",
              color: "#666"
            },
            value: {
              fontSize: "22px",
              fontWeight: 600,
              color: "#111",
              formatter: (val: number) => `${val}%`
            },
            total: {
              show: true,
              label: "Score Progress",
              formatter: () => `${score.toFixed(2)}%`
            }
          }
        }
      },
      fill: {
        type: "solid",
        colors: ["#204f95"] // Manual, AI
      },
      stroke: {
        lineCap: "round"
      },
      labels: ["Score Progress"]
    };
  }
}
