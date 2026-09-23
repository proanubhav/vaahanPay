import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, InjectionToken, signal } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, map, of, tap, throwError } from "rxjs";

import type { AdminChallan, AdminChallanSummary } from "./admin-challan.model";
import { ADMIN_DEMO_USERS } from "./admin-demo-data";

// Set to false (or override this token) when the user APIs are ready.
export const ADMIN_USE_DEMO_DATA = new InjectionToken<boolean>(
  "ADMIN_USE_DEMO_DATA",
  {
    providedIn: "root",
    factory: () => true,
  },
);

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: "admin";
}
export interface RegisteredUser {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  registeredAt: string;
  status: "active" | "inactive";
  address?: string;
  walletAmount?: number;
  challans?: AdminChallan[];
  challanSummary?: AdminChallanSummary;
  vehicles?: { number: string; make?: string; model?: string }[];
}
export interface UserPage {
  users: RegisteredUser[];
  total: number;
}
export const ADMIN_API_URL = new InjectionToken<string>("ADMIN_API_URL", {
  providedIn: "root",
  factory: () => "/api/admin",
});

@Injectable({ providedIn: "root" })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(ADMIN_API_URL);
  private readonly useDemoData = inject(ADMIN_USE_DEMO_DATA);
  private readonly router = inject(Router);
  private readonly identity = signal<AdminIdentity | null>(null);
  readonly admin = this.identity.asReadonly();

  login(email: string, password: string) {
    return this.http
      .post<{ admin: AdminIdentity }>(
        `${this.base}/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(map((response) => this.acceptIdentity(response)));
  }

  session() {
    return this.http
      .get<{ admin: AdminIdentity }>(`${this.base}/session`, {
        withCredentials: true,
      })
      .pipe(map((response) => this.acceptIdentity(response)));
  }

  logout() {
    return this.http
      .post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.identity.set(null)));
  }

  users(search: string, page: number, pageSize: number) {
    if (this.useDemoData) {
      const query = search.trim().toLowerCase();
      const matches = ADMIN_DEMO_USERS.filter((user) =>
        [user.name, user.mobile, user.email ?? ""].some((value) =>
          value.toLowerCase().includes(query),
        ),
      );
      const start = (page - 1) * pageSize;
      return of<UserPage>({
        users: structuredClone(matches.slice(start, start + pageSize)),
        total: matches.length,
      });
    }
    return this.http
      .get<UserPage>(`${this.base}/users`, {
        withCredentials: true,
        params: { search, page, pageSize },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  user(id: string) {
    if (this.useDemoData) {
      const user = ADMIN_DEMO_USERS.find((record) => record.id === id);
      return user
        ? of(structuredClone(user))
        : throwError(
            () =>
              new HttpErrorResponse({
                status: 404,
                statusText: "User not found",
              }),
          );
    }
    return this.http
      .get<RegisteredUser>(`${this.base}/users/${encodeURIComponent(id)}`, {
        withCredentials: true,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private acceptIdentity(response: { admin: AdminIdentity }): AdminIdentity {
    if (response?.admin?.role !== "admin") {
      this.identity.set(null);
      throw new Error("Administrator access is required.");
    }
    this.identity.set(response.admin);
    return response.admin;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401 || error.status === 403) {
      this.identity.set(null);
      void this.router.navigate(["/admin/login"]);
    }
    return throwError(() => error);
  }
}
