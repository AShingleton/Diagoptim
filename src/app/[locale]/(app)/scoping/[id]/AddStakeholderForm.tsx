"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

const inputCls = "h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30";

export function AddStakeholderForm({
  action,
  parents,
}: {
  action: (formData: FormData) => Promise<void>;
  parents: Array<{ id: string; fullName: string }>;
}) {
  const [pending, start] = useTransition();
  return (
    <form action={(fd) => start(() => { void action(fd); })} className="grid gap-3 rounded-xl border border-border/60 bg-card p-4 sm:grid-cols-2">
      <input name="fullName" required placeholder="Nom complet" className={inputCls} />
      <input name="email" type="email" required placeholder="Email" className={inputCls} />
      <input name="roleLabel" required placeholder="Role (ex: Vendeuse, Gerant)" className={inputCls} />
      <select name="hierarchyParentId" defaultValue="" className={inputCls}>
        <option value="">Rattachement hierarchique (optionnel)</option>
        {parents.map((p) => (<option key={p.id} value={p.id}>Sous la responsabilite de {p.fullName}</option>))}
      </select>
      <Button type="submit" disabled={pending} className="sm:col-span-2 justify-self-start">
        {pending ? "Ajout..." : "Ajouter au panel"}
      </Button>
    </form>
  );
}
