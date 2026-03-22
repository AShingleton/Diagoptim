"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Star } from "lucide-react";

interface Testimonial {
  initials: string;
  name: string;
  company: string;
  role: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    initials: "PD",
    name: "Philippe Durand",
    company: "Métallerie Durand",
    role: "Dirigeant",
    quote:
      "DiagOptim nous a permis d'identifier 120 000 € de gaspillages en une seule session. Le plan d'action généré était immédiatement applicable. En 3 mois, nous avons réduit nos temps d'attente de 40%.",
    rating: 5,
  },
  {
    initials: "SL",
    name: "Sophie Lemaire",
    company: "AgroTech Solutions",
    role: "Directrice des Opérations",
    quote:
      "L'outil de diagnostic est bluffant de précision. Il a mis le doigt sur des problèmes de surproduction que nous n'avions jamais quantifiés. Les outils Lean intégrés nous font gagner un temps précieux.",
    rating: 5,
  },
  {
    initials: "MB",
    name: "Marc Bertrand",
    company: "Imprimerie Bertrand & Fils",
    role: "Gérant",
    quote:
      "En tant que PME, nous n'avions pas les moyens de faire appel à un consultant Lean. DiagOptim nous offre le même niveau d'analyse à une fraction du coût. Le ROI a été visible dès le premier mois.",
    rating: 4,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center sm:mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("landing.testimonials.subtitle")}
          </p>
        </motion.div>

        {/* Testimonial Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={cardVariants}
              className="group relative flex flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:border-white/10 dark:bg-card/80"
            >
              {/* Quote mark */}
              <div className="mb-4 text-4xl font-serif leading-none text-primary/20">
                &ldquo;
              </div>

              {/* Quote text */}
              <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">
                {testimonial.quote}
              </p>

              {/* Rating */}
              <div className="mb-4">
                <StarRating rating={testimonial.rating} />
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                {/* Avatar with initials */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Auto-scrolling logo/badge bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-14 overflow-hidden"
        >
          <div className="relative">
            {/* Fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent" />

            <motion.div
              className="flex items-center gap-12"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear" as const,
              }}
            >
              {/* Duplicate for seamless loop */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground/60"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {t.initials}
                  </div>
                  <span className="whitespace-nowrap font-medium">
                    {t.company}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
