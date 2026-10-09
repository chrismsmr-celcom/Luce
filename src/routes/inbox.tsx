import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileAudio, FileImage, FileText, FileVideo, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { AttachmentViewer, effectiveMime, previewKind } from "@/components/luce/attachment-viewer";
import { MailBody } from "@/components/luce/mail-body";
import { Button } from "@/components/ui/button";
import { api, type MailAttachment } from "@/lib/api";
import { formatMessageTime, formatSize, senderName, useInbox } from "@/lib/luce-data";

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

// "Amina Kalala <amina@x.com>" -> { name: "Amina Kalala", email: "amina@x.com" }
function splitSender(from: string): { name: string; email: string } {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) {
    const email = m[2] ?? "";
    return { name: (m[1] ?? "").trim() || email, email };
  }
  return { name: from.trim(), email: from.includes("@") ? from.trim() : "" };
}

function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: `hsl(${hash} 55% 45%)` }}
    >
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function AttachmentIcon({ a }: { a: MailAttachment }) {
  const kind = previewKind(effectiveMime(a));
  const cls = "size-5";
  if (kind === "image") return <FileImage className={cls} />;
  if (kind === "video") return <FileVideo className={cls} />;
  if (kind === "audio") return <FileAudio className={cls} />;
  return <FileText className={cls} />;
}

function InboxPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const { connected, items, loading, error } = useInbox();
  const all = items.map((m) => ({ ...m, from: senderName(m.from), rawFrom: m.from, time: formatMessageTime(m.date) }));
  const list = tab === "all" ? all : all.filter((m) => m.source === tab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = list.find((m) => m.id === selectedId);
  const [viewing, setViewing] = useState<MailAttachment | null>(null);

  // Le détail complet (HTML + pièces jointes) n'est chargé qu'à l'ouverture d'un message.
  const detail = useQuery({
    queryKey: ["mail", selectedId],
    queryFn: () => api.mailDetail(selectedId as string),
    enabled: !!selectedId && selected?.source === "gmail",
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const sender = selected ? splitSender(detail.data?.from || selected.rawFrom) : null;
  const attachments = (detail.data?.attachments ?? []).filter(
    // On masque les images « inline » (logos de signature) : elles font partie du corps du mail.
    (a) => !(a.inline && a.mimeType.startsWith("image/")),
  );

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
            {tab === "slack" ? "La lecture de Slack arrive bientôt." : connected ? "Ta boîte de réception est vide." : "Aucune source connectée ici."}
          </p>
          {!connected && <Link to="/connexions" className="mt-2 inline-block text-sm underline">Connecter Gmail</Link>}
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
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        {m.hasAttachments && <Paperclip className="size-3" />}
                        {m.time}
                      </span>
                    </div>
                    <p className="truncate text-sm">{m.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.preview}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <div className={`min-w-0 rounded-2xl border bg-card p-4 shadow-soft sm:p-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto ${selected ? "" : "hidden lg:block"}`}>
            {selected && sender ? (
              <>
                <button onClick={() => setSelectedId(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground lg:hidden">
                  <ArrowLeft className="size-4" /> Retour
                </button>

                <h2 className="font-display text-lg font-semibold leading-snug">{detail.data?.subject || selected.subject}</h2>
                <span className="mt-2 inline-block rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {selected.source === "slack" ? "Slack" : "Gmail"}
                </span>

                <div className="mt-3 flex items-start gap-3">
                  <Avatar name={sender.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{sender.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sender.email && <span>&lt;{sender.email}&gt;</span>}
                      {detail.data?.to && <span> · à {detail.data.to}</span>}
                    </p>
                    {detail.data?.cc && <p className="truncate text-xs text-muted-foreground">Cc : {detail.data.cc}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(detail.data?.date || selected.date).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>

                <div className="mt-3 border-t pt-3">
                  {detail.isLoading ? (
                    <div className="space-y-2" aria-busy="true">
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    </div>
                  ) : detail.data ? (
                    <MailBody key={detail.data.id} html={detail.data.html} text={detail.data.text || selected.preview} />
                  ) : (
                    <>
                      {detail.error && (
                        <p className="mb-3 rounded-lg border border-destructive/40 p-3 text-xs text-destructive">
                          Impossible de charger le message complet : {detail.error.message}
                        </p>
                      )}
                      <MailBody text={selected.body || selected.preview} />
                    </>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                      <Paperclip className="size-4" /> {attachments.length} pièce{attachments.length > 1 ? "s" : ""} jointe{attachments.length > 1 ? "s" : ""}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {attachments.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setViewing(a)}
                          className="flex items-center gap-3 rounded-xl border bg-background p-3 text-left transition hover:bg-muted/60"
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                            <AttachmentIcon a={a} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{a.filename}</span>
                            <span className="block text-xs text-muted-foreground">{formatSize(a.size)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selected.source === "gmail" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline">
                      <a href={`https://mail.google.com/mail/u/0/#all/${selected.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" /> Ouvrir dans Gmail
                      </a>
                    </Button>
                  </div>
                )}

                <AttachmentViewer messageId={selected.id} attachment={viewing} onClose={() => setViewing(null)} />
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
