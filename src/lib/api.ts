// Thin client for the Luce Flask backend.
// Dev: Vite proxies /api to Flask (see vite.config.ts), so cookies stay same-origin.
// Prod: set VITE_API_URL if the API lives on another origin (then the backend needs
// FRONTEND_ORIGINS + SameSite=None cookies), or serve both behind one domain.

import { getAccessToken, signOut } from "./auth";

const BASE = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== "GET") {
    headers.set("Content-Type", "application/json");
    headers.set("X-Luce-Client", "web"); // required by the backend CSRF guard
  }
  const token = await getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`); // verified by backend/auth.py
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError("Impossible de joindre le serveur Luce.", 0);
  }
  if (res.status === 401 && token) void signOut(); // expired/invalid session -> back to /login
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError((data as { error?: string }).error ?? `Erreur ${res.status}`, res.status);
  return data as T;
}

export type Autonomy = "ask" | "draft" | "auto";

export type PendingAction = { id: string; tool: string; arguments: Record<string, unknown> };

export type ChatResult = {
  message: string;
  tool_called: boolean;
  autonomy: Autonomy;
  pending_actions: PendingAction[];
  pending_approvals: { tool: string; approval_id: string | null }[];
};

export type Me = { toolkits: string[]; autonomy: Autonomy; pending_actions: PendingAction[] };

export type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  size: number | null;
  url?: string;
};

export type RealMessage = {
  id: string;
  source: "gmail" | "slack";
  from: string;
  subject: string;
  preview: string;
  body?: string;
  html?: string;
  date: string;
  unread: boolean;
  priority: boolean;
  attachments?: Attachment[];
};

export type RealEvent = { id: string; title: string; start: string; end: string; allDay: boolean; who: string };
export type RealFile = {
  id: string;
  name: string;
  type: "pdf" | "doc" | "sheet" | "slides" | "image" | "folder";
  owner: string;
  modified: string;
  size: number | null;
  link: string;
};

export type RealArtifact = {
  id: string;
  kind: "reply" | "action" | "summary" | "reminder" | "alert";
  title: string;
  body: string;
  sources: string[];
  urgency: "high" | "normal" | "low";
  hasAction: boolean;
  actionTool: string | null;
  status: "new" | "processing" | "done";
  note: string | null;
  created: string;
};

export const api = {
  me: () => request<Me>("/api/me"),
  connections: () => request<Record<string, boolean>>("/api/connections"),
  connect: (toolkit: string) =>
    request<{ id: string | null; redirect_url: string }>(
      `/api/connect/${encodeURIComponent(toolkit)}`,
      { method: "POST" },
    ),
  chat: (message: string) =>
    request<ChatResult>("/api/chat", { method: "POST", body: JSON.stringify({ message }) }),
  history: () =>
    request<{ messages: { role: "user" | "assistant"; content: string }[] }>("/api/history"),
  setAutonomy: (autonomy: Autonomy) =>
    request<{ autonomy: Autonomy }>("/api/settings", {
      method: "POST",
      body: JSON.stringify({ autonomy }),
    }),
  confirmAction: (id: string) =>
    request<{ success: boolean; pending_approval: boolean; blocked: boolean; error?: string }>(
      `/api/actions/${id}/confirm`,
      { method: "POST" },
    ),
  rejectAction: (id: string) =>
    request<{ success: boolean }>(`/api/actions/${id}/reject`, { method: "POST" }),
  deleteAccount: () => request<{ success: boolean }>("/api/account/delete", { method: "POST" }),
  inbox: () => request<{ items: RealMessage[] }>("/api/data/inbox"),
  agenda: () =>
    request<{ items: RealEvent[] }>(`/api/data/agenda?tz=${new Date().getTimezoneOffset()}`),
  files: () => request<{ items: RealFile[] }>("/api/data/files"),
  artifacts: () => request<{ items: RealArtifact[] }>("/api/artifacts"),
  generateArtifacts: () =>
    request<{ created: number; connected: string[]; note: string | null; items: RealArtifact[] }>(
      "/api/artifacts/generate",
      { method: "POST" },
    ),
  approveArtifact: (id: string) =>
    request<{ success: boolean; pending_approval: boolean; blocked: boolean; error?: string }>(
      `/api/artifacts/${id}/approve`,
      { method: "POST" },
    ),
  dismissArtifact: (id: string) =>
    request<{ success: boolean }>(`/api/artifacts/${id}/dismiss`, { method: "POST" }),
};
