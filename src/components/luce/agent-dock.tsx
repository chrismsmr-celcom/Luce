import { useState } from "react";
import { ArrowUp, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { label: string; done: boolean };
type Run = { id: number; goal: string; steps: Step[]; result?: string };

const SUGGESTIONS = [
  "Résume mes emails non lus",
  "Prépare ma journée de demain",
  "Rédige une réponse à Slack #ventes",
];

// Agentic command bar. Replace `simulate` with a POST to the Luce backend (/api/chat).
export function AgentDock() {
  const [value, setValue] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [open, setOpen] = useState(false);

  function simulate(goal: string) {
    const id = Date.now();
    const steps = ["Analyse de la demande", "Consultation des outils connectés", "Rédaction du résultat"];
    setRuns((r) => [{ id, goal, steps: steps.map((s) => ({ label: s, done: false })) }, ...r]);
    setOpen(true);
    steps.forEach((_, i) =>
      setTimeout(() => {
        setRuns((r) =>
          r.map((run) =>
            run.id !== id
              ? run
              : {
                  ...run,
                  steps: run.steps.map((s, j) => (j <= i ? { ...s, done: true } : s)),
                  result: i === steps.length - 1 ? "Terminé — le résultat a été ajouté à tes Artefacts." : undefined,
                },
          ),
        );
      }, 700 * (i + 1)),
    );
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim()) return;
    simulate(value.trim());
    setValue("");
  }

  return (
    <div className="pointer-events-none sticky bottom-0 z-30 px-3 pb-3 sm:px-6 lg:px-10">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        {open && runs.length > 0 && (
          <div className="mb-2 max-h-[45vh] overflow-y-auto rounded-2xl border bg-card p-3 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tâches de Luce</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-md p-1 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-medium">{run.goal}</p>
                  <ul className="mt-2 space-y-1">
                    {run.steps.map((s) => (
                      <li key={s.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                        {s.done ? <Check className="size-3.5 text-success" /> : <Loader2 className="size-3.5 animate-spin" />}
                        {s.label}
                      </li>
                    ))}
                  </ul>
                  {run.result && <p className="mt-2 text-sm">{run.result}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {!open && runs.length === 0 && (
          <div className="mb-2 hidden flex-wrap justify-center gap-2 sm:flex">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => simulate(s)} className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft hover:text-foreground">
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-soft">
          <div className="grid size-6 shrink-0 place-items-center rounded-md bg-primary font-display text-xs font-bold text-primary-foreground">L</div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => runs.length && setOpen(true)}
            placeholder="Confie une mission à Luce…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" className="shrink-0 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/85" aria-label="Envoyer">
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
