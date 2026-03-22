"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  FileText,
  Layers,
  Plus,
  ArrowRight,
  Calendar,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  totalBases: number;
}

interface KnowledgeBase {
  id: string;
  name: string;
  type: string;
  documentCount: number;
  createdAt: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Knowledge Base Dashboard
// ---------------------------------------------------------------------------

export default function KnowledgePage() {
  const { locale } = useParams<{ locale: string }>();

  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [statsRes, basesRes] = await Promise.all([
          fetch("/api/rag/stats"),
          fetch("/api/rag/knowledge-base"),
        ]);

        if (!statsRes.ok) throw new Error("Erreur lors du chargement des statistiques");
        if (!basesRes.ok) throw new Error("Erreur lors du chargement des bases");

        const statsData = await statsRes.json();
        const basesData = await basesRes.json();

        setStats(statsData);
        setBases(Array.isArray(basesData) ? basesData : basesData.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
    switch (type.toLowerCase()) {
      case "pdf":
      case "document":
        return "default";
      case "url":
      case "web":
        return "secondary";
      default:
        return "outline";
    }
  }

  // -------------------------------------------------------------------------
  // Stat card sub-component
  // -------------------------------------------------------------------------

  function StatCard({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: number | undefined;
    color: string;
  }) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 pt-2">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: color + "1a", color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">
                {value?.toLocaleString("fr-FR") ?? "—"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1B4F72" }}>
            Base de connaissances
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerez vos bases de connaissances, documents et contenus indexes.
          </p>
        </div>
        <Link href={`/${locale}/knowledge/ingest`}>
          <Button size="lg" style={{ backgroundColor: "#1B4F72" }}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ingerer du contenu
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Documents totaux"
          value={stats?.totalDocuments}
          color="#1B4F72"
        />
        <StatCard
          icon={Layers}
          label="Chunks totaux"
          value={stats?.totalChunks}
          color="#2E86C1"
        />
        <StatCard
          icon={Database}
          label="Bases de connaissances"
          value={stats?.totalBases}
          color="#27AE60"
        />
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Knowledge bases list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Vos bases de connaissances</h2>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-1 h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucune base de connaissances trouvee
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Commencez par ingerer du contenu pour creer votre premiere base.
              </p>
              <Link href={`/${locale}/knowledge/ingest`} className="mt-4">
                <Button variant="outline" size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Ingerer du contenu
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bases.map((base) => (
              <Link key={base.id} href={`/${locale}/knowledge/${base.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{base.name}</CardTitle>
                      <Badge variant={typeBadgeVariant(base.type)}>
                        {base.type}
                      </Badge>
                    </div>
                    {base.description && (
                      <CardDescription className="line-clamp-2">
                        {base.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>
                        {base.documentCount} document{base.documentCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Cree le {formatDate(base.createdAt)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: "#2E86C1" }}
                    >
                      Voir les details
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
