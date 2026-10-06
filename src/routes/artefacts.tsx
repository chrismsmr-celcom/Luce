import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ARTIFACTS } from "@/lib/luce-demo";

export const Route = createFileRoute("/artefacts")({
  head: () => ({
    meta: [
      { title: "Artefacts — Luce" },
      { name: "description", content: "Brouillons, résumés et rapports produits par Luce, prêts à valider." },
      { property: "og:title", content: "Artefacts — Luce" },
      { property: "og:description", content: "Tout ce que Luce a produit pour toi." },
    ],
  }),
  component: Artefacts,
});

function Artefacts() {
  const [open, setOpen] = useState<(typeof ARTIFACTS)[number] | null>(null);
  const [approved, setApproved] = useState<string[]>([]);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Artefacts" subtitle="Ce que Luce a produit pour toi." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ARTIFACTS.map((a) => {
          const status = approved.includes(a.id) ? "Validé" : a.status;
          return (
            <button key={a.id} onClick={() => setOpen(a)} className="flex flex-col rounded-2xl border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{a.kind}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status === "À valider" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{status}</span>
              </div>
              <h3 className="mt-3 font-display font-semibold">{a.title}</h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
              <span className="mt-4 text-xs text-muted-foreground">{a.created}</span>
            </button>
          );
        })}
      </div>
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {open && (
            <>
              <SheetHeader>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{open.kind}</span>
                <SheetTitle className="font-display text-xl">{open.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 whitespace-pre-line rounded-xl bg-muted p-4 text-sm leading-relaxed">{open.body}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => { setApproved((p) => [...p, open.id]); toast.success("Validé"); setOpen(null); }}>
                  <Check className="size-4" /> Valider
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(open.body); toast("Copié"); }}>
                  <Copy className="size-4" /> Copier
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
