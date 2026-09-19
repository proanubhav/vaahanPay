import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';

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
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly header = viewChild.required<ElementRef<HTMLElement>>('header');
  protected readonly headerHeight = signal(0);
  protected readonly isScrolled = signal(false);

  constructor() {
    afterNextRender(() => {
      const element = this.header().nativeElement;
      const updateHeight = () => this.headerHeight.set(element.getBoundingClientRect().height);
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
