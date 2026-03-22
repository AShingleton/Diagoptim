"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Zap,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";
import type { RoadmapAction, ActionStatus } from "@/types/roadmap";

const MOCK_ACTIONS: RoadmapAction[] = [
  {
    id: "1", diagnosticId: "d1", companyId: "c1",
    title: "Réduire les stocks tampons entre postes",
    description: "Mettre en place un système kanban entre les postes de production",
    category: "quick_win", priority: 9, estimatedGain: 25000,
    effortLevel: "low", status: "in_progress", dueDate: "2026-04-15",
    wasteCategory: "inventory", methodology: "lean", createdAt: "2026-03-20",
  },
  {
    id: "2", diagnosticId: "d1", companyId: "c1",
    title: "Optimiser le planning de maintenance préventive",
    description: "Passer d'une maintenance corrective à préventive avec un calendrier structuré",
    category: "short_term", priority: 8, estimatedGain: 35000,
    effortLevel: "medium", status: "todo", dueDate: "2026-05-01",
    wasteCategory: "waiting", methodology: "lean", createdAt: "2026-03-20",
  },
  {
    id: "3", diagnosticId: "d1", companyId: "c1",
    title: "Passer en flux tiré sur la ligne principale",
    description: "Transformer la ligne de production principale du flux poussé au flux tiré",
    category: "structural", priority: 7, estimatedGain: 40000,
    effortLevel: "high", status: "todo", dueDate: "2026-06-30",
    wasteCategory: "overproduction", methodology: "lean", createdAt: "2026-03-20",
  },
  {
    id: "4", diagnosticId: "d1", companyId: "c1",
    title: "Installer un contrôle qualité en ligne",
    description: "Ajouter des capteurs et points de contrôle sur la chaîne de production",
    category: "short_term", priority: 6, estimatedGain: 20000,
    effortLevel: "medium", status: "completed", dueDate: "2026-04-01",
    wasteCategory: "defects", methodology: "six_sigma", createdAt: "2026-03-15",
    completedAt: "2026-03-28",
  },
  {
    id: "5", diagnosticId: "d1", companyId: "c1",
    title: "Entretiens de compétences trimestriels",
    description: "Mettre en place des entretiens structurés pour identifier et valoriser les compétences",
    category: "quick_win", priority: 5, estimatedGain: 15000,
    effortLevel: "low", status: "completed", dueDate: "2026-03-30",
    wasteCategory: "skills", methodology: "lean", createdAt: "2026-03-10",
    completedAt: "2026-03-25",
  },
];

const statusIcons: Record<ActionStatus, typeof CheckCircle2> = {
  todo: Clock,
  in_progress: ArrowUpDown,
  completed: CheckCircle2,
  skipped: Clock,
};

const statusColors: Record<ActionStatus, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  skipped: "bg-muted text-muted-foreground",
};

const categoryColors: Record<string, string> = {
  quick_win: "bg-success/10 text-success border-success/30",
  short_term: "bg-accent/10 text-accent border-accent/30",
  structural: "bg-warning/10 text-warning border-warning/30",
  transformation: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function RoadmapPage() {
  const { t, locale } = useTranslation();
  const [actions] = useState(MOCK_ACTIONS);
  const [filter, setFilter] = useState<string>("all");

  const completedCount = actions.filter((a) => a.status === "completed").length;
  const totalGains = actions.reduce((sum, a) => sum + a.estimatedGain, 0);
  const completedGains = actions
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + a.estimatedGain, 0);
  const completionRate = Math.round((completedCount / actions.length) * 100);
  const fmt = (n: number) => n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");

  const filteredActions =
    filter === "all" ? actions : actions.filter((a) => a.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">{t("roadmap.title")}</h1>
          <p className="text-muted-foreground">{t("roadmap.subtitle")}</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("roadmap.addAction")}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("roadmap.totalGains")}</p>
                <p className="text-xl font-bold">{fmt(totalGains)}€</p>
                <p className="text-xs text-success">{fmt(completedGains)}€ {t("roadmap.status.completed").toLowerCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("roadmap.completionRate")}</p>
                <p className="text-xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">
                  {completedCount}/{actions.length} actions
                </p>
              </div>
            </div>
            <Progress value={completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quick Wins</p>
                <p className="text-xl font-bold">
                  {actions.filter((a) => a.category === "quick_win").length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {actions.filter((a) => a.category === "quick_win" && a.status === "completed").length} {t("roadmap.status.completed").toLowerCase()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({actions.length})</TabsTrigger>
          <TabsTrigger value="todo">{t("roadmap.status.todo")}</TabsTrigger>
          <TabsTrigger value="in_progress">{t("roadmap.status.inProgress")}</TabsTrigger>
          <TabsTrigger value="completed">{t("roadmap.status.completed")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Action List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredActions.map((action, i) => {
            const StatusIcon = statusIcons[action.status];
            return (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                layout
              >
                <Card className="glass hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${statusColors[action.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium">{action.title}</h3>
                            {action.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {action.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className={`text-xs ${categoryColors[action.category]}`}>
                                {t(`roadmap.${action.category === "quick_win" ? "quickWin" : action.category === "short_term" ? "shortTerm" : action.category}`)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {t(`roadmap.${action.effortLevel}`)}
                              </Badge>
                              {action.wasteCategory && (
                                <Badge variant="secondary" className="text-xs">
                                  {t(`diagnostic.wastes.${action.wasteCategory}`)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-success">+{fmt(action.estimatedGain)}€</p>
                            {action.dueDate && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {action.dueDate}
                              </div>
                            )}
                          </div>
                        </div>
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
