import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { LOGIN_API_CONFIG } from '../../../core/services/login.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;
  const close = vi.fn();
  const verifyOtp = vi.fn();

  beforeEach(async () => {
    vi.useFakeTimers();
    close.mockReset();
    verifyOtp.mockReset();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: { vehicleNumber: 'DL01AB1234' } },
        { provide: MatDialogRef, useValue: { close } },
        {
          provide: LOGIN_API_CONFIG,
          useValue: { loginUrl: '/login', verifyOtp },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();
    vi.useRealTimers();
  });

  function render() {
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  }

  function input(selector: string, value: string) {
    const element = fixture.nativeElement.querySelector(
      selector,
    ) as HTMLInputElement;
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function submit() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  function requestCode() {
    input('#login-name', 'Test Driver');
    input('#login-mobile', '9876543210');
    submit();
    return http.expectOne((request) => request.url === '/login');
  }

  function showOtp() {
    requestCode().flush({ success: true, requestId: 'challenge-1' });
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
  }

  function pasteCode(code: string) {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: () => code },
    });
    fixture.nativeElement.querySelector('.otp-input').dispatchEvent(event);
    fixture.detectChanges();
  }

  it('validates details without issuing a login request', () => {
    render();
    input('#login-name', '   ');
    input('#login-mobile', '123');
    submit();
    http.expectNone((request) => request.url === '/login');
    expect(fixture.nativeElement.textContent).toContain(
      'Enter a valid 10-digit mobile number.',
    );
    expect(
      fixture.nativeElement
        .querySelector('#login-name')
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('prefills the vehicle input and uses edits throughout the OTP flow', () => {
    render();
    expect(
      fixture.nativeElement.querySelector('#login-vehicle-number').value,
    ).toBe('DL01AB1234');
    input('#login-vehicle-number', 'hr 29-bb 4896');
    const request = requestCode();
    expect(request.request.params.get('vehicleNumber')).toBe('HR29BB4896');
    request.flush({ success: true, requestId: 'edited-vehicle' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.vehicle-badge').textContent,
    ).toContain('HR29BB4896');
    pasteCode('1234');
    verifyOtp.mockReturnValueOnce(of({ success: true }));
    submit();
    expect(verifyOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleNumber: 'HR29BB4896',
      }),
    );
    expect(close).toHaveBeenCalledWith({
      verified: true,
      vehicleNumber: 'HR29BB4896',
    });
  });

  it('starts blank without a supplied number and requires it for challan checks', () => {
    Object.assign(TestBed.inject(MAT_DIALOG_DATA), {
      mode: 'vehicle',
      vehicleNumber: undefined,
    });
    render();
    expect(
      fixture.nativeElement.querySelector('#login-vehicle-number').value,
    ).toBe('');
    input('#login-name', 'Test Driver');
    input('#login-mobile', '9876543210');
    input('#login-vehicle-number', '   ');
    submit();
    http.expectNone((request) => request.url === '/login');
    expect(
      fixture.nativeElement.querySelector('#vehicle-number-error').textContent,
    ).toContain('Enter a valid vehicle number');
    input('#login-vehicle-number', 'DL01AB1234');
    submit();
    const request = http.expectOne((request) => request.url === '/login');
    expect(request.request.params.get('vehicleNumber')).toBe('DL01AB1234');
    request.flush({ success: true });
  });

  it('sends GET /login and only advances after a successful response', () => {
    render();
    const request = requestCode();
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('name')).toBe('Test Driver');
    expect(request.request.params.get('mobile')).toBe('9876543210');
    expect(request.request.params.get('vehicleNumber')).toBe('DL01AB1234');
    expect(
      fixture.nativeElement.querySelector('.primary-button').disabled,
    ).toBe(true);
    submit();
    http.expectNone((request) => request.url === '/login');
    request.flush({ success: true, requestId: 'challenge-1' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('#login-title').textContent,
    ).toContain('Verify OTP');
    expect(close).not.toHaveBeenCalled();
  });

  it('keeps the details form available after an HTTP error', () => {
    render();
    requestCode().flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#login-name')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('couldn’t send');
    expect(
      fixture.nativeElement.querySelector('.primary-button').disabled,
    ).toBe(false);
  });

  it('does not treat an unexpected response as a successful OTP request', () => {
    render();
    requestCode().flush({ status: 'ok' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#login-name')).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
  });

  it('supports OTP paste and waits for the verification adapter to confirm success', () => {
    render();
    showOtp();
    pasteCode('1234');
    expect(
      [...fixture.nativeElement.querySelectorAll('.otp-input')].map(
        (el: any) => el.value,
      ),
    ).toEqual(['1', '2', '3', '4']);
    verifyOtp.mockReturnValueOnce(of({ success: false }));
    submit();
    expect(close).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'could not be verified',
    );
    verifyOtp.mockReturnValueOnce(of({ success: true }));
    submit();
    expect(verifyOtp).toHaveBeenLastCalledWith({
      name: 'Test Driver',
      mobile: '9876543210',
      vehicleNumber: 'DL01AB1234',
      otp: '1234',
      requestId: 'challenge-1',
    });
    expect(close).toHaveBeenCalledWith({
      verified: true,
      vehicleNumber: 'DL01AB1234',
    });
  });

  it('enforces the resend cooldown and starts a new challenge', () => {
    render();
    showOtp();
    expect(fixture.nativeElement.textContent).toContain('Resend in 30s');
    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.resend-copy button').click();
    http
      .expectOne((request) => request.url === '/login')
      .flush({ success: true, requestId: 'challenge-2' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resend in 30s');
  });

  it('shows an unavailable state when verification has not been configured', () => {
    TestBed.inject(LOGIN_API_CONFIG).verifyOtp = undefined;
    render();
    showOtp();
    expect(fixture.nativeElement.textContent).toContain(
      'Verification is currently unavailable',
    );
    expect(
      fixture.nativeElement.querySelector('.primary-button').disabled,
    ).toBe(true);
  });

  it('cancels an in-flight request when the dialog is destroyed', () => {
    render();
    const request = requestCode();
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });

  it('uses only the mobile number for the standalone login flow', () => {
    Object.assign(TestBed.inject(MAT_DIALOG_DATA), {
      mode: 'login',
      vehicleNumber: undefined,
    });
    render();
    expect(fixture.nativeElement.querySelector('#login-name')).toBeNull();
    expect(fixture.nativeElement.querySelector('.vehicle-badge')).toBeNull();
    input('#login-mobile', '9876543210');
    submit();
    const request = http.expectOne((request) => request.url === '/login');
    expect(request.request.params.keys()).toEqual(['mobile']);
    request.flush({ success: true, requestId: 'login-challenge' });
    fixture.detectChanges();
    pasteCode('1234');
    verifyOtp.mockReturnValueOnce(of({ success: true }));
    submit();
    expect(verifyOtp).toHaveBeenCalledWith({
      mobile: '9876543210',
      otp: '1234',
      requestId: 'login-challenge',
    });
    expect(close).toHaveBeenCalledWith({ verified: true });
  });

  it('keeps the name field hidden when changing a standalone login number', () => {
    Object.assign(TestBed.inject(MAT_DIALOG_DATA), {
      mode: 'login',
      vehicleNumber: undefined,
    });
    render();
    input('#login-mobile', '123');
    submit();
    http.expectNone((request) => request.url === '/login');
    input('#login-mobile', '9876543210');
    submit();
    http
      .expectOne((request) => request.url === '/login')
      .flush({ success: true });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.primary-button').textContent,
    ).toContain('Verify & log in');
    fixture.nativeElement.querySelector('.edit-number').click();
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    expect(fixture.nativeElement.querySelector('#login-name')).toBeNull();
    expect(fixture.nativeElement.querySelector('#login-mobile').value).toBe(
      '9876543210',
    );
  });
});
