"use client";

import { motion } from "framer-motion";
import { Rocket, Zap, Crown, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { SUPPORT_PACKS } from "@/lib/constants";

const packIcons = { coup_de_pouce: Zap, acceleration: Rocket, transformation: Crown };
const packColors = {
  coup_de_pouce: "from-accent/20 to-accent/5",
  acceleration: "from-warning/20 to-warning/5",
  transformation: "from-primary/20 to-primary/5",
};

export default function SupportPage() {
  const { t, locale } = useTranslation();
  const fmt = (n: number) => n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold font-heading">{t("support.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("support.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SUPPORT_PACKS.map((pack, i) => {
          const Icon = packIcons[pack.id];
          const gradient = packColors[pack.id];

          return (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <CardHeader className="text-center pb-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{t(pack.nameKey)}</CardTitle>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-bold">{fmt(pack.price)}€</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {pack.hours} {t("support.hours")}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {pack.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full">{t("support.book")}</Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
