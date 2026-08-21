import type { SessionUser } from "@/types/domain";

export function buildSalaryMessage(workerName: string, summary: { earned: number; paid: number; pending: number }, lines: { product: string; quantity: number }[]) {
  const products = lines.map((line) => `* ${line.product}: ${line.quantity}`).join("\n");
  return `Namaste ${workerName} Ji,\n\nSalary Summary:\n\n${products}\n\nTotal Earnings: ₹${summary.earned.toLocaleString("en-IN")}\nPaid: ₹${summary.paid.toLocaleString("en-IN")}\nPending: ₹${summary.pending.toLocaleString("en-IN")}`;
}

export async function sendWhatsAppStatement(_user: SessionUser, phone: string, message: string) {
  if (process.env.OTP_PROVIDER === "mock" || !process.env.TWILIO_ACCOUNT_SID) {
    return { provider: "mock", phone, message };
  }

  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const body = new URLSearchParams({
    From: process.env.TWILIO_WHATSAPP_FROM ?? "",
    To: `whatsapp:${phone}`,
    Body: message
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) throw new Error(`WhatsApp provider failed: ${response.status}`);
  return response.json();
}
