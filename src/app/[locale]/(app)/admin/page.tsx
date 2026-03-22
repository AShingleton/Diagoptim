"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Activity,
  CreditCard,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Plan prices for MRR calculation
const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 49,
  pro: 149,
  expert: 299,
  consultant_solo: 199,
  consultant_cabinet: 499,
};

interface AdminStats {
  totalUsers: number;
  diagnosticsThisMonth: number;
  subscribersByPlan: Record<string, number>;
  mrr: number;
  signups30d: { date: string; count: number }[];
  recentDiagnostics: {
    id: string;
    companyName: string;
    type: string;
    completedAt: string;
  }[];
}

interface HealthStatus {
  status: string;
  version: string;
  uptime: number;
  services: Record<string, boolean>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // Stats API not yet available — show empty state
    } finally {
      setLoading(false);
    }
  }

  async function checkHealth() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/health");
      setHealth(await res.json());
    } catch {
      setHealth({ status: "unreachable", version: "?", uptime: 0, services: {} });
    } finally {
      setHealthLoading(false);
    }
  }

  // Calculate MRR from subscribers
  const mrr = stats
    ? Object.entries(stats.subscribersByPlan).reduce(
        (total, [plan, count]) => total + (PLAN_PRICES[plan] || 0) * count,
        0
      )
    : 0;

  const totalSubscribers = stats
    ? Object.entries(stats.subscribersByPlan)
        .filter(([plan]) => plan !== "free")
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Administration</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administration</h1>
        <Button variant="outline" onClick={loadStats} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Utilisateurs totaux"
          value={stats?.totalUsers ?? 0}
          icon={Users}
        />
        <StatCard
          title="Diagnostics ce mois"
          value={stats?.diagnosticsThisMonth ?? 0}
          icon={Activity}
        />
        <StatCard
          title="Abonnés payants"
          value={totalSubscribers}
          icon={CreditCard}
          subtitle={
            stats?.subscribersByPlan
              ? Object.entries(stats.subscribersByPlan)
                  .filter(([plan]) => plan !== "free")
                  .map(([plan, count]) => `${plan}: ${count}`)
                  .join(", ")
              : undefined
          }
        />
        <StatCard
          title="MRR estimé"
          value={`${mrr.toLocaleString("fr-FR")} €`}
          icon={TrendingUp}
        />
      </div>

      {/* Charts + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups chart */}
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Inscriptions (30 derniers jours)
          </h2>
          {stats?.signups30d && stats.signups30d.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.signups30d}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Aucune donnée disponible
            </div>
          )}
        </Card>

        {/* Health Check */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">État des services</h2>
          <Button
            onClick={checkHealth}
            disabled={healthLoading}
            className="w-full mb-4 gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${healthLoading ? "animate-spin" : ""}`} />
            Lancer le health check
          </Button>

          {health && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge variant={health.status === "ok" ? "default" : "destructive"}>
                  {health.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Version</span>
                <span className="text-sm font-mono">{health.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm">
                  {Math.round(health.uptime / 60)} min
                </span>
              </div>
              <hr className="my-2" />
              {Object.entries(health.services).map(([service, ok]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{service}</span>
                  {ok ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent diagnostics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          10 derniers diagnostics complétés
        </h2>
        {stats?.recentDiagnostics && stats.recentDiagnostics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Entreprise</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Complété le</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDiagnostics.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="py-2">{d.companyName}</td>
                    <td className="py-2">
                      <Badge variant="outline">{d.type}</Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(d.completedAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun diagnostic complété</p>
        )}
      </Card>
    </div>
  );
}
