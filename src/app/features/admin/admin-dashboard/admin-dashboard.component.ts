import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { AdminService } from "../admin.service";
import { AdminRequestsService } from "../admin-requests/admin-requests.service";
import { ChallanRequest } from "../admin-requests/admin-request.model";
import {
  actionReason,
  actionableRequests,
  dashboardAnalytics,
  periodStart,
} from "./dashboard-analytics";

@Component({
  selector: "app-admin-dashboard",
  standalone: false,
  templateUrl: "./admin-dashboard.component.html",
  styleUrl: "./admin-dashboard.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent {
  private readonly admin = inject(AdminService);
  readonly requestsApi = inject(AdminRequestsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly records = signal<ChallanRequest[]>([]);
  readonly users = signal(0);
  readonly days = signal(30);
  readonly updated = signal(new Date());
  readonly from = computed(() => periodStart(this.days(), this.updated()));
  readonly analytics = computed(() =>
    dashboardAnalytics(this.records(), this.from(), this.updated()),
  );
  readonly tasks = computed(() => actionableRequests(this.records()));
  readonly recentTasks = computed(() => this.tasks().slice(0, 6));
  readonly reason = actionReason;
  readonly periodLabel = computed(() =>
    this.days() ? `Last ${this.days()} days` : "All time",
  );
  constructor() {
    this.reload();
  }
  reload() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    forkJoin({
      requests: this.requestsApi.list(),
      users: this.admin.users("", 1, 1),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.records.set(result.requests);
          this.users.set(result.users.total);
          this.updated.set(new Date());
          this.busy.set(false);
        },
        error: () => {
          this.error.set("Unable to load dashboard data. Please try again.");
          this.busy.set(false);
        },
      });
  }
  openStatus(status: string) {
    void this.router.navigate(["/admin/challan-requests"], {
      queryParams: { status, from: this.from() || null },
    });
  }
  openPayment(paymentStatus: string) {
    void this.router.navigate(["/admin/challan-requests"], {
      queryParams: { paymentStatus, from: this.from() || null },
    });
  }
}
