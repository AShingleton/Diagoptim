/**
 * Multi-tenant management for white-label deployments.
 *
 * Resolves tenant configuration by user ID or custom domain,
 * and produces branding themes from the configuration.
 *
 * @module whitelabel/tenant
 */

import { supabase } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** White-label configuration for a tenant (consultant or partner). */
export interface WhiteLabelConfig {
  id: string;
  tenantName: string;
  customDomain: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerText: string | null;
  footerText: string | null;
  supportEmail: string | null;
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

/** Branding theme derived from a tenant config. */
export interface BrandingTheme {
  primary: string;
  secondary: string;
  accent: string;
  fontFamily: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  headerText: string | null;
  footerText: string | null;
  cssVariables: Record<string, string>;
}

/** Default DiagOptim branding. */
const DEFAULT_BRANDING: BrandingTheme = {
  primary: "#3498db",
  secondary: "#2c3e50",
  accent: "#e74c3c",
  fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  logoUrl: null,
  faviconUrl: null,
  headerText: null,
  footerText: null,
  cssVariables: {
    "--color-primary": "#3498db",
    "--color-secondary": "#2c3e50",
    "--color-accent": "#e74c3c",
    "--font-family": "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
};

// ---------------------------------------------------------------------------
// In-memory cache (replace with Redis or similar in production)
// ---------------------------------------------------------------------------

interface CacheEntry {
  config: WhiteLabelConfig;
  expiresAt: number;
}

const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): WhiteLabelConfig | null {
  const entry = tenantCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tenantCache.delete(key);
    return null;
  }
  return entry.config;
}

function setCache(key: string, config: WhiteLabelConfig): void {
  tenantCache.set(key, {
    config,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieves the white-label configuration for a given user.
 *
 * Checks if the user owns a tenant configuration or belongs to one.
 * Returns `null` if no white-label config exists (uses default branding).
 *
 * @param userId - The user ID to look up.
 * @returns The white-label config, or `null` if none exists.
 */
export async function getTenantConfig(userId: string): Promise<WhiteLabelConfig | null> {
  const cacheKey = `user:${userId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // Query tenant config by owner ID
  const result = await supabase
    .from("whitelabel_configs")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (result.error || !result.data) {
    return null;
  }

  const config = mapDbRow(result.data as Record<string, unknown>);
  setCache(cacheKey, config);
  return config;
}

/**
 * Resolves a tenant configuration by custom domain.
 *
 * Used during request handling to determine which tenant's branding
 * to apply based on the incoming domain.
 *
 * @param domain - The domain to look up (e.g., "diag.partner.com").
 * @returns The matching white-label config, or `null` if no match.
 */
export async function resolveTenantByDomain(domain: string): Promise<WhiteLabelConfig | null> {
  const normalizedDomain = domain.toLowerCase().trim();
  const cacheKey = `domain:${normalizedDomain}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const result = await supabase
    .from("whitelabel_configs")
    .select("*")
    .eq("custom_domain", normalizedDomain)
    .single();

  if (result.error || !result.data) {
    return null;
  }

  const config = mapDbRow(result.data as Record<string, unknown>);
  setCache(cacheKey, config);
  return config;
}

/**
 * Produces a BrandingTheme from a white-label configuration.
 *
 * If no configuration is provided, returns the default DiagOptim branding.
 *
 * @param config - The white-label configuration to derive branding from.
 * @returns A BrandingTheme with colors, fonts, and CSS variables.
 */
export function applyBranding(config: WhiteLabelConfig | null): BrandingTheme {
  if (!config) {
    return DEFAULT_BRANDING;
  }

  return {
    primary: config.primaryColor,
    secondary: config.secondaryColor,
    accent: config.accentColor,
    fontFamily: config.fontFamily,
    logoUrl: config.logoUrl,
    faviconUrl: config.faviconUrl,
    headerText: config.headerText,
    footerText: config.footerText,
    cssVariables: {
      "--color-primary": config.primaryColor,
      "--color-secondary": config.secondaryColor,
      "--color-accent": config.accentColor,
      "--font-family": config.fontFamily,
      "--color-primary-light": lightenColor(config.primaryColor, 30),
      "--color-primary-dark": darkenColor(config.primaryColor, 20),
    },
  };
}

/**
 * Invalidates cached tenant config for a given user or domain.
 *
 * @param key - Either a user ID or domain to invalidate.
 */
export function invalidateTenantCache(key: string): void {
  tenantCache.delete(`user:${key}`);
  tenantCache.delete(`domain:${key}`);
}

/**
 * Clears the entire tenant cache.
 */
export function clearTenantCache(): void {
  tenantCache.clear();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapDbRow(row: Record<string, unknown>): WhiteLabelConfig {
  return {
    id: String(row.id ?? ""),
    tenantName: String(row.tenant_name ?? ""),
    customDomain: row.custom_domain ? String(row.custom_domain) : null,
    logoUrl: row.logo_url ? String(row.logo_url) : null,
    faviconUrl: row.favicon_url ? String(row.favicon_url) : null,
    primaryColor: String(row.primary_color ?? "#3498db"),
    secondaryColor: String(row.secondary_color ?? "#2c3e50"),
    accentColor: String(row.accent_color ?? "#e74c3c"),
    fontFamily: String(row.font_family ?? "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"),
    headerText: row.header_text ? String(row.header_text) : null,
    footerText: row.footer_text ? String(row.footer_text) : null,
    supportEmail: row.support_email ? String(row.support_email) : null,
    privacyPolicyUrl: row.privacy_policy_url ? String(row.privacy_policy_url) : null,
    termsOfServiceUrl: row.terms_of_service_url ? String(row.terms_of_service_url) : null,
    ownerId: String(row.owner_id ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

/**
 * Lightens a hex color by a given percentage.
 *
 * @param hex     - Hex color string (e.g., "#3498db").
 * @param percent - Percentage to lighten (0-100).
 * @returns Lightened hex color string.
 */
function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor));

  return rgbToHex(r, g, b);
}

/**
 * Darkens a hex color by a given percentage.
 *
 * @param hex     - Hex color string.
 * @param percent - Percentage to darken (0-100).
 * @returns Darkened hex color string.
 */
function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 - percent / 100;
  const r = Math.max(0, Math.round(rgb.r * factor));
  const g = Math.max(0, Math.round(rgb.g * factor));
  const b = Math.max(0, Math.round(rgb.b * factor));

  return rgbToHex(r, g, b);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
