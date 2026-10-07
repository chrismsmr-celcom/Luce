import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { TOOLKITS, useConnections } from "@/lib/luce-store";

export const Route = createFileRoute("/connexions")({
  head: () => ({
    meta: [
      { title: "Connexions — Luce" },
      {
        name: "description",
        content: "Connecte ou déconnecte Gmail, Slack, Drive et tes autres outils.",
      },
      { property: "og:title", content: "Connexions — Luce" },
      { property: "og:description", content: "Gère les outils auxquels Luce a accès." },
    ],
  }),
  component: Connexions,
});

function Connexions() {
  const [connected, , { loading, error }] = useConnections();
  const [pending, setPending] = useState<string | null>(null);

  const connect = async (id: string, name: string) => {
    setPending(id);
    try {
      const { redirect_url } = await api.connect(id);
      // OAuth happens on the provider's page; the backend sends the user back here.
      window.location.assign(redirect_url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Impossible de connecter ${name}`);
      setPending(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Connexions"
        subtitle={loading ? "Chargement…" : `${connected.length} outils connectés à Luce.`}
      />
      {error && (
        <div className="mb-4 rounded-2xl border border-destructive/40 bg-card p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLKITS.map((t) => {
          const on = connected.includes(t.id);
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft"
            >
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-xl font-display font-bold ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {t.mark}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.desc}</p>
                <p
                  className={`mt-0.5 text-xs font-medium ${on ? "text-success" : "text-muted-foreground"}`}
                >
                  {on ? "● Connecté" : "Non connecté"}
                </p>
              </div>
              {!on && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  disabled={pending === t.id}
                  onClick={() => connect(t.id, t.name)}
                >
                  {pending === t.id ? "…" : "Connecter"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Pour retirer l'accès d'un outil, révoque-le depuis les paramètres de sécurité du compte
        concerné (Google, GitHub…).
      </p>
    </div>
  );
}
