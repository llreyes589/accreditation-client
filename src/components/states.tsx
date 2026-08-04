import type { ReactNode } from "react"
import { Loader2, AlertTriangle, Inbox } from "lucide-react"
import { ApiError } from "@/api/client"
import { Button } from "@/components/ui/button"

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-slate-500">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry?: () => void
}) {
  const e = error as ApiError | Error
  const status = e instanceof ApiError ? e.status : undefined
  const msg =
    e instanceof ApiError
      ? status === 403
        ? "Your role does not have access to this resource."
        : e.firstError
      : (e?.message ?? "Something went wrong.")

  return (
    <div className="flex flex-col items-center gap-3 rounded border border-red-200 bg-red-50/60 px-4 py-8 text-center">
      <AlertTriangle className="size-5 text-red-600" />
      <div>
        <p className="text-[13px] font-semibold text-red-800">
          {status ? `Error ${status}` : "Request failed"}
        </p>
        <p className="mt-0.5 text-[13px] text-red-700/80">{msg}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="size-5 text-slate-300" />
      <p className="text-[13px] text-slate-500">{children}</p>
    </div>
  )
}

/** Renders the right state for a react-query result. */
export function QueryBoundary<T>({
  query,
  children,
  empty,
}: {
  query: { data?: T; isLoading: boolean; error: unknown; refetch: () => void }
  children: (data: T) => ReactNode
  empty?: ReactNode
}) {
  if (query.isLoading) return <Loading />
  if (query.error) return <ErrorState error={query.error} onRetry={query.refetch} />
  if (query.data == null) return <>{empty ?? <Empty>No data.</Empty>}</>
  if (Array.isArray(query.data) && query.data.length === 0)
    return <>{empty ?? <Empty>Nothing here yet.</Empty>}</>
  return <>{children(query.data)}</>
}
