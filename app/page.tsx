import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Bookshelf } from './bookshelf'
import { NavLinks } from './nav-links'
import { RevealObserver } from './reveal'

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
          <span className="lp-brand-kanji">{'栞'}</span>
          <span className="lp-brand-name">Shiori</span>
        </Link>
        <NavLinks />
        <Link href="/login" className="lp-nav-login" id="lp-login-nav">
          Masuk
        </Link>
      </nav>

      {/* Washi tape accent */}
      <div className="lp-washi" aria-hidden="true" />

      {/* Hero */}
      <section className="lp-hero" id="lp-hero">
        <div className="lp-hero-text" data-reveal>
          <div className="lp-trust-pill">
            <span className="lp-trust-dot" />
            <span>Tahun Ajaran 2026/2027 &bull; Kurikulum Merdeka &bull; Rabat Tetap 10%</span>
          </div>

          <h1 className="lp-headline">
            Pesan Buku Pelajaran
            <br />
            <span className="lp-headline-accent">untuk Sekolah Anda</span>
          </h1>
          <p className="lp-subline">
            Sistem pemesanan buku LKS &amp; Pegangan Guru (PG) resmi dari CV Putra Nugraha.
            Pilih jenjang, tentukan buku, terima nota berformat resmi untuk SPJ Dana BOS.
          </p>

          <div className="lp-hero-actions">
            <Link href="/login" className="lp-btn-primary" id="lp-cta-main">
              <span>Masuk Akun</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <a href="#lp-jenjang" className="lp-btn-secondary" id="lp-cta-catalog">
              Lihat Katalog
            </a>
            <a
              href="https://wa.me/6281229778899?text=Halo%20CV%20Putra%20Nugraha,%20saya%20ingin%20aktivasi%20akun%20pemesanan%20buku%20untuk%20sekolah%20kami"
              target="_blank"
              rel="noopener noreferrer"
              className="lp-btn-wa"
              aria-label="Aktivasi Akun Sekolah via WhatsApp"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 0 1-5.82 2.41c-1.47 0-2.93-.39-4.2-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.27-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.35.06-.53.25-.19.19-.71.69-.71 1.69s.73 1.96.83 2.1c.1.13 1.41 2.22 3.49 3.07.49.21.88.33 1.18.43.5.16.95.14 1.31.08.4-.06 1.22-.5 1.39-.98.17-.49.17-.91.12-.99-.05-.09-.19-.14-.4-.25s-1.22-.6-1.41-.67c-.19-.07-.33-.1-.47.1-.14.2-.54.67-.66.81-.12.14-.24.16-.45.05s-.89-.33-1.69-1.05c-.63-.56-1.05-1.25-1.17-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.13-.64-1.55-.17-.42-.35-.36-.48-.37l-.41-.01z" />
              </svg>
              <span>Aktivasi Akun (WhatsApp)</span>
            </a>
          </div>

          <div className="lp-onboard-notice">
            <span className="lp-onboard-icon" aria-hidden="true">&#9432;</span>
            <span>
              <strong>Informasi Sekolah:</strong> Akun divisi dikelola &amp; diaktivasi oleh CV Putra Nugraha. Belum memiliki akun? Hubungi hotline WhatsApp untuk pendaftaran cepat.
            </span>
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-num">{totalBooks || '—'}</span>
              <span className="lp-stat-label">Buku Tersedia</span>
            </div>
            <div className="lp-stat-dot" />
            <div className="lp-stat">
              <span className="lp-stat-num">{jenjangCount || '—'}</span>
              <span className="lp-stat-label">Jenjang Pendidikan</span>
            </div>
          </div>
        </div>

        <div className="lp-hero-visual" data-reveal>
          <Image
            src="/assets/shiori-mascot.png"
            alt="Shiori mascot"
            width={400}
            height={400}
            className="lp-hero-mascot"
            priority
          />
        </div>

        <a href="#lp-jenjang" className="lp-scroll-cue" aria-label="Scroll ke katalog buku">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* Bookshelf */}
      <section className="lp-shelf-section" id="lp-jenjang">
        <div className="lp-shelf-inner">
          <h2 className="lp-section-title" data-reveal>Rak Buku Pelajaran</h2>
          <p className="lp-section-sub">
            Pilih kelompok jenjang, lalu klik buku untuk pratinjau judul, kelas, dan harga
          </p>
          <Bookshelf jenjangData={jenjangData} />
        </div>
      </section>

      {/* Timeline: How it works */}
      <section className="lp-section" id="lp-how">
        <h2 className="lp-section-title" data-reveal>Alur Pemesanan</h2>
        <p className="lp-section-sub">Tiga langkah mudah menggantikan bolak-balik spreadsheet</p>

        <div className="lp-timeline">
          <div className="lp-timeline-track" aria-hidden="true" />

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">1</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  <path d="M8 7h6" /><path d="M8 11h8" />
                </svg>
              </div>
              <h3 className="lp-tl-title">Pilih Jenjang</h3>
              <p className="lp-tl-desc">
                Pilih jenjang pendidikan sekolah Anda di rak buku dan telaah judul yang dibutuhkan.
              </p>
            </div>
          </div>

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">2</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <h3 className="lp-tl-title">Input Kuantitas</h3>
              <p className="lp-tl-desc">
                Tentukan jumlah eksemplar LKS siswa dan buku Pegangan Guru (PG) per mata pelajaran.
              </p>
            </div>
          </div>

          <div className="lp-tl-item" data-reveal>
            <div className="lp-tl-marker">3</div>
            <div className="lp-tl-card">
              <div className="lp-tl-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h10" /><path d="M7 11h10" /><path d="M7 15h6" />
                </svg>
              </div>
              <h3 className="lp-tl-title">Terima Nota Resmi SPJ</h3>
              <p className="lp-tl-desc">
                Nota terbit otomatis dengan rincian rabat tetap 10%, siap dilampirkan untuk SPJ Dana BOS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer" id="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-footer-kanji">{'栞'}</span>
            <span className="lp-footer-name">Shiori</span>
          </div>
          <div className="lp-footer-info">
            <p className="lp-footer-company">CV Putra Nugraha &mdash; Distributor Buku Pelajaran</p>
            <p className="lp-footer-addr">
              Jl. Merapi Raya No 17, Mojosongo, Jebres, Solo &bull; WhatsApp: 0812-2977-8899
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginTop: '6px' }}>
            <Link href="/admin" className="lp-empty-link" style={{ textDecoration: 'none' }}>
              Panel Admin Distributor
            </Link>
            <span style={{ color: '#A09080' }}>&bull;</span>
            <Link href="/login" className="lp-empty-link" style={{ textDecoration: 'none' }}>
              Masuk Divisi Sekolah
            </Link>
          </div>
          <p className="lp-footer-copy">
            &copy; {new Date().getFullYear()} CV Putra Nugraha. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
