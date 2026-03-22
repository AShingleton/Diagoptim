"use client";

import { motion } from "framer-motion";
import { FileBarChart, Download, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

const MOCK_REPORTS = [
  {
    id: "r1",
    titleFr: "Diagnostic complet - Mars 2026",
    titleEn: "Full Diagnostic - March 2026",
    date: "2026-03-20",
    score: 42,
    type: "diagnostic",
  },
  {
    id: "r2",
    titleFr: "Rapport intermédiaire - Février 2026",
    titleEn: "Interim Report - February 2026",
    date: "2026-02-15",
    score: 38,
    type: "progress",
  },
];

export default function ReportsPage() {
  const { t, locale } = useTranslation();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">{t("nav.reports")}</h1>
      </div>

      <div className="space-y-4">
        {MOCK_REPORTS.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileBarChart className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {locale === "fr" ? report.titleFr : report.titleEn}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Score: {report.score}/100
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                    <Link href={`/${locale}/diagnostic/${report.id}/results`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        {t("common.view")}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
