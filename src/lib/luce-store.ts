import { useCallback, useEffect, useState } from "react";

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
  | "github"
  | "twitter"
  | "whatsapp"
  | "supabase";

export const TOOLKITS: { id: ToolkitId; name: string; desc: string; mark: string }[] = [
  { id: "gmail", name: "Gmail", desc: "Lire, trier et répondre aux emails.", mark: "M" },
  { id: "slack", name: "Slack", desc: "Suivre canaux et messages directs.", mark: "S" },
  { id: "googledrive", name: "Google Drive", desc: "Accéder à tes documents.", mark: "D" },
  { id: "googlecalendar", name: "Google Calendar", desc: "Gérer ton agenda.", mark: "C" },
  { id: "github", name: "GitHub", desc: "Repos, issues et pull requests.", mark: "G" },
  { id: "twitter", name: "X (Twitter)", desc: "Rédiger et publier tes posts.", mark: "X" },
  { id: "whatsapp", name: "WhatsApp", desc: "Envoyer des messages.", mark: "W" },
  { id: "supabase", name: "Supabase", desc: "Interroger tes bases de données.", mark: "B" },
];

export function useConnections() {
  return usePersisted<ToolkitId[]>("luce.connections", ["gmail", "slack", "googledrive"]);
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
