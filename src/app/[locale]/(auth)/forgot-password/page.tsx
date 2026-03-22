"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Activity,
  ArrowLeft,
  Loader2,
  MailCheck,
  AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const { t, locale } = useTranslation();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotValues) {
    setServerError(null);
    console.log("Forgot password submit:", data);
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
  }

  return (
    <div className="flex w-full min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" as const }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2.5 mb-6"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                DiagOptim
              </span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">
              {t("auth.resetPassword")}
            </h1>
          </div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {locale === "fr"
                    ? "Entrez votre adresse email et nous vous enverrons un lien de reinitialisation."
                    : "Enter your email address and we'll send you a password reset link."}
                </p>

                {/* Server error */}
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {serverError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="h-11"
                      aria-invalid={!!errors.email}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("auth.sendResetLink")
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center py-4"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
                  <MailCheck className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  {locale === "fr" ? "Email envoye !" : "Email sent!"}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  {t("auth.resetSent")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
