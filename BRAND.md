# Barkado & Co. — Brand Guide

Source of truth: the final branding document (`FINAL BRANDING DOCUMENT BARKADO & CO..pdf`, 16 pages).
This file is the working summary. **Every page, component, email, banner or asset built for this
project must follow it.** When a design skill (taste-skill, impeccable, ui-ux-pro-max, etc.) suggests
its own palette, fonts or style, this brand wins.

Mockups from the document: [`docs/brand/reference/`](docs/brand/reference/).

## Brand overview

Barkado & Co. is a **premium pet-care and lifestyle brand based in Chandigarh**, bringing together
pet services, products and experiences under one ecosystem. Audience: modern pet parents and animal
lovers. Personality: **warm, playful and sophisticated**. It's about a community and a lifestyle that
celebrate the bond between pets and their humans, not just a service.

## Logo

- **Mark:** a chunky, rounded letter **B** (the brand initial) with a **dog silhouette** cut into it.
  The B stands for comfort and warmth; the dog stands for love and care.
- **Four versions:** emblem logo, wordmark ("BARKADO & CO."), combination (mark + wordmark),
  monogram (the B alone).
- Usual treatment: **plum mark on ivory**, or **ivory mark on plum**. Golden yellow is the accent
  (waves, hearts, tags).
- The wordmark is set in Sugar Loved. One playful detail: the "A" in "BARKADO" is often a lowercase,
  tilted "a" ("BARKaDO").
- **Logo files (vector, extracted from the branding PDF):** `public/brand/logo/`:
  `emblem-*`, `wordmark-*`, `combination-*`, `monogram-*`, each as `-plum` (for light grounds)
  and `-ivory` (for plum/dark grounds). Use `components/BrandLogo.tsx`
  (`<BrandLogo variant="wordmark" tone="plum" />`). The favicon is `app/icon.svg` (ivory
  monogram on a plum rounded square). Never redraw or retype the logo.

## Colors

| Name | Hex | Role |
|---|---|---|
| Dried Plum | `#6e1e3b` | Primary brand color: logo, headings, dark grounds, main buttons |
| Golden Yellow | `#f9dd8a` | Accent: highlights, waves, hearts, badges, secondary call to action |
| Powder Blue | `#a5bde1` | Supporting color: soft backgrounds, tags, illustrations; use sparingly |
| Ivory | `#fbf0d9` | Main light ground, text and marks on plum |

Mockups lean heavily on **plum + ivory**, with golden yellow as the accent. Check text contrast:
plum on ivory works; yellow or powder blue text on ivory does not.

## Typography

| Role | Typeface | Use |
|---|---|---|
| Primary | **Gulfs Display** (variable) | Headlines, display type |
| Secondary | **Artifakt Element** (Black weight shown) | Section headers, labels, strong UI text |
| Logo and campaign lines | **Sugar Loved** | Wordmark and playful taglines only, never body text |
| Body (as used in the document) | Corbel (Light / Bold) | Long text in the document |

These are not Google Fonts. The site is already wired for them in `app/globals.css`
(`@font-face` + the `--font-heading`, `--font-ui` and `--font-script` stacks, and the `.font-script`
and `.font-ui` classes). To switch them on, put licensed web font files in `public/fonts/` with these
exact names:

- `GulfsDisplay.woff2` (variable, or the bold weight)
- `ArtifaktElement-Black.woff2` and `ArtifaktElement-Regular.woff2`
- `SugarLoved.woff2`

Until those files exist, headings fall back to Outfit, UI text to Plus Jakarta Sans, and taglines
to Outfit. The fonts embedded in the branding PDF are partial subsets and must not be used as web
fonts.

## Voice and taglines

Playful, punny, affectionate, a little indulgent. Campaign lines from the document:

- "A Hug in every Paw"
- "Woof it All!"
- "Spoil them a little EXTRA"
- "A Spa day fit for a TIARA"
- "WAGGLES!"
- Promo example: "Get 20% OFF on this pawsome toy!"

Keep UI copy (buttons, forms, errors) clear and plain. Puns belong in headlines and campaigns, not
in functional text.

## Imagery and look

- **Real dog photography** with lots of personality: close-up faces, tongues out, playful poses,
  dogs cut out on solid plum or ivory grounds, outdoor play shots, warm human-and-dog moments.
- **Merch and touchpoints:** shopping bags, tote, cap, collar, bandana, dog t-shirt, hang tags,
  keychain, packing tape, wall sign, bus-stop ads.
- **Recurring motifs:** wavy golden-yellow bands at the bottom of things, line-drawn hearts, paw
  prints, bubbles, a rubber duck (spa), circular "BARKADO & CO." badge text around the B.
- Shapes are soft and rounded, nothing sharp or corporate.

## Current codebase vs brand (as of 2026-11-11)

**Colors are moved over.** `app/globals.css` keeps the old token names, but their values are now the
brand:

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--cream` | `#fbf0d9` Ivory | `#1c0c13` | page background |
| `--forest` | `#3d1426` plum ink | `#fbf0d9` | body text, headings |
| `--terracotta` | `#6e1e3b` Dried Plum | `#f9dd8a` | accent text, links, primary button |
| `--gold` | `#f9dd8a` Golden Yellow | `#f9dd8a` | highlights, accent button |
| `--panel-dark` | `#6e1e3b` Dried Plum | same | dark panels with white text |
| `--shelf-bg-start` | `#e4ebf6` powder-blue tint | `#33202b` | shop shelf panel |

New code should use these tokens (or `--brand-plum`, `--brand-yellow`, `--brand-blue`,
`--brand-ivory`), not raw hex values. Breed themes (`.theme-*`), error reds and success greens were
left as they were on purpose. Clerk's in-app sign-in popups use the brand colors through
`ClerkProvider appearance`. The hosted sign-in page (`*.accounts.dev`) has to be recolored in the
Clerk dashboard.

**Fonts are not moved yet.** The app still uses Plus Jakarta Sans (headings) and Inter (body). The
brand font files are needed first.
