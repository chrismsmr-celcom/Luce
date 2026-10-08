import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileImage, FileSpreadsheet, FileText, Folder, Presentation, Search } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { formatFileDate, formatSize, useFiles } from "@/lib/luce-data";

export const Route = createFileRoute("/dossiers")({
  head: () => ({
    meta: [
      { title: "Dossiers — Luce" },
      { name: "description", content: "Tes fichiers Google Drive accessibles directement depuis Luce." },
      { property: "og:title", content: "Dossiers — Luce" },
      { property: "og:description", content: "Parcours tes fichiers Google Drive depuis Luce." },
    ],
  }),
  component: Dossiers,
});

const ICONS = { pdf: FileText, doc: FileText, sheet: FileSpreadsheet, slides: Presentation, image: FileImage, folder: Folder };

const KINDS = [
  { id: "doc", label: "Documents" },
  { id: "sheet", label: "Feuilles" },
  { id: "slides", label: "Présentations" },
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Images" },
  { id: "folder", label: "Dossiers" },
] as const;

function Dossiers() {
  const { connected, items, loading, error } = useFiles();
  const [folder, setFolder] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const files = items.filter((f) => (!folder || f.type === folder) && f.name.toLowerCase().includes(q.toLowerCase()));

  if (!connected)
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Dossiers" />
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Google Drive n'est pas connecté.</p>
          <Link to="/connexions" className="mt-2 inline-block text-sm underline">Connecter Google Drive</Link>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Dossiers" subtitle="Ton Google Drive, accessible à Luce." />
      <div className="mb-4 flex items-center gap-2 rounded-xl border bg-card px-3 shadow-soft">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un fichier…" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[null, ...KINDS.map((k) => k.id)].map((f) => (
          <button
            key={f ?? "all"}
            onClick={() => setFolder(f)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm ${folder === f ? "border-transparent bg-secondary text-secondary-foreground" : "bg-card"}`}
          >
            <Folder className="size-4" /> {f ? KINDS.find((k) => k.id === f)?.label : "Tous"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {files.map((f) => {
          const Icon = ICONS[f.type] ?? FileText;
          return (
            <a key={f.id} href={f.link || undefined} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition hover:-translate-y-0.5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{f.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[f.owner, formatFileDate(f.modified), formatSize(f.size)].filter(Boolean).join(" · ")}</p>
              </div>
            </a>
          );
        })}
        {loading && <p className="text-sm text-muted-foreground">Chargement de ton Drive…</p>}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        {!loading && !error && files.length === 0 && <p className="text-sm text-muted-foreground">Aucun fichier trouvé.</p>}
      </div>
    </div>
  );
}
