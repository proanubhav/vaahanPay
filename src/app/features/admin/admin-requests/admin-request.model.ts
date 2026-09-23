import { AdminChallan, AdminChallanStatus } from "../admin-challan.model";

export interface ChallanRemark {
  text: string;
  createdAt: string;
  author: string;
}
export interface ChallanRequest extends AdminChallan {
  userId: string;
  userName: string;
  mobile: string;
  email?: string;
  paymentStatus: "paid" | "pending" | "failed";
  paymentAmount?: number;
  paidAt?: string;
  remarks: ChallanRemark[];
  receipt?: { name: string; url: string };
}
export interface RequestUpdate {
  status: AdminChallanStatus;
  remark: string;
}
