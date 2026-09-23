export type AdminChallanStatus = "pending" | "in-progress" | "closed";

export interface AdminChallan {
  id: string;
  vehicleNumber: string;
  type: "online" | "court";
  status: AdminChallanStatus;
  offence: string;
  issuedAt: string;
  location: string;
  authority: string;
  amount: number;
  paidAmount?: number;
  submittedAt?: string;
  closedAt?: string;
  paymentReference?: string;
  progressNote?: string;
}

export interface AdminChallanSummary {
  total: number;
  pending: number;
  inProgress: number;
  closed: number;
  moneySaved: number;
}

export function challanSavings(challan: AdminChallan): number {
  return challan.status === "closed" && challan.paidAmount != null
    ? Math.max(0, challan.amount - challan.paidAmount)
    : 0;
}

// Directory APIs may return just a summary; profiles can derive it from full records.
export function summarizeChallans(user: {
  challans?: AdminChallan[];
  challanSummary?: AdminChallanSummary;
}): AdminChallanSummary {
  if (user.challanSummary) return user.challanSummary;
  const challans = user.challans ?? [];
  return {
    total: challans.length,
    pending: challans.filter((c) => c.status === "pending").length,
    inProgress: challans.filter((c) => c.status === "in-progress").length,
    closed: challans.filter((c) => c.status === "closed").length,
    moneySaved: challans.reduce((sum, c) => sum + challanSavings(c), 0),
  };
}
