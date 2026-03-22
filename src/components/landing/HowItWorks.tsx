"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { MessageSquareText, BarChart3, Rocket, type LucideIcon } from "lucide-react";

interface Step {
  number: number;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: MessageSquareText,
    titleKey: "landing.howItWorks.step1.title",
    descriptionKey: "landing.howItWorks.step1.description",
  },
  {
    number: 2,
    icon: BarChart3,
    titleKey: "landing.howItWorks.step2.title",
    descriptionKey: "landing.howItWorks.step2.description",
  },
  {
    number: 3,
    icon: Rocket,
    titleKey: "landing.howItWorks.step3.title",
    descriptionKey: "landing.howItWorks.step3.description",
  },
];

const stepVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.25,
      duration: 0.6,
      ease: "easeOut" as const,
    },
  }),
};

const lineVariants = {
  hidden: { scaleY: 0 },
  visible: (i: number) => ({
    scaleY: 1,
    transition: {
      delay: i * 0.25 + 0.3,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export default function HowItWorks() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center sm:mb-20"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("landing.howItWorks.subtitle")}
          </p>
        </motion.div>

        {/* Steps - Mobile (vertical timeline) */}
        <div className="relative sm:hidden">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 h-full w-px bg-border" />

          <div className="space-y-12">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  className="relative flex gap-6 pl-2"
                >
                  {/* Number circle */}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="pb-2">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(step.titleKey)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t(step.descriptionKey)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Steps - Desktop (alternating layout) */}
        <div className="hidden sm:block">
          <div className="relative">
            {/* Center vertical line */}
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />

            <div className="space-y-16">
              {steps.map((step, i) => {
                const Icon = step.icon;
                const isLeft = i % 2 === 0;

                return (
                  <div key={step.number} className="relative">
                    {/* Animated connector line segment */}
                    {i < steps.length - 1 && (
                      <motion.div
                        custom={i}
                        variants={lineVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                        className="absolute left-1/2 top-12 h-[calc(100%+4rem)] w-px origin-top -translate-x-1/2 bg-primary/30"
                      />
                    )}

                    {/* Numbered circle on center line */}
                    <motion.div
                      custom={i}
                      variants={stepVariants}
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      className="absolute left-1/2 top-0 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/25"
                    >
                      {step.number}
                    </motion.div>

                    {/* Content card */}
                    <motion.div
                      custom={i}
                      variants={stepVariants}
                      initial="hidden"
                      animate={isInView ? "visible" : "hidden"}
                      className={`flex ${isLeft ? "justify-start pr-[calc(50%+3rem)]" : "justify-end pl-[calc(50%+3rem)]"}`}
                    >
                      <div className="max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/80">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">
                          {t(step.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {t(step.descriptionKey)}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
