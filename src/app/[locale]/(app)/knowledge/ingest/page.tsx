"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Upload,
  Globe,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KnowledgeBaseOption {
  id: string;
  name: string;
}

type IngestTab = "file" | "url" | "text";

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt,.md,.html,.csv";
const ACCEPTED_MIME =
  "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/html,text/csv";

// ---------------------------------------------------------------------------
// Ingest Page
// ---------------------------------------------------------------------------

export default function IngestPage() {
  const { locale } = useParams<{ locale: string }>();

  // Shared state
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseOption[]>([]);
  const [loadingBases, setLoadingBases] = useState(true);
  const [activeTab, setActiveTab] = useState<IngestTab>("file");

  // Form fields (shared across tabs)
  const [title, setTitle] = useState("");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState<string>("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("fr");

  // File-specific
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL-specific
  const [url, setUrl] = useState("");

  // Text-specific
  const [textContent, setTextContent] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // -------------------------------------------------------------------------
  // Fetch knowledge bases
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadBases() {
      setLoadingBases(true);
      try {
        const res = await fetch("/api/rag/knowledge-base");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const list: KnowledgeBaseOption[] = Array.isArray(data)
          ? data
          : data.data ?? [];
        setKnowledgeBases(list);
        if (list.length > 0 && !knowledgeBaseId) {
          setKnowledgeBaseId(list[0].id);
        }
      } catch {
        // Silently fail — user can still type a new base name
      } finally {
        setLoadingBases(false);
      }
    }

    loadBases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  // File handling
  // -------------------------------------------------------------------------

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  }, [title]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function removeFile() {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit() {
    setSubmitting(true);
    setProgress(10);
    setResult(null);

    try {
      let endpoint = "";
      let body: FormData | string;
      const headers: Record<string, string> = {};

      if (activeTab === "file") {
        if (!selectedFile) throw new Error("Veuillez selectionner un fichier.");
        endpoint = "/api/rag/ingest/file";
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", title);
        formData.append("knowledgeBaseId", knowledgeBaseId);
        formData.append("category", category);
        formData.append("tags", tags);
        formData.append("language", language);
        body = formData;
      } else if (activeTab === "url") {
        if (!url.trim()) throw new Error("Veuillez saisir une URL.");
        endpoint = "/api/rag/ingest/url";
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          url: url.trim(),
          title,
          knowledgeBaseId,
          category,
          language,
        });
      } else {
        if (!textContent.trim()) throw new Error("Veuillez saisir du texte.");
        endpoint = "/api/rag/ingest/text";
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          content: textContent,
          title,
          knowledgeBaseId,
          category,
          language,
        });
      }

      setProgress(40);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body,
      });

      setProgress(80);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Erreur serveur (${res.status})`
        );
      }

      setProgress(100);
      setResult({
        success: true,
        message: "Contenu ingere avec succes !",
      });

      // Reset form
      setTitle("");
      setCategory("");
      setTags("");
      setUrl("");
      setTextContent("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setProgress(0);
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Une erreur est survenue",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Reusable field components
  // -------------------------------------------------------------------------

  function TitleField() {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Titre du document"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
    );
  }

  function KnowledgeBaseField() {
    return (
      <div className="space-y-1.5">
        <Label>Base de connaissances</Label>
        {loadingBases ? (
          <Skeleton className="h-8 w-full" />
        ) : knowledgeBases.length > 0 ? (
          <Select
            value={knowledgeBaseId}
            onValueChange={(val) => setKnowledgeBaseId(val as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selectionner une base" />
            </SelectTrigger>
            <SelectContent>
              {knowledgeBases.map((kb) => (
                <SelectItem key={kb.id} value={kb.id}>
                  {kb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="Nom de la nouvelle base"
            value={knowledgeBaseId}
            onChange={(e) => setKnowledgeBaseId(e.target.value)}
          />
        )}
      </div>
    );
  }

  function CategoryField() {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="category">Categorie</Label>
        <Input
          id="category"
          placeholder="Ex: Lean Management, Qualite..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>
    );
  }

  function TagsField() {
    return (
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (separes par des virgules)</Label>
        <Input
          id="tags"
          placeholder="Ex: lean, kaizen, 5S"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>
    );
  }

  function LanguageField() {
    return (
      <div className="space-y-1.5">
        <Label>Langue</Label>
        <Select value={language} onValueChange={(val) => setLanguage(val as string)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">Francais</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/knowledge`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1B4F72" }}>
            Ingerer du contenu
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ajoutez des documents, URLs ou textes a votre base de connaissances.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as IngestTab);
              setResult(null);
            }}
          >
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="file" className="flex-1 gap-1.5">
                <Upload className="h-4 w-4" />
                Fichier
              </TabsTrigger>
              <TabsTrigger value="url" className="flex-1 gap-1.5">
                <Globe className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1 gap-1.5">
                <FileText className="h-4 w-4" />
                Texte
              </TabsTrigger>
            </TabsList>

            {/* ---- File tab ---- */}
            <TabsContent value="file">
              <div className="space-y-4">
                {/* Drop zone */}
                <div
                  className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                    dragOver
                      ? "border-[#2E86C1] bg-[#2E86C1]/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={`${ACCEPTED_EXTENSIONS},${ACCEPTED_MIME}`}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                  />

                  {selectedFile ? (
                    <div className="flex items-center gap-3 px-4">
                      <FileText className="h-8 w-8 shrink-0" style={{ color: "#1B4F72" }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} Ko
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Glissez-deposez un fichier ici
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ou cliquez pour parcourir (PDF, DOCX, TXT, MD, HTML, CSV)
                      </p>
                    </>
                  )}
                </div>

                <TitleField />
                <KnowledgeBaseField />
                <div className="grid gap-4 sm:grid-cols-2">
                  <CategoryField />
                  <TagsField />
                </div>
                <LanguageField />
              </div>
            </TabsContent>

            {/* ---- URL tab ---- */}
            <TabsContent value="url">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <TitleField />
                <KnowledgeBaseField />
                <CategoryField />
                <LanguageField />
              </div>
            </TabsContent>

            {/* ---- Text tab ---- */}
            <TabsContent value="text">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="text-content">Contenu</Label>
                  <Textarea
                    id="text-content"
                    placeholder="Collez ou saisissez votre texte ici..."
                    className="min-h-[200px]"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                  />
                </div>
                <TitleField />
                <KnowledgeBaseField />
                <CategoryField />
                <LanguageField />
              </div>
            </TabsContent>
          </Tabs>

          {/* Progress / result */}
          {submitting && (
            <div className="mt-6">
              <Progress value={progress}>
                <span className="text-xs text-muted-foreground">
                  Ingestion en cours... {progress}%
                </span>
              </Progress>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 flex items-center gap-2 rounded-lg p-3 text-sm ${
                result.success
                  ? "bg-[#27AE60]/10 text-[#27AE60]"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              {result.message}
            </div>
          )}

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              disabled={submitting}
              onClick={handleSubmit}
              style={{ backgroundColor: "#1B4F72" }}
            >
              {submitting ? "Ingestion en cours..." : "Lancer l'ingestion"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
