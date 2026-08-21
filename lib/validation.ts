import { z } from "zod";

export const phoneSchema = z.string().min(8).max(16).regex(/^[0-9+ -]+$/);

export const loginSchema = z.object({
  phone: phoneSchema,
  passcode: z.string().min(4).max(32)
});

export const productionEntrySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(100000),
  note: z.string().max(500).optional(),
  proofUrl: z.string().url().optional()
});

export const approvalSchema = z.object({
  productionLogId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  quantity: z.coerce.number().int().positive().optional(),
  remarks: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional()
});

export const attendanceSchema = z.object({
  status: z.enum(["present", "absent", "half_day", "leave"]).default("present"),
  action: z.enum(["login", "logout", "mark"]),
  gpsLat: z.coerce.number().optional(),
  gpsLng: z.coerce.number().optional(),
  selfieUrl: z.string().url().optional()
});

export const paymentSchema = z.object({
  workerId: z.string().uuid(),
  payrollId: z.string().uuid().optional(),
  amount: z.coerce.number().positive(),
  mode: z.string().min(2).max(40),
  notes: z.string().max(500).optional(),
  status: z.enum(["draft", "completed"]).default("completed")
});
