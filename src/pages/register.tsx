import * as React from "react"
import { Link } from "react-router-dom"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label, Select } from "@/components/ui/input"
import { useRegisterInstitution, useRegisterResident, usePublicInstitutions } from "@/api/hooks"
import { ApiError } from "@/api/client"
import type { Track } from "@/api/types"

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/login" className="mb-6 flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded bg-navy text-sm font-bold text-white">PSP</div>
          <span className="font-display font-bold">Accreditation Manager</span>
        </Link>
        <div className="rounded border border-slate-200 bg-white p-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

function Success({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
      <CheckCircle2 className="size-6 text-emerald-600" />
      <p className="text-[13px] font-semibold text-emerald-800">Registration submitted</p>
      <p className="max-w-sm text-[13px] text-emerald-700/80">{message}</p>
      <Button asChild variant="outline" size="sm"><Link to="/login">Back to sign in</Link></Button>
    </div>
  )
}

function useFormError() {
  const [error, setError] = React.useState<ApiError | null>(null)
  const fieldError = (name: string) => error?.errors?.[name]?.[0]
  return { error, setError, fieldError }
}

function ErrorBanner({ error }: { error: ApiError | null }) {
  if (!error) return null
  return (
    <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
      {error.firstError}
    </p>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-[12px] text-red-600">{error}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function RegisterInstitutionPage() {
  const mut = useRegisterInstitution()
  const { error, setError, fieldError } = useFormError()
  const [done, setDone] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await mut.mutateAsync({
        institution: {
          name: String(f.get("inst_name")),
          address: String(f.get("address") || ""),
          hospital_level: String(f.get("hospital_level") || ""),
        },
        name: String(f.get("name")),
        email: String(f.get("email")),
        password: String(f.get("password")),
        password_confirmation: String(f.get("password_confirmation")),
        username: String(f.get("username")),
        phone: String(f.get("phone") || ""),
        telegram_handle: String(f.get("telegram_handle") || ""),
      })
      setDone(res.message)
    } catch (err) {
      if (err instanceof ApiError) setError(err)
    }
  }

  return (
    <Shell
      title="Register Training Institution"
      subtitle="Creates the institution and its owner account. Verify your email and wait for Admin approval. Add Training Officers afterward."
    >
      {done ? (
        <Success message={done} />
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <ErrorBanner error={error} />
          <p className="label-caps">Institution</p>
          <Field label="Institution Name" error={fieldError("institution.name")}>
            <Input name="inst_name" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address" error={fieldError("institution.address")}>
              <Input name="address" />
            </Field>
            <Field label="Hospital Level" error={fieldError("institution.hospital_level")}>
              <Input name="hospital_level" placeholder="e.g. Level 3" />
            </Field>
          </div>

          <p className="label-caps pt-2">Owner Account</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={fieldError("name")}><Input name="name" required /></Field>
            <Field label="Username" error={fieldError("username")}><Input name="username" required autoComplete="username" /></Field>
            <Field label="Email" error={fieldError("email")}><Input name="email" type="email" required /></Field>
            <Field label="Password" error={fieldError("password")}>
              <Input name="password" type="password" minLength={8} required />
            </Field>
            <Field label="Confirm Password">
              <Input name="password_confirmation" type="password" minLength={8} required />
            </Field>
            <Field label="Contact Number" error={fieldError("phone")}><Input name="phone" /></Field>
            <Field label="Telegram" error={fieldError("telegram_handle")}><Input name="telegram_handle" /></Field>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="animate-spin" />}
            Submit registration
          </Button>
        </form>
      )}
    </Shell>
  )
}

/* ------------------------------------------------------------------ */

export function RegisterResidentPage() {
  const mut = useRegisterResident()
  const institutions = usePublicInstitutions()
  const { error, setError, fieldError } = useFormError()
  const [done, setDone] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const f = new FormData(e.currentTarget)
    try {
      const res = await mut.mutateAsync({
        institution_id: Number(f.get("institution_id")),
        name: String(f.get("name")),
        email: String(f.get("email")),
        password: String(f.get("password")),
        password_confirmation: String(f.get("password_confirmation")),
        track: String(f.get("track")) as Track,
        username: String(f.get("username")),
        date_accepted: String(f.get("date_accepted") || "") || undefined,
        age_at_enrollment: f.get("age_at_enrollment")
          ? Number(f.get("age_at_enrollment"))
          : undefined,
      })
      setDone(res.message)
    } catch (err) {
      if (err instanceof ApiError) setError(err)
    }
  }

  return (
    <Shell
      title="Register as Resident"
      subtitle="You may only register with an approved training institution. Year level is computed from your Date Accepted."
    >
      {done ? (
        <Success message={done} />
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <ErrorBanner error={error} />
          <Field label="Training Institution" error={fieldError("institution_id")}>
            <Select name="institution_id" required defaultValue="">
              <option value="" disabled>
                {institutions.isLoading ? "Loading institutions…" : "Select an institution"}
              </option>
              {(institutions.data ?? []).map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                  {i.hospital_level ? ` — ${i.hospital_level}` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={fieldError("name")}><Input name="name" required /></Field>
            <Field label="Username" error={fieldError("username")}><Input name="username" required autoComplete="username" /></Field>
            <Field label="Email" error={fieldError("email")}><Input name="email" type="email" required /></Field>
            <Field label="Password" error={fieldError("password")}>
              <Input name="password" type="password" minLength={8} required />
            </Field>
            <Field label="Confirm Password">
              <Input name="password_confirmation" type="password" minLength={8} required />
            </Field>
            <Field label="Training Track" error={fieldError("track")}>
              <Select name="track" required defaultValue="AP_CP">
                <option value="AP">AP</option>
                <option value="CP">CP</option>
                <option value="AP_CP">AP/CP</option>
              </Select>
            </Field>
            <Field label="Date Accepted" error={fieldError("date_accepted")}>
              <Input name="date_accepted" type="date" />
            </Field>
            <Field label="Age at Enrollment" error={fieldError("age_at_enrollment")}>
              <Input name="age_at_enrollment" type="number" min={0} />
            </Field>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={mut.isPending}>
            {mut.isPending && <Loader2 className="animate-spin" />}
            Submit registration
          </Button>
        </form>
      )}
    </Shell>
  )
}
