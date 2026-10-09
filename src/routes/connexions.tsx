import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/luce/app-shell";
import { Button } from "@/components/ui/button";
import { TOOLKITS, useConnections } from "@/lib/luce-store";

export const Route = createFileRoute("/connexions")({
  head: () => ({
    meta: [
      { title: "Connexions — Luce" },
      { name: "description", content: "Connecte ou déconnecte Gmail, Slack, Drive et tes autres outils." },
      { property: "og:title", content: "Connexions — Luce" },
      { property: "og:description", content: "Gère les outils auxquels Luce a accès." },
    ],
  }),
  component: Connexions,
});

function Connexions() {
  const [connected, setConnected] = useConnections();
  const toggle = (id: (typeof TOOLKITS)[number]["id"], name: string) => {
    const on = connected.includes(id);
    setConnected((c) => (on ? c.filter((x) => x !== id) : [...c, id]));
    toast(on ? `${name} déconnecté` : `${name} connecté`);
  };
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Connexions" subtitle={`${connected.length} outils connectés à Luce.`} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLKITS.map((t) => {
          const on = connected.includes(t.id);
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft">
              <div className={`grid size-11 shrink-0 place-items-center rounded-xl font-display font-bold ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t.mark}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.desc}</p>
                <p className={`mt-0.5 text-xs font-medium ${on ? "text-success" : "text-muted-foreground"}`}>{on ? "● Connecté" : "Non connecté"}</p>
              </div>
              <Button size="sm" variant={on ? "outline" : "secondary"} className={on ? "shrink-0 hover:border-destructive hover:text-destructive" : "shrink-0"} onClick={() => toggle(t.id, t.name)}>
                {on ? "Déconnecter" : "Connecter"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
