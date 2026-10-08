import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useConnections, type ToolkitId } from "./luce-store";

// Real data from the connected tools (via the Luce backend / Composio).
// Each hook only fires when the matching tool is connected.
function useConnected(id: ToolkitId) {
  const [ids, , { loading }] = useConnections();
  return { connected: ids.includes(id), loadingConnections: loading };
}

const opts = { staleTime: 60_000, retry: 1, refetchOnWindowFocus: true } as const;

export function useInbox() {
  const { connected, loadingConnections } = useConnected("gmail");
  const q = useQuery({ queryKey: ["data", "inbox"], queryFn: api.inbox, enabled: connected, ...opts });
  return { connected, items: q.data?.items ?? [], loading: loadingConnections || (connected && q.isLoading), error: q.error as Error | null };
}

export function useAgenda() {
  const { connected, loadingConnections } = useConnected("googlecalendar");
  const q = useQuery({ queryKey: ["data", "agenda"], queryFn: api.agenda, enabled: connected, ...opts });
  return { connected, items: q.data?.items ?? [], loading: loadingConnections || (connected && q.isLoading), error: q.error as Error | null };
}

export function useFiles() {
  const { connected, loadingConnections } = useConnected("googledrive");
  const q = useQuery({ queryKey: ["data", "files"], queryFn: api.files, enabled: connected, ...opts });
  return { connected, items: q.data?.items ?? [], loading: loadingConnections || (connected && q.isLoading), error: q.error as Error | null };
}

// ---- formatting -----------------------------------------------------------

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function formatEventTime(e: { start: string; allDay: boolean }): string {
  if (e.allDay) return "Jour";
  const d = new Date(e.start);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatFileDate(iso: string): string {
  const t = formatMessageTime(iso);
  // formatMessageTime returns an HH:MM time for today
  return t.includes(":") ? "Aujourd'hui" : t;
}

export function formatSize(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

// "Amina Kalala <amina@x.com>" -> "Amina Kalala"
export function senderName(from: string): string {
  const m = from.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/);
  return (m?.[1] ?? from).trim();
}
