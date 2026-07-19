import { Resvg, type ResvgRenderOptions } from "@resvg/resvg-js";
import { buildFishboneSvg } from "./fishbone-svg";
import { FISHBONE_FONT_REGULAR, FISHBONE_FONT_BOLD, FISHBONE_FONT_FAMILY } from "./fishbone-font";
import type { ScopingSynthesis } from "@/lib/ai/engine";

/** Renders the shared fishbone SVG to a PNG buffer (embedded fonts → works serverless). */
export function fishbonePngBuffer(ishikawa: ScopingSynthesis["ishikawa"]): Buffer {
  const svg = buildFishboneSvg(ishikawa.causes, ishikawa.problem, ishikawa.rootCause);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1400 },
    background: "#ffffff",
    font: {
      // fontBuffers is a real runtime option (resvg-js README, "New in 2.5.0") but is
      // missing from the bundled type defs in 2.6.2 — cast keeps types happy, no runtime change.
      fontBuffers: [FISHBONE_FONT_REGULAR, FISHBONE_FONT_BOLD],
      defaultFontFamily: FISHBONE_FONT_FAMILY,
      loadSystemFonts: false,
      serif: FISHBONE_FONT_FAMILY,
      sansSerif: FISHBONE_FONT_FAMILY,
    },
  } as ResvgRenderOptions);
  return Buffer.from(resvg.render().asPng());
}

/** Same as a base64 data URI (for <img> on screen / jsPDF / pptxgenjs addImage). */
export function fishbonePngDataUri(ishikawa: ScopingSynthesis["ishikawa"]): string {
  return "data:image/png;base64," + fishbonePngBuffer(ishikawa).toString("base64");
}
