"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  CheckCircle,
  Target,
  ArrowRight,
  Plus,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { FinancialGoalProgress } from "@/components/dashboard/FinancialGoalProgress";
import ScoreGauge from "@/components/charts/ScoreGauge";
import RadarChart8Wastes from "@/components/charts/RadarChart8Wastes";
import type { WasteScores } from "@/types/diagnostic";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Mock data
const MOCK_SCORES: WasteScores = {
  overproduction: 6.5,
  waiting: 7.2,
  transport: 4.1,
  overprocessing: 5.8,
  inventory: 8.0,
  motion: 3.5,
  defects: 6.0,
  skills: 7.5,
};

const MOCK_PRIORITIES = [
  { id: "1", titleFr: "Réduire les stocks tampons", titleEn: "Reduce buffer stock", gain: 25000, category: "quick_win" },
  { id: "2", titleFr: "Optimiser la maintenance préventive", titleEn: "Optimize preventive maintenance", gain: 35000, category: "short_term" },
  { id: "3", titleFr: "Passer en flux tiré", titleEn: "Switch to pull-flow", gain: 40000, category: "structural" },
];

const MOCK_ACTIVITIES = [
  { id: "1", textFr: "Diagnostic complété", textEn: "Diagnostic completed", date: "2026-03-20", type: "diagnostic" },
  { id: "2", textFr: "Action 'Réduire stocks' démarrée", textEn: "Action 'Reduce stock' started", date: "2026-03-19", type: "action" },
  { id: "3", textFr: "Formation VSM terminée", textEn: "VSM training completed", date: "2026-03-18", type: "training" },
];

const MOCK_UPCOMING = [
  { id: "1", titleFr: "Revue des indicateurs", titleEn: "KPI review", dueDate: "2026-03-25" },
  { id: "2", titleFr: "Atelier Ishikawa", titleEn: "Ishikawa workshop", dueDate: "2026-03-28" },
  { id: "3", titleFr: "Audit 5S atelier", titleEn: "5S workshop audit", dueDate: "2026-04-02" },
];

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const userName = "Antoine";
  const globalScore = 42;
  const hasDiagnostic = true;

  const fmt = (n: number) => n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      quick_win: "bg-success/10 text-success",
      short_term: "bg-accent/10 text-accent",
      structural: "bg-warning/10 text-warning",
      transformation: "bg-destructive/10 text-destructive",
    };
    return colors[cat] || "bg-muted text-muted-foreground";
  };

  if (!hasDiagnostic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t("dashboard.noData")}</h2>
          <p className="mt-2 text-muted-foreground max-w-md">{t("dashboard.noDataDesc")}</p>
          <Link href={`/${locale}/diagnostic/new`}>
            <Button size="lg" className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.startDiagnostic")}
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">
            {t("dashboard.greeting")}, {userName} !
          </h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <Link href={`/${locale}/diagnostic/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("nav.newDiagnostic")}
          </Button>
        </Link>
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("dashboard.globalScore"), value: `${globalScore}/100`, icon: Target, color: "text-primary" },
          { label: t("dashboard.estimatedSavings"), value: `${fmt(135000)}€`, icon: TrendingUp, color: "text-success" },
          { label: t("dashboard.completedActions"), value: "3/12", icon: CheckCircle, color: "text-accent" },
          { label: t("dashboard.progression"), value: "25%", icon: Activity, color: "text-warning" },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} variants={cardVariants}>
            <Card className="glass hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${kpi.color}`}>
                    <kpi.icon className="h-6 w-6" />
                  </div>
                </div>
                {i === 3 && <Progress value={25} className="mt-3 h-2" />}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={cardVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("dashboard.globalScore")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ScoreGauge score={globalScore} size={200} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("diagnostic.results.wasteRadar")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <RadarChart8Wastes scores={MOCK_SCORES} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Financial Goal */}
      <motion.div variants={cardVariants}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("dashboard.financialGoal")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialGoalProgress
              current={12450}
              goal={50000}
              label={t("dashboard.estimatedSavings")}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Priorities + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Priorities */}
        <motion.div variants={cardVariants}>
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("dashboard.topPriorities")}</CardTitle>
              <Link href={`/${locale}/roadmap`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t("common.view")} <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_PRIORITIES.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{locale === "fr" ? p.titleFr : p.titleEn}</p>
                      <Badge variant="outline" className={`text-xs mt-1 ${getCategoryColor(p.category)}`}>
                        {t(`roadmap.${p.category === "quick_win" ? "quickWin" : p.category === "short_term" ? "shortTerm" : p.category}`)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">+{fmt(p.gain)}€</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Actions */}
        <motion.div variants={cardVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle>{t("dashboard.upcomingActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_UPCOMING.map((action, i) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{locale === "fr" ? action.titleFr : action.titleEn}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{action.dueDate}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={cardVariants}>
        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_ACTIVITIES.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm">{locale === "fr" ? activity.textFr : activity.textEn}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.date}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* CTA */}
      <motion.div variants={cardVariants}>
        <Card className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-heading font-bold mb-2">
                  {t("dashboard.ctaTitle")}
                </h3>
                <p className="text-primary-foreground/80">
                  {t("dashboard.ctaDesc")}
                </p>
              </div>
              <Link href={`/${locale}/diagnostic/new`}>
                <Button size="lg" variant="secondary" className="shrink-0 gap-2">
                  {t("dashboard.startDiagnostic")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
