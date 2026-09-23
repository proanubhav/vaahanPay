import { HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import {
  Subject,
  catchError,
  combineLatest,
  of,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import { summarizeChallans } from "../admin-challan.model";
import { AdminService, RegisteredUser } from "../admin.service";

@Component({
  selector: "app-admin-profile",
  standalone: false,
  templateUrl: "./admin-profile.component.html",
  styleUrl: "./admin-profile.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileComponent {
  private readonly api = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();
  readonly summary = summarizeChallans;
  readonly user = signal<RegisteredUser | null>(null);
  readonly busy = signal(true);
  readonly error = signal("");
  constructor() {
    combineLatest([
      this.route.paramMap,
      this.refresh.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(() => {
          this.busy.set(true);
          this.error.set("");
          this.user.set(null);
        }),
        switchMap(([params]) =>
          this.api.user(params.get("id") ?? "").pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(
                error.status === 404
                  ? "This user could not be found."
                  : "Unable to load this profile. Please try again.",
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => {
        this.user.set(user);
        this.busy.set(false);
      });
  }
  reload() {
    this.refresh.next();
  }
}
