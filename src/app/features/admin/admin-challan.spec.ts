import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ADMIN_DEMO_USERS } from "./admin-demo-data";
import { AdminChallan, summarizeChallans } from "./admin-challan.model";
import { AdminModule } from "./admin.module";
import { AdminProfileChallansComponent } from "./admin-profile-challans/admin-profile-challans.component";

const base: AdminChallan = {
  id: "1",
  vehicleNumber: "DL01AB1234",
  status: "closed",
  type: "court",
  offence: "Parking",
  issuedAt: "2026-08-01T12:00:00Z",
  location: "Demo road",
  authority: "Demo authority",
  amount: 1000,
  paidAmount: 750,
};

describe("Admin challan summaries", () => {
  it("counts every category and only counts realized, nonnegative savings", () => {
    const summary = summarizeChallans({
      challans: [
        base,
        { ...base, id: "2", status: "pending", paidAmount: 0 },
        { ...base, id: "3", status: "in-progress", paidAmount: 0 },
        { ...base, id: "4", paidAmount: 1200 },
        { ...base, id: "5", paidAmount: undefined },
        { ...base, id: "6", paidAmount: 0 },
      ],
    });
    expect(summary).toEqual({
      total: 6,
      pending: 1,
      inProgress: 1,
      closed: 4,
      moneySaved: 1250,
    });
  });

  it("keeps demo challans assigned to each user’s linked vehicles", () => {
    for (const user of ADMIN_DEMO_USERS) {
      const summary = summarizeChallans(user);
      expect(summary.total).toBe(
        summary.pending + summary.inProgress + summary.closed,
      );
      for (const challan of user.challans ?? []) {
        expect(
          user.vehicles?.some(
            (vehicle) => vehicle.number === challan.vehicleNumber,
          ),
        ).toBe(true);
      }
    }
  });
});

describe("Admin profile challan filters", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it("switches status and type, displays closed savings, and handles empty matches", () => {
    const fixture = TestBed.createComponent(AdminProfileChallansComponent);
    fixture.componentRef.setInput("challans", [
      base,
      { ...base, id: "2", status: "pending", type: "online" },
      { ...base, id: "3", status: "in-progress" },
    ]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.visible().map((c) => c.id)).toEqual(["2"]);
    const buttons = fixture.nativeElement.querySelectorAll(
      ".status-filters button",
    ) as NodeListOf<HTMLButtonElement>;
    buttons[2].click();
    fixture.detectChanges();
    expect(component.visible().map((c) => c.id)).toEqual(["1"]);
    expect(
      fixture.nativeElement.querySelector(".settlement").textContent,
    ).toContain("250.00");
    const select = fixture.nativeElement.querySelector(
      "select",
    ) as HTMLSelectElement;
    select.value = "online";
    select.dispatchEvent(new Event("change"));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "No challans match the selected type.",
    );
    buttons[1].click();
    fixture.detectChanges();
    expect(component.type()).toBe("all");
    expect(component.visible().map((c) => c.id)).toEqual(["3"]);
  });
});
