"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Award, CalendarRange, Check, Download, IndianRupee, PackagePlus, Plus, Search, Trophy, UserPlus, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Product = {
  id: string;
  name: string;
  rate: number;
  active: boolean;
};

type Worker = {
  id: string;
  name: string;
  phone: string;
  role: "worker" | "admin";
};

type WorkEntry = {
  id: string;
  workerId: string;
  productId: string;
  quantity: number;
  rate: number;
  amount: number;
  status: "pending" | "approved" | "rejected";
  note: string;
  workDate: string;
  createdAt: string;
};

type Payment = {
  id: string;
  workerId: string;
  amount: number;
  type: "salary" | "advance";
  date: string;
  note: string;
};

const productsKey = "sanskrtiagain_products";
const workersKey = "sanskrtiagain_workers";
const entriesKey = "sanskrtiagain_entries";
const paymentsKey = "sanskrtiagain_payments";

const starterProducts: Product[] = [
  { id: "sunderkand", name: "Sunderkand", rate: 10, active: true },
  { id: "chalisa", name: "Hanuman Chalisa", rate: 6, active: true },
  { id: "packing", name: "Packing", rate: 3, active: true }
];

const starterWorkers: Worker[] = [
  { id: "worker-a", name: "Worker A", phone: "9000000001", role: "worker" },
  { id: "worker-b", name: "Worker B", phone: "9000000002", role: "worker" },
  { id: "worker-c", name: "Worker C", phone: "9000000003", role: "worker" }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [workers, setWorkers] = useState<Worker[]>(starterWorkers);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "all">("daily");
  const [query, setQuery] = useState("");
  const [productName, setProductName] = useState("");
  const [rate, setRate] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [workerPhone, setWorkerPhone] = useState("");
  const [paymentWorkerId, setPaymentWorkerId] = useState("worker-a");
  const [paymentType, setPaymentType] = useState<"salary" | "advance">("salary");
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    setProducts(readStore(productsKey, starterProducts));
    setWorkers(readStore(workersKey, starterWorkers));
    setEntries(readStore(entriesKey, []));
    setPayments(readStore(paymentsKey, []));
  }, []);

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === "daily") return today();
    if (range === "weekly") return startOfWeek(now);
    if (range === "monthly") return startOfMonth(now);
    return "";
  }, [range]);

  const filteredEntries = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const worker = workers.find((item) => item.id === entry.workerId);
      const product = products.find((item) => item.id === entry.productId);
      const inRange = !rangeStart || entry.workDate >= rangeStart;
      const matches = !lowerQuery || `${worker?.name} ${product?.name} ${entry.note}`.toLowerCase().includes(lowerQuery);
      return inRange && matches;
    });
  }, [entries, products, query, rangeStart, workers]);

  const approvedEntries = filteredEntries.filter((entry) => entry.status === "approved");
  const pendingEntries = entries.filter((entry) => entry.status === "pending");

  const productReport = useMemo(() => {
    return products.map((product) => {
      const productEntries = approvedEntries.filter((entry) => entry.productId === product.id);
      return {
        name: product.name,
        quantity: productEntries.reduce((sum, entry) => sum + entry.quantity, 0),
        amount: productEntries.reduce((sum, entry) => sum + entry.amount, 0)
      };
    }).filter((item) => item.quantity > 0);
  }, [approvedEntries, products]);

  const workerReport = useMemo(() => {
    return workers.filter((worker) => worker.role === "worker").map((worker) => {
      const workerEntries = approvedEntries.filter((entry) => entry.workerId === worker.id);
      const salaryPaid = payments.filter((payment) => payment.workerId === worker.id && payment.type === "salary").reduce((sum, payment) => sum + payment.amount, 0);
      const advances = payments.filter((payment) => payment.workerId === worker.id && payment.type === "advance").reduce((sum, payment) => sum + payment.amount, 0);
      const earned = workerEntries.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        ...worker,
        quantity: workerEntries.reduce((sum, entry) => sum + entry.quantity, 0),
        earned,
        advances,
        salaryPaid,
        due: earned - advances - salaryPaid
      };
    }).sort((a, b) => b.earned - a.earned);
  }, [approvedEntries, payments, workers]);

  const totals = useMemo(() => {
    const quantity = approvedEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    const earned = approvedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const advances = payments.filter((payment) => payment.type === "advance").reduce((sum, payment) => sum + payment.amount, 0);
    const salaryPaid = payments.filter((payment) => payment.type === "salary").reduce((sum, payment) => sum + payment.amount, 0);
    return { quantity, earned, advances, salaryPaid, due: earned - advances - salaryPaid };
  }, [approvedEntries, payments]);

  function decide(entryId: string, status: "approved" | "rejected") {
    const nextEntries = entries.map((entry) => entry.id === entryId ? { ...entry, status } : entry);
    setEntries(nextEntries);
    writeStore(entriesKey, nextEntries);
  }

  function addProduct(event: React.FormEvent) {
    event.preventDefault();
    const nextProducts = [{ id: crypto.randomUUID(), name: productName.trim(), rate: Number(rate), active: true }, ...products];
    setProducts(nextProducts);
    writeStore(productsKey, nextProducts);
    setProductName("");
    setRate("");
  }

  function addWorker(event: React.FormEvent) {
    event.preventDefault();
    const nextWorkers = [{ id: crypto.randomUUID(), name: workerName.trim(), phone: workerPhone.trim(), role: "worker" as const }, ...workers];
    setWorkers(nextWorkers);
    writeStore(workersKey, nextWorkers);
    setWorkerName("");
    setWorkerPhone("");
  }

  function recordPayment(event: React.FormEvent) {
    event.preventDefault();
    const nextPayments = [{
      id: crypto.randomUUID(),
      workerId: paymentWorkerId,
      amount: Number(paymentAmount),
      type: paymentType,
      date: today(),
      note: paymentType === "advance" ? "Advance payment" : "Monthly salary payment"
    }, ...payments];
    setPayments(nextPayments);
    writeStore(paymentsKey, nextPayments);
    setPaymentAmount("");
  }

  function exportCsv() {
    const header = "date,worker,product,quantity,rate,amount,status,note";
    const rows = filteredEntries.map((entry) => {
      const worker = workers.find((item) => item.id === entry.workerId)?.name ?? "";
      const product = products.find((item) => item.id === entry.productId)?.name ?? "";
      return [entry.workDate, worker, product, entry.quantity, entry.rate, entry.amount, entry.status, entry.note.replaceAll(",", " ")].join(",");
    });
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sanskrtiagain-${range}-report.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Sanskrtiagain Team</p>
            <h1 className="text-2xl font-bold tracking-normal">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" href="/worker">Worker</Link>
            <button onClick={exportCsv} className="focus-ring rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white" type="button">
              <Download className="mr-2 inline h-4 w-4" />Export
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <PackagePlus className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-sm text-slate-500">Pieces made</p>
              <p className="mt-1 text-2xl font-bold">{totals.quantity.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <IndianRupee className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm text-slate-500">Earned</p>
              <p className="mt-1 text-2xl font-bold">₹{totals.earned.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <CalendarRange className="h-5 w-5 text-amber-600" />
              <p className="mt-3 text-sm text-slate-500">Advance</p>
              <p className="mt-1 text-2xl font-bold">₹{totals.advances.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Users className="h-5 w-5 text-fuchsia-700" />
              <p className="mt-3 text-sm text-slate-500">Workers</p>
              <p className="mt-1 text-2xl font-bold">{workerReport.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Trophy className="h-5 w-5 text-rose-600" />
              <p className="mt-3 text-sm text-slate-500">Balance due</p>
              <p className="mt-1 text-2xl font-bold">₹{totals.due.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-md border border-slate-300 bg-slate-50 p-1">
                {(["daily", "weekly", "monthly", "all"] as const).map((item) => (
                  <button key={item} onClick={() => setRange(item)} className={`rounded px-3 py-2 text-sm font-semibold capitalize ${range === item ? "bg-slate-950 text-white" : "text-slate-700"}`} type="button">
                    {item}
                  </button>
                ))}
              </div>
              <label className="flex min-w-[240px] items-center gap-2 rounded-md border border-slate-300 bg-white px-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input className="w-full py-2 outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search worker or product" />
              </label>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Product report</h2>
                <PackagePlus className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productReport}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#047857" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <h2 className="font-semibold">Who is ahead</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {workerReport.map((worker, index) => (
                  <div key={worker.id} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 p-4 text-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 font-bold">{index + 1}</div>
                    <div>
                      <p className="font-semibold">{worker.name}</p>
                      <p className="text-slate-500">{worker.quantity} pcs · due ₹{worker.due.toLocaleString("en-IN")}</p>
                    </div>
                    <p className="font-bold">₹{worker.earned.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <h2 className="font-semibold">Approval queue</h2>
              <p className="text-sm text-slate-500">{pendingEntries.length} pending</p>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingEntries.map((entry) => {
                const worker = workers.find((item) => item.id === entry.workerId);
                const product = products.find((item) => item.id === entry.productId);
                return (
                  <div key={entry.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-semibold">{worker?.name ?? "Worker"} made {entry.quantity} {product?.name ?? "product"}</p>
                      <p className="text-sm text-slate-500">{entry.workDate} · ₹{entry.rate} each · total ₹{entry.amount.toLocaleString("en-IN")} {entry.note ? `· ${entry.note}` : ""}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => decide(entry.id, "approved")} className="focus-ring rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white" type="button">
                        <Check className="mr-1 inline h-4 w-4" />Approve
                      </button>
                      <button onClick={() => decide(entry.id, "rejected")} className="focus-ring rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white" type="button">
                        <X className="mr-1 inline h-4 w-4" />Reject
                      </button>
                    </div>
                  </div>
                );
              })}
              {!pendingEntries.length ? <p className="p-4 text-sm text-slate-500">No pending work right now.</p> : null}
            </div>
          </section>
        </section>

        <aside className="space-y-5">
          <form onSubmit={recordPayment} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Monthly payment / advance</h2>
            <label className="mt-4 block text-sm font-medium">
              Worker
              <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3" value={paymentWorkerId} onChange={(event) => setPaymentWorkerId(event.target.value)}>
                {workers.filter((worker) => worker.role === "worker").map((worker) => (
                  <option key={worker.id} value={worker.id}>{worker.name}</option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium">
              Type
              <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3" value={paymentType} onChange={(event) => setPaymentType(event.target.value as "salary" | "advance")}>
                <option value="salary">Salary payment</option>
                <option value="advance">Advance payment</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium">
              Amount
              <input className="mt-2 w-full rounded-md border border-slate-300 p-3" inputMode="decimal" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required />
            </label>
            <button className="focus-ring mt-4 w-full rounded-md bg-slate-950 py-3 font-semibold text-white">
              <IndianRupee className="mr-2 inline h-5 w-5" />Record
            </button>
          </form>

          <form onSubmit={addProduct} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Add product</h2>
            <label className="mt-4 block text-sm font-medium">
              Product name
              <input className="mt-2 w-full rounded-md border border-slate-300 p-3" value={productName} onChange={(event) => setProductName(event.target.value)} required />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Rate per piece
              <input className="mt-2 w-full rounded-md border border-slate-300 p-3" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} required />
            </label>
            <button className="focus-ring mt-4 w-full rounded-md border border-slate-300 bg-white py-3 font-semibold">
              <Plus className="mr-2 inline h-5 w-5" />Save product
            </button>
          </form>

          <form onSubmit={addWorker} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Add worker</h2>
            <label className="mt-4 block text-sm font-medium">
              Name
              <input className="mt-2 w-full rounded-md border border-slate-300 p-3" value={workerName} onChange={(event) => setWorkerName(event.target.value)} required />
            </label>
            <label className="mt-4 block text-sm font-medium">
              Phone
              <input className="mt-2 w-full rounded-md border border-slate-300 p-3" inputMode="tel" value={workerPhone} onChange={(event) => setWorkerPhone(event.target.value)} required />
            </label>
            <button className="focus-ring mt-4 w-full rounded-md border border-slate-300 bg-white py-3 font-semibold">
              <UserPlus className="mr-2 inline h-5 w-5" />Save worker
            </button>
          </form>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="font-semibold">Recent payments</h2>
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 8).map((payment) => {
                const worker = workers.find((item) => item.id === payment.workerId);
                return (
                  <div key={payment.id} className="p-4 text-sm">
                    <p className="font-semibold">{worker?.name ?? "Worker"} · {payment.type}</p>
                    <p className="text-slate-500">{payment.date} · ₹{payment.amount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
              {!payments.length ? <p className="p-4 text-sm text-slate-500">No payments recorded yet.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
