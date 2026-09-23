import { AdminModule } from "../admin.module";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ADMIN_USE_DEMO_DATA, AdminService } from "../admin.service";
import { AdminRequestsService } from "./admin-requests.service";
import { AdminRequestsComponent } from "./admin-requests.component";

describe("Admin challan requests", () => {
  function setup(demo: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ADMIN_USE_DEMO_DATA, useValue: demo },
      ],
    });
    return TestBed.inject(AdminRequestsService);
  }
  it("shows submitted demo challans and keeps status changes consistent with profiles", async () => {
    const service = setup(true);
    const records = await firstValueFrom(service.list());
    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) => !!record.submittedAt)).toBe(true);
    const request = records[0];
    const updated = await firstValueFrom(
      service.update(
        request.id,
        { status: "closed", remark: "  Receipt verified  " },
        null,
      ),
    );
    expect(updated.remarks.at(-1)?.text).toBe("Receipt verified");
    expect(updated.closedAt).toBeTruthy();
    const user = await firstValueFrom(
      TestBed.inject(AdminService).user(request.userId),
    );
    expect(user.challans?.find((item) => item.id === request.id)?.status).toBe(
      "closed",
    );
    const reopened = await firstValueFrom(
      service.update(request.id, { status: "in-progress", remark: "" }, null),
    );
    expect(reopened.closedAt).toBeUndefined();
    expect(reopened.remarks).toEqual(updated.remarks);
  });
  it("loads requests and sends receipt, status and remark together with credentials", () => {
    const service = setup(false);
    const http = TestBed.inject(HttpTestingController);
    service.list().subscribe();
    const list = http.expectOne("/api/admin/challan-requests");
    expect(list.request.withCredentials).toBe(true);
    list.flush([]);
    const receipt = new File(["receipt"], "receipt.pdf", {
      type: "application/pdf",
    });
    service
      .update("CH/1", { status: "closed", remark: " Completed " }, receipt)
      .subscribe();
    const save = http.expectOne("/api/admin/challan-requests/CH%2F1");
    expect(save.request.method).toBe("PATCH");
    expect(save.request.withCredentials).toBe(true);
    expect(save.request.body.get("status")).toBe("closed");
    expect(save.request.body.get("remark")).toBe("Completed");
    expect(save.request.body.get("receipt").name).toBe("receipt.pdf");
    save.flush({});
    http.verify();
  });
  it("preserves edits when saving fails", async () => {
    const service = setup(false);
    const http = TestBed.inject(HttpTestingController);
    const component = TestBed.runInInjectionContext(
      () => new AdminRequestsComponent(),
    );
    http.expectOne("/api/admin/challan-requests").flush([]);
    // Obtain a realistic fixture without coupling it to the component implementation.
    const { ADMIN_DEMO_USERS } = await import("../admin-demo-data");
    const user = ADMIN_DEMO_USERS[0];
    const challan = user.challans!.find((item) => item.submittedAt)!;
    component.open({
      ...challan,
      userId: user.id,
      userName: user.name,
      mobile: user.mobile,
      paymentStatus: "paid",
      remarks: [],
    });
    component.form.controls.remark.setValue("Keep this draft");
    component.save(document.createElement("input"));
    http
      .expectOne(`/api/admin/challan-requests/${challan.id}`)
      .flush({}, { status: 500, statusText: "Server error" });
    expect(component.form.controls.remark.value).toBe("Keep this draft");
    expect(component.saving()).toBe(false);
    expect(component.actionError()).toContain("Unable to save");
    expect(component.selected()?.remarks).toEqual([]);
    http.verify();
  });
  it("rejects unsupported receipts before saving", () => {
    setup(true);
    const component = TestBed.runInInjectionContext(
      () => new AdminRequestsComponent(),
    );
    component.chooseFile({
      target: {
        files: [new File(["x"], "receipt.html", { type: "text/html" })],
        value: "receipt.html",
      },
    } as unknown as Event);
    expect(component.file()).toBeNull();
    expect(component.fileError()).toContain("PDF, JPG or PNG");
  });
});

describe("Challan request screen", () => {
  it("opens a request and renders a saved remark in the history", async () => {
    await TestBed.configureTestingModule({
      imports: [AdminModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminRequestsComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const manage = element.querySelector<HTMLButtonElement>("tbody button")!;
    expect(manage).toBeTruthy();
    manage.click();
    fixture.detectChanges();
    expect(element.textContent).toContain("Payment reference");
    const remark = element.querySelector<HTMLTextAreaElement>("textarea")!;
    remark.value = "Receipt checked by operations";
    remark.dispatchEvent(new Event("input"));
    element
      .querySelector<HTMLFormElement>("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.querySelector(".success")?.textContent).toContain("updated");
    expect(element.textContent).toContain("Receipt checked by operations");
    expect(remark.value).toBe("");
  });
});
