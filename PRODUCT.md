# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are **schools and teachers** ordering textbooks (LKS — student worksheets, and PG — exam-prep booklets) for their students across Indonesian education levels (SD, SMP, SMA, SMK, Madrasah, TK Akademik, AKM & P5, Produktif, ASAJ UM, Jurnal & TK). User accounts are created by the admin — there is no self-registration.

Secondary user is the **admin operator at CV Putra Nugraha**, who manages the book catalog, creates user accounts, reviews incoming orders, and tracks sales through the admin dashboard.

## Product Purpose

Shiori (栞) replaces the previous spreadsheet-based ordering workflow where schools and CV Putra Nugraha exchanged Excel files back and forth. It provides a self-service web interface where authenticated buyers browse books by education level, build an order with quantities, and receive an auto-generated nota (invoice). The admin side gives CV Putra Nugraha order management, user account management, and sales visibility.

Success means: schools can complete a book order in minutes instead of email/spreadsheet rounds, and CV Putra Nugraha processes orders faster with fewer errors.

## Positioning

A purpose-built ordering tool for Indonesian LKS/PG textbook distributors — not a general e-commerce platform. The catalog is structured by jenjang (education level), bidang studi (subject), and kelas (grade), matching how schools actually think about book procurement. Auto-generated nota with built-in discount calculation (potongan) reflects the trade's standard pricing model.

## Operating Context

- Schools log in with admin-provisioned credentials, then browse the landing page, pick a jenjang, see available books in a table, enter quantities for LKS and/or PG variants, review a summary with 10% discount applied, and submit.
- Orders generate a nota (invoice number) automatically.
- Admin logs in via `/admin`, accesses a dashboard at `/admin/dashboard` for order management, user account creation, and catalog management.
- Book catalog is seeded from Excel data (see `prisma/seed.js`), reflecting the existing spreadsheet-based catalog.
- Data: PostgreSQL via Prisma ORM.

## Capabilities and Constraints

- Catalog: books with jenjang, bidang studi, kelas, halaman, hargaLks, hargaPg, jenis.
- Orders: buyer (logged-in user), line items, subtotal, fixed 10% potongan, netto, status (pending/confirmed).
- User accounts: created by admin, required for placing orders. No self-registration.
- Admin: username/password auth (bcrypt), dashboard with bilingual JP+ID interface.
- Export: xlsx dependency present for potential Excel export.
- No payment integration — orders are invoiced offline.
- Single admin role, no role hierarchy.
- Indonesian language for buyer-facing surfaces; Japanese-Indonesian bilingual aesthetic in admin.

## Brand Commitments

- **Name**: 栞 Shiori — always displayed with the kanji character.
- **Logo/Mascot**: The asset at `/assets/Screenshot 2026-09-28 234611.png` is the finalized logo/mascot and must be used.
- **Business entity**: CV Putra Nugraha — appears in footer, nota, and branding.
- **Aesthetic**: Japanese-Indonesian fusion — Japanese subtitles in admin UI, washi tape / stationery motifs on landing page.
- **Address**: Jl. Merapi Raya No 17 Mojosongo Jebres Solo (on nota).

## Evidence on Hand

- Working Next.js 16 app with full order flow and admin dashboard.
- Seeded book catalog from real Excel data (`prisma/seed.js`).
- Logo/mascot and multiple custom illustration assets in `/public/assets/`.
- Admin dashboard with sidebar nav icons, stat card illustrations, cloud/wave decorative elements.
- No testimonials, case studies, or external press.

## Product Principles

1. **Replace the spreadsheet, not the relationship** — the tool accelerates ordering but doesn't change how CV Putra Nugraha works with schools.
2. **Catalog-first** — the book list organized by jenjang is the core navigation; everything flows from it.
3. **Nota as output** — the auto-generated invoice is the primary deliverable of every order, not a receipt afterthought.
4. **Admin simplicity** — one operator, one dashboard; admin provisions user accounts and manages the full lifecycle.
5. **Indonesian context native** — terminology, currency, education structure, and discount conventions match the local trade.
