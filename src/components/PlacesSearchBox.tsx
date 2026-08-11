import * as React from "react"
import { MapPin, Loader2 } from "lucide-react"
import { usePlacesSearch } from "@/api/hooks"
import type { PlacesResult } from "@/api/types"

export function PlacesSearchBox({
  onSelect,
  placeholder = "Search a place…",
}: {
  onSelect: (p: PlacesResult) => void
  value?: string
  placeholder?: string
}) {
  const [q, setQ] = React.useState("")
  const [debounced, setDebounced] = React.useState("")
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const { data, isFetching } = usePlacesSearch(debounced)

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="h-9 w-full rounded border border-slate-300 bg-white pl-8 pr-3 text-[13px] focus-visible:border-brand focus-visible:outline-none"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
      {open && data && data.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-slate-200 bg-white shadow">
          {data.map((p, i) => (
            <li key={(p.raw?.place_id as string | number | undefined) ?? i}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-[13px] hover:bg-slate-50"
                onMouseDown={() => {
                  onSelect(p)
                  setQ(p.label)
                  setOpen(false)
                }}
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <span>{p.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
