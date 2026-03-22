"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ClipboardCheck,
  Map,
  Wrench,
  FileSearch,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}

const features: Feature[] = [
  {
    icon: ClipboardCheck,
    titleKey: "landing.features.diagnostic.title",
    descriptionKey: "landing.features.diagnostic.description",
  },
  {
    icon: Map,
    titleKey: "landing.features.roadmap.title",
    descriptionKey: "landing.features.roadmap.description",
  },
  {
    icon: Wrench,
    titleKey: "landing.features.tools.title",
    descriptionKey: "landing.features.tools.description",
  },
  {
    icon: FileSearch,
    titleKey: "landing.features.documents.title",
    descriptionKey: "landing.features.documents.description",
  },
  {
    icon: GraduationCap,
    titleKey: "landing.features.training.title",
    descriptionKey: "landing.features.training.description",
  },
  {
    icon: Users,
    titleKey: "landing.features.collaboration.title",
    descriptionKey: "landing.features.collaboration.description",
  },
];

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

export default function Features() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center sm:mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.titleKey}
                variants={cardVariants}
                className="group relative rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:border-white/10 dark:bg-card/80 sm:p-8"
              >
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-6" />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(feature.descriptionKey)}
                </p>

                {/* Hover glow */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
