"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestLoginLink } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";
export function LoginForm({ invalidLink = false }: { invalidLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    invalidLink
      ? "הקישור שגוי או פג תוקף. בקשו קישור חדש ופתחו אותו באותו דפדפן."
      : "",
  );
  const [pending, start] = useTransition();
  const router = useRouter();
  function send() {
    setError("");
    start(async () => {
      try {
        const result = await requestLoginLink(email);
        if (result.ok) setSent(true);
        else setError(result.error);
      } catch {
        setError("לא ניתן להתחבר כרגע. נסו שוב.");
      }
    });
  }
  return (
    <main className={styles.login}>
      <h1>כניסה לניהול</h1>
      <p>כניסה פרטית באמצעות קישור למייל.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label className={styles.field}>
          <span>כתובת מייל</span>
          <input
            type="email"
            autoComplete="email"
            dir="ltr"
            required
            value={email}
            disabled={pending}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
          />
        </label>
        {sent && (
          <p role="status">
            הקישור נשלח. פתחו אותו באותו דפדפן כדי להיכנס לניהול.
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "שולח…" : sent ? "שליחת קישור מחדש" : "שליחת קישור כניסה"}
        </Button>
        {sent && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => router.refresh()}
          >
            כבר התחברתי — רענון
          </Button>
        )}
      </form>
    </main>
  );
}
