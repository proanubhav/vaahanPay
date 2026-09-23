import { ChallanRequest } from "../admin-requests/admin-request.model";

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}
export function periodStart(days: number, now = new Date()): string {
  if (!days) return "";
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return start.toISOString().slice(0, 10);
}
export function inPeriod(record: ChallanRequest, from: string): boolean {
  return (
    !from || (!!record.submittedAt && record.submittedAt.slice(0, 10) >= from)
  );
}
export function dashboardAnalytics(
  records: ChallanRequest[],
  from: string,
  now = new Date(),
) {
  const requests = records.filter((record) => inPeriod(record, from));
  const statuses: ChartDatum[] = [
    { key: "pending", label: "Pending", value: 0, color: "#d69b35" },
    { key: "in-progress", label: "In progress", value: 0, color: "#5488c9" },
    { key: "closed", label: "Closed", value: 0, color: "#268464" },
  ].map((item) => ({
    ...item,
    value: requests.filter((record) => record.status === item.key).length,
  }));
  const payments: ChartDatum[] = [
    { key: "paid", label: "Paid", value: 0, color: "#268464" },
    { key: "pending", label: "Pending", value: 0, color: "#d69b35" },
    { key: "failed", label: "Failed", value: 0, color: "#cd6b62" },
  ].map((item) => ({
    ...item,
    value: requests.filter((record) => record.paymentStatus === item.key)
      .length,
  }));
  // UTC calendar days make chart buckets and request-list date filters agree.
  const dates = requests
    .map((record) => record.submittedAt?.slice(0, 10) ?? "")
    .filter(Boolean)
    .sort();
  const end = now.toISOString().slice(0, 10);
  const start = from || dates[0] || end;
  const buckets = new Map<string, number>();
  const span = Math.max(
    1,
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1,
  );
  const monthly = span > 100;
  const cursor = new Date(
    `${monthly ? start.slice(0, 7) + "-01" : start}T00:00:00Z`,
  );
  while (cursor.toISOString().slice(0, 10) <= end) {
    buckets.set(cursor.toISOString().slice(0, monthly ? 7 : 10), 0);
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  for (const record of requests) {
    const key = record.submittedAt?.slice(0, monthly ? 7 : 10);
    if (key && buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
  }
  const trend: ChartDatum[] = [...buckets].map(([key, value]) => ({
    key,
    value,
    label: new Date(
      `${key.length === 7 ? key + "-01" : key}T00:00:00Z`,
    ).toLocaleDateString(
      "en-IN",
      monthly
        ? { month: "short", year: "2-digit", timeZone: "UTC" }
        : { day: "numeric", month: "short", timeZone: "UTC" },
    ),
  }));
  return {
    requests,
    statuses,
    payments,
    trend,
    paidAmount: requests
      .filter((record) => record.paymentStatus === "paid")
      .reduce((sum, record) => sum + (record.paymentAmount ?? 0), 0),
    missingPaymentAmounts: requests.filter(
      (record) =>
        record.paymentStatus === "paid" && record.paymentAmount == null,
    ).length,
    open: requests.filter((record) => record.status !== "closed").length,
    closureRate: requests.length
      ? Math.round((statuses[2].value / requests.length) * 100)
      : 0,
  };
}
export function actionReason(record: ChallanRequest): string {
  if (record.paymentStatus === "failed") return "Review failed payment";
  if (record.paymentStatus === "pending") return "Verify payment";
  if (record.status === "pending") return "Start resolution";
  if (record.status === "in-progress") return "Update progress";
  return "Upload receipt";
}
export function actionableRequests(records: ChallanRequest[]) {
  return records
    .filter(
      (record) =>
        record.status !== "closed" ||
        record.paymentStatus !== "paid" ||
        !record.receipt,
    )
    .sort(
      (a, b) =>
        (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "") ||
        a.id.localeCompare(b.id),
    );
}
