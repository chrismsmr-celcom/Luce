import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// Local persistence for the UI shell. Swap these hooks for calls to the Luce
// backend (/api/connections, /api/history…) once it is wired up.
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    const onSync = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.key === key) setValue(d.value);
    };
    window.addEventListener("luce-store", onSync);
    return () => window.removeEventListener("luce-store", onSync);
  }, [key]);
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        localStorage.setItem(key, JSON.stringify(v));
        queueMicrotask(() =>
          window.dispatchEvent(new CustomEvent("luce-store", { detail: { key, value: v } })),
        );
        return v;
      });
    },
    [key],
  );
  return [value, update] as const;
}

export type ToolkitId =
  | "gmail"
  | "slack"
  | "googledrive"
  | "googlecalendar"
  | "googlesheets"
  | "googlephotos"
  | "googlesearchconsole"
  | "github"
  | "twitter"
  | "whatsapp"
  | "supabase";

export const TOOLKITS: { id: ToolkitId; name: string; desc: string; mark: string }[] = [
  { id: "gmail", name: "Gmail", desc: "Lire, trier et répondre aux emails.", mark: "M" },
  { id: "slack", name: "Slack", desc: "Suivre canaux et messages directs.", mark: "S" },
  { id: "googledrive", name: "Google Drive", desc: "Accéder à tes documents.", mark: "D" },
  { id: "googlecalendar", name: "Google Calendar", desc: "Gérer ton agenda.", mark: "C" },
  {
    id: "googlesheets",
    name: "Google Sheets",
    desc: "Lire et mettre à jour tes feuilles.",
    mark: "F",
  },
  { id: "googlephotos", name: "Google Photos", desc: "Retrouver tes photos.", mark: "P" },
  {
    id: "googlesearchconsole",
    name: "Search Console",
    desc: "Suivre la performance de ton site.",
    mark: "Q",
  },
  { id: "github", name: "GitHub", desc: "Repos, issues et pull requests.", mark: "G" },
  { id: "twitter", name: "X (Twitter)", desc: "Rédiger et publier tes posts.", mark: "X" },
  { id: "whatsapp", name: "WhatsApp", desc: "Envoyer des messages.", mark: "W" },
  { id: "supabase", name: "Supabase", desc: "Interroger tes bases de données.", mark: "B" },
];

// Real connection state, read from the backend (Composio). Returns the connected
// toolkit ids and a `refresh` function; `loading`/`error` describe the last fetch.
export function useConnections() {
  const q = useQuery({ queryKey: ["connections"], queryFn: api.connections, staleTime: 15_000 });
  const qc = useQueryClient();
  const ids = Object.entries(q.data ?? {})
    .filter(([, on]) => on)
    .map(([id]) => id as ToolkitId);
  const refresh = useCallback(() => qc.invalidateQueries({ queryKey: ["connections"] }), [qc]);
  return [ids, refresh, { loading: q.isLoading, error: q.error as Error | null }] as const;
}

export type Note = { id: string; title: string; body: string; pinned: boolean; updatedAt: number };

const SEED_NOTES: Note[] = [
  {
    id: "n1",
    title: "Préférences de Christopher",
    body: "Réunions jamais avant 9h30. Réponses courtes aux emails. Priorité : clients Celcom.",
    pinned: true,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "n2",
    title: "Objectifs Q4",
    body: "- Lancer Luce v1\n- Signer 3 nouveaux clients\n- Recruter un dev backend",
    pinned: false,
    updatedAt: Date.now() - 3600000,
  },
];

export function useNotes() {
  return usePersisted<Note[]>("luce.notes", SEED_NOTES);
}

export function useSettings() {
  return usePersisted("luce.settings", {
    name: "Christopher",
    autonomy: "ask" as "ask" | "draft" | "auto",
    briefing: true,
    language: "fr",
  });
}

// The autonomy level is enforced by the backend, so the server is the source of truth.
export function useAutonomy() {
  const q = useQuery({ queryKey: ["me"], queryFn: api.me, staleTime: 30_000 });
  const qc = useQueryClient();
  const set = useCallback(
    async (level: "ask" | "draft" | "auto") => {
      await api.setAutonomy(level);
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    [qc],
  );
  return [q.data?.autonomy ?? "ask", set, { loading: q.isLoading }] as const;
}
