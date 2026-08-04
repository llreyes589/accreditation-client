import { MailCheck, Clock, LogOut, RefreshCw } from "lucide-react"
import { usePendingApproval } from "@/api/hooks"
import { resendVerification } from "@/api/endpoints"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth"
import * as React from "react"

export default function PendingPage() {
  const { data, refetch, isFetching } = usePendingApproval()
  const { signOut } = useAuth()
  const [sent, setSent] = React.useState(false)

  const verified = data?.email_verified
  const status = data?.status ?? "pending"

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-md space-y-4 rounded border border-slate-200 bg-white p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50">
          <Clock className="size-5 text-amber-600" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Awaiting activation</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Your account must be email-verified and approved by an Admin before you can access the
            console.
          </p>
        </div>

        <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[13px]">Email verification</span>
            <StatusBadge status={verified ? "Verified" : "Pending"} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px]">Admin approval</span>
            <StatusBadge status={status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"} />
          </div>
        </div>

        {!verified && (
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await resendVerification()
              setSent(true)
            }}
          >
            <MailCheck /> {sent ? "Verification email sent" : "Resend verification email"}
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="subtle" className="flex-1" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "animate-spin" : ""} /> Refresh status
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => signOut()}>
            <LogOut /> Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
