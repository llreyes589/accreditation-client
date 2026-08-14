import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  UserCog,
  CalendarRange,
  FlaskConical,
  ClipboardList,
  ClipboardCheck,
  GraduationCap,
  FileText,
  ArrowLeftRight,
  Settings2,
  LifeBuoy,
  AlertTriangle,
  Bell,
  FileSpreadsheet,
  X,
} from "lucide-react"
import type { RoleName } from "@/api/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth"

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  roles: RoleName[]
}

const TO: RoleName[] = ["TrainingOfficer", "TrainingInstitution"]
const ADMIN: RoleName[] = ["Admin"]
const ACCREDITOR: RoleName[] = ["Accreditor"]
const ALL: RoleName[] = ["Admin", "Accreditor", "TrainingOfficer", "Resident"]

export const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, roles: ALL },
  { to: "/approvals", label: "Approvals", icon: ShieldCheck, roles: ADMIN },
  { to: "/inspection", label: "Inspections", icon: ClipboardCheck, roles: ACCREDITOR },
  { to: "/findings", label: "Findings & Actions", icon: AlertTriangle, roles: [ ...TO, ...ACCREDITOR, ...ADMIN ] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ALL },
  { to: "/reports", label: "Reports", icon: FileSpreadsheet, roles: [ ...TO, ...ACCREDITOR, ...ADMIN ] },
  { to: "/institutions", label: "Institutions", icon: Building2, roles: ALL },
  { to: "/institution-profile", label: "Institution Profile", icon: Building2, roles: TO },
  { to: "/accreditation", label: "Accreditation", icon: FileText, roles: TO },
  { to: "/residents", label: "Residents", icon: Users, roles: TO },
  { to: "/training-officers", label: "Training Officers", icon: UserCog, roles: TO },
  { to: "/consultants", label: "Consultants", icon: UserCog, roles: TO },
  { to: "/rotations", label: "Rotations", icon: CalendarRange, roles: TO },
  { to: "/evaluation", label: "Quizzes & Exams", icon: GraduationCap, roles: TO },
  { to: "/research", label: "Research", icon: FlaskConical, roles: TO },
  { to: "/case-logs", label: "Case Logs", icon: ClipboardList, roles: TO },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, roles: TO },
  { to: "/documents", label: "Documents", icon: FileText, roles: TO },
  { to: "/settings", label: "Settings", icon: Settings2, roles: ADMIN },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { roles } = useAuth()
  const items = navItems.filter((i) => i.roles.some((r) => roles.includes(r)))

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-navy/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-navy text-slate-300 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded bg-brand text-[13px] font-bold text-white">
              PSP
            </div>
            <div className="leading-tight">
              <p className="font-display text-[13px] font-bold text-white">Accreditation Manager</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Management Console
              </p>
            </div>
          </div>
          <button className="text-slate-400 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-brand/15 text-white shadow-[inset_2px_0_0_0_var(--color-brand)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-2">
          <a className="flex items-center gap-2.5 rounded px-2.5 py-2 text-[13px] text-slate-400 hover:text-white" href="#">
            <LifeBuoy className="size-4" /> Support
          </a>
        </div>
      </aside>
    </>
  )
}
