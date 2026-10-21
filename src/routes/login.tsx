import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LuceArt } from "@/components/luce/luce-art";
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
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const signup = mode === "signup";

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setError(null);
    setInfo(null);
  }

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
      {/* Panneau illustré : le ciel est le fond rouge, le texte reste dans le ciel */}
      <section className="relative isolate flex min-h-[22rem] flex-col justify-start overflow-hidden bg-brand-red p-6 sm:min-h-[26rem] sm:p-10 lg:min-h-screen lg:p-14">
        <LuceArt className="absolute inset-0 -z-10 h-full w-full" />
        <div className="max-w-[60%] lg:max-w-[50%]">
          <h1 className="font-display text-6xl font-bold leading-[0.82] tracking-tighter text-brand-cream sm:text-8xl lg:text-[9rem]">
            LUCE
          </h1>
          <p className="mt-4 font-display text-base font-medium leading-tight text-black sm:text-xl lg:mt-6 lg:text-3xl">
            L'assistant qui se branche à tes outils et comprend ton contexte.
          </p>
        </div>
      </section>

      {/* Formulaire */}
      <section className="relative flex items-center justify-center overflow-hidden bg-background px-5 py-10 sm:px-10 sm:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-red opacity-10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-primary opacity-30 blur-3xl"
        />

        <div className="relative w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl sm:p-10">
          <div className="flex items-center gap-4">
            <img
              src="/logo-192.png"
              alt="Luce"
              width={56}
              height={56}
              className="size-14 shrink-0 rounded-2xl object-cover shadow-md ring-4 ring-background"
            />
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {signup ? "Bienvenue !" : "Content de te revoir"}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {signup ? "Quelques secondes pour démarrer avec Luce." : "Connecte-toi pour retrouver ton espace."}
              </p>
            </div>
          </div>

          {/* Onglets */}
          <div role="tablist" aria-label="Mode" className="mt-7 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium">
            {(
              [
                ["signin", "Connexion"],
                ["signup", "Créer un compte"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => switchMode(value)}
                className={
                  "rounded-full px-3 py-2 transition-all " +
                  (mode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="toi@exemple.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl pl-10 text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  required
                  minLength={signup ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pl-10 pr-11 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {signup && <p className="text-xs text-muted-foreground">8 caractères minimum.</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
                {info}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="group h-12 w-full rounded-full text-base font-semibold shadow-md transition-shadow hover:shadow-lg"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Patiente…
                </>
              ) : (
                <>
                  {signup ? "Créer mon compte" : "Se connecter"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-success" /> Protégé par Cerbère
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-success" /> Rien ne part sans ton clic
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
