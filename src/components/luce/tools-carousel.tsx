import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plug } from "lucide-react";
import { TOOLKITS, useConnections, type ToolkitId } from "@/lib/luce-store";
import { TOOL_SNAPSHOTS } from "@/lib/luce-demo";

// Tools already shown elsewhere on the home page.
const EXCLUDED: ToolkitId[] = ["gmail", "slack", "googlecalendar"];
const INTERVAL = 5000;

export function ToolsCarousel() {
  const [connected] = useConnections();
  const tools = TOOLKITS.filter((t) => connected.includes(t.id) && !EXCLUDED.includes(t.id));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= tools.length) setIndex(0);
  }, [tools.length, index]);

  useEffect(() => {
    if (paused || tools.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % tools.length), INTERVAL);
    return () => clearInterval(id);
  }, [paused, tools.length]);

  if (tools.length === 0)
    return (
      <section className="mt-4 grid min-h-56 place-items-center rounded-2xl border border-dashed bg-card p-6 text-center">
        <div>
          <Plug className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Connecte Drive, GitHub, X, WhatsApp… pour voir leurs données ici.</p>
          <Link to="/connexions" className="mt-2 inline-block text-sm font-medium underline">Ajouter un outil</Link>
        </div>
      </section>
    );

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-2xl border bg-card shadow-soft"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {tools.map((t) => {
          const snap = TOOL_SNAPSHOTS[t.id];
          return (
            <div key={t.id} className="w-full shrink-0 p-5 pb-16 sm:p-6 sm:pb-16">
              <div className="flex items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary font-display font-bold text-primary-foreground">{t.mark}</div>
                <div className="min-w-0">
                  <h2 className="truncate font-display font-semibold">{t.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">{snap?.headline ?? t.desc}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
                {snap?.stats.map((s) => (
                  <div key={s.label} className="min-w-0 rounded-xl bg-muted p-3">
                    <p className="font-display text-xl font-bold sm:text-2xl">{s.value}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-4 hidden divide-y sm:block">
                {snap?.items.map((i) => (
                  <li key={i} className="truncate py-2 text-sm">{i}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-x-5 bottom-4 flex items-center justify-between gap-3 sm:inset-x-6">
        <div className="flex items-center gap-1.5">
          {tools.map((t, i) => (
            <button
              key={t.id}
              aria-label={`Voir ${t.name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-secondary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <Link
          to={tools[index]?.id === "googledrive" ? "/dossiers" : "/connexions"}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
        >
          Ouvrir <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
