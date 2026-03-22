/**
 * Branding configuration utilities for white-label deployments.
 *
 * Generates CSS custom properties, validates branding configs,
 * and produces report-specific branding objects.
 *
 * @module whitelabel/branding
 */

import type { WhiteLabelConfig } from "./tenant";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Branding properties specific to report generation. */
export interface ReportBranding {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  headerText: string | null;
  footerText: string | null;
  coverBackgroundColor: string;
  coverTextColor: string;
  tableHeaderBackground: string;
  tableHeaderColor: string;
}

/** Result of a branding configuration validation. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/** A validation error that prevents saving. */
export interface ValidationError {
  field: string;
  message: string;
}

/** A validation warning (non-blocking). */
export interface ValidationWarning {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// CSS generation
// ---------------------------------------------------------------------------

/**
 * Generates a CSS string with custom properties from a white-label configuration.
 *
 * The generated CSS can be injected into a `<style>` tag or appended
 * to the document's stylesheet to apply tenant branding.
 *
 * @param config - The white-label configuration.
 * @returns CSS string with `:root` custom properties.
 */
export function generateBrandingCSS(config: WhiteLabelConfig): string {
  const primaryRgb = hexToRgb(config.primaryColor);
  const secondaryRgb = hexToRgb(config.secondaryColor);

  const primaryLight = lighten(config.primaryColor, 85);
  const primaryDark = darken(config.primaryColor, 20);
  const secondaryLight = lighten(config.secondaryColor, 85);

  return `:root {
  /* Primary colors */
  --brand-primary: ${config.primaryColor};
  --brand-primary-rgb: ${primaryRgb};
  --brand-primary-light: ${primaryLight};
  --brand-primary-dark: ${primaryDark};

  /* Secondary colors */
  --brand-secondary: ${config.secondaryColor};
  --brand-secondary-rgb: ${secondaryRgb};
  --brand-secondary-light: ${secondaryLight};

  /* Accent */
  --brand-accent: ${config.accentColor};

  /* Typography */
  --brand-font-family: ${config.fontFamily};

  /* Derived component colors */
  --brand-button-bg: ${config.primaryColor};
  --brand-button-hover: ${primaryDark};
  --brand-button-text: #ffffff;
  --brand-link-color: ${config.primaryColor};
  --brand-link-hover: ${primaryDark};
  --brand-header-bg: ${config.secondaryColor};
  --brand-header-text: #ffffff;
  --brand-sidebar-bg: ${config.secondaryColor};
  --brand-sidebar-text: #ffffff;
  --brand-sidebar-active: ${config.primaryColor};
  --brand-card-border: ${primaryLight};
  --brand-focus-ring: ${config.primaryColor}40;
  --brand-badge-bg: ${primaryLight};
  --brand-badge-text: ${primaryDark};
  --brand-progress-bar: ${config.primaryColor};
  --brand-chart-primary: ${config.primaryColor};
  --brand-chart-secondary: ${config.secondaryColor};
  --brand-chart-accent: ${config.accentColor};
}

/* Apply brand font globally */
body {
  font-family: var(--brand-font-family);
}

/* Brand-aware component overrides */
.btn-primary {
  background-color: var(--brand-button-bg);
  color: var(--brand-button-text);
}
.btn-primary:hover {
  background-color: var(--brand-button-hover);
}
a {
  color: var(--brand-link-color);
}
a:hover {
  color: var(--brand-link-hover);
}
*:focus-visible {
  outline-color: var(--brand-primary);
  box-shadow: 0 0 0 3px var(--brand-focus-ring);
}`;
}

// ---------------------------------------------------------------------------
// Report branding
// ---------------------------------------------------------------------------

/**
 * Produces a ReportBranding object for use by the PDF/DOCX generators.
 *
 * @param config - The white-label configuration.
 * @returns ReportBranding with all colors and text settings for reports.
 */
export function getReportBranding(config: WhiteLabelConfig): ReportBranding {
  return {
    logoUrl: config.logoUrl,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    fontFamily: config.fontFamily,
    headerText: config.headerText,
    footerText: config.footerText,
    coverBackgroundColor: config.secondaryColor,
    coverTextColor: "#ffffff",
    tableHeaderBackground: config.primaryColor,
    tableHeaderColor: "#ffffff",
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Hex color regex. */
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** URL regex (basic). */
const URL_RE = /^https?:\/\/.+/;

/** Allowed font families. */
const ALLOWED_FONTS = [
  "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "'Inter', sans-serif",
  "'Poppins', sans-serif",
  "'Lato', sans-serif",
  "'Open Sans', sans-serif",
  "'Montserrat', sans-serif",
  "'Roboto', sans-serif",
  "'Nunito', sans-serif",
  "system-ui, sans-serif",
];

/**
 * Validates a partial branding configuration.
 *
 * Checks that colors are valid hex, URLs are well-formed, and font
 * families are from the allowed list.
 *
 * @param config - Partial white-label config to validate.
 * @returns Validation result with errors and warnings.
 */
export function validateBrandingConfig(config: Partial<WhiteLabelConfig>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate colors
  if (config.primaryColor !== undefined && !HEX_COLOR_RE.test(config.primaryColor)) {
    errors.push({ field: "primaryColor", message: "Primary color must be a valid hex color (e.g., #3498db)" });
  }

  if (config.secondaryColor !== undefined && !HEX_COLOR_RE.test(config.secondaryColor)) {
    errors.push({ field: "secondaryColor", message: "Secondary color must be a valid hex color" });
  }

  if (config.accentColor !== undefined && !HEX_COLOR_RE.test(config.accentColor)) {
    errors.push({ field: "accentColor", message: "Accent color must be a valid hex color" });
  }

  // Validate URLs
  if (config.logoUrl !== undefined && config.logoUrl !== null && !URL_RE.test(config.logoUrl)) {
    errors.push({ field: "logoUrl", message: "Logo URL must be a valid HTTP(S) URL" });
  }

  if (config.faviconUrl !== undefined && config.faviconUrl !== null && !URL_RE.test(config.faviconUrl)) {
    errors.push({ field: "faviconUrl", message: "Favicon URL must be a valid HTTP(S) URL" });
  }

  if (config.privacyPolicyUrl !== undefined && config.privacyPolicyUrl !== null && !URL_RE.test(config.privacyPolicyUrl)) {
    errors.push({ field: "privacyPolicyUrl", message: "Privacy policy URL must be a valid HTTP(S) URL" });
  }

  if (config.termsOfServiceUrl !== undefined && config.termsOfServiceUrl !== null && !URL_RE.test(config.termsOfServiceUrl)) {
    errors.push({ field: "termsOfServiceUrl", message: "Terms of service URL must be a valid HTTP(S) URL" });
  }

  // Validate font family
  if (config.fontFamily !== undefined && !ALLOWED_FONTS.includes(config.fontFamily)) {
    warnings.push({
      field: "fontFamily",
      message: `Font family "${config.fontFamily}" is not in the allowed list. It may not render correctly.`,
    });
  }

  // Validate tenant name
  if (config.tenantName !== undefined) {
    if (config.tenantName.trim().length === 0) {
      errors.push({ field: "tenantName", message: "Tenant name cannot be empty" });
    } else if (config.tenantName.length > 100) {
      errors.push({ field: "tenantName", message: "Tenant name must be 100 characters or fewer" });
    }
  }

  // Validate custom domain
  if (config.customDomain !== undefined && config.customDomain !== null) {
    const domainRe = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRe.test(config.customDomain)) {
      errors.push({ field: "customDomain", message: "Custom domain must be a valid domain name (e.g., diag.partner.com)" });
    }
  }

  // Validate support email
  if (config.supportEmail !== undefined && config.supportEmail !== null) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(config.supportEmail)) {
      errors.push({ field: "supportEmail", message: "Support email must be a valid email address" });
    }
  }

