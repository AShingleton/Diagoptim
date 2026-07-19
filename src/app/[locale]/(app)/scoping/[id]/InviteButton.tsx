"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function InviteButton({
  action,
  status,
}: {
  action: () => Promise<void>;
  status: string;
}) {
  const [pending, start] = useTransition();
  const already = status !== "pending";
  return (
    <Button
      size="sm"
      variant={already ? "outline" : "default"}
      disabled={pending || already}
      onClick={() => start(() => { void action(); })}
    >
      {pending ? "Envoi..." : already ? "Invité" : "Inviter"}
    </Button>
  );
}
