// Demo content shown until the Luce backend feeds real Gmail / Slack / Drive data.
export const EMAILS = [
  { id: "e1", source: "gmail", from: "Amina Kalala", subject: "Contrat Celcom — version finale", preview: "Bonjour Christopher, voici la version signée par notre juridique…", time: "09:12", unread: true, priority: true },
  { id: "e2", source: "gmail", from: "Google Calendar", subject: "Invitation : Revue produit jeu. 15:00", preview: "Tu as été invité à Revue produit Luce…", time: "08:40", unread: true, priority: false },
  { id: "e3", source: "gmail", from: "Jean Mbuyi", subject: "Devis infrastructure", preview: "Comme convenu, ci-joint le devis pour les serveurs…", time: "Hier", unread: false, priority: false },
  { id: "e4", source: "gmail", from: "Stripe", subject: "Ton virement est en route", preview: "Un virement de 2 340,00 € arrivera sous 2 jours…", time: "Hier", unread: false, priority: false },
];

export const SLACK = [
  { id: "s1", source: "slack", from: "#ventes · Sarah", subject: "On a besoin de ta validation", preview: "Le client attend une réponse sur la remise de 15 %…", time: "10:05", unread: true, priority: true },
  { id: "s2", source: "slack", from: "#dev · Patrick", subject: "Déploiement terminé", preview: "La v0.9 de l'agent est en production ✅", time: "09:30", unread: true, priority: false },
  { id: "s3", source: "slack", from: "DM · Grace", subject: "Point RH", preview: "On peut décaler notre point à 16h ?", time: "Hier", unread: false, priority: false },
];

export const FILES = [
  { id: "f1", name: "Contrat Celcom 2026.pdf", type: "pdf", owner: "Amina K.", modified: "Aujourd'hui", size: "1,2 Mo", folder: "Clients" },
  { id: "f2", name: "Roadmap Luce Q4", type: "doc", owner: "Toi", modified: "Hier", size: "—", folder: "Produit" },
  { id: "f3", name: "Budget 2026", type: "sheet", owner: "Toi", modified: "Lun.", size: "—", folder: "Finance" },
  { id: "f4", name: "Pitch investisseurs", type: "slides", owner: "Toi", modified: "28 sept.", size: "—", folder: "Levée" },
  { id: "f5", name: "Logo Luce.png", type: "image", owner: "Grace", modified: "20 sept.", size: "340 Ko", folder: "Marque" },
  { id: "f6", name: "Notes réunion Celcom", type: "doc", owner: "Toi", modified: "18 sept.", size: "—", folder: "Clients" },
];

export const FOLDERS = ["Clients", "Produit", "Finance", "Levée", "Marque"];

export const ARTIFACTS = [
  { id: "a1", kind: "Brouillon d'email", title: "Réponse à Amina — contrat Celcom", body: "Bonjour Amina,\n\nMerci pour la version finale. Je la relis ce matin et reviens vers toi avant 14h.\n\nBien à toi,\nChristopher", created: "Il y a 10 min", status: "À valider" },
  { id: "a2", kind: "Résumé", title: "Briefing du matin", body: "• 2 emails prioritaires (Celcom, Sarah)\n• 3 réunions aujourd'hui\n• Déploiement v0.9 réussi", created: "08:00", status: "Prêt" },
  { id: "a3", kind: "Rapport", title: "Analyse du budget Q3", body: "Dépenses en hausse de 12 % vs Q2, principalement infrastructure. Recommandation : renégocier le contrat serveurs.", created: "Hier", status: "Prêt" },
  { id: "a4", kind: "Post X", title: "Annonce Luce v0.9", body: "Luce v0.9 est là : ton chef de cabinet IA gère désormais Slack et Drive. 🚀", created: "Hier", status: "À valider" },
];

export const AGENDA = [
  { time: "10:30", title: "Appel Celcom", who: "Amina, Jean" },
  { time: "13:00", title: "Déjeuner équipe", who: "Équipe" },
  { time: "15:00", title: "Revue produit Luce", who: "Patrick, Grace" },
];

export const TOOL_SNAPSHOTS: Record<string, { headline: string; stats: { label: string; value: string }[]; items: string[] }> = {
  googledrive: { headline: "6 fichiers modifiés cette semaine", stats: [{ label: "Fichiers", value: "128" }, { label: "Partagés", value: "14" }, { label: "Stockage", value: "62 %" }], items: ["Contrat Celcom 2026.pdf — Amina K.", "Roadmap Luce Q4 — modifié hier"] },
  github: { headline: "luce-agent · 3 pull requests ouvertes", stats: [{ label: "PR ouvertes", value: "3" }, { label: "Issues", value: "12" }, { label: "Commits / 7j", value: "41" }], items: ["#42 Ajout du connecteur Slack — à relire", "#39 Fix mémoire Notebook — fusionnée"] },
  twitter: { headline: "Ton compte X cette semaine", stats: [{ label: "Abonnés", value: "2,4k" }, { label: "Impressions", value: "18k" }, { label: "Brouillons", value: "2" }], items: ["Annonce Luce v0.9 — à valider", "Thread IA & productivité — 320 j'aime"] },
  whatsapp: { headline: "4 conversations actives", stats: [{ label: "Non lus", value: "5" }, { label: "Groupes", value: "3" }, { label: "Envoyés", value: "27" }], items: ["Équipe Celcom — « On valide demain ? »", "Grace — « Merci pour le doc ! »"] },
  supabase: { headline: "Base de production en bonne santé", stats: [{ label: "Tables", value: "18" }, { label: "Requêtes / h", value: "3,1k" }, { label: "Uptime", value: "99,9 %" }], items: ["Nouveaux utilisateurs aujourd'hui : 23", "Dernière sauvegarde : il y a 2 h"] },
};
