import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Worker Production Management",
  description: "Production, attendance, payroll, approval, and analytics system for workshop operations"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-sm text-slate-600">
          Made by{" "}
          <a
            className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:text-emerald-700"
            href="https://x.com/Yuvraj_Vyas"
            target="_blank"
            rel="noreferrer"
          >
            Yuvraj
          </a>
        </footer>
      </body>
    </html>
  );
}
