import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, Sparkle, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, type RealArtifact } from "@/lib/api";
import { formatMessageTime } from "@/lib/luce-data";
import { useConnections } from "@/lib/luce-store";

export const Route = createFileRoute("/artefacts")({
  head: () => ({
    meta: [
      { title: "Artefacts — Luce" },
      { name: "description", content: "Réponses, actions et résumés préparés par Luce à partir de tes outils, prêts à valider." },
      { property: "og:title", content: "Artefacts — Luce" },
      { property: "og:description", content: "Ce que Luce a préparé pour toi avant que tu le demandes." },
    ],
  }),
  component: Artefacts,
});

const KIND_LABEL: Record<RealArtifact["kind"], string> = {
  reply: "Réponse préparée",
  action: "Action proposée",
  summary: "Résumé",
  reminder: "Rappel",
  alert: "Alerte",
};

function sortArtifacts(items: RealArtifact[]) {
  const urg = { high: 0, normal: 1, low: 2 } as const;
  return [...items].sort((a, b) => {
    const sa = a.status === "done" ? 1 : 0;
    const sb = b.status === "done" ? 1 : 0;
    if (sa !== sb) return sa - sb;
    if (urg[a.urgency] !== urg[b.urgency]) return urg[a.urgency] - urg[b.urgency];
    return b.created.localeCompare(a.created);
  });
}

function Artefacts() {
  const qc = useQueryClient();
  const [connected, , { loading: loadingConnections }] = useConnections();
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({ queryKey: ["artifacts"], queryFn: api.artifacts, staleTime: 30_000 });
  const items = sortArtifacts(list.data?.items ?? []);
  const open = items.find((a) => a.id === openId) ?? null;

  const generate = useMutation({
    mutationFn: api.generateArtifacts,
    onSuccess: (r) => {
      qc.setQueryData(["artifacts"], { items: r.items });
      qc.invalidateQueries({ queryKey: ["me"] });
      if (r.note) toast(r.note);
      else if (r.created === 0) toast("Rien de nouveau pour l'instant.");
      else toast.success(`${r.created} nouvelle${r.created > 1 ? "s" : ""} proposition${r.created > 1 ? "s" : ""}`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Luce n'a pas pu analyser tes outils"),
  });

  // Première ouverture de la session avec des outils connectés : Luce fait le tour tout seul.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || loadingConnections || list.isLoading) return;
    autoRan.current = true;
    if (connected.length === 0) return;
    try {
      if (sessionStorage.getItem("luce.autogen")) return;
      sessionStorage.setItem("luce.autogen", "1");
    } catch {
      /* ignore */
    }
    generate.mutate();
  }, [loadingConnections, list.isLoading, connected.length, generate]);

  const approve = useMutation({
    mutationFn: api.approveArtifact,
    onSuccess: (r) => {
      if (r.success) toast.success("Action exécutée");
      else if (r.pending_approval) toast("En attente d'approbation Cerbère");
      else toast.error(r.error ?? "L'action n'a pas pu être exécutée");
      qc.invalidateQueries({ queryKey: ["artifacts"] });
      setOpenId(null);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Erreur");
      qc.invalidateQueries({ queryKey: ["artifacts"] });
    },
  });

  const dismiss = useMutation({
    mutationFn: api.dismissArtifact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["artifacts"] });
      setOpenId(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erreur"),
  });

  const busy = generate.isPending;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Artefacts"
        subtitle="Ce que Luce a préparé à partir de tes outils, avant que tu le demandes."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button onClick={() => generate.mutate()} disabled={busy || connected.length === 0}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkle className="size-4" />}
          {busy ? "Luce analyse tes outils…" : "Actualiser"}
        </Button>
        {connected.length > 0 && (
          <span className="text-xs text-muted-foreground">{connected.length} outil{connected.length > 1 ? "s" : ""} connecté{connected.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {list.error && (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-card p-4 text-sm text-destructive">{list.error.message}</div>
      )}

      {!loadingConnections && connected.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Luce n'a encore rien à analyser.</p>
          <Link to="/connexions" className="mt-2 inline-block text-sm underline">Connecter tes outils</Link>
        </div>
      ) : items.length === 0 && !busy && !list.isLoading ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Aucune proposition pour l'instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">Clique sur « Actualiser » pour que Luce fasse le tour de tes outils.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenId(a.id)}
              className={`flex flex-col rounded-2xl border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 ${a.status === "done" ? "opacity-70" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{KIND_LABEL[a.kind]}</span>
                <span className="flex items-center gap-1.5">
                  {a.urgency === "high" && a.status !== "done" && (
                    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-medium text-destructive-foreground">Urgent</span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${a.status === "done" ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}>
                    {a.status === "done" ? "Fait" : "À valider"}
                  </span>
                </span>
              </div>
              <h3 className="mt-3 font-display font-semibold">{a.title}</h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {a.sources.map((s) => (
                  <span key={s} className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{s}</span>
                ))}
                <span className="ml-auto text-xs text-muted-foreground">{formatMessageTime(a.created.replace(" ", "T") + (a.created.includes("+") || a.created.endsWith("Z") ? "" : "Z"))}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{KIND_LABEL[open.kind]}</span>
                <SheetTitle className="font-display text-xl">{open.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 whitespace-pre-line break-words rounded-xl bg-muted p-4 text-sm leading-relaxed">{open.body}</div>
              {open.sources.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">Sources : {open.sources.join(", ")}</p>
              )}
              {open.hasAction && open.status !== "done" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {open.actionTool?.includes("DRAFT")
                    ? "« Valider » crée ce brouillon dans ton Gmail (dossier Brouillons). Rien n'est envoyé : tu relis et tu envoies toi-même."
                    : `« Valider » exécute l'action préparée (${open.actionTool}). Rien ne part avant ton clic.`}
                </p>
              )}
              {open.note && <p className="mt-3 text-xs text-muted-foreground">{open.note}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {open.status !== "done" && (
                  <Button onClick={() => approve.mutate(open.id)} disabled={approve.isPending}>
                    {approve.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    {open.hasAction ? (open.actionTool?.includes("DRAFT") ? "Créer le brouillon Gmail" : "Valider") : "Marquer comme fait"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(open.body); toast("Copié"); }}>
                  <Copy className="size-4" /> Copier
                </Button>
                <Button variant="ghost" onClick={() => dismiss.mutate(open.id)} disabled={dismiss.isPending}>
                  <X className="size-4" /> Ignorer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
