"use client";

// The flickering pixels across the top of the page, Magic UI style.
// Four versions to compare: add ?pixels=band | sheet | accent | page | off to the URL.
// The default is set by DEFAULT below.
import { useEffect, useState } from "react";
import { FlickeringGrid } from "./FlickeringGrid";

export type PixelStyle = "band" | "sheet" | "accent" | "page" | "off";
const DEFAULT: PixelStyle = "band";

const fadeDown = { maskImage: "linear-gradient(to bottom, black, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent)" };

export function usePixelStyle(): PixelStyle {
  const [style, setStyle] = useState<PixelStyle>(DEFAULT);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("pixels") as PixelStyle | null;
    if (q && ["band", "sheet", "accent", "page", "off"].includes(q)) setStyle(q);
  }, []);
  return style;
}

/** Page-level versions: behind everything, full width. */
export function PixelBand() {
  const style = usePixelStyle();
  if (style === "band")
    // Dillion's: a short strip of grey pixels across the top of the screen, fading out
    return (
      <div aria-hidden className="no-print pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120px] overflow-hidden">
        <FlickeringGrid className="size-full" squareSize={2} gridGap={2} color="var(--ink)" maxOpacity={0.22} flickerChance={0.3} style={fadeDown} />
      </div>
    );
  if (style === "accent")
    // Taller, in the orange accent, a bit chunkier
    return (
      <div aria-hidden className="no-print pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] overflow-hidden">
        <FlickeringGrid className="size-full" squareSize={3} gridGap={3} color="var(--accent)" maxOpacity={0.35} flickerChance={0.25} style={fadeDown} />
      </div>
    );
  if (style === "page")
    // A faint grid over the whole background, fading toward the bottom
    return (
      <div aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <FlickeringGrid
          className="size-full"
          squareSize={2}
          gridGap={5}
          color="var(--ink)"
          maxOpacity={0.12}
          flickerChance={0.15}
          style={{ maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 85%)", WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 85%)" }}
        />
      </div>
    );
  return null;
}

/** The "sheet" version lives inside the paper, across its top edge. */
export function SheetPixels() {
  const style = usePixelStyle();
  if (style !== "sheet") return null;
  return (
    <div aria-hidden className="no-print pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden rounded-t-2xl">
      <FlickeringGrid className="size-full" squareSize={2} gridGap={2} color="var(--ink)" maxOpacity={0.2} style={fadeDown} />
    </div>
  );
}
