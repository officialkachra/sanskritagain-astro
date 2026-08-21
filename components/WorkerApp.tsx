"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, IndianRupee, LogIn, LogOut, PackageCheck, Plus, Send, UserRound } from "lucide-react";

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
const activeWorkerKey = "sanskrtiagain_active_worker";

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

export function WorkerApp() {
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [workers, setWorkers] = useState<Worker[]>(starterWorkers);
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workerId, setWorkerId] = useState("worker-a");
  const [productId, setProductId] = useState("sunderkand");
  const [quantity, setQuantity] = useState("10");
  const [note, setNote] = useState("");
  const [workDate, setWorkDate] = useState(today());
  const [attendance, setAttendance] = useState({ in: "", out: "" });

  useEffect(() => {
    setProducts(readStore(productsKey, starterProducts));
    setWorkers(readStore(workersKey, starterWorkers));
    setEntries(readStore(entriesKey, []));
    setPayments(readStore(paymentsKey, []));
    setWorkerId(window.localStorage.getItem(activeWorkerKey) || "worker-a");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(activeWorkerKey, workerId);
  }, [workerId]);

  const activeProducts = products.filter((product) => product.active);
  const selectedProduct = activeProducts.find((product) => product.id === productId) ?? activeProducts[0];
  const numericQuantity = Number(quantity) || 0;
  const previewAmount = numericQuantity * (selectedProduct?.rate ?? 0);

  const myEntries = useMemo(() => entries.filter((entry) => entry.workerId === workerId), [entries, workerId]);
  const myPayments = useMemo(() => payments.filter((payment) => payment.workerId === workerId), [payments, workerId]);
  const summary = useMemo(() => {
    const approved = myEntries.filter((entry) => entry.status === "approved").reduce((sum, entry) => sum + entry.amount, 0);
    const pending = myEntries.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + entry.amount, 0);
    const salaryPaid = myPayments.filter((payment) => payment.type === "salary").reduce((sum, payment) => sum + payment.amount, 0);
    const advances = myPayments.filter((payment) => payment.type === "advance").reduce((sum, payment) => sum + payment.amount, 0);
    return { approved, pending, salaryPaid, advances, due: approved - salaryPaid - advances };
  }, [myEntries, myPayments]);

  function submitWork(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProduct || numericQuantity <= 0) return;

    const entry: WorkEntry = {
      id: crypto.randomUUID(),
      workerId,
      productId: selectedProduct.id,
      quantity: numericQuantity,
      rate: selectedProduct.rate,
      amount: previewAmount,
      status: "pending",
      note,
      workDate,
      createdAt: new Date().toISOString()
    };
    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    writeStore(entriesKey, nextEntries);
    setQuantity("");
    setNote("");
  }

  function markAttendance(type: "in" | "out") {
    const stamp = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setAttendance((current) => ({ ...current, [type]: stamp }));
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Sanskrtiagain Team</p>
            <h1 className="text-2xl font-bold tracking-normal">Daily Worker Entry</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link className="focus-ring rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" href="/admin">
              Admin
            </Link>
            <Link className="focus-ring rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white" href="/login">
              Login
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <IndianRupee className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-sm text-slate-500">Approved earning</p>
              <p className="mt-1 text-2xl font-bold">₹{summary.approved.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Clock3 className="h-5 w-5 text-amber-600" />
              <p className="mt-3 text-sm text-slate-500">Pending work</p>
              <p className="mt-1 text-2xl font-bold">₹{summary.pending.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <LogOut className="h-5 w-5 text-rose-600" />
              <p className="mt-3 text-sm text-slate-500">Advance</p>
              <p className="mt-1 text-2xl font-bold">₹{summary.advances.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm text-slate-500">Balance due</p>
              <p className="mt-1 text-2xl font-bold">₹{summary.due.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <form onSubmit={submitWork} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold">Add today work</h2>
                <p className="text-sm text-slate-500">Example: Worker A made 10 Sunderkand at ₹10 each, total ₹100.</p>
              </div>
              <PackageCheck className="h-6 w-6 text-emerald-700" />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium">
                Worker
                <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3" value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
                  {workers.filter((worker) => worker.role === "worker").map((worker) => (
                    <option key={worker.id} value={worker.id}>{worker.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Work date
                <input className="mt-2 w-full rounded-md border border-slate-300 p-3" type="date" value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Product
                <select className="mt-2 w-full rounded-md border border-slate-300 bg-white p-3" value={productId} onChange={(event) => setProductId(event.target.value)}>
                  {activeProducts.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} - ₹{product.rate}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Quantity
                <input className="mt-2 w-full rounded-md border border-slate-300 p-3 text-xl font-bold" inputMode="numeric" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium">
              Note
              <textarea className="mt-2 w-full rounded-md border border-slate-300 p-3" rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Batch, quality note, or supervisor message" />
            </label>

            <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm text-slate-500">Payment calculation</p>
                <p className="text-xl font-bold">{numericQuantity || 0} x ₹{selectedProduct?.rate ?? 0} = ₹{previewAmount.toLocaleString("en-IN")}</p>
              </div>
              <button className="focus-ring rounded-md bg-emerald-700 px-5 py-3 font-semibold text-white">
                <Send className="mr-2 inline h-5 w-5" />Submit
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Attendance</h2>
              <CalendarDays className="h-5 w-5 text-blue-700" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => markAttendance("in")} className="focus-ring rounded-md bg-slate-950 py-3 font-semibold text-white" type="button">
                <LogIn className="mr-2 inline h-5 w-5" />In
              </button>
              <button onClick={() => markAttendance("out")} className="focus-ring rounded-md border border-slate-300 bg-white py-3 font-semibold" type="button">
                <LogOut className="mr-2 inline h-5 w-5" />Out
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p className="rounded-md bg-slate-50 p-3">Login<br /><span className="font-semibold">{attendance.in || "--"}</span></p>
              <p className="rounded-md bg-slate-50 p-3">Logout<br /><span className="font-semibold">{attendance.out || "--"}</span></p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h2 className="font-semibold">Recent entries</h2>
              <UserRound className="h-5 w-5 text-emerald-700" />
            </div>
            <div className="max-h-[520px] divide-y divide-slate-100 overflow-auto">
              {myEntries.slice(0, 12).map((entry) => {
                const product = products.find((item) => item.id === entry.productId);
                return (
                  <div key={entry.id} className="grid grid-cols-[1fr_auto] gap-3 p-4 text-sm">
                    <div>
                      <p className="font-semibold">{product?.name ?? "Product"}</p>
                      <p className="text-slate-500">{entry.workDate} · {entry.quantity} pcs · {entry.status}</p>
                    </div>
                    <p className="font-bold">₹{entry.amount.toLocaleString("en-IN")}</p>
                  </div>
                );
              })}
              {!myEntries.length ? <p className="p-4 text-sm text-slate-500">No work submitted yet.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
