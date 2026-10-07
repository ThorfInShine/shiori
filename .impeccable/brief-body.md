## Mode

Persuade

## Audience

Indonesian school teachers and administrators ordering textbooks (LKS & PG). Arrives on phone or laptop between classes. Needs to understand what Shiori is, log in, and start browsing the catalog by jenjang within seconds.

## Job

Understand Shiori's value, log in (account created by admin), browse education levels (jenjang), and enter the order flow. Primary action: login. Secondary action: browse catalog.

## Proof

Real book counts per jenjang from the database. The 3-step ordering process as demonstration. The 栞 mascot and brand establishing identity. CV Putra Nugraha as the trusted entity.

## Constraints

- Mascot asset at `/assets/Screenshot 2026-09-28 234611.png` is mandatory
- 栞 kanji and "Shiori" name mandatory
- CV Putra Nugraha in footer and about section
- Indonesian language only
- Next.js 16, server component with Prisma DB call
- Login CTA prominent (navbar + hero) — links to `/login`
- User auth not yet built — login route is a future surface

## Direction contract

THESIS: Shiori's landing page is a neighborhood bookshop counter — the teacher walks in, sees stacked spines organized by jenjang behind the counter, a handwritten order slip waiting, the shopkeeper's calculator already on. The category default (clean SaaS white grid, generic product hero) and the prior incumbent (chalkboard classroom) are both refused in favor of the tactile warmth and commercial trust of the Indonesian toko buku: wood grain surfaces, visible book inventory as proof, and the ordering slip as the call to action.

OWN-WORLD: Dark warm wood (#3B2820) as the dominant ground — the counter surface and shelving. Cream paper (#F5EDE0) as the primary text and content-card color. Warm gold (#C9A96E) as the accent for interactive elements and pricing. Each jenjang carries a colored spine label — pink (#D4808A) for SD, blue (#7BA8C4) for SMP, yellow (#E8D070) for SMA, warm red (#C94C4C) for SMK, lavender (#B0A0C8) for Madrasah. A warm rounded display face for headlines (shopkeeper's hand-painted sign character). A clean sans-serif for body text. Book spines as navigation elements. Order slip paper texture for content cards. Calculator-tape numerals for stats and counts.

STORY: The visitor arrives at the counter. The shopkeeper (mascot) is ready with a bookmark in hand. Behind her, shelves of books organized by jenjang — each shelf labeled with a colored tab. The headline reads like a hand-painted shop sign: "Pesan Buku Lebih Mudah." On the counter, the order slip shows three simple steps. Below, the jenjang shelves fan out as navigable categories with real book counts ticking like a circulation counter. The footer carries CV Putra Nugraha's address like it's printed on the shop's business card.

FIRST VIEWPORT: Full-width dark warm wood ground. Top: navbar with 栞 Shiori brand left in warm gold, "Masuk" button right as a cream-on-wood outlined button. Center: large headline "Pesan Buku / Lebih Mudah / dengan Shiori" in a warm rounded display face, "Lebih Mudah" in warm gold accent, set as hand-painted shop signage against the wood. Right: mascot at ~200px sitting on the counter holding a bookmark, book spines visible behind her on shelves with colored jenjang tabs. Below headline: stats as calculator-tape numbers — "{totalBooks} Buku Tersedia" and "{jenjang} Jenjang" — with deliberate spatial isolation. Two CTAs: "Mulai Memesan →" primary cream button with warm gold hover, "Masuk" outline button. The primary CTA sits with deliberate breathing room (raised from dev-console). Items snap to a fixed counter-grid pitch (raised from cutting-bench). Small honest counters tick quietly beside stats (raised from minihompy).

FORM: Indonesian neighborhood bookshop counter — translated to web. The commercial warmth and organized trust of a real toko buku as information surface, book spines and order slips as rendering medium. Position 1 from the grounded list. Seed key: fe29d443.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
