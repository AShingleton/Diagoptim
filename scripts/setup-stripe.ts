/**
 * Setup Stripe Products & Prices for DiagOptim
 * Creates all products/prices, saves IDs to config/stripe-prices.json,
 * and updates .env with real price IDs.
 *
 * Usage: npx tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Load .env manually (no dotenv dependency required)
// ---------------------------------------------------------------------------
function loadEnvFile(): Record<string, string> {
  const envPath = path.join(__dirname, '..', '.env');
  const vars: Record<string, string> = {};

  if (!fs.existsSync(envPath)) {
    return vars;
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
    vars[key] = value;
  }

  return vars;
}

const envVars = loadEnvFile();
// Merge into process.env so downstream code can use either
Object.assign(process.env, envVars);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set in .env');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ---------------------------------------------------------------------------
// Product / Price definitions
// ---------------------------------------------------------------------------
interface PriceConfig {
  amount: number;
  interval?: 'month' | 'year';
  type?: 'one_time';
}

interface ProductConfig {
  name: string;
  description: string;
  prices: PriceConfig[];
  envKeys: string[];
}

const PRODUCTS: ProductConfig[] = [
  // ── SUBSCRIPTIONS ──────────────────────────────────────────────────────
  {
    name: 'DiagOptim Starter',
    description: 'Diagnostic 3/mois, 5 docs, outils de base',
    prices: [
      { amount: 4900, interval: 'month' },
      { amount: 46800, interval: 'year' },
    ],
    envKeys: ['STRIPE_PRICE_STARTER_MONTHLY', 'STRIPE_PRICE_STARTER_YEARLY'],
  },
  {
    name: 'DiagOptim Pro',
    description: 'Diagnostics illimites, 30 docs, tous les outils',
    prices: [
      { amount: 14900, interval: 'month' },
      { amount: 142800, interval: 'year' },
    ],
    envKeys: ['STRIPE_PRICE_PRO_MONTHLY', 'STRIPE_PRICE_PRO_YEARLY'],
  },
  {
    name: 'DiagOptim Expert',
    description: 'Tout illimite, multi-sites, integrations',
    prices: [
      { amount: 29900, interval: 'month' },
      { amount: 286800, interval: 'year' },
    ],
    envKeys: ['STRIPE_PRICE_EXPERT_MONTHLY', 'STRIPE_PRICE_EXPERT_YEARLY'],
  },
  {
    name: 'Consultant Solo',
    description: 'White-label, 15 clients max',
    prices: [
      { amount: 19900, interval: 'month' },
      { amount: 190800, interval: 'year' },
    ],
    envKeys: [
      'STRIPE_PRICE_CONSULTANT_SOLO_MONTHLY',
      'STRIPE_PRICE_CONSULTANT_SOLO_YEARLY',
    ],
  },
  {
    name: 'Cabinet',
    description: 'White-label, 5 users, clients illimites, domaine custom',
    prices: [
      { amount: 49900, interval: 'month' },
      { amount: 478800, interval: 'year' },
    ],
    envKeys: [
      'STRIPE_PRICE_CONSULTANT_CABINET_MONTHLY',
      'STRIPE_PRICE_CONSULTANT_CABINET_YEARLY',
    ],
  },

  // ── SUPPORT PACKS (one_time) ───────────────────────────────────────────
  {
    name: 'Pack Coup de Pouce',
    description: '1h de visio avec un consultant',
    prices: [{ amount: 7900, type: 'one_time' }],
    envKeys: ['STRIPE_PRICE_PACK_COUP_DE_POUCE'],
  },
  {
    name: 'Pack Acceleration',
    description: '3h sur 1 mois + revue roadmap',
    prices: [{ amount: 24900, type: 'one_time' }],
    envKeys: ['STRIPE_PRICE_PACK_ACCELERATION'],
  },
  {
    name: 'Pack Transformation',
    description: '10h sur 3 mois + coaching personnalise',
    prices: [{ amount: 69900, type: 'one_time' }],
    envKeys: ['STRIPE_PRICE_PACK_TRANSFORMATION'],
  },

  // ── SUPPORT SUBSCRIPTIONS ──────────────────────────────────────────────
  {
    name: 'Support Essentiel',
    description: '2h/mois, reponse 48h',
    prices: [{ amount: 9900, interval: 'month' }],
    envKeys: ['STRIPE_PRICE_SUPPORT_ESSENTIEL_MONTHLY'],
  },
  {
    name: 'Support Premium',
    description: '5h/mois, reponse 24h, consultant dedie',
    prices: [{ amount: 24900, interval: 'month' }],
    envKeys: ['STRIPE_PRICE_SUPPORT_PREMIUM_MONTHLY'],
  },
];

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------
interface PriceResult {
  productName: string;
  productId: string;
  priceId: string;
  amount: number;
  type: string;
  interval?: string;
  envKey: string;
}

// ---------------------------------------------------------------------------
// Update .env file — replace price_... placeholders with real IDs, or append
// ---------------------------------------------------------------------------
function updateEnvFile(envMapping: Record<string, string>): void {
  const envPath = path.join(__dirname, '..', '.env');

  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }

  const handledKeys = new Set<string>();

  // For each mapping, try to replace an existing line (with any value/placeholder)
  for (const [key, value] of Object.entries(envMapping)) {
    const regex = new RegExp(`^(\\s*${key}\\s*=).*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
      handledKeys.add(key);
    }
  }

  // Append any keys that were not already present
  const toAppend: string[] = [];
  for (const [key, value] of Object.entries(envMapping)) {
    if (!handledKeys.has(key)) {
      toAppend.push(`${key}=${value}`);
    }
  }

  if (toAppend.length > 0) {
    // Ensure we start on a new line
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
    content += '\n# Stripe Price IDs (auto-generated by setup-stripe.ts)\n';
    content += toAppend.join('\n') + '\n';
  }

  fs.writeFileSync(envPath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('DiagOptim - Stripe Products Setup\n');
  console.log('='.repeat(60));

  const results: PriceResult[] = [];
  const envMapping: Record<string, string> = {};

  for (const productConfig of PRODUCTS) {
    try {
      console.log(`\nCreating product: ${productConfig.name}`);

      const product = await stripe.products.create({
        name: productConfig.name,
        description: productConfig.description,
        metadata: {
          app: 'diagoptim',
          created_by: 'setup-script',
        },
      });

      console.log(`  Product ID: ${product.id}`);

      for (let i = 0; i < productConfig.prices.length; i++) {
        const priceConfig = productConfig.prices[i];
        const envKey = productConfig.envKeys[i];

        const priceParams: Stripe.PriceCreateParams = {
          product: product.id,
          unit_amount: priceConfig.amount,
          currency: 'eur',
        };

        if (priceConfig.interval) {
          priceParams.recurring = { interval: priceConfig.interval };
        }

        const price = await stripe.prices.create(priceParams);

        const label = priceConfig.interval
          ? `${priceConfig.interval}ly`
          : 'one-time';

        console.log(
          `  Price (${label}): ${price.id} -> ${(priceConfig.amount / 100).toFixed(2)} EUR`,
        );

        results.push({
          productName: productConfig.name,
          productId: product.id,
          priceId: price.id,
          amount: priceConfig.amount,
          type: priceConfig.interval ? 'recurring' : 'one_time',
          interval: priceConfig.interval,
          envKey,
        });

        envMapping[envKey] = price.id;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `  ERROR creating "${productConfig.name}": ${message}`,
      );
      console.error('  Skipping this product and continuing...');
    }
  }

  // ---------- Save config/stripe-prices.json ----------
  const configDir = path.join(__dirname, '..', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const configPath = path.join(configDir, 'stripe-prices.json');
  fs.writeFileSync(
    configPath,
    JSON.stringify({ results, envMapping }, null, 2),
    'utf-8',
  );
  console.log(`\nSaved price config to ${configPath}`);

  // ---------- Update .env ----------
  updateEnvFile(envMapping);
  console.log('Updated .env with real Stripe price IDs');

  // ---------- Summary table ----------
  console.log('\n' + '='.repeat(60));
  console.log(
    padRight('Product', 26) +
      padRight('Type', 12) +
      padRight('Amount', 12) +
      'Price ID',
  );
  console.log('-'.repeat(60));

  for (const r of results) {
    const typeLabel = r.interval ? `${r.interval}ly` : 'one-time';
    const amountLabel = `${(r.amount / 100).toFixed(2)} EUR`;
    console.log(
      padRight(r.productName, 26) +
        padRight(typeLabel, 12) +
        padRight(amountLabel, 12) +
        r.priceId,
    );
  }

  console.log('-'.repeat(60));
  console.log(`\nSUMMARY:`);
  console.log(`  Products created : ${new Set(results.map((r) => r.productId)).size}`);
  console.log(`  Prices created   : ${results.length}`);
  console.log(`  Config saved     : config/stripe-prices.json`);
  console.log(`  .env updated     : yes`);
  console.log('\nDone.');
}

function padRight(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

main().catch((err) => {
  console.error('FATAL ERROR:', err instanceof Error ? err.message : err);
  process.exit(1);
});
