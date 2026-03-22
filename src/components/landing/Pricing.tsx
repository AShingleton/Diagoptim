"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants";
import { Check } from "lucide-react";
import type { BillingInterval } from "@/types/billing";
import Link from "next/link";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Pricing() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const isAnnual = interval === "annual";

  function formatPrice(plan: (typeof PRICING_PLANS)[number]) {
    if (plan.price.monthly === 0) return "0";
    const price = isAnnual
      ? Math.round(plan.price.annual / 12)
      : plan.price.monthly;
    return price.toString();
  }

  function getCtaKey(planId: string) {
    if (planId === "free") return "pricing.startFree";
    if (planId === "expert") return "pricing.contactUs";
    return "pricing.choosePlan";
  }

  return (
    <section ref={ref} id="pricing" className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("pricing.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-12 flex items-center justify-center gap-3"
        >
          <span
            className={`text-sm font-medium transition-colors ${
              !isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t("pricing.monthly")}
          </span>

          <button
            type="button"
            onClick={() =>
              setInterval(isAnnual ? "monthly" : "annual")
            }
            className="relative h-7 w-12 rounded-full bg-primary/20 transition-colors hover:bg-primary/30"
            aria-label="Toggle billing interval"
          >
            <motion.div
              className="absolute top-0.5 h-6 w-6 rounded-full bg-primary shadow-sm"
              animate={{ left: isAnnual ? "calc(100% - 1.625rem)" : "0.125rem" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>

          <span
            className={`text-sm font-medium transition-colors ${
              isAnnual ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t("pricing.annual")}
          </span>

          <AnimatePresence>
            {isAnnual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success"
              >
                {t("pricing.annualSave")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {PRICING_PLANS.map((plan) => {
            const isHighlighted = plan.highlighted;
            return (
              <motion.div
                key={plan.id}
                variants={cardVariants}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                  isHighlighted
                    ? "border-primary/40 bg-white shadow-lg shadow-primary/10 dark:bg-card"
                    : "border-white/20 bg-white/80 shadow-sm backdrop-blur-md hover:shadow-md dark:border-white/10 dark:bg-card/80"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      {t(plan.badge)}
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {t(plan.nameKey)}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(plan)}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {t("common.euro")}
                    </span>
                  </div>
                  {plan.price.monthly > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {t("pricing.perMonth")}
                    </span>
                  )}
                  {isAnnual && plan.price.monthly > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground/70">
                      {plan.price.annual}
                      {t("common.euro")} / an
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" />
                      <span className="text-sm text-muted-foreground">
                        {t(featureKey)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.id === "free" ? "/diagnostic" : "/auth/register"}>
                  <Button
                    variant={isHighlighted ? "default" : "outline"}
                    size="lg"
                    className={`w-full rounded-xl ${
                      isHighlighted
                        ? "shadow-md shadow-primary/20"
                        : ""
                    }`}
                  >
                    {t(getCtaKey(plan.id))}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
