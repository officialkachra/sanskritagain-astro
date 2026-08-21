import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, IndianRupee, PackageCheck, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";

const features = [
  { title: "Daily entries", text: "Worker selects product, quantity, date, and the app calculates payment.", Icon: ClipboardCheck },
  { title: "Admin approvals", text: "Approve or reject work before it counts in reports and payroll.", Icon: ShieldCheck },
  { title: "Reports", text: "Daily, weekly, monthly, and all-time product and worker filters.", Icon: BarChart3 },
  { title: "Payments", text: "Track monthly salary paid, advance paid, and remaining balance.", Icon: IndianRupee }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm">
            <PackageCheck className="h-4 w-4 text-emerald-700" />
            Sanskrtiagain Team App
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-normal md:text-6xl">Daily work, payment, and production reports</h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              A smooth app for workers to enter production like 10 Sunderkand at ₹10 each, and for admins to check reports, pay salary, manage advances, and see who is ahead.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="focus-ring rounded-md bg-slate-950 px-5 py-3 font-semibold text-white" href="/login">
              Open login <ArrowRight className="ml-2 inline h-5 w-5" />
            </Link>
            <Link className="focus-ring rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold" href="/admin">
              Admin dashboard
            </Link>
            <Link className="focus-ring rounded-md border border-slate-300 bg-white px-5 py-3 font-semibold" href="/worker">
              Worker entry
            </Link>
            <Link className="focus-ring rounded-md border border-amber-300 bg-amber-50 px-5 py-3 font-semibold text-amber-900" href="/ved">
              Sanskritagain Astro <Sparkles className="ml-2 inline h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Example calculation</p>
                <h2 className="mt-1 text-2xl font-bold">10 Sunderkand x ₹10</h2>
              </div>
              <IndianRupee className="h-7 w-7 text-emerald-700" />
            </div>
            <p className="mt-4 rounded-md bg-slate-50 p-4 text-3xl font-bold">₹100</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Users className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm text-slate-500">Workers</p>
              <p className="text-2xl font-bold">3+</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Trophy className="h-5 w-5 text-amber-600" />
              <p className="mt-3 text-sm text-slate-500">Ranking</p>
              <p className="text-2xl font-bold">Live</p>
            </div>
          </div>
          {features.map(({ title, text, Icon }) => (
            <div key={title} className="grid grid-cols-[36px_1fr] gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="h-5 w-5 text-emerald-700" />
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
