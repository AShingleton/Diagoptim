"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function SynthesisButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button onClick={() => start(() => { void action(); })} disabled={pending} size="sm">
      {pending ? "Génération en cours (30-60 s)..." : label}
    </Button>
  );
}
