import { ADMIN_USE_DEMO_DATA } from "./admin.service";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { of } from "rxjs";
import { AdminModule } from "./admin.module";
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminProfileComponent } from "./admin-profile/admin-profile.component";

const user = {
  id: "42",
  name: "Anu Gupta",
  mobile: "9876543210",
  email: "anu@example.com",
  status: "active",
  registeredAt: "2026-09-01T12:00:00Z",
  vehicles: [{ number: "DL01AB1234" }],
};

describe("Admin user screens", () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        { provide: ADMIN_USE_DEMO_DATA, useValue: false },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: "42" })) },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it("renders registered users, profile links, and the next page", async () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    http
      .expectOne((req) => req.url === "/api/admin/users")
      .flush({ users: [user], total: 11 });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain("Anu Gupta");
    expect(element.querySelector(".profile-link")?.getAttribute("href")).toBe(
      "/admin/users/42",
    );
    fixture.componentInstance.changePage(1);
    const nextPage = http.expectOne((req) => req.url === "/api/admin/users");
    expect(nextPage.request.params.get("page")).toBe("2");
    nextPage.flush({
      users: [{ ...user, id: "43", name: "Next User" }],
      total: 11,
    });
    fixture.detectChanges();
    expect(element.textContent).toContain("Next User");
    expect(element.textContent).toContain("Showing 11–11 of 11");
  });

  it("shows a retryable error, then an empty directory", () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    http
      .expectOne((req) => req.url === "/api/admin/users")
      .flush({}, { status: 500, statusText: "Server Error" });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Users couldn’t be loaded",
    );
    fixture.componentInstance.reload();
    http
      .expectOne((req) => req.url === "/api/admin/users")
      .flush({ users: [], total: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "No registered users yet",
    );
  });

  it("renders an individual profile and linked vehicles", () => {
    const fixture = TestBed.createComponent(AdminProfileComponent);
    http.expectOne("/api/admin/users/42").flush(user);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("anu@example.com");
    expect(fixture.nativeElement.textContent).toContain("DL01AB1234");
    expect(fixture.nativeElement.textContent).toContain("Not provided");
  });

  it("handles a missing user without displaying stale profile details", () => {
    const fixture = TestBed.createComponent(AdminProfileComponent);
    http
      .expectOne("/api/admin/users/42")
      .flush({}, { status: 404, statusText: "Not Found" });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "This user could not be found.",
    );
    expect(fixture.nativeElement.querySelector(".profile-summary")).toBeNull();
  });
});
