"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithMagicLink() {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-text">
      <section className="w-full max-w-md rounded-lg border border-line bg-panel p-6">
        <h1 className="text-xl font-semibold">Sign in to Mission Control</h1>
        <p className="mt-2 text-sm text-muted">Internal access for BizDeedz operators.</p>
        <input
          className="mt-4 w-full rounded border border-line bg-background px-3 py-2 text-sm"
          placeholder="name@bizdeedz.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button
          className="mt-3 w-full rounded bg-sky-600 px-3 py-2 text-sm font-medium"
          disabled={loading || !email}
          onClick={signInWithMagicLink}
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </section>
    </main>
  );
}
