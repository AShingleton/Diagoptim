"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Menu,
  X,
  Globe,
  ArrowRight,
} from "lucide-react";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";

// ---------------------------------------------------------------------------
// Placeholder sections for components not yet created
// ---------------------------------------------------------------------------

function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {t("landing.howItWorks.title")}
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("landing.howItWorks.subtitle")}
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {(["step1", "step2", "step3"] as const).map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="relative rounded-2xl border bg-card p-8 text-left"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground text-lg font-bold mb-4">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t(`landing.howItWorks.${step}.title`)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(`landing.howItWorks.${step}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useTranslation();
  const testimonials = [
    {
      name: "Sophie Martin",
      role: "CEO, TechFlow",
      quote:
        "DiagOptim nous a permis d'identifier des gaspillages que nous ne soupconnions meme pas. En 3 mois, nous avons reduit nos couts de 15%.",
      avatar: "SM",
    },
    {
      name: "Pierre Durand",
      role: "COO, IndustriePro",
      quote:
        "La feuille de route generee est incroyablement pertinente. Chaque action est claire, mesurable et priorisee.",
      avatar: "PD",
    },
    {
      name: "Claire Lefevre",
      role: "DG, BioServices",
      quote:
        "L'interface est intuitive et le diagnostic conversationnel rend l'experience presque ludique. Excellent outil.",
      avatar: "CL",
    },
  ];

  return (
    <section id="testimonials" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {t("landing.testimonials.title")}
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("landing.testimonials.subtitle")}
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border bg-card p-8 text-left"
            >
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {item.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t, locale } = useTranslation();
  const plans = [
    {
      name: t("pricing.free"),
      price: "0",
      features: [
        t("pricing.features.oneDiagnostic"),
        t("pricing.features.basicReport"),
        t("pricing.features.threeActions"),
        t("pricing.features.memorySheets"),
      ],
      cta: t("pricing.startFree"),
      href: `/${locale}/register`,
      popular: false,
    },
    {
      name: t("pricing.starter"),
      price: "29",
      features: [
        t("pricing.features.unlimitedDiagnostics"),
        t("pricing.features.fullReport"),
        t("pricing.features.tenActions"),
        t("pricing.features.basicTools"),
        t("pricing.features.emailSupport"),
      ],
      cta: t("pricing.choosePlan"),
      href: `/${locale}/register`,
      popular: false,
    },
    {
      name: t("pricing.pro"),
      price: "79",
      features: [
        t("pricing.features.advancedReport"),
        t("pricing.features.unlimitedActions"),
        t("pricing.features.allTools"),
        t("pricing.features.documentAnalysis"),
        t("pricing.features.teamCollaboration"),
        t("pricing.features.prioritySupport"),
      ],
      cta: t("pricing.choosePlan"),
      href: `/${locale}/register`,
      popular: true,
    },
    {
      name: t("pricing.expert"),
      price: "199",
      features: [
        t("pricing.features.everything"),
        t("pricing.features.customDiagnostic"),
        t("pricing.features.apiAccess"),
        t("pricing.features.whiteLabel"),
        t("pricing.features.dedicatedSupport"),
        t("pricing.features.onboarding"),
      ],
      cta: t("pricing.contactUs"),
      href: `/${locale}/register`,
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          {t("pricing.title")}
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
          {t("pricing.subtitle")}
        </p>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl border p-6 text-left flex flex-col ${
                plan.popular
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {t("pricing.popular")}
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">
                  {t("common.euro")}
                  {t("pricing.perMonth")}
                </span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-primary">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className="mt-6">
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t, locale } = useTranslation();
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#1B4F72] to-[#2E86C1] p-12 md:p-16"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">
            {t("landing.cta.subtitle")}
          </p>
          <Link href={`/${locale}/register`}>
            <Button
              size="lg"
              className="mt-8 h-12 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-[#1B4F72] shadow-lg hover:bg-white/90"
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

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  const { t, locale } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const otherLocale = locale === "fr" ? "en" : "fr";

  const navLinks = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.faq"), href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
              <Activity className="w-5 h-5" />
            </div>
            <span
              className={`text-lg font-bold tracking-tight ${
                scrolled ? "text-foreground" : "text-white"
              }`}
            >
              DiagOptim
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  scrolled
                    ? "text-muted-foreground"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language switcher */}
            <Link
              href={`/${otherLocale}`}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Globe className="w-4 h-4" />
              {otherLocale.toUpperCase()}
            </Link>

            <Link href={`/${locale}/login`}>
              <Button
                variant="ghost"
                className={
                  scrolled
                    ? ""
                    : "text-white hover:text-white hover:bg-white/10"
                }
              >
                {t("nav.login")}
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X
                className={`w-6 h-6 ${
                  scrolled ? "text-foreground" : "text-white"
                }`}
              />
            ) : (
              <Menu
                className={`w-6 h-6 ${
                  scrolled ? "text-foreground" : "text-white"
                }`}
              />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-lg border-b border-border/50"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-sm font-medium text-foreground py-2"
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-border/50" />
              <Link
                href={`/${otherLocale}`}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground py-2"
              >
                <Globe className="w-4 h-4" />
                {otherLocale.toUpperCase()}
              </Link>
              <div className="flex gap-3 pt-2">
                <Link href={`/${locale}/login`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    {t("nav.login")}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  const { t, locale } = useTranslation();

  const productLinks = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.faq"), href: "#faq" },
    { label: t("nav.diagnostic"), href: `/${locale}/dashboard/diagnostic` },
  ];

  const companyLinks = [
    { label: t("footer.about"), href: "#" },
    { label: t("footer.blog"), href: "#" },
    { label: t("footer.careers"), href: "#" },
    { label: t("footer.contact"), href: "#" },
  ];

  const legalLinks = [
    { label: t("footer.termsOfService"), href: "#" },
    { label: t("footer.privacyPolicy"), href: "#" },
  ];

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                DiagOptim
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("app.description")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-3">
              {t("footer.product")}
            </h4>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-3">
              {t("footer.company")}
            </h4>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-3">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} DiagOptim.{" "}
            {t("footer.rights")}.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href={`/${locale === "fr" ? "en" : "fr"}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === "fr" ? "English" : "Francais"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
