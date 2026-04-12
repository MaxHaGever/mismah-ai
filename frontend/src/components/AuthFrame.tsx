import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { SparklesIcon } from "@heroicons/react/outline";
import BrandMark from "./BrandMark";

interface AuthFrameProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  mode?: "split" | "compact";
  badge?: string;
  stepLabels?: string[];
  currentStep?: number;
  footer?: ReactNode;
  context?: "auth" | "app";
  homeTo?: string;
}

const navItems = [
  { to: "/login", label: "התחברות" },
  { to: "/register", label: "הרשמה" },
];

export default function AuthFrame({
  title,
  subtitle,
  icon,
  children,
  mode = "split",
  badge = "",
  stepLabels,
  currentStep,
  footer,
  context = "auth",
  homeTo = "/login",
}: AuthFrameProps) {
  const { pathname } = useLocation();
  const isAppContext = context === "app";

  return (
    <div
      dir="rtl"
      className={
        isAppContext
          ? "min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900"
          : "min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.94),_rgba(15,23,42,1))] text-slate-100"
      }
    >
      {!isAppContext ? (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.05),transparent_35%)]" />
      ) : null}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 pb-4 pt-6 sm:px-6 lg:px-8">
        <Link
          to={homeTo}
          className={`transition ${
            isAppContext
              ? "rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:border-cyan-300 hover:text-cyan-700"
              : "hover:-translate-y-0.5"
          }`}
        >
          {isAppContext ? (
            <>
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                  isAppContext ? "bg-cyan-100 text-cyan-700" : "bg-cyan-400/15 text-cyan-200"
                }`}
              >
                <SparklesIcon className="h-4 w-4" />
              </span>
              <span>חזרה למערכת</span>
              {badge ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {badge}
                </span>
              ) : null}
            </>
          ) : (
            <BrandMark tone="auth" compact />
          )}
        </Link>

        {isAppContext ? <div /> : (
          <nav className="flex flex-wrap items-center justify-end gap-2 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full border px-3 py-2 transition ${
                    active
                      ? "border-cyan-300/50 bg-cyan-300/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <section
          className={`mx-auto rounded-[2rem] bg-white p-6 text-slate-900 sm:p-8 ${
            isAppContext
              ? "border border-slate-200/70 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.3)]"
              : "border border-white/10 shadow-2xl shadow-slate-950/30"
          } ${mode === "compact" ? "max-w-3xl" : "max-w-2xl"}`}
        >
          <div className="space-y-6">
            {stepLabels?.length ? (
              <div className={`grid gap-2 ${stepLabels.length <= 4 ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
                {stepLabels.map((step, index) => {
                  const isActive = index === (currentStep ?? 0);
                  const isPast = index < (currentStep ?? 0);
                  return (
                    <div
                      key={step}
                      className={`rounded-2xl border px-3 py-3 text-xs font-medium ${
                        isActive
                          ? "border-cyan-500 bg-cyan-50 text-cyan-800"
                          : isPast
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                      }`}
                    >
                      <div className="mb-1 text-[11px] uppercase tracking-[0.2em]">{index + 1}</div>
                      {step}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                {icon}
              </span>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
                <p className="text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
            </div>

            {children}
            {footer}
          </div>
        </section>
      </main>
    </div>
  );
}
