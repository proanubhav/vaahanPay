import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { LoginComponent } from '../auth/login/login.component';
import { HomeComponent } from './home.component';

describe('HomeComponent challan entry points', () => {
  let fixture: ComponentFixture<HomeComponent>;
  const open = vi.fn();

  beforeEach(async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    open.mockReset().mockReturnValue({ afterClosed: () => of(undefined) });
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: MatDialog,
          useValue: {
            open,
            getDialogById: () => undefined,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.unstubAllGlobals();
  });

  function enter(selector: string, value: string) {
    const input = fixture.nativeElement.querySelector(
      selector,
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function footerLink(): HTMLAnchorElement {
    return fixture.nativeElement.querySelector(
      '.home-footer a[href="#check-challan"]',
    );
  }

  it('opens the challan popup with an empty vehicle field from the footer link', () => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    footerLink().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(open).toHaveBeenCalledWith(
      LoginComponent,
      expect.objectContaining({
        data: { mode: 'vehicle', vehicleNumber: '' },
      }),
    );
  });

  it.each(['#vehicle-number', '#footer-vehicle-number'])(
    'prefills the footer popup with the number entered in %s',
    (selector) => {
      enter(selector, 'hr 29 bb 4896');
      footerLink().click();
      expect(open).toHaveBeenCalledWith(
        LoginComponent,
        expect.objectContaining({
          data: { mode: 'vehicle', vehicleNumber: 'HR29BB4896' },
        }),
      );
    },
  );

  it.each(['#vehicle-number', '#footer-vehicle-number'])(
    'keeps the existing form submission working for %s',
    (selector) => {
      enter(selector, 'DL01AB1234');
      fixture.nativeElement
        .querySelector(selector)
        .closest('form')
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        );
      expect(open).toHaveBeenCalledWith(
        LoginComponent,
        expect.objectContaining({
          data: { mode: 'vehicle', vehicleNumber: 'DL01AB1234' },
        }),
      );
    },
  );
});
