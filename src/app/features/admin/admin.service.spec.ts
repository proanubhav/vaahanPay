import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router, UrlTree } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ADMIN_USE_DEMO_DATA, AdminService } from "./admin.service";
import { adminGuard } from "./admin.guard";
import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";

const admin = {
  id: "1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
};

describe("Admin access and user API", () => {
  let service: AdminService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ADMIN_USE_DEMO_DATA, useValue: false },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it("sends credentials by POST and accepts only an admin identity", () => {
    let rejected = false;
    service
      .login("user@example.com", "secret")
      .subscribe({ error: () => (rejected = true) });
    const request = http.expectOne("/api/admin/login");
    expect(request.request.method).toBe("POST");
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual({
      email: "user@example.com",
      password: "secret",
    });
    request.flush({ admin: { ...admin, role: "user" } });
    expect(rejected).toBe(true);
    expect(service.admin()).toBeNull();
  });

  it("checks the server session before allowing protected navigation", async () => {
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/admin/users/42" } as RouterStateSnapshot,
      ),
    );
    const outcome = firstValueFrom(
      result as import("rxjs").Observable<boolean | UrlTree>,
    );
    http
      .expectOne("/api/admin/session")
      .flush({}, { status: 401, statusText: "Unauthorized" });
    const redirect = await outcome;
    expect(TestBed.inject(Router).serializeUrl(redirect as UrlTree)).toBe(
      "/admin/login?returnUrl=%2Fadmin%2Fusers%2F42",
    );
  });

  it("allows a verified administrator", async () => {
    const result = TestBed.runInInjectionContext(() =>
      adminGuard(
        {} as ActivatedRouteSnapshot,
        { url: "/admin/users" } as RouterStateSnapshot,
      ),
    );
    const outcome = firstValueFrom(
      result as import("rxjs").Observable<boolean | UrlTree>,
    );
    http.expectOne("/api/admin/session").flush({ admin });
    expect(await outcome).toBe(true);
  });

  it("passes search and pagination to the server", () => {
    service.users("Anu", 2, 10).subscribe();
    const request = http.expectOne((req) => req.url === "/api/admin/users");
    expect(request.request.params.get("search")).toBe("Anu");
    expect(request.request.params.get("page")).toBe("2");
    expect(request.request.params.get("pageSize")).toBe("10");
    expect(request.request.withCredentials).toBe(true);
    request.flush({ users: [], total: 0 });
  });

  it("clears the identity after successful server logout", () => {
    service.login("admin@example.com", "secret").subscribe();
    http.expectOne("/api/admin/login").flush({ admin });
    expect(service.admin()?.id).toBe("1");
    service.logout().subscribe();
    const request = http.expectOne("/api/admin/logout");
    expect(request.request.method).toBe("POST");
    request.flush(null);
    expect(service.admin()).toBeNull();
  });
});
