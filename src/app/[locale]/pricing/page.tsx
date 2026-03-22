"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "@/hooks/useTranslation";
import { PRICING_PLANS } from "@/lib/constants";

export default function PricingPage() {
  const { t, locale } = useTranslation();
  const [annual, setAnnual] = useState(false);
  const fmt = (n: number) => n.toLocaleString(locale === "fr" ? "fr-FR" : "en-US");

  const faqItems = ["q1", "q2", "q3", "q4"];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-primary font-bold text-xl">
            <ArrowLeft className="h-5 w-5" />
            DiagOptim
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/login`}>
              <Button variant="ghost">{t("auth.login")}</Button>
            </Link>
            <Link href={`/${locale}/register`}>
              <Button>{t("auth.register")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold font-heading mb-4">{t("pricing.title")}</h1>
          <p className="text-lg text-muted-foreground mb-8">{t("pricing.subtitle")}</p>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={annual ? "text-muted-foreground" : "font-medium"}>
              {t("pricing.monthly")}
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={annual ? "font-medium" : "text-muted-foreground"}>
              {t("pricing.annual")}
            </span>
            {annual && (
              <Badge className="bg-success text-white">{t("pricing.annualSave")}</Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`relative glass hover:shadow-xl transition-all ${
                  plan.highlighted
                    ? "border-2 border-primary shadow-lg scale-[1.02]"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4">
                      {t(plan.badge)}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-lg">{t(plan.nameKey)}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {fmt(annual ? Math.round(plan.price.annual / 12) : plan.price.monthly)}€
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-muted-foreground">{t("pricing.perMonth")}</span>
                    )}
                  </div>
                  {annual && plan.price.monthly > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {fmt(plan.price.annual)}€/an
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.price.monthly === 0
                      ? t("pricing.startFree")
                      : plan.id === "expert"
                      ? t("pricing.contactUs")
                      : t("pricing.choosePlan")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold font-heading text-center mb-8">
            {t("pricing.faq.title")}
          </h2>
          <Accordion>
            {faqItems.map((item) => (
              <AccordionItem key={item} value={item}>
                <AccordionTrigger>{t(`pricing.faq.${item}`)}</AccordionTrigger>
                <AccordionContent>{t(`pricing.faq.a${item.slice(1)}`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </main>
    </div>
  );
}
