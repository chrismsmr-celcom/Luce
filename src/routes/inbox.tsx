import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Reply, Sparkle } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { EMAILS, SLACK } from "@/lib/luce-demo";
import { useConnections } from "@/lib/luce-store";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Luce" },
      { name: "description", content: "Tes emails Gmail et messages Slack réunis et triés par Luce." },
      { property: "og:title", content: "Inbox — Luce" },
      { property: "og:description", content: "Gmail et Slack réunis dans une seule inbox intelligente." },
    ],
  }),
  component: InboxPage,
});

const TABS = [
  { id: "all", label: "Tout" },
  { id: "gmail", label: "Gmail" },
  { id: "slack", label: "Slack" },
] as const;

function InboxPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [connections] = useConnections();
  const all = [...EMAILS, ...SLACK].filter((m) =>
    m.source === "gmail" ? connections.includes("gmail") : connections.includes("slack"),
  );
  const list = tab === "all" ? all : all.filter((m) => m.source === tab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = list.find((m) => m.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Inbox" subtitle="Gmail et Slack, triés par priorité." />
      <div className="mb-4 inline-flex rounded-xl border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${tab === t.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Aucune source connectée ici.</p>
          <Link to="/connexions" className="mt-2 inline-block text-sm underline">Connecter Gmail ou Slack</Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <ul className={`divide-y overflow-hidden rounded-2xl border bg-card shadow-soft ${selected ? "hidden lg:block" : ""}`}>
            {list.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelectedId(m.id)}
                  className={`flex w-full gap-3 p-4 text-left hover:bg-muted/60 ${selectedId === m.id ? "bg-accent/60" : ""}`}
                >
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.unread ? "bg-success" : "bg-transparent"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${m.unread ? "font-semibold" : ""}`}>{m.from}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{m.time}</span>
                    </div>
                    <p className="truncate text-sm">{m.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className={`rounded-2xl border bg-card p-5 shadow-soft sm:p-6 ${selected ? "" : "hidden lg:block"}`}>
            {selected ? (
              <>
                <button onClick={() => setSelectedId(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground lg:hidden">
                  <ArrowLeft className="size-4" /> Retour
                </button>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {selected.source === "slack" ? "Slack" : "Gmail"}
                </span>
                <h2 className="mt-3 font-display text-xl font-semibold">{selected.subject}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selected.from} · {selected.time}</p>
                <p className="mt-6 leading-relaxed">{selected.preview}</p>
                <div className="mt-6 rounded-xl bg-muted p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Sparkle className="size-3.5" /> Suggestion de Luce
                  </p>
                  <p className="mt-2 text-sm">Répondre que tu valides et proposer un appel demain à 10h.</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => toast.success("Brouillon créé dans Artefacts")}>
                    <Sparkle className="size-4" /> Luce rédige la réponse
                  </Button>
                  <Button variant="outline"><Reply className="size-4" /> Répondre</Button>
                </div>
              </>
            ) : (
              <p className="grid h-full min-h-60 place-items-center text-sm text-muted-foreground">Sélectionne un message</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
