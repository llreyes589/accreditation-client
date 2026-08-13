import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { AuthProvider, useAuth } from "@/context/auth"
import { Loading } from "@/components/states"
import type { RoleName } from "@/api/types"

import DashboardPage from "@/pages/dashboard"
import ApprovalsPage from "@/pages/approvals"
import InstitutionsPage from "@/pages/institutions"
import InstitutionProfilePage from "@/pages/institution-profile"
import AccreditationPage from "@/pages/accreditation"
import ResidentsPage from "@/pages/residents"
import ResidentLifecyclePage from "@/pages/resident-lifecycle"
import TrainingOfficersPage from "@/pages/training-officers"
import ConsultantsPage from "@/pages/consultants"
import RotationsPage from "@/pages/rotations"
import EvaluationPage from "@/pages/evaluation"
import ResearchPage from "@/pages/research"
import CaseLogsPage from "@/pages/case-logs"
import TransfersPage from "@/pages/transfers"
import DocumentsPage from "@/pages/documents"
import SettingsPage from "@/pages/settings"
import LoginPage from "@/pages/login"
import PendingPage from "@/pages/pending"
import InspectionPage from "@/pages/inspection"
import FindingsPage from "@/pages/findings"
import { RegisterInstitutionPage, RegisterResidentPage } from "@/pages/register"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, err) => {
        const status = (err as { status?: number })?.status
        if (status && status >= 400 && status < 500) return false
        return count < 2
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

/** Requires a session; bounces unverified/unapproved users to /pending. */
function Protected({ children, roles }: { children: ReactNode; roles?: RoleName[] }) {
  const { isAuthenticated, loading, isApproved, isVerified, hasRole } = useAuth()
  const loc = useLocation()

  if (loading) return <Loading label="Restoring session…" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (!isApproved || !isVerified) return <Navigate to="/pending" replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/" replace />
  return <>{children}</>
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <Loading label="Restoring session…" />
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

const TO: RoleName[] = ["TrainingOfficer", "TrainingInstitution"]
const ADMIN: RoleName[] = ["Admin"]
const ACCREDITOR: RoleName[] = ["Accreditor"]

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register/institution" element={<PublicOnly><RegisterInstitutionPage /></PublicOnly>} />
      <Route path="/register/resident" element={<PublicOnly><RegisterResidentPage /></PublicOnly>} />
      <Route path="/pending" element={<PendingPage />} />

      <Route element={<Protected><AppShell /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="institutions" element={<InstitutionsPage />} />
        <Route path="institution-profile" element={<Protected roles={TO}><InstitutionProfilePage /></Protected>} />
        <Route path="approvals" element={<Protected roles={ADMIN}><ApprovalsPage /></Protected>} />
        <Route path="settings" element={<Protected roles={ADMIN}><SettingsPage /></Protected>} />
        <Route path="accreditation" element={<Protected roles={TO}><AccreditationPage /></Protected>} />
        <Route path="residents" element={<Protected roles={TO}><ResidentsPage /></Protected>} />
        <Route path="residents/:id" element={<Protected roles={TO}><ResidentLifecyclePage /></Protected>} />
        <Route path="training-officers" element={<Protected roles={TO}><TrainingOfficersPage /></Protected>} />
        <Route path="consultants" element={<Protected roles={TO}><ConsultantsPage /></Protected>} />
        <Route path="rotations" element={<Protected roles={TO}><RotationsPage /></Protected>} />
        <Route path="evaluation" element={<Protected roles={TO}><EvaluationPage /></Protected>} />
        <Route path="research" element={<Protected roles={TO}><ResearchPage /></Protected>} />
        <Route path="case-logs" element={<Protected roles={TO}><CaseLogsPage /></Protected>} />
        <Route path="transfers" element={<Protected roles={TO}><TransfersPage /></Protected>} />
        <Route path="documents" element={<Protected roles={TO}><DocumentsPage /></Protected>} />
        <Route path="inspection" element={<Protected roles={ACCREDITOR}><InspectionPage /></Protected>} />
        <Route path="inspection/:id" element={<Protected roles={ACCREDITOR}><InspectionPage /></Protected>} />
        <Route path="findings" element={<Protected roles={[...TO, ...ACCREDITOR, ...ADMIN]}><FindingsPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
