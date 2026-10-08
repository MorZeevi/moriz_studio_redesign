"use client";
import { Button } from "@/components/ui/button";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>לא ניתן לטעון את הניהול</h1>
      <p role="alert">
        בדקו את החיבור ונסו שוב. אם זו התקנה חדשה, ודאו שמשתני הסביבה הוגדרו.
      </p>
      <Button onClick={reset}>ניסיון חוזר</Button>
    </main>
  );
}
