import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700",
        approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
        pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        expired: "bg-red-50 text-red-700 ring-1 ring-red-600/15",
        info: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/15",
        navy: "bg-navy text-white",
        outline: "border border-slate-300 text-slate-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export type StatusKind =
  | "Approved"
  | "Accredited"
  | "Active"
  | "Verified"
  | "Compliant"
  | "Completed"
  | "Passed"
  | "Published"
  | "Pending"
  | "Under Review"
  | "In Progress"
  | "Near Limit"
  | "Expired"
  | "Rejected"
  | "Retained"
  | "Inactive"

const map: Record<string, "approved" | "pending" | "expired" | "info"> = {
  Approved: "approved",
  Accredited: "approved",
  Active: "approved",
  Verified: "approved",
  Compliant: "approved",
  Completed: "approved",
  Passed: "approved",
  Published: "approved",
  Pending: "pending",
  "Under Review": "pending",
  "In Progress": "pending",
  "Near Limit": "pending",
  Expired: "expired",
  Rejected: "expired",
  Retained: "expired",
  Inactive: "expired",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={map[status] ?? "default"} className={className}>
      {status}
    </Badge>
  )
}

export { badgeVariants }
