import type { LucideIcon } from "lucide-react";

export function StatCard({ title, value, detail, Icon }: { title: string; value: string | number; detail: string; Icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-saffron" />
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
