import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, OnDestroy } from "@angular/core";
import { of, throwError } from "rxjs";
import {
  ADMIN_API_URL,
  ADMIN_USE_DEMO_DATA,
  AdminService,
} from "../admin.service";
import { ChallanRequest, RequestUpdate } from "./admin-request.model";

@Injectable({ providedIn: "root" })
export class AdminRequestsService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly base = inject(ADMIN_API_URL);
  readonly demo = inject(ADMIN_USE_DEMO_DATA);
  private readonly admin = inject(AdminService);
  private readonly records = new Map<string, ChallanRequest>();
  private readonly urls = new Set<string>();

  constructor() {
    if (this.demo) {
      for (const user of this.admin.demoUsers) {
        for (const challan of user.challans ?? []) {
          if (!challan.submittedAt) continue;
          this.records.set(challan.id, {
            ...structuredClone(challan),
            userId: user.id,
            userName: user.name,
            mobile: user.mobile,
            email: user.email,
            paymentStatus: "paid",
            paymentAmount: challan.paidAmount ?? challan.amount,
            paidAt: challan.submittedAt,
            paymentReference:
              challan.paymentReference ?? `DEMO-PAY-${challan.id}`,
            remarks: challan.progressNote
              ? [
                  {
                    text: challan.progressNote,
                    author: "Demo administrator",
                    createdAt: challan.submittedAt,
                  },
                ]
              : [],
          });
        }
      }
    }
  }

  list() {
    return this.demo
      ? of(
          structuredClone(
            [...this.records.values()].sort((a, b) =>
              (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""),
            ),
          ),
        )
      : this.http.get<ChallanRequest[]>(`${this.base}/challan-requests`, {
          withCredentials: true,
        });
  }

  update(id: string, update: RequestUpdate, receipt: File | null) {
    if (this.demo) {
      const record = this.records.get(id);
      if (!record)
        return throwError(() => new HttpErrorResponse({ status: 404 }));
      const now = new Date().toISOString();
      const next = structuredClone(record);
      next.status = update.status;
      next.closedAt =
        update.status === "closed" ? (record.closedAt ?? now) : undefined;
      if (update.remark.trim()) {
        next.remarks.push({
          text: update.remark.trim(),
          createdAt: now,
          author: this.admin.admin()?.name ?? "Demo administrator",
        });
        next.progressNote = update.remark.trim();
      }
      if (receipt) {
        const url = URL.createObjectURL(receipt);
        this.urls.add(url);
        next.receipt = { name: receipt.name, url };
      }
      this.records.set(id, next);
      const challan = this.admin.demoUsers
        .find((user) => user.id === next.userId)
        ?.challans?.find((item) => item.id === id);
      if (challan)
        Object.assign(challan, {
          status: next.status,
          closedAt: next.closedAt,
          progressNote: next.progressNote,
        });
      return of(structuredClone(next));
    }
    const body = new FormData();
    body.append("status", update.status);
    body.append("remark", update.remark.trim());
    if (receipt) body.append("receipt", receipt, receipt.name);
    return this.http.patch<ChallanRequest>(
      `${this.base}/challan-requests/${encodeURIComponent(id)}`,
      body,
      { withCredentials: true },
    );
  }

  ngOnDestroy() {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
  }
}
