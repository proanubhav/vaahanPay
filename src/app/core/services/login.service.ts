import { HttpClient } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { Observable, throwError } from 'rxjs';

export interface LoginDetails {
  name: string;
  mobile: string;
  vehicleNumber: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  requestId?: string;
}

export interface OtpVerification extends LoginDetails {
  otp: string;
  requestId?: string;
}

export interface LoginApiConfig {
  loginUrl: string;
  // Supply the verification adapter once the backend contract is available.
  verifyOtp?: (request: OtpVerification) => Observable<LoginResponse>;
}

export const LOGIN_API_CONFIG = new InjectionToken<LoginApiConfig>(
  'LOGIN_API_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({ loginUrl: '/login' }),
  },
);

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(LOGIN_API_CONFIG);
  readonly canVerifyOtp = !!this.config.verifyOtp;

  requestOtp(details: LoginDetails): Observable<LoginResponse> {
    // Provisional query keys: confirm these against the /login API contract.
    return this.http.get<LoginResponse>(this.config.loginUrl, {
      params: {
        name: details.name,
        mobile: details.mobile,
        vehicleNumber: details.vehicleNumber,
      },
    });
  }

  verifyOtp(request: OtpVerification): Observable<LoginResponse> {
    return (
      this.config.verifyOtp?.(request) ??
      throwError(
        () =>
          new Error(
            'Verification is currently unavailable. Please try again later.',
          ),
      )
    );
  }
}
