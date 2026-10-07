import Image from 'next/image'
import Link from 'next/link'
import { NavLinks } from './nav-links'
import { RevealObserver } from './reveal'
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
    // DB not connected — show page with empty state
  }

  const jenjangCount = jenjangData.length || 0

  return (
    <div className="lp">
      <RevealObserver />
      {/* Navbar */}
      <nav className="lp-nav" id="lp-navbar">
        <Link href="/" className="lp-brand">
          <Image
            src="/assets/shiori-mascot.png"
            alt="Shiori mascot"
            width={36}
            height={36}
            className="lp-brand-mascot"
          />
          <span className="lp-brand-kanji">{'\u681E'}</span>
          <span className="lp-brand-name">Shiori</span>
        </Link>
        <NavLinks />
        <Link href="/admin" className="lp-nav-login" id="lp-login-nav">
          Masuk
        </Link>
      </nav>

      {/* Washi tape accent */}
      <div className="lp-washi" aria-hidden="true" />

      {/* Hero */}
      <section className="lp-hero" id="lp-hero">
        <div className="lp-hero-text" data-reveal>
          <h1 className="lp-headline">
            Pesan Buku Pelajaran
            <br />
            <span className="lp-headline-accent">untuk Sekolah Anda</span>
          </h1>
          <p className="lp-subline">
            Sistem pemesanan buku LKS &amp; PG dari CV Putra Nugraha.
            Pilih jenjang, tentukan buku, terima nota&nbsp;&mdash; selesai.
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
              <span className="lp-stat-num">{totalBooks || '\u2014'}</span>
              <span className="lp-stat-label">Buku Tersedia</span>
            </div>
            <div className="lp-stat-dot" />
            <div className="lp-stat">
              <span className="lp-stat-num">{jenjangCount || '\u2014'}</span>
              <span className="lp-stat-label">Jenjang</span>
            </div>
          </div>
        </div>

        <div className="lp-hero-visual" data-reveal>
          <Image
            src="/assets/shiori-mascot.png"
            alt="Shiori mascot"
            width={420}
            height={420}
            className="lp-hero-mascot"
            priority
          />
        </div>

        <a href="#lp-jenjang" className="lp-scroll-cue" aria-label="Scroll ke katalog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </a>
      </section>

      {/* Bookshelf */}
      <section className="lp-shelf-section" id="lp-jenjang">
        <div className="lp-shelf-inner">
          <h2 className="lp-section-title" data-reveal>Rak Buku</h2>
          <p className="lp-section-sub">
            Klik buku untuk melihat daftar buku yang tersedia
          </p>
          {jenjangData.length > 0 ? (
            <div className="lp-bookshelf">
              {Array.from({ length: Math.ceil(jenjangData.length / 5) }, (_, row) => (
                <div key={row} className="lp-shelf-row">
                  <div className="lp-shelf-books" data-reveal>
                    {jenjangData.slice(row * 5, row * 5 + 5).map(j => {
                      const color = JENJANG_COLORS[j.jenjang] || '#b0b0b0'
                      return (
                        <div
                          key={j.jenjang}
                          className="lp-book"
                          style={{ '--book-color': color } as React.CSSProperties}
                          title={`${j.jenjang} - ${j._count} buku`}
                        >
                          <div className="lp-book-body">
                            <div className="lp-book-front">
                              <div className="lp-book-bind" />
                              <div className="lp-book-stripe" />
                              <div className="lp-book-info">
                                <div className="lp-book-bind lp-book-bind--light" />
                                <span className="lp-book-title">{j.jenjang}</span>
                                <span className="lp-book-count">{j._count} buku</span>
                              </div>
                              <div className="lp-book-border" />
                            </div>
                            <div className="lp-book-spine" />
                            <div className="lp-book-back" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="lp-shelf-plank" />
                </div>
              ))}
            </div>
          ) : (
            <p className="lp-empty">Katalog sedang dimuat. <a href="/" className="lp-empty-link">Muat ulang halaman</a></p>
          )}
        </div>
      </section>

      {/* Timeline: How it works */}
      <section className="lp-section" id="lp-how">
        <h2 className="lp-section-title" data-reveal>Cara Memesan</h2>
        <p className="lp-section-sub">Tiga langkah, tanpa ribet</p>

        <div className="lp-timeline">
          <div className="lp-timeline-track" aria-hidden="true" />

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">1</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  <path d="M8 7h6"/><path d="M8 11h8"/>
                </svg>
              </div>
              <h3 className="lp-tl-title">Pilih Jenjang</h3>
              <p className="lp-tl-desc">Pilih jenjang pendidikan yang sesuai dengan kebutuhan sekolah Anda</p>
            </div>
          </div>

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">2</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <h3 className="lp-tl-title">Tentukan Buku</h3>
              <p className="lp-tl-desc">Pilih buku dan tentukan jumlah pesanan untuk setiap mata pelajaran</p>
            </div>
          </div>

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">3</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M7 7h10"/><path d="M7 11h10"/><path d="M7 15h6"/>
                </svg>
              </div>
              <h3 className="lp-tl-title">Terima Nota</h3>
              <p className="lp-tl-desc">Nota pesanan terbit otomatis, siap untuk diproses dan dikirim</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer" id="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-kanji">{'\u681E'}</span>
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
