"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials or you do not have admin access.");
      return;
    }
    const callback = searchParams.get("next") || "/admin";
    router.push(callback);
    router.refresh();
  };

  return (
    <div className="w-full max-w-sm animate-fadeUp rounded-2xl border border-bark-800/10 bg-white p-8 shadow-lift">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-600 font-serif text-base font-bold text-white">
          MJ
        </span>
        <h1 className="font-serif text-xl text-bark-900">Admin Sign In</h1>
        <p className="mt-1 text-xs text-bark-500">MJ Nature Naturals · Admin Panel</p>
      </div>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{error}</p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ivory-100 to-sand-50 px-4">
      <Suspense>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
