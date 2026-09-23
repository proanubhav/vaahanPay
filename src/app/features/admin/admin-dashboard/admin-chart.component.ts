import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";
import {
  arc,
  area,
  line,
  max,
  pie,
  scaleBand,
  scaleLinear,
  scalePoint,
} from "d3";
import type { PieArcDatum } from "d3";
import { ChartDatum } from "./dashboard-analytics";

@Component({
  selector: "app-admin-chart",
  standalone: false,
  templateUrl: "./admin-chart.component.html",
  styleUrl: "./admin-chart.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChartComponent {
  readonly data = input.required<ChartDatum[]>();
  readonly kind = input<"line" | "donut" | "bar">("line");
  readonly label = input.required<string>();
  readonly choose = output<string>();
  readonly total = computed(() =>
    this.data().reduce((sum, item) => sum + item.value, 0),
  );
  readonly slices = computed(() => {
    const shape = arc<PieArcDatum<ChartDatum>>()
      .innerRadius(66)
      .outerRadius(92)
      .cornerRadius(4);
    return pie<ChartDatum>()
      .sort(null)
      .value((item) => item.value)(this.data())
      .map((item) => ({ ...item.data, path: shape(item) ?? "" }));
  });
  readonly plot = computed(() => {
    const data = this.data();
    const y = scaleLinear()
      .domain([0, Math.max(1, max(data, (item) => item.value) ?? 0)])
      .nice(4)
      .range([190, 20]);
    const x = scalePoint<string>()
      .domain(data.map((item) => item.key))
      .range([46, 570]);
    const band = scaleBand<string>()
      .domain(data.map((item) => item.key))
      .range([46, 570])
      .padding(0.55);
    const points = data.map((item) => ({
      ...item,
      x: x(item.key) ?? 46,
      y: y(item.value),
      barX: band(item.key) ?? 46,
      width: band.bandwidth(),
      height: 190 - y(item.value),
    }));
    return {
      points,
      ticks: y
        .ticks(4)
        .filter(Number.isInteger)
        .map((value) => ({ value, y: y(value) })),
      line:
        line<(typeof points)[number]>()
          .x((item) => item.x)
          .y((item) => item.y)(points) ?? "",
      area:
        area<(typeof points)[number]>()
          .x((item) => item.x)
          .y0(190)
          .y1((item) => item.y)(points) ?? "",
      labels: points.filter(
        (_, index) =>
          index === 0 ||
          index === points.length - 1 ||
          index % Math.max(1, Math.ceil(points.length / 5)) === 0,
      ),
    };
  });
}
