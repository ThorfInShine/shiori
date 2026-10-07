import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const JENJANG_COLORS: Record<string, string> = {
  SD:            '#D4808A',
  SMP:           '#7BA8C4',
  SMA:           '#E8D070',
  SMK:           '#C94C4C',
  MADRASAH:      '#B0A0C8',
  'AKM & P5':   '#7BA784',
  PROD:          '#E89668',
  TKA:           '#D4A86A',
  'ASAJ UM':     '#8BAAB0',
  'JURNAL & TK': '#C4A0B0',
}

export default async function Home() {
  let jenjangData: { jenjang: string; _count: number }[] = []
  let totalBooks = 0

  try {
    const raw = await prisma.book.groupBy({
      by: ['jenjang'],
      _count: { _all: true },
      orderBy: { jenjang: 'asc' },
    })
    jenjangData = raw.map(r => ({ jenjang: r.jenjang, _count: r._count._all }))
    totalBooks = jenjangData.reduce((s, j) => s + j._count, 0)
  } catch {
    // DB not connected Ã¢â‚¬â€ show page with empty state
  }

  const jenjangCount = jenjangData.length || 0

  return (
    <div className="lp">
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Navbar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <nav className="lp-nav" id="lp-navbar">
        <Link href="/" className="lp-brand">
          <Image
            src="/assets/Screenshot 2026-09-28 234611.png"
            alt="Ã¦Â Å¾ Shiori mascot"
            width={36}
            height={36}
            className="lp-brand-mascot"
          />
          <span className="lp-brand-kanji">Ã¦Â Å¾</span>
          <span className="lp-brand-name">Shiori</span>
        </Link>
        <Link href="/admin" className="lp-nav-login" id="lp-login-nav">
          Masuk
        </Link>
      </nav>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Washi tape accent Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="lp-washi" aria-hidden="true" />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Hero Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="lp-hero" id="lp-hero">
        <div className="lp-hero-text">
          <h1 className="lp-headline">
            Pesan Buku Pelajaran
            <br />
            <span className="lp-headline-accent">untuk Sekolah Anda</span>
          </h1>
          <p className="lp-subline">
            Sistem pemesanan buku LKS &amp; PG dari CV Putra Nugraha.
            Pilih jenjang, tentukan buku, terima nota&nbsp;Ã¢â‚¬â€ selesai.
          </p>

          <div className="lp-hero-actions">
            <Link href="/admin" className="lp-btn-primary" id="lp-cta-main">
              Masuk
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
            <a href="#lp-jenjang" className="lp-btn-secondary" id="lp-cta-catalog">
              Lihat Katalog
            </a>
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-num">{totalBooks || 'Ã¢â‚¬â€'}</span>
              <span className="lp-stat-label">Buku Tersedia</span>
            </div>
            <div className="lp-stat-dot" />
            <div className="lp-stat">
              <span className="lp-stat-num">{jenjangCount || 'Ã¢â‚¬â€'}</span>
              <span className="lp-stat-label">Jenjang</span>
            </div>
          </div>
        </div>

        <div className="lp-hero-visual">
          <Image
            src="/assets/Screenshot 2026-09-28 234611.png"
            alt="Ã¦Â Å¾ Shiori mascot"
            width={280}
            height={280}
            className="lp-hero-mascot"
            priority
          />
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Jenjang grid Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}

      <section className="lp-section" id="lp-jenjang">
        <h2 className="lp-section-title">Pilih Jenjang</h2>
        <p className="lp-section-sub">
          Pilih jenjang pendidikan untuk melihat daftar buku yang tersedia
        </p>
        <div className="lp-jenjang-grid">
          {jenjangData.length > 0 ? (
            jenjangData.map(j => {
              const color = JENJANG_COLORS[j.jenjang] || '#b0b0b0'
              return (
                <Link
                  key={j.jenjang}
                  href={`/order?jenjang=${encodeURIComponent(j.jenjang)}`}
                  className="lp-jenjang-card"
                  style={{ '--jenjang-color': color } as React.CSSProperties}
                >
                  <div className="lp-jenjang-tab" />
                  <div className="lp-jenjang-body">
                    <span className="lp-jenjang-name">{j.jenjang}</span>
                    <span className="lp-jenjang-count">{j._count} buku</span>
                  </div>
                </Link>
              )
            })
          ) : (
            <p className="lp-empty">Katalog belum dimuat</p>
          )}
        </div>
      </section>



      {/* Ã¢â€â‚¬Ã¢â€â‚¬ How it works Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <section className="lp-section lp-steps-section" id="lp-how">
        <h2 className="lp-section-title">Cara Memesan</h2>
        <p className="lp-section-sub">Tiga langkah, tanpa ribet</p>

        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                <path d="M8 7h6"/><path d="M8 11h8"/>
              </svg>
            </div>
            <h3 className="lp-step-title">Pilih Jenjang</h3>
            <p className="lp-step-desc">Pilih jenjang pendidikan yang sesuai dengan kebutuhan sekolah</p>
          </div>

          <div className="lp-step-line" />

          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <h3 className="lp-step-title">Tentukan Buku</h3>
            <p className="lp-step-desc">Pilih buku dan tentukan jumlah pesanan untuk setiap mata pelajaran</p>
          </div>

          <div className="lp-step-line" />

          <div className="lp-step">
            <div className="lp-step-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M7 7h10"/><path d="M7 11h10"/><path d="M7 15h6"/>
              </svg>
            </div>
            <h3 className="lp-step-title">Terima Nota</h3>
            <p className="lp-step-desc">Nota pesanan terbit otomatis, siap untuk diproses</p>
          </div>
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Footer Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <footer className="lp-footer" id="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-kanji">Ã¦Â Å¾</span>
            <span className="lp-footer-name">Shiori</span>
          </div>
          <div className="lp-footer-info">
            <p className="lp-footer-company">CV Putra Nugraha</p>
            <p className="lp-footer-addr">Jl. Merapi Raya No 17, Mojosongo, Jebres, Solo</p>
          </div>
          <p className="lp-footer-copy">
            &copy; {new Date().getFullYear()} CV Putra Nugraha. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
