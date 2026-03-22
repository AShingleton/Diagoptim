"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  Image,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface MockDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  status: "analyzing" | "ready" | "error";
  fileType: "pdf" | "excel" | "image" | "word";
}

const MOCK_DOCS: MockDocument[] = [
  { id: "1", name: "Facture_2026_001.pdf", type: "invoice", size: "245 KB", uploadDate: "2026-03-20", status: "ready", fileType: "pdf" },
  { id: "2", name: "Bilan_2025.xlsx", type: "balance_sheet", size: "1.2 MB", uploadDate: "2026-03-19", status: "ready", fileType: "excel" },
  { id: "3", name: "Devis_client_ABC.pdf", type: "quote", size: "180 KB", uploadDate: "2026-03-18", status: "analyzing", fileType: "pdf" },
  { id: "4", name: "Photo_atelier.jpg", type: "brochure", size: "3.5 MB", uploadDate: "2026-03-17", status: "ready", fileType: "image" },
];

const fileIcons = {
  pdf: FileText,
  excel: FileSpreadsheet,
  image: Image,
  word: FileText,
};

const statusConfig = {
  analyzing: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "En analyse..." },
  ready: { icon: CheckCircle, color: "text-success", bg: "bg-success/10", label: "Analysé" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erreur" },
};

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Mock: just add a placeholder document
    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0];
      setDocs((prev) => [
        {
          id: crypto.randomUUID(),
          name: file.name,
          type: "invoice",
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadDate: new Date().toISOString().split("T")[0],
          status: "analyzing",
          fileType: "pdf",
        },
        ...prev,
      ]);
    }
  }, []);

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("nav.documents")}</h1>
        <p className="text-muted-foreground">
          {t("diagnostic.documents.subtitle")}
        </p>
      </div>

      {/* Upload Zone */}
      <Card
        className={`glass border-2 border-dashed transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">{t("diagnostic.documents.upload")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("diagnostic.documents.formats")}</p>
          </div>
          <Button variant="outline" onClick={() => { /* File input would go here */ }}>
            {t("common.upload")}
          </Button>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        <AnimatePresence>
          {docs.map((doc, i) => {
            const FileIcon = fileIcons[doc.fileType];
            const status = statusConfig[doc.status];
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{doc.size}</span>
                          <span className="text-xs text-muted-foreground">{doc.uploadDate}</span>
                          <Badge variant="outline" className={`text-xs gap-1 ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeDoc(doc.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
