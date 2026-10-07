---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

## Mode

Persuade

## Audience

Indonesian school teachers and administrators ordering textbooks (LKS & PG). Arrives on phone or laptop between classes. Mix of returning users (login fast) and first-time visitors (understand Shiori, then login).

## Job

Understand Shiori's value, log in (account created by admin), browse education levels (jenjang). Primary action: login. Secondary action: browse catalog.

## Proof

Real book counts per jenjang from the database. The 3-step ordering process. The 栞 mascot as identity anchor. CV Putra Nugraha as the trusted business entity.

## Constraints

- Mascot asset at `/assets/Screenshot 2026-09-28 234611.png` is mandatory
- 栞 kanji and "Shiori" name mandatory
- CV Putra Nugraha in footer
- Indonesian language only
- Next.js 16, server component with Prisma DB call
- Login CTA prominent (navbar + hero) — links to `/admin`
- Japanese-Indonesian fusion aesthetic: washi tape, kraft paper, warm palette

## Direction contract

THESIS: Shiori's landing page is a toko bunbougu (文房具店) — a Japanese stationery shop counter. The teacher walks up to a warm wooden counter, sees categories arranged in labeled trays with washi tape tabs, and picks what they need. The category default (clean SaaS white grid) and the predecessor (gacha machine chrome) are both refused in favor of the crafted warmth of a well-kept stationery supply shop where books and school supplies naturally live.

OWN-WORLD: Warm cream ground (#F4EDE3) like unbleached washi paper. Sakura pink (#C4727E) as primary accent for CTAs and brand energy. Kinari gold (#C9A96E) as secondary warm accent. Kraft brown (#B89B7A) for borders and fixtures. Sumi brown (#2C2420) for text. Each jenjang keeps its established color identity applied as washi tape tab colors on cards. Shippori Mincho B1 for display headlines (Japanese serif character). Source Sans 3 + Noto Sans JP for body. Washi tape strips as accent/divider elements. Paper-white card surfaces with subtle borders like wooden tray compartments.

STORY: The visitor arrives at the stationery shop. The mascot stands behind the counter, welcoming. The headline reads the shop sign: "Pesan Buku Pelajaran untuk Sekolah Anda." Below, washi-tape-tabbed cards organize books by jenjang — pull a tray to see what's inside. Three simple steps explain the process. The footer is the shop's address label.

FIRST VIEWPORT: Warm cream ground. Top: navbar with 栞 Shiori brand left (sakura kanji + mincho name), "Masuk" button right (kraft-bordered paper-white). Washi tape accent strip below navbar (alternating sakura and kinari segments). Center-left: headline "Pesan Buku Pelajaran / untuk Sekolah Anda" in Shippori Mincho, "untuk Sekolah Anda" in sakura accent. Subline in body sans. Two CTAs: sakura pink "Masuk →" primary, kraft-bordered "Lihat Katalog" secondary. Stats: honest numbers in display face with dot separator. Right: mascot at 280px as the shopkeeper. Signature interaction: jenjang cards lift on hover like pulling a display tray forward.

FORM: Toko bunbougu (Japanese stationery shop counter) — translated to web. The crafted warmth of washi tape, kraft paper, and wooden display trays applied to textbook ordering. The shop's organized compartments as navigation medium, each labeled with a colored washi tape tab. Seed key: fe29d443 (assigned overridden by user-pinned direction).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
