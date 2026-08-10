import * as React from "react"
import { Save, Loader2, CheckCircle2 } from "lucide-react"
import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useInstitutionProfile, useUpdateInstitutionProfile, usePsgcRegions, usePsgcProvinces, usePsgcCities } from "@/api/hooks"
import { ApiError } from "@/api/client"
import type { Institution } from "@/api/types"

export default function InstitutionProfilePage() {
  const q = useInstitutionProfile()
  const mut = useUpdateInstitutionProfile()
  const [err, setErr] = React.useState<string | null>(null)
  const [ok, setOk] = React.useState(false)

  const [form, setForm] = React.useState<Institution | null>(null)
  React.useEffect(() => {
    if (q.data) setForm(q.data)
  }, [q.data])

  const regions = usePsgcRegions()
  const provinces = usePsgcProvinces(form?.region || undefined)
  const cities = usePsgcCities(form?.province || undefined)

  if (q.isLoading) return <p className="text-slate-500">Loading profile…</p>
  if (q.error) return <p className="text-red-600">Failed to load institution profile.</p>
  if (!form) return null

  function set<K extends keyof Institution>(key: K, value: Institution[K], reset?: Partial<Institution>) {
    setForm((f) => (f ? { ...f, [key]: value, ...reset } : f))
  }

  async function save() {
    if (!form) return
    setErr(null)
    setOk(false)
    try {
      await mut.mutateAsync({
        name: String(form.name),
        address: form.address ?? undefined,
        hospital_level: form.hospital_level ?? undefined,
        laboratory_level: form.laboratory_level ?? undefined,
        bsf_category: form.bsf_category ?? undefined,
        director: form.director ?? undefined,
        chairman: form.chairman ?? undefined,
        contact_number: form.contact_number ?? undefined,
        email: form.email ?? undefined,
        year_program_opened: form.year_program_opened ?? undefined,
        region: form.region ?? undefined,
        province: form.province ?? undefined,
        city: form.city ?? undefined,
      })
      setOk(true)
    } catch (e) {
      setErr(e instanceof ApiError ? e.firstError : "Failed to save profile.")
    }
  }

  return (
    <>
      <PageHeader
        title="Institution Profile"
        description="Manage your training institution's registered details"
        actions={
          <Button size="sm" onClick={save} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="animate-spin" /> : <Save />} Save profile
          </Button>
        }
      />

      {err && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</p>
      )}
      {ok && (
        <p className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
          <CheckCircle2 className="size-4" /> Profile saved.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>All fields are visible in the national registry once approved</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Institution Name">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Hospital Level">
              <Input value={form.hospital_level ?? ""} placeholder="e.g. Level 3" onChange={(e) => set("hospital_level", e.target.value)} />
            </Field>
            <Field label="Address">
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Laboratory Level">
              <Input value={form.laboratory_level ?? ""} placeholder="e.g. Lab 2" onChange={(e) => set("laboratory_level", e.target.value)} />
            </Field>
            <Field label="BSF Category">
              <Input value={form.bsf_category ?? ""} placeholder="e.g. A" onChange={(e) => set("bsf_category", e.target.value)} />
            </Field>
            <Field label="Director / Hospital Chief">
              <Input value={form.director ?? ""} onChange={(e) => set("director", e.target.value)} />
            </Field>
            <Field label="Chairman">
              <Input value={form.chairman ?? ""} onChange={(e) => set("chairman", e.target.value)} />
            </Field>
            <Field label="Contact Number">
              <Input value={form.contact_number ?? ""} onChange={(e) => set("contact_number", e.target.value)} />
            </Field>
            <Field label="Institution Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Year Program Opened">
              <Input
                type="number"
                min={1900}
                max={2100}
                value={form.year_program_opened ?? ""}
                onChange={(e) => set("year_program_opened", e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
            <Field label="Region">
              <Select
                value={form.region ?? ""}
                onChange={(e) => set("region", e.target.value || null, { province: null, city: null })}
              >
                <option value="">{regions.isLoading ? "Loading…" : "Select region"}</option>
                {(regions.data ?? []).map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Province">
              <Select
                value={form.province ?? ""}
                disabled={!form.region}
                onChange={(e) => set("province", e.target.value || null, { city: null })}
              >
                <option value="">{form.region ? (provinces.isLoading ? "Loading…" : "Select province") : "Select region first"}</option>
                {(provinces.data ?? []).map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Select
                value={form.city ?? ""}
                disabled={!form.province}
                onChange={(e) => set("city", e.target.value || null)}
              >
                <option value="">{form.province ? (cities.isLoading ? "Loading…" : "Select city") : "Select province first"}</option>
                {(cities.data ?? []).map((o) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
