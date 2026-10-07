import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Check, Loader2, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, type PendingAction } from "@/lib/api";

type Run = {
  id: number;
  goal: string;
  status: "running" | "done" | "error";
  result?: string;
  actions: (PendingAction & {
    state: "pending" | "busy" | "done" | "rejected" | "failed";
    note?: string | undefined;
  })[];
  approvals: { tool: string }[];
};

const SUGGESTIONS = [
  "Résume mes emails non lus",
  "Prépare ma journée de demain",
  "Rédige une réponse à Slack #ventes",
];

function describeArgs(args: Record<string, unknown>) {
  return Object.entries(args)
    .filter(([, v]) => v !== null && v !== "" && v !== undefined)
    .slice(0, 6)
    .map(([k, v]) => {
      const text = typeof v === "string" ? v : JSON.stringify(v);
      return `${k}: ${text.length > 160 ? text.slice(0, 160) + "…" : text}`;
    });
}

// Agentic command bar, wired to the Luce backend (POST /api/chat).
export function AgentDock() {
  const [value, setValue] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();

  const patchRun = (id: number, fn: (r: Run) => Run) =>
    setRuns((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));

  async function send(goal: string) {
    if (busy) return;
    const id = Date.now();
    setBusy(true);
    setOpen(true);
    setRuns((r) => [{ id, goal, status: "running", actions: [], approvals: [] }, ...r]);
    try {
      const res = await api.chat(goal);
      patchRun(id, (r) => ({
        ...r,
        status: "done",
        result: res.message,
        actions: res.pending_actions.map((a) => ({ ...a, state: "pending" as const })),
        approvals: res.pending_approvals,
      }));
      if (res.tool_called) qc.invalidateQueries({ queryKey: ["connections"] });
    } catch (e) {
      patchRun(id, (r) => ({
        ...r,
        status: "error",
        result: e instanceof Error ? e.message : "Erreur inconnue",
      }));
    } finally {
      setBusy(false);
    }
  }

  async function decide(runId: number, action: PendingAction, accept: boolean) {
    const setState = (state: Run["actions"][number]["state"], note?: string) =>
      patchRun(runId, (r) => ({
        ...r,
        actions: r.actions.map((a) => (a.id === action.id ? { ...a, state, note } : a)),
      }));
    setState("busy");
    try {
      if (!accept) {
        await api.rejectAction(action.id);
        setState("rejected");
        return;
      }
      const res = await api.confirmAction(action.id);
      if (res.success) {
        setState("done");
        toast.success("Action exécutée");
      } else if (res.pending_approval) {
        setState("done", "En attente d'approbation de sécurité (Cerbere).");
      } else {
        setState("failed", res.error ?? "L'action a échoué.");
      }
    } catch (e) {
      setState("failed", e instanceof Error ? e.message : "Erreur");
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const goal = value.trim();
    if (!goal) return;
    setValue("");
    void send(goal);
  }

  return (
    <div className="pointer-events-none sticky bottom-0 z-30 px-3 pb-3 sm:px-6 lg:px-10">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        {open && runs.length > 0 && (
          <div className="mb-2 max-h-[45vh] overflow-y-auto rounded-2xl border bg-card p-3 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tâches de Luce
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              {runs.map((run) => (
                <div key={run.id} className="rounded-xl bg-muted/60 p-3">
                  <p className="text-sm font-medium">{run.goal}</p>
                  {run.status === "running" && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> Luce travaille…
                    </p>
                  )}
                  {run.result && (
                    <p
                      className={`mt-2 whitespace-pre-wrap text-sm ${run.status === "error" ? "text-destructive" : ""}`}
                    >
                      {run.result}
                    </p>
                  )}
                  {run.approvals.length > 0 && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="size-3.5" /> Une action attend une approbation de
                      sécurité avant de s'exécuter.
                    </p>
                  )}
                  {run.actions.map((a) => (
                    <div key={a.id} className="mt-2 rounded-lg border bg-card p-2.5">
                      <p className="text-xs font-semibold">Luce propose : {a.tool}</p>
                      <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        {describeArgs(a.arguments).map((line) => (
                          <li key={line} className="break-words">
                            {line}
                          </li>
                        ))}
                      </ul>
                      {a.state === "pending" || a.state === "busy" ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            disabled={a.state === "busy"}
                            onClick={() => decide(run.id, a, true)}
                          >
                            {a.state === "busy" ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Check className="size-3.5" />
                            )}{" "}
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={a.state === "busy"}
                            onClick={() => decide(run.id, a, false)}
                          >
                            Refuser
                          </Button>
                        </div>
                      ) : (
                        <p
                          className={`mt-2 text-xs ${a.state === "failed" ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {a.state === "done"
                            ? (a.note ?? "✓ Exécutée")
                            : a.state === "rejected"
                              ? "Refusée"
                              : a.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {!open && runs.length === 0 && (
          <div className="mb-2 hidden flex-wrap justify-center gap-2 sm:flex">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-2xl border bg-card p-2 pl-4 shadow-soft"
        >
          <div className="grid size-6 shrink-0 place-items-center rounded-md bg-primary font-display text-xs font-bold text-primary-foreground">
            L
          </div>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => runs.length && setOpen(true)}
            placeholder="Confie une mission à Luce…"
            maxLength={4000}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy}
            className="shrink-0 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/85"
            aria-label="Envoyer"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
