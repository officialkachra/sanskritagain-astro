export type AppRole = "admin" | "supervisor" | "worker";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";
export type PaymentStatus = "draft" | "completed" | "reversed";

export type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  role: AppRole;
};

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  rate_per_unit: string;
  active: boolean;
  qc_required: boolean;
};

export type ProductionLog = {
  id: string;
  worker_id: string;
  worker_name?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  rate_per_unit: string;
  amount: string;
  status: ApprovalStatus;
  work_date: string;
  note: string | null;
  submitted_at: string;
};
