/**
 * Official Barkado & Co. logo artwork, extracted as vector SVG from the final
 * branding document (see BRAND.md). Never redraw the logo — use these files.
 *
 * variant: emblem (circular badge) | wordmark | combination (B + wordmark) | monogram (B only)
 * tone:    "plum" for light grounds, "ivory" for plum/dark grounds
 */
type Variant = "emblem" | "wordmark" | "combination" | "monogram";

export default function BrandLogo({
  variant = "wordmark",
  tone = "plum",
  className = "h-9 w-auto",
  alt = "Barkado & Co.",
}: {
  variant?: Variant;
  tone?: "plum" | "ivory";
  className?: string;
  alt?: string;
}) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/brand/logo/${variant}-${tone}.svg`} alt={alt} className={className} draggable={false} />;
}
