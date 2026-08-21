"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ClipboardList, KeyRound, ShieldCheck, UserRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  function choose(role: "admin" | "worker") {
    window.localStorage.setItem("sanskrtiagain_role", role);
    router.push(role === "admin" ? "/admin" : "/worker");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-5xl gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            Sanskrtiagain Team
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-normal md:text-6xl">Worker production and payment app</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Daily work entry, product rate calculation, approval, reports, monthly salary, advances, and worker ranking.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <ClipboardList className="h-5 w-5 text-emerald-700" />
              <p className="mt-3 text-sm font-semibold">Daily work</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <BarChart3 className="h-5 w-5 text-blue-700" />
              <p className="mt-3 text-sm font-semibold">Reports</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <KeyRound className="h-5 w-5 text-amber-600" />
              <p className="mt-3 text-sm font-semibold">Two logins</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">Choose login</h2>
          <p className="mt-1 text-sm text-slate-500">Demo mode opens instantly. Database login files are still in the project for production setup.</p>
          <div className="mt-5 grid gap-3">
            <button onClick={() => choose("worker")} className="focus-ring grid grid-cols-[44px_1fr] items-center gap-3 rounded-lg border border-slate-200 bg-[#f8fafc] p-4 text-left" type="button">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-700 text-white">
                <UserRound className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold">Worker login</span>
                <span className="block text-sm text-slate-500">Enter daily production and see payment balance.</span>
              </span>
            </button>
            <button onClick={() => choose("admin")} className="focus-ring grid grid-cols-[44px_1fr] items-center gap-3 rounded-lg border border-slate-200 bg-slate-950 p-4 text-left text-white" type="button">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-950">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold">Admin login</span>
                <span className="block text-sm text-slate-300">Approve entries, view reports, manage payments.</span>
              </span>
            </button>
          </div>
          <Link className="mt-5 inline-block text-sm font-semibold text-emerald-700" href="/">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
