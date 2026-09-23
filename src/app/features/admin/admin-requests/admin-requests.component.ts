import { ActivatedRoute, Router } from "@angular/router";
import {
  actionableRequests,
  inPeriod,
} from "../admin-dashboard/dashboard-analytics";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { AdminChallanStatus } from "../admin-challan.model";
import { ChallanRequest } from "./admin-request.model";
import { AdminRequestsService } from "./admin-requests.service";

@Component({
  selector: "app-admin-requests",
  standalone: false,
  templateUrl: "./admin-requests.component.html",
  styleUrl: "./admin-requests.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRequestsComponent {
  readonly api = inject(AdminRequestsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly paymentFilter = signal("all");
  readonly from = signal("");
  readonly attention = signal(false);
  readonly records = signal<ChallanRequest[]>([]);
  readonly selected = signal<ChallanRequest | null>(null);
  readonly busy = signal(false);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly actionError = signal("");
  readonly message = signal("");
  readonly query = signal("");
  readonly filter = signal("all");
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly file = signal<File | null>(null);
  readonly fileError = signal("");
  readonly form = new FormGroup({
    status: new FormControl<AdminChallanStatus>("pending", {
      nonNullable: true,
    }),
    remark: new FormControl("", {
      nonNullable: true,
      validators: [Validators.maxLength(2000)],
    }),
  });
  readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    const records = this.attention()
      ? actionableRequests(this.records())
      : this.records();
    return records.filter(
      (item) =>
        (this.filter() === "all" ||
          item.status === this.filter() ||
          (this.filter() === "open" && item.status !== "closed")) &&
        (this.paymentFilter() === "all" ||
          item.paymentStatus === this.paymentFilter()) &&
        inPeriod(item, this.from()) &&
        [
          item.id,
          item.vehicleNumber,
          item.userName,
          item.mobile,
          item.paymentReference ?? "",
        ].some((value) => value.toLowerCase().includes(query)),
    );
  });
  readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.matches().length / this.pageSize)),
  );
  readonly visible = computed(() =>
    this.matches().slice(
      (this.page() - 1) * this.pageSize,
      this.page() * this.pageSize,
    ),
  );

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.filter.set(
          ["pending", "in-progress", "closed", "open"].includes(
            params.get("status") ?? "",
          )
            ? params.get("status")!
            : "all",
        );
        this.paymentFilter.set(
          ["paid", "pending", "failed"].includes(
            params.get("paymentStatus") ?? "",
          )
            ? params.get("paymentStatus")!
            : "all",
        );
        const from = params.get("from") ?? "";
        this.from.set(
          /^\d{4}-\d{2}-\d{2}$/.test(from) && Number.isFinite(Date.parse(from))
            ? from
            : "",
        );
        this.attention.set(params.get("attention") === "true");
        this.page.set(1);
        this.applyRequestLink();
      });
    this.reload();
  }
  reload() {
    if (this.busy() || this.selected()) return;
    this.busy.set(true);
    this.error.set("");
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.page.set(1);
          this.busy.set(false);
          this.applyRequestLink();
        },
        error: () => {
          this.error.set("Unable to load challan requests. Please try again.");
          this.busy.set(false);
        },
      });
  }
  private applyRequestLink() {
    const id = this.route.snapshot.queryParamMap.get("requestId");
    if (!id) return;
    const request = this.records().find((item) => item.id === id);
    if (request) this.open(request);
    else if (!this.busy())
      this.message.set("This challan request is no longer available.");
  }
  clearDashboardFilters() {
    this.from.set("");
    this.attention.set(false);
    this.paymentFilter.set("all");
    this.filter.set("all");
    this.page.set(1);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }
  open(record: ChallanRequest) {
    this.selected.set(record);
    this.form.reset({ status: record.status, remark: "" });
    this.file.set(null);
    this.fileError.set("");
    this.actionError.set("");
    this.message.set("");
  }
  close() {
    if (!this.saving()) {
      this.selected.set(null);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { requestId: null },
        queryParamsHandling: "merge",
      });
    }
  }
  chooseFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.file.set(null);
    this.fileError.set("");
    this.message.set("");
    if (!file) return;
    if (
      !["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5 * 1024 * 1024 ||
      !file.size
    ) {
      this.fileError.set("Choose a non-empty PDF, JPG or PNG file up to 5 MB.");
      input.value = "";
      return;
    }
    this.file.set(file);
  }
  save(receiptInput: HTMLInputElement) {
    const record = this.selected();
    if (!record || this.saving() || this.form.invalid || this.fileError())
      return;
    const update = this.form.getRawValue();
    if (
      update.status === record.status &&
      !update.remark.trim() &&
      !this.file()
    ) {
      this.actionError.set(
        "Change the status, add a remark or choose a receipt first.",
      );
      return;
    }
    this.saving.set(true);
    this.form.disable();
    this.actionError.set("");
    this.message.set("");
    this.api
      .update(record.id, update, this.file())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.records.update((records) =>
            records.map((item) => (item.id === saved.id ? saved : item)),
          );
          this.selected.set(saved);
          this.form.reset({ status: saved.status, remark: "" });
          this.form.enable();
          this.file.set(null);
          receiptInput.value = "";
          this.page.set(Math.min(this.page(), this.pages()));
          this.saving.set(false);
          this.message.set("Challan request updated.");
        },
        error: (error: HttpErrorResponse) => {
          this.form.enable();
          this.saving.set(false);
          this.actionError.set(
            error.status === 401 || error.status === 403
              ? "Your session expired or you do not have permission. Please sign in again."
              : "Unable to save changes. Your inputs are preserved; please try again.",
          );
        },
      });
  }
  receiptUrl(url: string) {
    return /^(https?:\/\/|blob:|\/(?!\/))/.test(url) ? url : null;
  }
}
