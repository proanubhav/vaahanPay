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
  Router,
} from "@angular/router";
import { of } from "rxjs";
import { AdminModule } from "../admin.module";
import { ADMIN_USE_DEMO_DATA } from "../admin.service";
import { ChallanRequest } from "../admin-requests/admin-request.model";
import { AdminRequestsComponent } from "../admin-requests/admin-requests.component";
import { AdminDashboardComponent } from "./admin-dashboard.component";
import {
  actionableRequests,
  dashboardAnalytics,
  periodStart,
} from "./dashboard-analytics";

const request: ChallanRequest = {
  id: "CH-1",
  userId: "1",
  userName: "Sample User",
  mobile: "9000000001",
  vehicleNumber: "DL01AB1234",
  type: "online",
  status: "pending",
  offence: "Parking",
  issuedAt: "2026-09-01T00:00:00Z",
  submittedAt: "2026-09-23T01:00:00Z",
  location: "Delhi",
  authority: "Traffic Police",
  amount: 1000,
  paymentStatus: "paid",
  paymentAmount: 750,
  remarks: [],
};

describe("Dashboard analytics", () => {
  it("uses inclusive UTC dates, fills missing days and excludes unpaid amounts", () => {
    const now = new Date("2026-09-23T14:00:00Z");
    const from = periodStart(3, now);
    expect(from).toBe("2026-09-21");
    const result = dashboardAnalytics(
      [
        request,
        {
          ...request,
          id: "2",
          submittedAt: "2026-09-21T00:00:00Z",
          paymentStatus: "failed",
        },
        { ...request, id: "3", submittedAt: "2026-09-20T23:59:59Z" },
      ],
      from,
      now,
    );
    expect(result.requests.length).toBe(2);
    expect(result.paidAmount).toBe(750);
    expect(result.trend.map((item) => item.value)).toEqual([1, 0, 1]);
    expect(result.payments.map((item) => item.value)).toEqual([1, 0, 1]);
  });
  it("keeps missing receipts actionable and removes completed requests with receipts", () => {
    const completed = { ...request, status: "closed" as const };
    expect(actionableRequests([completed])).toHaveLength(1);
    expect(
      actionableRequests([
        { ...completed, receipt: { name: "receipt.pdf", url: "/receipt.pdf" } },
      ]),
    ).toHaveLength(0);
    expect(dashboardAnalytics([], "", new Date("2026-09-23")).closureRate).toBe(
      0,
    );
  });
});

describe("Dashboard screens and links", () => {
  it("renders D3 paths and links the exact task and filtered request statuses", async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.componentInstance.days.set(0);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll("app-admin-chart")).toHaveLength(3);
    expect(
      element.querySelector("app-admin-chart path")?.getAttribute("d"),
    ).toBeTruthy();
    expect(element.querySelector(".task-link")?.getAttribute("href")).toContain(
      "requestId=DEMO-",
    );
    expect(element.querySelectorAll(".metric")).toHaveLength(4);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, "navigate").mockResolvedValue(true);
    element.querySelector<HTMLButtonElement>(".legend button")!.click();
    expect(navigate).toHaveBeenCalledWith(["/admin/challan-requests"], {
      queryParams: { status: "pending", from: null },
    });
  });
  it("does not show zero metrics when loading fails", async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ADMIN_USE_DEMO_DATA, useValue: false },
      ],
    }).compileComponents();
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    http
      .expectOne((req) => req.url === "/api/admin/users")
      .flush({ users: [], total: 2 });
    http
      .expectOne("/api/admin/challan-requests")
      .flush({}, { status: 500, statusText: "Error" });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Unable to load dashboard",
    );
    expect(fixture.nativeElement.querySelector(".metrics")).toBeNull();
    http.verify();
  });
  it("opens the linked request and applies dashboard payment and period filters", () => {
    const params = convertToParamMap({
      requestId: request.id,
      paymentStatus: "paid",
      from: "2026-09-01",
      status: "open",
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ADMIN_USE_DEMO_DATA, useValue: false },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(params),
            snapshot: { queryParamMap: params },
          },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(
      () => new AdminRequestsComponent(),
    );
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne("/api/admin/challan-requests")
      .flush([
        request,
        { ...request, id: "2", paymentStatus: "failed" },
        { ...request, id: "3", submittedAt: "2026-08-01T00:00:00Z" },
        { ...request, id: "4", status: "closed" },
      ]);
    expect(component.selected()?.id).toBe(request.id);
    expect(component.matches().map((item) => item.id)).toEqual([request.id]);
    http.verify();
  });
});
