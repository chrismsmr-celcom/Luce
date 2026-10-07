import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Brain, Pin, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/lib/luce-store";

export const Route = createFileRoute("/notebook")({
  head: () => ({
    meta: [
      { title: "Notebook — Luce" },
      { name: "description", content: "Le carnet et la mémoire de Luce : notes, préférences et contexte." },
      { property: "og:title", content: "Notebook — Luce" },
      { property: "og:description", content: "La mémoire de ton chef de cabinet IA." },
    ],
  }),
  component: Notebook,
});

function Notebook() {
  const [notes, setNotes] = useNotes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  const active = notes.find((n) => n.id === activeId);

  const patch = (id: string, p: Partial<(typeof notes)[number]>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...p, updatedAt: Date.now() } : n)));
  const create = () => {
    const n = { id: crypto.randomUUID(), title: "Nouvelle note", body: "", pinned: false, updatedAt: Date.now() };
    setNotes((ns) => [n, ...ns]);
    setActiveId(n.id);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Notebook"
        subtitle="Ce que Luce retient sur toi et ton travail."
        action={<Button onClick={create}><Plus className="size-4" /> <span className="hidden sm:inline">Note</span></Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <ul className={`space-y-2 ${active ? "hidden lg:block" : ""}`}>
          {sorted.map((n) => (
            <li key={n.id}>
              <button onClick={() => setActiveId(n.id)} className={`w-full rounded-2xl border p-4 text-left shadow-soft ${activeId === n.id ? "border-transparent bg-secondary text-secondary-foreground" : "bg-card"}`}>
                <div className="flex items-center gap-2">
                  {n.pinned && <Brain className="size-3.5 shrink-0 text-success" />}
                  <span className="truncate text-sm font-medium">{n.title || "Sans titre"}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs opacity-70">{n.body || "Vide"}</p>
              </button>
            </li>
          ))}
        </ul>
        <div className={`rounded-2xl border bg-card p-4 shadow-soft sm:p-6 ${active ? "" : "hidden lg:block"}`}>
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2">
                <button onClick={() => setActiveId(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground lg:hidden">
                  <ArrowLeft className="size-4" /> Retour
                </button>
                <div className="ml-auto flex gap-1">
                  <Button variant={active.pinned ? "default" : "outline"} size="sm" onClick={() => patch(active.id, { pinned: !active.pinned })}>
                    <Pin className="size-4" /> {active.pinned ? "En mémoire" : "Mémoriser"}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => { setNotes((ns) => ns.filter((n) => n.id !== active.id)); setActiveId(null); }}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <input value={active.title} onChange={(e) => patch(active.id, { title: e.target.value })} className="w-full bg-transparent font-display text-2xl font-semibold outline-none" />
              <textarea value={active.body} onChange={(e) => patch(active.id, { body: e.target.value })} placeholder="Écris ici…" className="mt-3 min-h-[50vh] w-full resize-none bg-transparent text-sm leading-relaxed outline-none" />
            </>
          ) : (
            <div className="grid min-h-60 place-items-center text-center text-sm text-muted-foreground">
              <div>
                <Brain className="mx-auto mb-2 size-6" />
                Les notes « En mémoire » sont utilisées par Luce dans toutes ses missions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
