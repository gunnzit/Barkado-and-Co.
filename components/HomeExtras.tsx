import Link from "next/link";
import { Heart, PawPrint, Star, ArrowRight, Phone, Mail } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

/*
 * Homepage sections that give the page its personality (BRAND.md: warm,
 * playful, sophisticated; a lifestyle, not just a service). Nothing here is
 * invented: photos are brand/stock imagery (not presented as customers),
 * reviews render only from real Review rows, links go to real pages.
 */

const PLUM = "#6e1e3b";
const INK = "#3d1426";
const YELLOW = "#f9dd8a";
const MUTED = "#5e4752";
const H = { fontFamily: "var(--font-heading)" } as const;

// Captions are the brand's own campaign lines and playful labels.
const WAGGLES = [
  { src: "/images/brand/waggle-bandana.jpg", alt: "A golden retriever in a Barkado & Co. bandana", caption: "Woof it All!", sticker: "heart" },
  { src: "/images/hero-large.jpg", alt: "A French bulldog with a tennis ball", caption: "Ball is life", sticker: "paw" },
  { src: "/images/brand/waggle-dog-tshirt.jpg", alt: "A small dog in a Barkado & Co. tee", caption: "Spoil them a little EXTRA", sticker: "heart" },
  { src: "/images/tab-sitting.jpg", alt: "A dog relaxing on a cosy rug", caption: "Professional napper", sticker: "paw" },
  { src: "/images/brand/waggle-spa-poster.jpg", alt: "A dog enjoying a bubble bath", caption: "A spa day fit for a TIARA", sticker: "heart" },
  { src: "/images/promo-first-walk.jpg", alt: "A small dog on a leash, ready for a walk", caption: "Walkies, please", sticker: "paw" },
] as const;

