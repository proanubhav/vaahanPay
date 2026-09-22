import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import {
  LoginComponent,
  LoginDialogData,
  LoginDialogResult,
} from '../auth/login/login.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  host: {
    '(window:scroll)': 'onScroll()',
    '[style.--header-height]': 'headerHeight() + "px"',
  },
})
export class HomeComponent {
  protected readonly currentYear = new Date().getFullYear();
  private readonly document = inject(DOCUMENT);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header =
    viewChild.required<ElementRef<HTMLElement>>('header');
  protected readonly headerHeight = signal(0);
  protected readonly isScrolled = signal(false);
  protected readonly loginNotice = signal('');
  protected readonly vehicleNumber = signal('');

  protected onVehicleNumberInput(event: Event): void {
    this.vehicleNumber.set((event.target as HTMLInputElement).value);
  }

  protected openChallan(event: Event): void {
    event.preventDefault();
    this.openLogin(undefined, 'vehicle');
  }

  protected openLogin(
    event?: Event,
    mode: 'login' | 'vehicle' = 'login',
  ): void {
    event?.preventDefault();
    if (this.dialog.getDialogById('vehicle-login')) return;
    let data: LoginDialogData = {
      mode,
      vehicleNumber: this.vehicleNumber().replace(/\s/g, '').toUpperCase(),
    };
    if (event) {
      const form = event.target as HTMLFormElement;
      if (!form.reportValidity()) return;
      const vehicleNumber = String(
        new FormData(form).get('vehicleNumber') ?? '',
      )
        .replace(/\s/g, '')
        .toUpperCase();
      if (!vehicleNumber) return;
      this.vehicleNumber.set(vehicleNumber);
      data = { mode: 'vehicle', vehicleNumber };
    }
    this.loginNotice.set('');
    this.dialog
      .open<LoginComponent, LoginDialogData, LoginDialogResult>(
        LoginComponent,
        {
          id: 'vehicle-login',
          width: '448px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
          panelClass: 'login-dialog',
          backdropClass: 'login-backdrop',
          ariaLabelledBy: 'login-title',
          ariaDescribedBy: 'login-description',
          autoFocus: data.mode === 'login' ? '#login-mobile' : '#login-name',
          restoreFocus: true,
          data,
        },
      )
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.verified) {
          this.vehicleNumber.set(result.vehicleNumber ?? '');
          this.loginNotice.set('Your mobile number has been verified.');
        }
      });
  }

  constructor() {
    afterNextRender(() => {
      const element = this.header().nativeElement;
      const updateHeight = () =>
        this.headerHeight.set(element.getBoundingClientRect().height);
      updateHeight();
      this.onScroll();

      const observer = new ResizeObserver(updateHeight);
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onScroll(): void {
    this.isScrolled.set((this.document.defaultView?.scrollY ?? 0) > 0);
  }
}
