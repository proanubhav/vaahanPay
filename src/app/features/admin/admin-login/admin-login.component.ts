import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { finalize } from "rxjs";
import { AdminService } from "../admin.service";

@Component({
  selector: "app-admin-login",
  standalone: false,
  templateUrl: "./admin-login.component.html",
  styleUrl: "./admin-login.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLoginComponent {
  private readonly api = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly showPassword = signal(false);
  readonly form = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submit() {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set("");
    const { email, password } = this.form.getRawValue();
    this.api
      .login(email.trim(), password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: () => {
          const url = this.route.snapshot.queryParamMap.get("returnUrl");
          void this.router.navigateByUrl(
            url && /^\/admin\/users(?:\/[^?#]*)?(?:[?#].*)?$/.test(url)
              ? url
              : "/admin/users",
          );
        },
        error: () =>
          this.error.set(
            "Unable to sign in. Check your admin credentials and try again.",
          ),
      });
  }
}