/** A strip of happy dogs, polaroid style, to bring the brand's warmth to the middle of the page. */
export function WagglesStrip() {
  return (
    <section className="py-4" aria-labelledby="waggles-title">
      <div className="px-4 mb-3">
        <h2 id="waggles-title" className="font-script text-[34px] leading-none" style={{ color: PLUM }}>WAGGLES!</h2>
        <p className="text-xs mt-1" style={{ color: MUTED }}>Happy dogs, happy humans. That&rsquo;s the whole idea.</p>
      </div>
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar px-4 pb-3 snap-x snap-mandatory">
        {WAGGLES.map((w, i) => (
          <figure
            key={w.src}
            className="hover-lift snap-start shrink-0 w-[150px] p-2 pb-2.5 rounded-[1.25rem] relative"
            style={{ background: "#ffffff", boxShadow: "0 10px 24px -10px rgba(61,20,38,0.25)", transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)` }}
          >
            <div className="img-frame !rounded-[0.9rem] aspect-square">
              <img src={w.src} alt={w.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <figcaption className="mt-2 px-0.5 text-[12px] font-bold leading-tight" style={{ ...H, color: INK }}>{w.caption}</figcaption>
            <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: YELLOW, boxShadow: "0 4px 10px -4px rgba(61,20,38,0.35)" }} aria-hidden="true">
              {w.sticker === "heart" ? <Heart size={14} fill={PLUM} color={PLUM} /> : <PawPrint size={14} color={PLUM} />}
            </span>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Recruit pros right from the homepage. */
export function EarnBanner() {
  return (
    <section className="px-4 py-3">
      <Link href="/provider" className="hover-lift tap-scale relative flex items-center gap-3 overflow-hidden rounded-[1.75rem] p-4" style={{ background: YELLOW }}>
        <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: PLUM }}>
          <PawPrint size={22} color={YELLOW} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-[17px] leading-tight" style={{ ...H, color: PLUM }}>Love dogs? Earn with Barkado</span>
          <span className="block text-xs mt-0.5" style={{ color: INK }}>Walk, groom or train in Chandigarh. Set your own hours and prices.</span>
        </span>
        <ArrowRight size={18} color={PLUM} className="shrink-0" />
        <PawPrint size={90} className="absolute -right-5 -bottom-6 pointer-events-none" style={{ color: "rgba(110,30,59,0.07)" }} aria-hidden="true" />
      </Link>
    </section>
  );
}

export type HomeReview = { id: string; rating: number; comment: string; ownerFirstName: string; petName: string; service: string };
const SERVICE_NAME: Record<string, string> = { WALKING: "Walk", GROOMING: "Grooming", TRAINING: "Training", SITTING: "Sitting" };

/** Real reviews only. Renders nothing until there are some. */
export function ReviewsSection({ reviews }: { reviews: HomeReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="py-3" aria-labelledby="reviews-title">
      <div className="px-4 mb-3">
        <h2 id="reviews-title" className="font-bold text-[22px] leading-7 tracking-tight" style={{ ...H, color: PLUM }}>What pet parents say</h2>
        <p className="text-xs" style={{ color: MUTED }}>From real Barkado bookings</p>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-2 snap-x">
        {reviews.map((r) => (
          <figure key={r.id} className="snap-start shrink-0 w-[260px] p-4 rounded-[1.5rem]" style={{ background: "#ffffff", border: "1px solid rgba(61,20,38,0.07)", boxShadow: "0 8px 24px -4px rgba(61,20,38,0.06)" }}>
            <div className="flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill={i < r.rating ? "#e9b949" : "none"} color="#e9b949" />
              ))}
            </div>
            <blockquote className="mt-2 text-sm leading-snug line-clamp-4" style={{ color: INK }}>&ldquo;{r.comment}&rdquo;</blockquote>
            <figcaption className="mt-3 text-xs" style={{ color: MUTED }}>
              <b style={{ color: INK }}>{r.ownerFirstName}</b>, {r.petName}&rsquo;s human · {SERVICE_NAME[r.service] ?? "Booking"}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const SUPPORT_PHONE_DISPLAY = "+91 99888 75745";
const SUPPORT_PHONE_TEL = "+919988875745";
const SUPPORT_EMAIL = "hello@barkadoandco.com";

/** Proper end to the page, instead of an empty gap. */
export function SiteFooter() {
  return (
    <footer className="relative mt-6 overflow-hidden rounded-t-[2.25rem] px-5 pt-8 pb-36 lg:pb-10" style={{ background: PLUM, color: "#fbf0d9" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <BrandLogo variant="monogram" tone="ivory" className="h-12 w-auto" alt="" />
          <BrandLogo variant="wordmark" tone="ivory" className="h-11 w-auto" />
        </div>
        <p className="font-script text-xl mt-3" style={{ color: YELLOW }}>A Hug in every Paw</p>
        <p className="text-xs mt-1" style={{ color: "rgba(251,240,217,0.75)" }}>Walking, grooming, training and treats for dogs in Chandigarh.</p>

        <nav className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-6 text-sm" aria-label="Footer">
          <Link href="/walk-booking" className="hover:underline">Book a walk</Link>
          <Link href="/legal/contact" className="hover:underline">Contact us</Link>
          <Link href="/grooming" className="hover:underline">Home grooming</Link>
          <Link href="/legal/privacy" className="hover:underline">Privacy</Link>
          <Link href="/training" className="hover:underline">Training</Link>
          <Link href="/legal/terms" className="hover:underline">Terms</Link>
          <Link href="/accessories" className="hover:underline">Shop</Link>
          <Link href="/legal/refund" className="hover:underline">Refunds &amp; cancellations</Link>
          <Link href="/provider" className="hover:underline">Become a pro</Link>
          <Link href="/legal/shipping" className="hover:underline">Shipping</Link>
        </nav>

        <div className="flex flex-wrap gap-2 mt-6">
          <a href={`tel:${SUPPORT_PHONE_TEL}`} className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold" style={{ background: YELLOW, color: INK }}>
            <Phone size={13} /> {SUPPORT_PHONE_DISPLAY}
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold" style={{ background: "rgba(251,240,217,0.12)", color: "#fbf0d9" }}>
            <Mail size={13} /> {SUPPORT_EMAIL}
          </a>
        </div>

        <p className="text-[11px] mt-6" style={{ color: "rgba(251,240,217,0.55)" }}>© {new Date().getFullYear()} Barkado &amp; Co. All rights reserved.</p>
      </div>
      <PawPrint size={180} className="absolute -right-10 -bottom-8 pointer-events-none" style={{ color: "rgba(249,221,138,0.06)" }} aria-hidden="true" />
    </footer>
  );
}
