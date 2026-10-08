import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/luce/app-shell";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api"; // Assure-toi que cette route existe dans api.ts

export const Route = createFileRoute("/historique-mission")({
  head: () => ({
    meta: [
      { title: "Historique de Mission — Luce" },
      { name: "description", content: "Journal des opérations et directives exécutées par Luce." },
    ],
  }),
  component: MissionHistoryPage,
});

// Ajoute cette route dans src/lib/api.ts si elle n'y est pas :
// history: () => request<{ messages: { role: string; content: string; created_at: string }[] }>("/api/history"),

function MissionHistoryPage() {
  // On récupère l'historique via l'API backend
  const { data, isLoading } = useQuery({
    queryKey: ["mission-history"],
    queryFn: async () => {
      const res = await api.history(); // Appel à /api/history
      return res.messages;
    },
  });

  // Regrouper les messages par "Mission" (paire user + assistant)
  const missions = [];
  for (let i = 0; i < (data || []).length; i += 2) {
    const userMsg = (data || [])[i];
    const luceMsg = (data || [])[i + 1];
    if (userMsg) {
      missions.push({
        directive: userMsg.content,
        execution: luceMsg ? luceMsg.content : "En attente d'exécution...",
        date: userMsg.created_at || new Date().toISOString(),
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <PageHeader 
        title="Historique de Mission" 
        subtitle="Journal des directives opérateur et des exécutions autonomes de Luce." 
      />

      {isLoading ? (
        <div className="flex items-center justify-center p-10 text-muted-foreground">
          <Clock className="mr-2 h-4 w-4 animate-spin" /> Chargement du journal d'opérations...
        </div>
      ) : missions.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium">Aucune mission enregistrée.</p>
          <p className="text-sm text-muted-foreground">Les directives données à Luce apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission, index) => (
            <div key={index} className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
              {/* Ligne de temps visuelle */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-transparent rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="mb-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  <FileText className="h-3 w-3" />
                  Mission #{missions.length - index}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(mission.date).toLocaleString("fr-FR", { 
                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
                  })}
                </span>
              </div>

              <div className="space-y-4">
                {/* Directive Opérateur */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    O
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Directive Opérateur</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{mission.directive}</p>
                  </div>
                </div>

                {/* Exécution Luce */}
                <div className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                    L
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Exécution Luce</p>
                    <div className="mt-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 border border-gray-100">
                      {mission.execution}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
