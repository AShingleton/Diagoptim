"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

function AnimatedCounter({
  target,
  suffix,
  label,
  inView,
}: {
  target: number;
  suffix: string;
  label: string;
  inView: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white sm:text-4xl">
        {count.toLocaleString("fr-FR")}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Hero() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.5 });

  const stats = [
    {
      target: 500,
      suffix: "+",
      label: t("landing.hero.stats.companies"),
    },
    {
      target: 2,
      suffix: "M€+",
      label: t("landing.hero.stats.savings"),
    },
    {
      target: 98,
      suffix: "%",
      label: t("landing.hero.stats.satisfaction"),
    },
  ];

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1B4F72] to-[#2E86C1]">
        {/* Animated orbs */}
        <motion.div
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#2E86C1]/30 blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" as const }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#1B4F72]/40 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" as const }}
        />
        <motion.div
          className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#2E86C1]/20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" as const }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center"
        >
          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t("landing.hero.title")}{" "}
            <span className="bg-gradient-to-r from-[#5dade2] to-[#85c1e9] bg-clip-text text-transparent">
              {t("landing.hero.titleHighlight")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl"
          >
            {t("landing.hero.subtitle")}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/diagnostic">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-[#1B4F72] shadow-lg shadow-white/10 transition-all hover:bg-white/90 hover:shadow-xl hover:shadow-white/20"
              >
                {t("landing.hero.cta")}
                <ArrowRight className="size-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 gap-2 rounded-xl border-white/30 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10"
              >
                <Play className="size-4" />
                {t("landing.hero.ctaSecondary")}
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            ref={statsRef}
            variants={itemVariants}
            className="mx-auto mt-16 grid max-w-xl grid-cols-3 gap-8 rounded-2xl border border-white/10 bg-white/5 px-6 py-8 backdrop-blur-sm sm:mt-20 sm:max-w-2xl sm:gap-12"
          >
            {stats.map((stat, i) => (
              <AnimatedCounter
                key={i}
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                inView={statsInView}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
