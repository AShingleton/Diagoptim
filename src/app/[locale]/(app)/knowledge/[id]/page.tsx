"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Trash2,
  FileText,
  Hash,
  Layers,
  Calendar,
  Tag,
  Globe,
  FolderOpen,
  Cpu,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentChunk {
  index: number;
  content: string;
  tokenCount: number;
}

interface DocumentDetail {
  id: string;
  title: string;
  status: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  language?: string;
  createdAt: string;
  totalChunks: number;
  totalTokens: number;
  chunks: DocumentChunk[];
}

// ---------------------------------------------------------------------------
// Document Detail Page
// ---------------------------------------------------------------------------

export default function DocumentDetailPage() {
  const { locale, id } = useParams<{ locale: string; id: string }>();
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Fetch document
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/rag/knowledge-base/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Document introuvable.");
          throw new Error("Erreur lors du chargement du document.");
        }
        const data = await res.json();
        setDoc(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchDocument();
  }, [id]);

  // -------------------------------------------------------------------------
  // Delete handler
  // -------------------------------------------------------------------------

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/rag/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression.");
      router.push(`/${locale}/knowledge`);
    } catch {
      setError("Impossible de supprimer le document. Veuillez reessayer.");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function statusColor(status: string) {
    switch (status.toLowerCase()) {
      case "active":
      case "ready":
      case "indexed":
        return "default" as const;
      case "processing":
      case "pending":
        return "secondary" as const;
      case "error":
      case "failed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  }

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  }

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-7 w-60" />
        </div>
        <Card>
          <CardContent className="space-y-4 pt-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-2 pt-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------

  if (error && !doc) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/knowledge`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Erreur</h1>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Link href={`/${locale}/knowledge`} className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Retour a la liste
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doc) return null;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/knowledge`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "#1B4F72" }}
              >
                {doc.title}
              </h1>
              <Badge variant={statusColor(doc.status)}>{doc.status}</Badge>
            </div>
          </div>
        </div>

        {/* Delete button */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Supprimer
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
              <DialogDescription>
                Etes-vous sur de vouloir supprimer le document &laquo;&nbsp;{doc.title}&nbsp;&raquo; ?
                Cette action est irreversible et supprimera egalement tous les chunks associes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" />}
              >
                Annuler
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {doc.category && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Categorie :</span>
                <span className="font-medium">{doc.category}</span>
              </div>
            )}

            {doc.subcategory && (
              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sous-categorie :</span>
                <span className="font-medium">{doc.subcategory}</span>
              </div>
            )}

            {doc.language && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Langue :</span>
                <span className="font-medium">
                  {doc.language === "fr" ? "Francais" : doc.language === "en" ? "English" : doc.language}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cree le :</span>
              <span className="font-medium">{formatDate(doc.createdAt)}</span>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="flex items-center gap-2 text-sm sm:col-span-2">
                <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="shrink-0 text-muted-foreground">Tags :</span>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#2E86C11a", color: "#2E86C1" }}
            >
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chunks totaux</p>
              <p className="text-2xl font-bold tracking-tight">
                {doc.totalChunks.toLocaleString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#27AE601a", color: "#27AE60" }}
            >
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tokens totaux</p>
              <p className="text-2xl font-bold tracking-tight">
                {doc.totalTokens.toLocaleString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chunks section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold" style={{ color: "#1B4F72" }}>
          Chunks ({doc.totalChunks})
        </h2>

        {doc.chunks && doc.chunks.length > 0 ? (
          <div className="space-y-3">
            {doc.chunks.map((chunk) => (
              <Card key={chunk.index}>
                <CardContent className="pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        <Hash className="mr-0.5 h-3 w-3" />
                        {chunk.index}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {chunk.tokenCount.toLocaleString("fr-FR")} tokens
                      </span>
                    </div>
                  </div>
                  <Separator className="mb-2" />
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {truncate(chunk.content, 500)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucun chunk disponible
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Les chunks seront disponibles une fois l&apos;indexation terminee.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
