"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

const inputCls =
  "h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

export function NewProjectForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => startTransition(() => { void action(fd); })}
      className="grid gap-3 rounded-xl border border-border/60 bg-card p-4"
    >
      <div className="grid gap-1">
        <label className="text-sm font-medium">Nom du projet de cadrage</label>
        <input name="projectName" required placeholder="ex: Automatisation Boulangerie Martin" className={inputCls} />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Entreprise cliente</label>
        <input name="companyName" required placeholder="ex: Boulangerie Martin" className={inputCls} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <label className="text-sm font-medium">Qui pilote</label>
          <select name="ownerType" defaultValue="consultant" className={inputCls}>
            <option value="consultant">Moi (consultant)</option>
            <option value="client_lead">Un referent client</option>
          </select>
        </div>
        <div className="grid flex-1 gap-1">
          <label className="text-sm font-medium">Avis requis</label>
          <input name="requiredRespondents" type="number" min={1} max={20} defaultValue={3} className={inputCls} />
        </div>
      </div>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Creation..." : "Creer le cadrage"}
      </Button>
    </form>
  );
}
