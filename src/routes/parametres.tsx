import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/luce/app-shell";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { signOut } from "@/lib/auth";
import { useAutonomy, useSettings } from "@/lib/luce-store";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Luce" },
      {
        name: "description",
        content: "Règle le niveau d'autonomie de Luce, ton profil et ton briefing.",
      },
      { property: "og:title", content: "Paramètres — Luce" },
      { property: "og:description", content: "Personnalise ton chef de cabinet IA." },
    ],
  }),
  component: Parametres,
});

const AUTONOMY = [
  { id: "ask", label: "Demander avant d'agir", desc: "Luce propose, tu décides." },
  { id: "draft", label: "Préparer des brouillons", desc: "Luce rédige, tu valides l'envoi." },
  { id: "auto", label: "Autonome", desc: "Luce agit seule sur les tâches simples." },
] as const;

function Parametres() {
  const [s, setS] = useSettings();
  const [autonomy, setAutonomy] = useAutonomy();
  const pick = (level: (typeof AUTONOMY)[number]["id"]) =>
    setAutonomy(level).catch((e) =>
      toast.error(e instanceof Error ? e.message : "Impossible d'enregistrer"),
    );
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Paramètres" subtitle="Comment Luce travaille pour toi." />
      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <label className="text-sm font-medium" htmlFor="name">
          Ton prénom
        </label>
        <input
          id="name"
          value={s.name}
          onChange={(e) => setS({ ...s, name: e.target.value })}
          className="mt-2 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </section>
      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-display font-semibold">Niveau d'autonomie</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {AUTONOMY.map((a) => (
            <button
              key={a.id}
              onClick={() => pick(a.id)}
              className={`rounded-xl border p-3 text-left ${autonomy === a.id ? "border-transparent bg-primary text-primary-foreground" : "bg-background"}`}
            >
              <p className="text-sm font-medium">{a.label}</p>
              <p className="mt-1 text-xs opacity-70">{a.desc}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="min-w-0">
          <h2 className="font-display font-semibold">Briefing du matin</h2>
          <p className="text-sm text-muted-foreground">Luce prépare un résumé chaque jour à 8h.</p>
        </div>
        <Switch checked={s.briefing} onCheckedChange={(v) => setS({ ...s, briefing: v })} />
      </section>
      <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-soft">
        <div className="min-w-0">
          <h2 className="font-display font-semibold">Supprimer mes données</h2>
          <p className="text-sm text-muted-foreground">
            Efface ton historique et tes actions en attente sur le serveur.
          </p>
        </div>
        <button
          className="shrink-0 rounded-xl border px-3 py-2 text-sm hover:border-destructive hover:text-destructive"
          onClick={async () => {
            if (!confirm("Supprimer définitivement ton historique Luce ?")) return;
            try {
              await api.deleteAccount();
              toast.success("Données supprimées");
              await signOut(); // no-op in local mode
              location.reload();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Échec de la suppression");
            }
          }}
        >
          Supprimer
        </button>
      </section>
    </div>
  );
}

