import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZipperArt } from "@/components/luce/zipper-art";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Luce" },
      { name: "description", content: "Connecte-toi à Luce, l'assistant qui se branche à tes outils." },
    ],
  }),
  component: Login,
});

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(message)) return "Confirme d'abord ton adresse e-mail (vérifie ta boîte mail).";
  if (/already registered/i.test(message)) return "Un compte existe déjà avec cette adresse. Connecte-toi.";
  if (/rate limit/i.test(message)) return "Trop de tentatives. Réessaie dans quelques minutes.";
  return message;
}

function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const signup = mode === "signup";

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(friendlyError(error.message));
        else if (!data.session) setInfo("Compte créé. Clique sur le lien reçu par e-mail, puis connecte-toi.");
      } else {
        // On success, onAuthStateChange (useAuth) redirects to "/".
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(friendlyError(error.message));
      }
    } catch {
      setError("Impossible de joindre le serveur. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex min-h-72 flex-col justify-end overflow-hidden bg-brand-red p-6 sm:p-10 lg:min-h-screen lg:p-14">
        <ZipperArt className="absolute inset-y-0 right-0 h-full w-[45%] lg:w-1/2" />
        <div className="relative z-10 max-w-[55%] lg:max-w-[50%]">
          <h1 className="font-display text-6xl font-bold leading-[0.82] tracking-tighter text-brand-cream sm:text-8xl lg:text-[9rem]">
            LUCE
          </h1>
          <p className="mt-4 font-display text-base font-medium leading-tight text-black sm:text-xl lg:mt-6 lg:text-3xl">
            L'assistant qui se branche à tes outils et comprend ton contexte.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {signup ? "Créer un compte" : "Connexion"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {signup ? "Quelques secondes pour démarrer avec Luce." : "Content de te revoir."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete={signup ? "new-password" : "current-password"}
                required
                minLength={signup ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
              {signup && <p className="text-xs text-muted-foreground">8 caractères minimum.</p>}
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-sm text-success">
                {info}
              </p>
            )}

            <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-semibold">
              {busy ? "Patiente…" : signup ? "Créer mon compte" : "Se connecter"}
            </Button>
          </form>

          <p className="mt-5 text-sm text-muted-foreground">
            {signup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(signup ? "signin" : "signup");
                setError(null);
                setInfo(null);
              }}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {signup ? "Se connecter" : "Créer un compte"}
            </button>
          </p>

          <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" /> Protégé par Cerbère
          </div>
        </div>
      </section>
    </div>
  );
}