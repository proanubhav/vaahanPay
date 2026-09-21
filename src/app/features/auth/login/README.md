# Login popup integration

Both homepage vehicle forms open `LoginComponent` using Angular Material Dialog.
The registration number is passed through `LoginDialogData`. Dialog focus trapping,
Escape/backdrop dismissal, scroll locking, and focus restoration are managed by Material.

## Login request — contract pending confirmation

The supplied endpoint is `GET /login`. `LoginService.requestOtp` currently uses these
**provisional** query keys:

```text
GET /login?name=Test%20Driver&mobile=9876543210&vehicleNumber=DL01AB1234
```

It expects a JSON response with `success: true` and an optional string `requestId`.
Only an explicit successful response advances to OTP entry. An HTTP error,
`success: false`, or an unexpected response keeps the details form open.

Confirm the query names, phone number format, response shape, and API base URL with
the backend. The default URL is same-origin; the Angular development server alone
does not provide this endpoint. Supply a backend/proxy or configure `loginUrl` through
`LOGIN_API_CONFIG`. No personal information or tokens are stored in browser storage.

## OTP verification — backend endpoint not supplied

Verification is deliberately disabled until `LOGIN_API_CONFIG.verifyOtp` is supplied.
This adapter receives `{ name, mobile, vehicleNumber, otp, requestId? }` and returns
an `Observable<LoginResponse>`. Implement it using the backend's confirmed method,
URL, fields, and response mapping. Do not map an unverified response to `success: true`.
Session handling must follow the backend's authentication contract.

The popup closes with `{ verified: true, vehicleNumber }` only after that adapter
confirms success. The homepage currently shows a verification confirmation; challan
retrieval is a separate integration. Resending uses the same GET login request, with
a 30-second client cooldown. Backend rate limiting remains authoritative.

The four-digit code follows the supplied design. If the backend uses a different
OTP length or resend interval, update the UI and validation to match.

## Policy links

Pass real `termsUrl` and `privacyUrl` values in `LoginDialogData` to show linked terms.
They are omitted when unavailable rather than linking to nonexistent pages.

## Validation

```sh
npm test -- --watch=false --include='src/app/features/auth/login/login.component.spec.ts'
```

Tests use mocked HTTP responses and a verification adapter; they do not send OTPs.
