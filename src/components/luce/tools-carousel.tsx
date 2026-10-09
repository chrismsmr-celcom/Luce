import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plug } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useConnections, type ToolkitId } from "@/lib/luce-store";

// Outils déjà affichés ailleurs sur la page d'accueil (inbox, agenda, à valider).
const EXCLUDED: ToolkitId[] = ["gmail", "slack", "googlecalendar"];
const INTERVAL = 5000;

// Libellés conviviaux pour les outils sans page dédiée.
const TOOL_META: Record<string, { name: string; mark: string; blurb: string; to: string }> = {
  googledrive: { name: "Google Drive", mark: "D", blurb: "Tes documents récents.", to: "/dossiers" },
  github: { name: "GitHub", mark: "G", blurb: "Repos, issues et pull requests.", to: "/connexions" },
  twitter: { name: "X (Twitter)", mark: "X", blurb: "Tes posts et mentions.", to: "/connexions" },
  whatsapp: { name: "WhatsApp", mark: "W", blurb: "Tes messages.", to: "/connexions" },
  supabase: { name: "Supabase", mark: "B", blurb: "Tes bases de données.", to: "/connexions" },
};

// Données réelles pour un outil (extension : ajoute ici les futurs endpoints /api/data/*).
function useToolSnapshot(id: ToolkitId) {
  const files = useQuery({
    queryKey: ["data", "files"],
    queryFn: api.files,
    enabled: id === "googledrive",
    staleTime: 60_000,
    retry: 1,
  });

  if (id === "googledrive") {
    const items = (files.data?.items ?? []).slice(0, 4);
    return {
      headline: items.length ? `${items.length} documents récents` : "Aucun document récent",
      items: items.map((f) => `${f.name} · ${f.modified}`),
      loading: files.isLoading,
    };
  }

  return {
    headline: TOOL_META[id]?.blurb ?? "Outil connecté.",
    items: [] as string[],
    loading: false,
  };
}

function ToolCard({ id }: { id: ToolkitId }) {
  const meta = TOOL_META[id] ?? { name: id, mark: id[0]?.toUpperCase() ?? "?", blurb: "Outil connecté.", to: "/connexions" };
  const snap = useToolSnapshot(id);

  return (
    <div className="w-full shrink-0 p-5 pb-16 sm:p-6 sm:pb-16">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">{meta.mark}</div>
        <div className="min-w-0">
          <h2 className="truncate font-display font-semibold">{meta.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{snap.loading ? "Chargement…" : snap.headline}</p>
        </div>
      </div>
      {snap.items.length > 0 ? (
        <ul className="mt-4 hidden divide-y sm:block">
          {snap.items.map((item) => (
            <li key={item} className="truncate py-2 text-sm">{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Les données de cet outil s'afficheront ici dès qu'un endpoint <code className="rounded bg-muted px-1 text-xs">/api/data/{id}</code> existera côté backend.
        </p>
      )}
    </div>
  );
}

export function ToolsCarousel() {
  const [connected, , { loading }] = useConnections();
  const tools = connected.filter((id) => !EXCLUDED.includes(id));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= tools.length) setIndex(0);
  }, [tools.length, index]);

  // Défilement automatique uniquement quand il y a plusieurs outils connectés.
  useEffect(() => {
    if (paused || tools.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % tools.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused, tools.length]);

  if (loading)
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
          <p className="text-sm text-muted-foreground">Connecte Drive, GitHub, X, WhatsApp… pour voir leurs données ici.</p>
          <Link to="/connexions" className="mt-2 inline-block text-sm font-medium underline">Ajouter un outil</Link>
        </div>
      </section>
    );

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {tools.map((id) => (
          <ToolCard key={id} id={id} />
        ))}
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6">
        <div className="flex items-center gap-1.5">
          {tools.map((t, i) => (
            <button
              key={t}
              aria-label={`Voir l'outil ${TOOL_META[t]?.name ?? t}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-secondary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <Link
          to={TOOL_META[tools[index]]?.to ?? "/connexions"}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
        >
          Ouvrir <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
