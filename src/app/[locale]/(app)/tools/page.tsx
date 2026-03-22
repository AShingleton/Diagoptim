"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  GitBranch,
  Network,
  FileText,
  Grid2x2,
  Target,
  Building,
  Compass,
  Shield,
  PieChart,
  BarChart3,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { LEAN_TOOLS } from "@/lib/constants";

const iconMap: Record<string, typeof GitBranch> = {
  GitBranch, Network, FileText, Grid2x2, Target,
  Building, Compass, Shield, PieChart, BarChart3,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3 } },
};

export default function ToolsPage() {
  const { t, locale } = useTranslation();
  const userTier = "pro"; // mock

  const tierOrder = ["free", "starter", "pro", "expert"];
  const isLocked = (required: string) =>
    tierOrder.indexOf(required) > tierOrder.indexOf(userTier);

  const categoryLabels: Record<string, string> = {
    analysis: locale === "fr" ? "Analyse" : "Analysis",
    strategy: locale === "fr" ? "Stratégie" : "Strategy",
    improvement: locale === "fr" ? "Amélioration" : "Improvement",
  };

  const grouped = LEAN_TOOLS.reduce<Record<string, typeof LEAN_TOOLS>>((acc, tool) => {
    (acc[tool.category] ??= []).push(tool);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("tools.title")}</h1>
        <p className="text-muted-foreground">{t("tools.subtitle")}</p>
      </div>

      {Object.entries(grouped).map(([category, tools]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold mb-4">{categoryLabels[category]}</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tools.map((tool) => {
              const Icon = iconMap[tool.icon] || Target;
              const locked = isLocked(tool.tierRequired);

              return (
                <motion.div key={tool.id} variants={itemVariants}>
                  <Card
                    className={`glass group hover:shadow-lg transition-all duration-300 ${
                      locked ? "opacity-60" : "hover:scale-[1.02]"
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        {locked && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Lock className="h-3 w-3" />
                            {tool.tierRequired}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{t(tool.nameKey)}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t(tool.descriptionKey)}
                      </p>
                      {locked ? (
                        <Button variant="outline" size="sm" disabled className="w-full gap-2">
                          <Lock className="h-3 w-3" />
                          {t("tools.locked")} {tool.tierRequired}
                        </Button>
                      ) : (
                        <Link href={`/${locale}/tools/${tool.id}`}>
                          <Button variant="outline" size="sm" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            {t("tools.open")}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
