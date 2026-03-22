/**
 * DiagOptim Health Check
 * Verifies all services are properly configured and reachable.
 *
 * Usage: npx tsx scripts/health-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Parse .env manually (no dotenv dependency) ──────────────────────

function loadEnv(): void {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found at', envPath);
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Strip inline comments (space + #)
    const commentMatch = value.match(/\s+#/);
    if (commentMatch) {
      value = value.slice(0, commentMatch.index).trim();
    }
    // Only set if not already in environment
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

// ── Imports (after env is loaded so clients pick up env vars) ────────

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';

// ── Types ────────────────────────────────────────────────────────────

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const results: CheckResult[] = [];

// ── Helper ───────────────────────────────────────────────────────────

function isPlaceholder(value: string | undefined): boolean {
  if (!value || value.trim() === '') return true;
  const v = value.trim();
  const placeholders = [
    'price_...',
    'whsec_...',
    'ca_...',
    'sk-...',
    'pa-...',
    'phc_...',
    '...',
    'password',
  ];
  return placeholders.includes(v);
}

// ── 1. Supabase DB via Prisma ────────────────────────────────────────

async function checkPrisma(): Promise<void> {
  const name = 'Supabase DB (Prisma)';
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    results.push({ name, ok: true, detail: 'SELECT 1 returned successfully' });
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 2. Supabase Auth ─────────────────────────────────────────────────

async function checkSupabaseAuth(): Promise<void> {
  const name = 'Supabase Auth';
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      results.push({ name, ok: false, detail: 'Missing SUPABASE_URL or ANON_KEY' });
      return;
    }
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.auth.getSession();
    if (error) {
      results.push({ name, ok: false, detail: error.message });
    } else {
      results.push({ name, ok: true, detail: 'getSession() returned without error (null session expected)' });
    }
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 3. Anthropic Claude ──────────────────────────────────────────────

async function checkAnthropic(): Promise<void> {
  const name = 'Anthropic Claude';
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || isPlaceholder(apiKey)) {
      results.push({ name, ok: false, detail: 'ANTHROPIC_API_KEY missing or placeholder' });
      return;
    }
    const anthropic = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
    const response = await anthropic.messages.create({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    const text =
      response.content?.[0]?.type === 'text' ? response.content[0].text : 'response received';
    results.push({ name, ok: true, detail: `Model ${model} responded: "${text.trim()}"` });
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 4. Stripe ────────────────────────────────────────────────────────

async function checkStripe(): Promise<void> {
  const name = 'Stripe';
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || isPlaceholder(secretKey)) {
      results.push({ name, ok: false, detail: 'STRIPE_SECRET_KEY missing or placeholder' });
      return;
    }
    const stripe = new Stripe(secretKey);
    const products = await stripe.products.list({ limit: 1 });
    results.push({
      name,
      ok: true,
      detail: `products.list returned ${products.data.length} product(s)`,
    });
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 5. Brevo (Email) ────────────────────────────────────────────────

async function checkBrevo(): Promise<void> {
  const name = 'Brevo (Email)';
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || isPlaceholder(apiKey)) {
      results.push({ name, ok: false, detail: 'BREVO_API_KEY missing or placeholder' });
      return;
    }
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const data = await response.json();
      results.push({
        name,
        ok: true,
        detail: `Account: ${data.companyName || data.email || 'verified'}`,
      });
    } else {
      const text = await response.text();
      results.push({ name, ok: false, detail: `HTTP ${response.status}: ${text}` });
    }
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 6. Stripe Price IDs from env ─────────────────────────────────────

async function checkStripePrices(): Promise<void> {
  const name = 'Stripe Price IDs';
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || isPlaceholder(secretKey)) {
      results.push({ name, ok: false, detail: 'STRIPE_SECRET_KEY missing or placeholder' });
      return;
    }

    // Also check config/stripe-prices.json if it exists
    const configPath = path.resolve(__dirname, '..', 'config', 'stripe-prices.json');
    let priceEntries: { label: string; priceId: string }[] = [];

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const priceResults = config.results as Array<{ priceId: string; productName: string }>;
      for (const pr of priceResults) {
        priceEntries.push({ label: pr.productName, priceId: pr.priceId });
      }
    }

    // Collect STRIPE_PRICE_* env vars that are not placeholders
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('STRIPE_PRICE_') && value && !isPlaceholder(value)) {
        priceEntries.push({ label: key, priceId: value });
      }
    }

    if (priceEntries.length === 0) {
      results.push({
        name,
        ok: false,
        detail: 'No valid Stripe price IDs configured (all are placeholders)',
      });
      return;
    }

    const stripe = new Stripe(secretKey);
    let okCount = 0;
    const errors: string[] = [];

    for (const { label, priceId } of priceEntries) {
      try {
        await stripe.prices.retrieve(priceId);
        okCount++;
      } catch (err: any) {
        errors.push(`${label}: ${err.message}`);
      }
    }

    if (errors.length === 0) {
      results.push({ name, ok: true, detail: `All ${okCount} price IDs verified` });
    } else {
      results.push({
        name,
        ok: false,
        detail: `${okCount}/${priceEntries.length} OK; errors: ${errors.join('; ')}`,
      });
    }
  } catch (err: any) {
    results.push({ name, ok: false, detail: err.message ?? String(err) });
  }
}

// ── 7. Environment Variables ─────────────────────────────────────────

function checkEnvVars(): void {
  const name = 'Environment Variables';

  const criticalVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'ANTHROPIC_API_KEY',
    'ANTHROPIC_MODEL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'BREVO_API_KEY',
    'EMAIL_FROM_NAME',
    'EMAIL_FROM_EMAIL',
    'EMAIL_REPLY_TO',
    'ENCRYPTION_KEY',
    'ENCRYPTION_IV',
    'CRON_SECRET',
  ];

  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const varName of criticalVars) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    } else if (isPlaceholder(value)) {
      placeholder.push(varName);
    }
  }

  if (missing.length === 0 && placeholder.length === 0) {
    results.push({ name, ok: true, detail: `All ${criticalVars.length} critical vars set` });
  } else {
    const parts: string[] = [];
    if (missing.length > 0) parts.push(`Missing: ${missing.join(', ')}`);
    if (placeholder.length > 0) parts.push(`Placeholder: ${placeholder.join(', ')}`);
    results.push({ name, ok: false, detail: parts.join(' | ') });
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       DiagOptim Health Check             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // Sync check first
  checkEnvVars();

  // All async checks run concurrently — each catches its own errors
  await Promise.allSettled([
    checkPrisma(),
    checkSupabaseAuth(),
    checkAnthropic(),
    checkStripe(),
    checkBrevo(),
    checkStripePrices(),
  ]);

  // Display results
  for (const r of results) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`${icon} ${r.name} : ${r.ok ? 'OK' : 'ERROR'} (${r.detail})`);
  }

  // Summary
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log('');
  console.log(`━━━ Summary: ${passed}/${total} services OK ━━━`);
  console.log('');

  if (passed < total) {
    process.exit(1);
  }
}

main();
