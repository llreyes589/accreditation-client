import { Outlet } from "react-router-dom"
import * as React from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export function AppShell() {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
