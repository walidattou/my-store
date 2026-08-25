"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!response.ok) { setError("Email ou mot de passe incorrect."); return; }
    router.push("/admin");
    router.refresh();
  }
  return <main className="admin-login"><div className="login-card"><p className="admin-kicker">ATELIER / ADMIN</p><h1>Bienvenue.</h1><p>Connectez-vous pour gérer votre boutique.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label><button type="submit">Ouvrir le tableau de bord</button>{error && <div className="admin-error">{error}</div>}</form></div></main>;
}
