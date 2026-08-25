"use client";

import { FormEvent, useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setStatus("success");
      setName("");
      setPhone("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-panel" aria-labelledby="contact-title">
        <p className="eyebrow">My Store</p>
        <h1 id="contact-title">Let&apos;s keep in touch.</h1>
        <p className="intro">Leave your details and our team will get back to you soon.</p>

        <form onSubmit={handleSubmit} className="contact-form">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />

          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoComplete="tel"
          />

          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending..." : "Send details"}
          </button>
        </form>

        <p className={`form-message ${status}`} role="status" aria-live="polite">
          {status === "success" && "Thanks. Your details were sent successfully."}
          {status === "error" && "Something went wrong. Please try again."}
        </p>
      </section>
    </main>
  );
}