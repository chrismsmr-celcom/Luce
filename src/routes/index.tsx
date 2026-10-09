import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Inbox, Layers, Sparkle } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatEventTime, formatMessageTime, senderName, useAgenda, useInbox } from "@/lib/luce-data";
import { useSettings } from "@/lib/luce-store";
import { ToolsCarousel } from "@/components/luce/tools-carousel";

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
  const inbox = useInbox();
  const agenda = useAgenda();
  const arts = useQuery({ queryKey: ["artifacts"], queryFn: api.artifacts, staleTime: 30_000 });
  const priorities = inbox.items.filter((m) => m.priority || m.unread).slice(0, 6);
  const pending = (arts.data?.items ?? []).filter((a) => a.status === "new").slice(0, 6);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={`${hello}, ${settings.name}`} subtitle="Voici ce que Luce a préparé pourCardstoi." />

      <div className="mb-6 overflow-hidden rounded-3xl bg-secondary p-5 text-secondary-foreground sm:p-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkle className="size-3.5" /> Briefing de Luce
        </div>
        <p className="mt-3 max-w-2xl font-display text-xl leading-snug sm:text-2xl">
          {priorities.length} messages demandent ton attention, {agenda.items.length} réunions aujourd'hui et{" "}
          {pending.length} propositions attendent ta validation.
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
          {!inbox.connected && <Empty text="Connecte Gmail pour voir tes priorités." />}
          {inbox.connected && inbox.loading && <Empty text="Chargement…" />}
          {inbox.connected && !inbox.loading && priorities.length === 0 && <Empty text="Rien d'urgent dans ta boîte." />}
          {priorities.map((m) => (
            <Row key={m.id} title={m.subject} meta={`${senderName(m.from)} · ${formatMessageTime(m.date)}`} tag={m.source === "slack" ? "Slack" : "Gmail"} />
          ))}
        </Card>
        <Card title="Agenda" icon={CalendarDays}>
          {!agenda.connected && <Empty text="Connecte Google Calendar pour voir ton agenda." />}
          {agenda.connected && agenda.loading && <Empty text="Chargement…" />}
          {agenda.connected && !agenda.loading && agenda.items.length === 0 && <Empty text="Aucune réunion aujourd'hui." />}
          {agenda.items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 font-display text-sm font-semibold">{formatEventTime(a)}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.who}</p>
              </div>
            </div>
          ))}
        </Card>
        <Card title="À valider" icon={Layers} to="/artefacts" className="md:col-span-2 xl:col-span-1">
          {pending.length === 0 && <Empty text="Rien à valider pour l'instant." />}
          {pending.map((a) => (
            <Row key={a.id} title={a.title} meta={a.sources.join(" · ")} tag={a.urgency === "high" ? "Urgent" : "À valider"} />
          ))}
        </Card>
      </div>
    </div>
  );
}
<ToolsCarousel />
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

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-sm text-muted-foreground">{text}</p>;
}
