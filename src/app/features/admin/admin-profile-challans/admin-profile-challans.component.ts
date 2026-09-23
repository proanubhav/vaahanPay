import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from "@angular/core";
import {
  AdminChallan,
  AdminChallanStatus,
  challanSavings,
} from "../admin-challan.model";

@Component({
  selector: "app-admin-profile-challans",
  standalone: false,
  templateUrl: "./admin-profile-challans.component.html",
  styleUrl: "./admin-profile-challans.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileChallansComponent {
  readonly challans = input.required<AdminChallan[]>();
  readonly status = signal<AdminChallanStatus>("pending");
  readonly type = signal<"all" | "online" | "court">("all");
  readonly statuses: { value: AdminChallanStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In progress" },
    { value: "closed", label: "Closed" },
  ];
  readonly category = computed(() =>
    this.challans().filter((c) => c.status === this.status()),
  );
  readonly visible = computed(() =>
    this.category().filter(
      (c) => this.type() === "all" || c.type === this.type(),
    ),
  );
  readonly amount = computed(() =>
    this.visible().reduce((sum, c) => sum + c.amount, 0),
  );
  readonly savings = challanSavings;
  count(status: AdminChallanStatus) {
    return this.challans().filter((c) => c.status === status).length;
  }
  selectStatus(status: AdminChallanStatus) {
    this.status.set(status);
    this.type.set("all");
  }
  typeChanged(event: Event) {
    this.type.set(
      (event.target as HTMLSelectElement).value as "all" | "online" | "court",
    );
  }
}
