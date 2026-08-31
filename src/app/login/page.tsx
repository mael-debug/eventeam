"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ERROR_LABEL: Record<string, string> = {
  lien_invalide: "Le lien de connexion est invalide ou a expiré. Redemandez-en un, ou connectez-vous avec votre mot de passe si vous en avez un.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/onboarding";
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setStatus("error");
      return;
    }
    window.location.href = next;
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Community Intelligence</CardTitle>
        <CardDescription>
          {mode === "magic" ? "Connexion par lien magique — aucun mot de passe n'est requis par défaut." : "Connexion par mot de passe."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {urlError && ERROR_LABEL[urlError] && (
          <p className="mb-4 text-sm text-red-600">{ERROR_LABEL[urlError]}</p>
        )}

        {status === "sent" ? (
          <p className="text-sm text-neutral-700">
            Un lien de connexion a été envoyé à <strong>{email}</strong>. Ouvrez-le pour
            continuer.
          </p>
        ) : mode === "magic" ? (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@agence.com"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Envoi…" : "Recevoir le lien de connexion"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("password");
                setError(null);
                setStatus("idle");
              }}
              className="text-left text-sm text-neutral-500 underline"
            >
              Se connecter avec un mot de passe
            </button>
          </form>
        ) : (
          <form onSubmit={handlePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-pw">Adresse email</Label>
              <Input
                id="email-pw"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@agence.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Connexion…" : "Se connecter"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("magic");
                setError(null);
                setStatus("idle");
              }}
              className="text-left text-sm text-neutral-500 underline"
            >
              Utiliser le lien magique à la place
            </button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
