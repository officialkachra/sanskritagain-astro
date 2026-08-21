"use client";

export function LanguageToggle({ language, onChange }: { language: "en" | "hi"; onChange: (language: "en" | "hi") => void }) {
  return (
    <div className="grid grid-cols-2 rounded-md border border-slate-300 bg-white p-1 text-sm">
      <button className={`rounded px-3 py-2 ${language === "en" ? "bg-ink text-white" : ""}`} onClick={() => onChange("en")} type="button">
        EN
      </button>
      <button className={`rounded px-3 py-2 ${language === "hi" ? "bg-ink text-white" : ""}`} onClick={() => onChange("hi")} type="button">
        हिंदी
      </button>
    </div>
  );
}
