import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AdminService } from "../admin.service";

@Component({
  selector: "app-admin-shell",
  standalone: false,
  styleUrl: "./admin-shell.component.scss",
  templateUrl: "./admin-shell.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent {
  readonly api = inject(AdminService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal("");
  logout() {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.api
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(["/admin/login"]),
        error: () => this.error.set("Could not sign out. Please try again."),
      });
  }
}
