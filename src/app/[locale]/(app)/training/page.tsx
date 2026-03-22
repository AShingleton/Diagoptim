"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, FileText, BookOpen, Clock, CheckCircle, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/useTranslation";

const MOCK_TRAININGS = [
  {
    id: "1", title: "Introduction au Lean Management", titleEn: "Introduction to Lean Management",
    type: "video" as const, category: "theory", methodology: "lean_8wastes",
    duration: 15, description: "Découvrez les fondamentaux du Lean", descriptionEn: "Discover the fundamentals of Lean",
    tierRequired: "free", progress: 100,
  },
  {
    id: "2", title: "Les 8 gaspillages expliqués", titleEn: "The 8 Wastes Explained",
    type: "video" as const, category: "theory", methodology: "lean_8wastes",
    duration: 25, description: "Apprenez à identifier les 8 types de gaspillages", descriptionEn: "Learn to identify the 8 types of waste",
    tierRequired: "free", progress: 60,
  },
  {
    id: "3", title: "Fiche mémo : Value Stream Mapping", titleEn: "Memory Sheet: Value Stream Mapping",
    type: "memory_sheet" as const, category: "practice", methodology: "vsm",
    duration: 5, description: "Guide pratique pour réaliser un VSM", descriptionEn: "Practical guide for creating a VSM",
    tierRequired: "starter", progress: 0,
  },
  {
    id: "4", title: "Fiche mémo : Diagramme d'Ishikawa", titleEn: "Memory Sheet: Ishikawa Diagram",
    type: "memory_sheet" as const, category: "practice", methodology: "ishikawa",
    duration: 5, description: "Les étapes clés d'une analyse Ishikawa", descriptionEn: "Key steps in an Ishikawa analysis",
    tierRequired: "free", progress: 0,
  },
  {
    id: "5", title: "Atelier DMAIC pas à pas", titleEn: "Step-by-step DMAIC Workshop",
    type: "guide" as const, category: "practice", methodology: "dmaic",
    duration: 45, description: "Guide complet pour mener un projet DMAIC", descriptionEn: "Complete guide for running a DMAIC project",
    tierRequired: "pro", progress: 0,
  },
  {
    id: "6", title: "Lean dans l'industrie", titleEn: "Lean in Manufacturing",
    type: "video" as const, category: "sector_specific", methodology: "lean_8wastes",
    duration: 30, description: "Application du Lean dans le secteur industriel", descriptionEn: "Applying Lean in manufacturing",
    tierRequired: "starter", progress: 0,
  },
];

const typeIcons = { video: Play, memory_sheet: FileText, guide: BookOpen };
const typeColors = {
  video: "bg-accent/10 text-accent",
  memory_sheet: "bg-success/10 text-success",
  guide: "bg-warning/10 text-warning",
};

export default function TrainingPage() {
  const { t, locale } = useTranslation();
  const [tab, setTab] = useState("all");
  const userTier = "starter";
  const tierOrder = ["free", "starter", "pro", "expert"];
  const isLocked = (required: string) => tierOrder.indexOf(required) > tierOrder.indexOf(userTier);

  const filtered = tab === "all"
    ? MOCK_TRAININGS
    : MOCK_TRAININGS.filter((tr) => tr.type === tab);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("training.title")}</h1>
        <p className="text-muted-foreground">{t("training.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="video" className="gap-1">
            <Play className="h-3 w-3" /> {t("training.videos")}
          </TabsTrigger>
          <TabsTrigger value="memory_sheet" className="gap-1">
            <FileText className="h-3 w-3" /> {t("training.sheets")}
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1">
            <BookOpen className="h-3 w-3" /> {t("training.guides")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filtered.map((tr) => {
          const Icon = typeIcons[tr.type];
          const locked = isLocked(tr.tierRequired);

          return (
            <motion.div
              key={tr.id}
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            >
              <Card className={`glass hover:shadow-lg transition-all group ${locked ? "opacity-60" : "hover:scale-[1.02]"}`}>
                {/* Thumbnail area */}
                <div className={`h-32 rounded-t-xl flex items-center justify-center ${typeColors[tr.type]}`}>
                  <Icon className="h-12 w-12 opacity-50" />
                  {locked && (
                    <div className="absolute">
                      <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {tr.type === "video" ? t("training.videos") : tr.type === "memory_sheet" ? t("training.sheets") : t("training.guides")}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {tr.duration} {t("training.minutes")}
                    </div>
                  </div>
                  <h3 className="font-medium text-sm mb-1">
                    {locale === "fr" ? tr.title : tr.titleEn}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {locale === "fr" ? tr.description : tr.descriptionEn}
                  </p>

                  {tr.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {tr.progress === 100 ? t("training.completed") : t("training.inProgress")}
                        </span>
                        <span>{tr.progress}%</span>
                      </div>
                      <Progress value={tr.progress} className="h-1.5" />
                    </div>
                  )}

                  <Button
                    variant={locked ? "outline" : tr.progress > 0 && tr.progress < 100 ? "default" : "outline"}
                    size="sm"
                    disabled={locked}
                    className="w-full gap-2"
                  >
                    {locked ? (
                      <><Lock className="h-3 w-3" /> {tr.tierRequired}</>
                    ) : tr.progress === 100 ? (
                      <><CheckCircle className="h-3 w-3" /> {t("training.completed")}</>
                    ) : tr.progress > 0 ? (
                      <><Play className="h-3 w-3" /> {t("training.resume")}</>
                    ) : (
                      <><Play className="h-3 w-3" /> {t("training.start")}</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
