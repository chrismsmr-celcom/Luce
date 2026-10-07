import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Inbox, Layers, Sparkle } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { AGENDA, ARTIFACTS, EMAILS, SLACK } from "@/lib/luce-demo";
import { useSettings } from "@/lib/luce-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aujourd'hui — Luce" },
      { name: "description", content: "Ton briefing du jour : priorités, agenda et tâches préparées par Luce." },
      { property: "og:title", content: "Aujourd'hui — Luce" },
      { property: "og:description", content: "Ton briefing du jour préparé par Luce, ton chef de cabinet IA." },
    ],
  }),
  component: Today,
});

function Today() {
  const [settings] = useSettings();
  const priorities = [...EMAILS, ...SLACK].filter((m) => m.priority);
  const pending = ARTIFACTS.filter((a) => a.status === "À valider");
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`${hello}, ${settings.name}`} subtitle="Voici ce que Luce a préparé pour toi." />

      <div className="mb-6 overflow-hidden rounded-3xl bg-secondary p-5 text-secondary-foreground sm:p-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkle className="size-3.5" /> Briefing de Luce
        </div>
        <p className="mt-3 max-w-2xl font-display text-xl leading-snug sm:text-2xl">
          {priorities.length} messages demandent ton attention, {AGENDA.length} réunions aujourd'hui et{" "}
          {pending.length} brouillons attendent ta validation.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/inbox" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Ouvrir l'inbox <ArrowRight className="size-4" />
          </Link>
          <Link to="/artefacts" className="inline-flex items-center gap-1.5 rounded-full border border-secondary-foreground/20 px-4 py-2 text-sm">
            Valider les brouillons
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Priorités" icon={Inbox} to="/inbox">
          {priorities.map((m) => (
            <Row key={m.id} title={m.subject} meta={`${m.from} · ${m.time}`} tag={m.source === "slack" ? "Slack" : "Gmail"} />
          ))}
        </Card>
        <Card title="Agenda" icon={CalendarDays}>
          {AGENDA.map((a) => (
            <div key={a.time} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 font-display text-sm font-semibold">{a.time}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.who}</p>
              </div>
            </div>
          ))}
        </Card>
        <Card title="À valider" icon={Layers} to="/artefacts" className="md:col-span-2 xl:col-span-1">
          {pending.map((a) => (
            <Row key={a.id} title={a.title} meta={a.created} tag={a.kind} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, to, children, className = "" }: { title: string; icon: typeof Inbox; to?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-card p-4 shadow-soft sm:p-5 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          <Icon className="size-4" /> {title}
        </h2>
        {to && (
          <Link to={to} className="text-xs text-muted-foreground hover:text-foreground">
            Tout voir
          </Link>
        )}
      </div>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function Row({ title, meta, tag }: { title: string; meta: string; tag: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">{tag}</span>
    </div>
  );
}
