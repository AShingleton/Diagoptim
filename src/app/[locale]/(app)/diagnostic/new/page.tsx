"use client";

import { useEffect } from "react";
import { useDiagnosticStore } from "@/stores/diagnosticStore";
import { ConversationalEngine } from "@/components/diagnostic/ConversationalEngine";

export default function NewDiagnosticPage() {
  const { startNewDiagnostic } = useDiagnosticStore();

  useEffect(() => {
    startNewDiagnostic();
  }, [startNewDiagnostic]);

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <ConversationalEngine />
    </div>
  );
}
