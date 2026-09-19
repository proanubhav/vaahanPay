import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

const MOBILE_BREAKPOINTS = [Breakpoints.Handset, Breakpoints.Tablet];

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly isHandset = toSignal(
    this.breakpointObserver.observe(MOBILE_BREAKPOINTS).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(MOBILE_BREAKPOINTS) },
  );

  readonly isMobile = computed(() => this.isHandset());
  readonly sidenavOpened = signal(!this.isMobile());

  toggleSidenav(): void {
    this.sidenavOpened.update((opened) => !opened);
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile()) {
      this.sidenavOpened.set(false);
    }
  }
}
