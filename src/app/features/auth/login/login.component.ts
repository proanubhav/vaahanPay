import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize, Subscription, timer } from 'rxjs';
import {
  LoginDetails,
  LoginService,
} from '../../../core/services/login.service';

export interface LoginDialogData {
  vehicleNumber: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export interface LoginDialogResult {
  verified: true;
  vehicleNumber: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  protected readonly data = inject<LoginDialogData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(
    MatDialogRef<LoginComponent, LoginDialogResult>,
  );
  private readonly login = inject(LoginService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly otpInputs =
    viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  private cooldown?: Subscription;
  private details?: LoginDetails;
  private requestId?: string;

  protected readonly step = signal<'details' | 'otp'>('details');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly remaining = signal(0);
  protected readonly digits = signal(['', '', '', '']);
  protected readonly mobile = signal('');
  protected readonly canVerify = this.login.canVerifyOtp;
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    }),
    mobile: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)],
    }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.cooldown?.unsubscribe());
  }

  protected close(): void {
    this.dialog.close();
  }

  protected sendOtp(): void {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    this.requestOtp({
      name: value.name.trim(),
      mobile: value.mobile,
      vehicleNumber: this.data.vehicleNumber,
    });
  }

  protected resend(): void {
    if (this.busy() || this.remaining() > 0 || !this.details) return;
    this.requestOtp(this.details);
  }

  protected editDetails(): void {
    if (this.busy()) return;
    this.cooldown?.unsubscribe();
    this.step.set('details');
    this.error.set('');
    this.digits.set(['', '', '', '']);
    this.requestId = undefined;
    setTimeout(() => {
      if (!this.destroyRef.destroyed)
        this.element.nativeElement
          .querySelector<HTMLInputElement>('#login-name')
          ?.focus();
    });
  }

  private requestOtp(details: LoginDetails): void {
    this.busy.set(true);
    this.error.set('');
    this.login
      .requestOtp(details)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (response?.success !== true) {
            this.error.set(
              'We couldn’t send the code. Please check your details and try again.',
            );
            return;
          }
          this.details = details;
          this.requestId = response.requestId;
          this.mobile.set(details.mobile);
          this.digits.set(['', '', '', '']);
          this.step.set('otp');
          this.startCooldown();
          // The OTP fields become available on the next render.
          setTimeout(() => {
            if (!this.destroyRef.destroyed) this.focusDigit(0);
          });
        },
        error: () =>
          this.error.set(
            'We couldn’t send the code. Please try again in a moment.',
          ),
      });
  }

  private startCooldown(): void {
    this.cooldown?.unsubscribe();
    const expiresAt = Date.now() + 30_000;
    this.remaining.set(30);
    this.cooldown = timer(1000, 1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.remaining.set(
          Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)),
        );
        if (this.remaining() === 0) this.cooldown?.unsubscribe();
      });
  }

  protected onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fillDigits(index, input.value);
    input.value = this.digits()[index];
  }

  protected onPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    this.fillDigits(index, event.clipboardData?.getData('text') ?? '');
  }

  private fillDigits(index: number, value: string): void {
    if (this.busy()) return;
    const text = value.replace(/\D/g, '');
    const start = text.length >= 4 ? 0 : index;
    const next = [...this.digits()];
    if (!text) next[index] = '';
    for (let offset = 0; offset < Math.min(text.length, 4 - start); offset++) {
      next[start + offset] = text[offset];
    }
    this.digits.set(next);
    this.error.set('');
    if (text) this.focusDigit(Math.min(start + text.length, 3));
  }

  protected onDigitKey(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      event.preventDefault();
      const next = [...this.digits()];
      next[index - 1] = '';
      this.digits.set(next);
      this.focusDigit(index - 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.focusDigit(
        Math.max(0, Math.min(3, index + (event.key === 'ArrowLeft' ? -1 : 1))),
      );
    }
  }

  private focusDigit(index: number): void {
    const input = this.otpInputs()[index]?.nativeElement;
    input?.focus();
    input?.select();
  }

  protected verify(): void {
    if (this.busy() || !this.details || !this.canVerify) return;
    const otp = this.digits().join('');
    if (!/^\d{4}$/.test(otp)) {
      this.error.set('Enter the complete 4-digit code.');
      this.focusDigit(this.digits().findIndex((digit) => !digit));
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.login
      .verifyOtp({ ...this.details, otp, requestId: this.requestId })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (response?.success !== true) {
            this.error.set(
              'The code could not be verified. Check it or request a new one.',
            );
            return;
          }
          this.dialog.close({
            verified: true,
            vehicleNumber: this.data.vehicleNumber,
          });
        },
        error: () =>
          this.error.set('The code could not be verified. Please try again.'),
      });
  }
}
