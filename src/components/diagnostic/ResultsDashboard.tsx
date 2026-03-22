"use client";

import { motion } from "framer-motion";
import { Download, Map, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useDiagnosticStore } from "@/stores/diagnosticStore";
import RadarChart8Wastes from "@/components/charts/RadarChart8Wastes";
import ScoreGauge from "@/components/charts/ScoreGauge";
import type { WasteScores, WasteCategory } from "@/types/diagnostic";
import { WASTE_CATEGORIES } from "@/lib/constants";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Mock data for demo
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

const MOCK_RECOMMENDATIONS = [
  {
    id: "1",
    waste: "inventory" as WasteCategory,
    titleFr: "Réduire les stocks tampons entre postes",
    titleEn: "Reduce buffer stock between workstations",
    impact: "high" as const,
    gain: 25000,
  },
  {
    id: "2",
    waste: "skills" as WasteCategory,
    titleFr: "Mettre en place des entretiens de compétences trimestriels",
    titleEn: "Implement quarterly skills reviews",
    impact: "medium" as const,
    gain: 15000,
  },
  {
    id: "3",
    waste: "waiting" as WasteCategory,
    titleFr: "Optimiser le planning de maintenance préventive",
    titleEn: "Optimize preventive maintenance scheduling",
    impact: "high" as const,
    gain: 35000,
  },
  {
    id: "4",
    waste: "overproduction" as WasteCategory,
    titleFr: "Passer en flux tiré sur la ligne principale",
    titleEn: "Switch to pull-flow on main production line",
    impact: "high" as const,
    gain: 40000,
  },
  {
    id: "5",
    waste: "defects" as WasteCategory,
    titleFr: "Installer un contrôle qualité en ligne",
    titleEn: "Install in-line quality control",
    impact: "medium" as const,
    gain: 20000,
  },
];

function getScoreMessage(score: number, t: (key: string) => string): string {
  if (score >= 70) return t("diagnostic.results.scoreExcellent");
  if (score >= 50) return t("diagnostic.results.scoreGood");
  if (score >= 30) return t("diagnostic.results.scoreMedium");
  return t("diagnostic.results.scoreLow");
}

function getTopWastes(scores: WasteScores, count: number = 3): { key: WasteCategory; score: number }[] {
  return Object.entries(scores)
    .map(([key, score]) => ({ key: key as WasteCategory, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function ResultsDashboard() {
  const { t, locale } = useTranslation();
  const { wasteScores, globalScore } = useDiagnosticStore();

  const scores = wasteScores || MOCK_SCORES;
  const score = globalScore ?? 42;
  const topWastes = getTopWastes(scores);
  const totalGains = MOCK_RECOMMENDATIONS.reduce((sum, r) => sum + r.gain, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-3xl font-bold font-heading">{t("diagnostic.results.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("diagnostic.results.subtitle")}</p>
      </motion.div>

      {/* Score + Radar Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Score */}
        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-center">{t("diagnostic.results.globalScore")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <ScoreGauge score={score} size={220} />
              <p className="text-center text-muted-foreground max-w-sm">
                {getScoreMessage(score, t)}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>{totalGains.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}€</span>
                </div>
                <span className="text-muted-foreground">{t("roadmap.totalGains")}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={itemVariants}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-center">{t("diagnostic.results.wasteRadar")}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <RadarChart8Wastes scores={scores} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Issues */}
      <motion.div variants={itemVariants}>
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              {t("diagnostic.results.topIssues")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topWastes.map((waste, index) => {
                const category = WASTE_CATEGORIES.find((c) => c.key === waste.key);
                return (
                  <motion.div
                    key={waste.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.15 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: category?.color }}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {t(`diagnostic.wastes.${waste.key}`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Score: {waste.score.toFixed(1)}/10
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendations */}
      <motion.div variants={itemVariants}>
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              {t("diagnostic.results.recommendations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_RECOMMENDATIONS.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {locale === "fr" ? rec.titleFr : rec.titleEn}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {t(`diagnostic.wastes.${rec.waste}`)}
                        </Badge>
                        <Badge
                          variant={rec.impact === "high" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {rec.impact === "high" ? "Impact élevé" : "Impact moyen"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success">
                      +{rec.gain.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}€
                    </p>
                    <p className="text-xs text-muted-foreground">{t("roadmap.estimatedGain")}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button size="lg" variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {t("diagnostic.results.downloadReport")}
        </Button>
        <Button size="lg" className="gap-2">
          <Map className="h-4 w-4" />
          {t("diagnostic.results.startRoadmap")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
