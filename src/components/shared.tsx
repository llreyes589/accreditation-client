import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[30px] sm:leading-9">
          {title}
        </h1>
        {description && <p className="mt-1 text-[13px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
}: {
  label: string
  value: string
  delta?: string
  tone?: "up" | "warn" | "ok" | "neutral"
  icon?: ReactNode
}) {
  const toneCls = {
    up: "text-emerald-600",
    ok: "text-emerald-600",
    warn: "text-amber-600",
    neutral: "text-slate-500",
  }[tone]

  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-[28px] font-bold leading-none tracking-tight text-ink">
        {value}
      </p>
      {delta && <p className={cn("mt-2 text-[12px] font-medium", toneCls)}>{delta}</p>}
    </div>
  )
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center text-[12px] text-slate-500">
      {children}
    </div>
  )
}
