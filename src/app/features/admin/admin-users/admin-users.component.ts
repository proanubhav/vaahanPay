import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl } from "@angular/forms";
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { summarizeChallans } from "../admin-challan.model";
import { AdminService, UserPage } from "../admin.service";

@Component({
  selector: "app-admin-users",
  standalone: false,
  templateUrl: "./admin-users.component.html",
  styleUrl: "./admin-users.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent {
  private readonly api = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();
  private query = "";
  readonly search = new FormControl("", { nonNullable: true });
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly busy = signal(true);
  readonly error = signal("");
  readonly result = signal<UserPage>({ users: [], total: 0 });
  readonly Math = Math;
  readonly summary = summarizeChallans;

  constructor() {
    this.search.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.query = value.trim();
        this.page.set(1);
        this.reload();
      });
    this.refresh
      .pipe(
        startWith(undefined),
        tap(() => {
          this.busy.set(true);
          this.error.set("");
        }),
        switchMap(() =>
          this.api.users(this.query, this.page(), this.pageSize).pipe(
            catchError(() => {
              this.error.set(
                "Unable to load registered users. Please try again.",
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.result.set(result ?? { users: [], total: 0 });
        this.busy.set(false);
      });
  }
  reload() {
    this.refresh.next();
  }
  changePage(step: number) {
    const next = this.page() + step;
    if (
      this.busy() ||
      next < 1 ||
      next > Math.ceil(this.result().total / this.pageSize)
    )
      return;
    this.page.set(next);
    this.reload();
  }
}
