import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AUTH_ENABLED, supabase } from "./supabase";

export type AuthStatus = "loading" | "in" | "out";

// "loading" until the stored session is read. Without Supabase configured we are
// always "in" (local mode).
export function useAuth(): { status: AuthStatus; session: Session | null } {
  const [state, setState] = useState<{ status: AuthStatus; session: Session | null }>({
    status: "loading",
    session: null,
  });

  useEffect(() => {
    if (!supabase) {
      setState({ status: "in", session: null });
      return;
    }
    const apply = (session: Session | null) =>
      setState(session ? { status: "in", session } : { status: "out", session: null });
    let active = true;
    supabase.auth.getSession().then(({ data }) => active && apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// Bearer token the backend verifies (Authorization: Bearer <access token>).
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function signOut() {
  if (AUTH_ENABLED) await supabase?.auth.signOut();
}
