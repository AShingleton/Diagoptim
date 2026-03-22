"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CTA() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-28">
      {/* Dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#1B4F72] to-[#15395c]">
        {/* Animated pattern */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "32px 32px"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear" as const,
          }}
        />

        {/* Floating orbs */}
        <motion.div
          className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#2E86C1]/15 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" as const }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#5dade2]/10 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" as const }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
        >
          {t("landing.cta.title")}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70"
        >
          {t("landing.cta.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10"
        >
          <Link href="/diagnostic">
            <Button
              size="lg"
              className="h-13 gap-2.5 rounded-xl bg-white px-10 text-base font-semibold text-[#1B4F72] shadow-lg shadow-black/20 transition-all hover:bg-white/90 hover:shadow-xl hover:shadow-black/25"
            >
              {t("landing.cta.button")}
              <ArrowRight className="size-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
