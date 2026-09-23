# Admin panel

Lazy-loaded `AdminModule`, independent of the customer login and user panel.

- `/admin/login`: administrator email/password login.
- `/admin` or `/admin/users`: searchable, server-paginated registered-user directory.
- `/admin/users/:id`: personal details and linked vehicles.

## Component structure

Each view has its own TypeScript, HTML, and SCSS files in `admin-login/`, `admin-users/`, `admin-profile/`, and `admin-shell/`. Shared visual rules live in `styles/_common.scss`. `admin-routing.module.ts` defines the separate login, users, and profile routes; `admin.module.ts` declares the components.

The route guards are currently commented out, preserving the local development configuration. Enable `canActivate` and `canActivateChild` in `admin-routing.module.ts` when connecting administrator authentication.

## Temporary dummy data

Dummy user data is enabled by default through `ADMIN_USE_DEMO_DATA` in `admin.service.ts`. The 12 fictional records in `admin-demo-data.ts` populate both the directory and profiles. Search, pagination, status badges, and linked vehicles work without a backend. Open `/admin/users` and select **View profile**, or visit `/admin/users/1` directly.

To switch to the API, set the token factory to `false`, or add `{ provide: ADMIN_USE_DEMO_DATA, useValue: false }` to `app.config.ts` providers (import the token from `./features/admin/admin.service`). No component changes are needed. Login/session/logout still use the backend; the demo switch applies only to user reads.

## Backend integration

This repository has no backend. When dummy data is disabled, these screens require the following proposed API contract. No demo login credentials are provided. The default base URL is `/api/admin`. Override `ADMIN_API_URL` in `app.config.ts` to change it. Configure deployment routing to send `/api/*` to the backend and Angular routes to the app.

All requests use credentials. The backend must create an HttpOnly, Secure, SameSite session cookie on successful login, enforce the admin role on **every** admin endpoint, protect mutations against CSRF, rate-limit login attempts, and invalidate the session on logout. Angular's route guard is only a navigation convenience, not a security boundary. Use same-origin hosting with Angular's XSRF cookie/header convention (`XSRF-TOKEN` / `X-XSRF-TOKEN`), or configure the equivalent for your deployment.

| Method | Endpoint                            | Request / response                                                                                                                                                  |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/login`                            | Body `{ email, password }`; returns `{ admin: { id, name, email, role: "admin" } }` and sets the session cookie.                                                    |
| GET    | `/session`                          | Returns the same admin identity envelope for a valid admin session.                                                                                                 |
| POST   | `/logout`                           | Invalidates the session, clears its cookie, returns 204.                                                                                                            |
| GET    | `/users?search=&page=1&pageSize=10` | Returns `{ users: RegisteredUser[], total: number }`. Search across name, mobile, and email. `total` is the matching count; page is one-based. Use stable ordering. |
| GET    | `/users/:id`                        | Returns one `RegisteredUser`; 404 if absent.                                                                                                                        |

Return 401 for unauthenticated requests and 403 for non-admin accounts. User data requests redirect to login on these responses. In API mode, failed requests show retry states and never fall back to dummy records.

`RegisteredUser` is defined in `admin.service.ts`. Required fields: `id`, `name`, `mobile`, `registeredAt` (ISO timestamp), and `status` (`active` or `inactive`). Optional: `email`, `address`, and `vehicles` (`{ number, make?, model? }[]`). Return only profile fields intended for administrator display, never passwords or authentication secrets.

## Challan and wallet data

`RegisteredUser` now accepts `walletAmount` (INR), `challans` (`AdminChallan[]`), and an optional `challanSummary` for directory responses. Types live in `admin-challan.model.ts`. Summaries contain `total`, `pending`, `inProgress`, `closed`, and `moneySaved`. When a summary is absent, counts and savings are derived from the user's complete challan records. The profile endpoint should return the full challan array across all linked vehicles. Amounts are rupees, not paise.

Savings include only closed challans with a known `paidAmount`: `max(0, amount - paidAmount)`. `paidAmount` represents the final total charged, including any fees. Pending and in-progress challans do not contribute savings. Demo records use this same calculation, so directory counts and profile details match. The profile's Pending / In progress / Closed filters and Online / Court filter are read-only views.
