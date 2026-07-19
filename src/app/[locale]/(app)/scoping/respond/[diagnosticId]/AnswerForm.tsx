"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function AnswerForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={(fd) => start(() => { void action(fd); })}
      className="mt-4 grid gap-3"
    >
      <textarea
        name="answer"
        required
        rows={4}
        autoFocus
        placeholder="Votre réponse..."
        className="w-full rounded-lg border border-input bg-muted/30 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Enregistrement..." : "Continuer"}
      </Button>
    </form>
  );
}
