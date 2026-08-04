import * as React from "react"
import { useNavigate, Link } from "react-router-dom"
import { ShieldCheck, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { useAuth } from "@/context/auth"
import { ApiError } from "@/api/client"

export default function LoginPage() {
  const nav = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await signIn(email, password)
      if (user.status !== "approved" || !user.email_verified_at) nav("/pending")
      else nav("/")
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError : "Unable to sign in.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded bg-brand text-sm font-bold">PSP</div>
          <span className="font-display font-bold">Accreditation Manager</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight">
            An unbreakable record of training truth.
          </h1>
          <p className="mt-4 max-w-md text-[15px] text-slate-300">
            Institution accreditation, resident training, rotations, case logs and promotion
            decisions — governed in one auditable system.
          </p>
        </div>
        <p className="text-[11px] text-slate-500">© 2026 Philippine Society of Pathologists</p>
      </div>

      <div className="flex items-center justify-center bg-canvas p-6">
        <form
          className="w-full max-w-sm space-y-4 rounded border border-slate-200 bg-white p-6"
          onSubmit={onSubmit}
        >
          <div className="flex items-center gap-2 text-brand lg:hidden">
            <ShieldCheck className="size-5" />
            <span className="font-display font-bold text-ink">PSP Accreditation Manager</span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Use your registered institutional email.
            </p>
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Lock />}
            {busy ? "Signing in…" : "Sign in securely"}
          </Button>

          <div className="space-y-1 text-center text-[12px] text-slate-500">
            <p>
              Institution not yet registered?{" "}
              <Link className="font-semibold text-brand hover:underline" to="/register/institution">
                Register institution
              </Link>
            </p>
            <p>
              Resident?{" "}
              <Link className="font-semibold text-brand hover:underline" to="/register/resident">
                Register as resident
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