  // Color contrast warnings
  if (config.primaryColor && config.secondaryColor) {
    const contrast = getContrastRatio(config.primaryColor, config.secondaryColor);
    if (contrast < 3) {
      warnings.push({
        field: "primaryColor",
        message: `Low contrast ratio (${contrast.toFixed(1)}) between primary and secondary colors. Consider using more distinct colors for better readability.`,
      });
    }
  }

  // Header/footer length warnings
  if (config.headerText && config.headerText.length > 200) {
    warnings.push({ field: "headerText", message: "Header text is long. Consider keeping it under 200 characters." });
  }
  if (config.footerText && config.footerText.length > 200) {
    warnings.push({ field: "footerText", message: "Footer text is long. Consider keeping it under 200 characters." });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Color utility helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "0, 0, 0";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function hexToRgbValues(hex: string): { r: number; g: number; b: number } | null {
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

function lighten(hex: string, percent: number): string {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return hex;
  const factor = percent / 100;
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)),
  );
}

function darken(hex: string, percent: number): string {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return hex;
  const factor = 1 - percent / 100;
  return rgbToHex(
    Math.max(0, Math.round(rgb.r * factor)),
    Math.max(0, Math.round(rgb.g * factor)),
    Math.max(0, Math.round(rgb.b * factor)),
  );
}

/**
 * Calculates the WCAG contrast ratio between two hex colors.
 *
 * @param hex1 - First hex color.
 * @param hex2 - Second hex color.
 * @returns Contrast ratio (1 to 21).
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgbValues(hex);
  if (!rgb) return 0;

  const rsrgb = rgb.r / 255;
  const gsrgb = rgb.g / 255;
  const bsrgb = rgb.b / 255;

  const r = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
  const g = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
  const b = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
