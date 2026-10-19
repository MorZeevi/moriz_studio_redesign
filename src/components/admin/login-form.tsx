"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginWithPassword } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import styles from "./admin.module.css";
export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  function login() {
    setError("");
    start(async () => {
      try {
        const result = await loginWithPassword(password);
        if (result.ok) {
          setPassword("");
          router.replace("/admin/projects");
          router.refresh();
        } else setError(result.error);
      } catch {
        setError("לא ניתן להתחבר כרגע. נסו שוב.");
      }
    });
  }
  return (
    <main className={styles.login}>
      <h1>כניסה לניהול</h1>
      <p>הזינו את הסיסמה כדי להיכנס לניהול האתר.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          login();
        }}
      >
        <label className={styles.field}>
          <span>סיסמה</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            maxLength={1024}
            value={password}
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />
        </label>
        {error && (
          <p id="login-error" role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "מתחבר…" : "כניסה לניהול"}
        </Button>
      </form>
    </main>
  );
}
