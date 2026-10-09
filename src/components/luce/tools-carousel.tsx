import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plug } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Version 2 — le composant ne connaît AUCUN outil en dur.
// Tout vient d'un seul endpoint backend : GET /api/data/snapshots
// qui renvoie { tools: ToolSnapshot[] } pour chaque outil connecté
// (hors messagerie / agenda, exclus côté backend).
//
// Types partagés — à mettre dans src/lib/api.ts (ou un types.ts).
// ---------------------------------------------------------------------------

export interface ToolSnapshotItem {
  label: string;   // ex. " Rapport Q3.pdf"
  detail?: string; // ex. "modifié il y a 2 h"
}

export interface ToolSnapshot {
  id: string;      // identifiant toolkit Composio, ex. "googledrive"
  name: string;    // ex. "Google Drive"
  headline: string; // ex. "4 éléments récents"
  items: ToolSnapshotItem[];
  to?: string;     // route frontend dédiée, sinon /connexions
}

// ---------------------------------------------------------------------------
// Dans api.ts, ajouter :
//
//   export const api = {
//     ...,
//     toolSnapshots: () =>
//       request<ToolSnapshot[]>("/api/data/snapshots"), // cf. ton helper request()
//   };
//
// Le helper request() ajoute déjà le Bearer token ; on garde aussi le
// pattern `enabled: !!session` pour éviter la race 401 au chargement.
// ---------------------------------------------------------------------------

const INTERVAL = 5000;

export function ToolsCarousel({ session }: { session: unknown }) {
  const { data, isLoading } = useQuery({
    queryKey: ["data", "tool-snapshots"],
    queryFn: api.toolSnapshots,
    enabled: !!session, // ne part qu'une fois la session (donc le token) prête
    staleTime: 60_000,
    retry: 1,
  });

  const tools = data ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= tools.length) setIndex(0);
  }, [tools.length, index]);

  // Défilement automatique selon le nombre d'outils connectés.
  useEffect(() => {
    if (paused || tools.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % tools.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused, tools.length]);

  if (isLoading)
    return (
      <section className="mt-4 grid min-h-56 place-items-center rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Chargement des outils…
      </section>
    );

  if (tools.length === 0)
    return (
      <section className="mt-4 grid min-h-56 place-items-center rounded-2xl border border-dashed bg-card p-6 text-center">
        <div>
          <Plug className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Connecte des outils (Drive, GitHub, Notion, CRM…) pour voir leurs données ici.
          </p>
          <Link to="/connexions" className="mt-2 inline-block text-sm font-medium underline">
            Ajouter un outil
          </Link>
        </div>
      </section>
    );

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {tools.map((tool) => (
          <div key={tool.id} className="w-full shrink-0 p-5 pb-16 sm:p-6 sm:pb-16">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">
                {tool.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-display font-semibold">{tool.name}</h2>
                <p className="truncate text-xs text-muted-foreground">{tool.headline}</p>
              </div>
            </div>
            {tool.items.length > 0 ? (
              <ul className="mt-4 hidden divide-y sm:block">
                {tool.items.map((item) => (
                  <li key={item.label} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="truncate">{item.label}</span>
                    {item.detail && (
                      <span className="shrink-0 text-xs text-muted-foreground">{item.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Connecté — aucune donnée récente disponible pour le moment.
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6">
        <div className="flex items-center gap-1.5">
          {tools.map((tool, i) => (
            <button
              key={tool.id}
              aria-label={`Voir l'outil ${tool.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-secondary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        <Link
          to={tools[index]?.to ?? "/connexions"}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
        >
          Ouvrir <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
