import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Reply, Sparkle, FileText, Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { formatMessageTime, senderName, useInbox } from "@/lib/luce-data";
import type { Attachment } from "@/lib/api";
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
  const { connected, items, loading, error } = useInbox();
  const all = items.map((m) => ({
    ...m,
    from: senderName(m.from),
    time: formatMessageTime(m.date),
  }));
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

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Chargement de tes messages…</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-card p-6 text-sm text-destructive">{error.message}</div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">
            {tab === "slack"
              ? "La lecture de Slack arrive bientôt."
              : connected
                ? "Ta boîte de réception est vide."
                : "Aucune source connectée ici."}
          </p>
          {!connected && (
            <Link to="/connexions" className="mt-2 inline-block text-sm underline">Connecter Gmail</Link>
          )}
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
                
                {/* RENDU RICHE DU CONTENU */}
                <div className="mt-6 prose prose-sm max-w-none text-gray-800">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        if (!href) return <a>{children}</a>;
                        const ext = href.split(".").pop()?.toLowerCase();
                        if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
                          return <img src={href} alt={String(children)} className="max-w-full h-auto rounded-xl border border-gray-200 my-4" />;
                        }
                        if (ext === "pdf") {
                          return (
                            <div className="my-4 rounded-xl border border-gray-200 overflow-hidden">
                              <div className="bg-gray-100 p-3 flex items-center gap-2 border-b border-gray-200">
                                <FileText className="w-5 h-5 text-red-500" />
                                <span className="font-medium text-sm text-gray-700">Aperçu PDF</span>
                              </div>
                              <iframe src={href} className="w-full h-96 border-none" title="PDF Viewer" />
                            </div>
                          );
                        }
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            {children} <ExternalLink className="w-3 h-3" />
                          </a>
                        );
                      },
                    }}
                  >
                    {selected.html || selected.body || selected.preview || ""}
                  </ReactMarkdown>

                  {/* AFFICHAGE DES PIÈCES JOINTES */}
                  {selected.attachments && selected.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Pièces jointes ({selected.attachments.length})</h3>
                      <div className="grid gap-3">
                        {selected.attachments.map((att: Attachment) => (
                          <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{att.filename}</p>
                              <p className="text-xs text-gray-500">{att.mimeType}</p>
                            </div>
                            {att.url && (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white rounded-md">
                                <Download className="w-4 h-4 text-gray-600" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

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
