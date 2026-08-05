import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStore } from "@/api/client";
import * as ep from "@/api/endpoints";
import type { RoleName, User } from "@/api/types";

type AuthCtx = {
  user: User | null;
  token: string | null;
  roles: RoleName[];
  isAuthenticated: boolean;
  loading: boolean;
  /** Backend gate flags — /pending-approval mirrors these. */
  isApproved: boolean;
  isVerified: boolean;
  hasRole: (...r: RoleName[]) => boolean;
  signIn: (username: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = React.createContext<AuthCtx>(null as unknown as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [token, setToken] = React.useState<string | null>(tokenStore.get());
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(Boolean(tokenStore.get()));

  const load = React.useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // /me requires verified+approved; fall back to /pending-approval otherwise.
      const u = await ep.me();
      setUser(u);
    } catch {
      try {
        const p = await ep.pendingApproval();
        setUser({
          id: 0,
          name: "",
          username: null,
          email: "",
          status: p.status,
          email_verified_at: p.email_verified ? new Date().toISOString() : null,
          roles: [],
        });
      } catch {
        tokenStore.clear();
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const signIn = React.useCallback(
    async (username: string, password: string) => {
      const res = await ep.login(username, password);
      tokenStore.set(res.token);
      setToken(res.token);
      setUser(res.user);
      await qc.invalidateQueries();
      return res.user;
    },
    [qc],
  );

  const signOut = React.useCallback(async () => {
    try {
      await ep.logout();
    } catch {
      /* token may already be invalid — clear locally regardless */
    }
    tokenStore.clear();
    setToken(null);
    setUser(null);
    qc.clear();
  }, [qc]);

  /**
   * The database contains a legacy lowercase "admin" role alongside the
   * canonical "Admin". Normalise so legacy accounts still resolve correctly.
   */
  const roles = React.useMemo<RoleName[]>(
    () =>
      (user?.roles ?? []).map((r) =>
        r.name.toLowerCase() === "admin" ? "Admin" : (r.name as RoleName),
      ),
    [user],
  );

  const value: AuthCtx = {
    user,
    token,
    roles,
    isAuthenticated: Boolean(token && user),
    loading,
    isApproved: user?.status === "approved",
    isVerified: Boolean(user?.email_verified_at),
    hasRole: (...r) => r.some((x) => roles.includes(x)),
    signIn,
    signOut,
    refresh: load,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return React.useContext(Ctx);
}
