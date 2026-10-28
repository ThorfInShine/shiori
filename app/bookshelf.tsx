'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'

export interface JenjangData {
  jenjang: string
  _count: number
}

interface BookItem {
  id: number
  bidangStudi: string
  jenjang: string
  kategori: string
  kelas?: string | null
  halaman?: number | null
  hargaLks?: number | null
  hargaPg?: number | null
  halPg?: number | null
  jenis?: string | null
}

export interface JenjangMeta {
  code: string
  name: string
  levelDesc: string
  tier: 'dasar' | 'menengah' | 'keagamaan' | 'paud'
  color: string
}

export const JENJANG_METAS: Record<string, JenjangMeta> = {
  SD: {
    code: 'SD',
    name: 'Sekolah Dasar',
    levelDesc: 'Kelas 1 – 6 · Kurikulum Merdeka',
    tier: 'dasar',
    color: '#D4808A',
  },
  SMP: {
    code: 'SMP',
    name: 'Sekolah Menengah Pertama',
    levelDesc: 'Kelas 7 – 9 · Kurikulum Merdeka',
    tier: 'dasar',
    color: '#7BA8C4',
  },
  SMA: {
    code: 'SMA',
    name: 'Sekolah Menengah Atas',
    levelDesc: 'Kelas 10 – 12 · Kurikulum Merdeka',
    tier: 'menengah',
    color: '#E8D070',
  },
  SMK: {
    code: 'SMK',
    name: 'Sekolah Menengah Kejuruan',
    levelDesc: 'Kelas 10 – 12 · Kurikulum Merdeka',
    tier: 'menengah',
    color: '#C94C4C',
  },
  PROD: {
    code: 'PROD',
    name: 'SMK Produktif',
    levelDesc: 'Mata Pelajaran Kejuruan Spesifik',
    tier: 'menengah',
    color: '#E89668',
  },
  MADRASAH: {
    code: 'MADRASAH',
    name: 'Madrasah (MI, MTs, MA)',
    levelDesc: 'Pendidikan Keagamaan Kemenag',
    tier: 'keagamaan',
    color: '#B0A0C8',
  },
  'AKM & P5': {
    code: 'AKM & P5',
    name: 'AKM & P5',
    levelDesc: 'Asesmen & Penguatan Karakter',
    tier: 'keagamaan',
    color: '#7BA784',
  },
  'ASAJ UM': {
    code: 'ASAJ UM',
    name: 'ASAJ & Ujian Madrasah',
    levelDesc: 'Asesmen Sumatif Akhir Jenjang',
    tier: 'keagamaan',
    color: '#8BAAB0',
  },
  TKA: {
    code: 'TKA',
    name: 'TK Akademik',
    levelDesc: 'Pendidikan Anak Usia Dini (PAUD/TK)',
    tier: 'paud',
    color: '#D4A86A',
  },
  'JURNAL & TK': {
    code: 'JURNAL & TK',
    name: 'Jurnal Guru & Perangkat TK',
    levelDesc: 'Administrasi & Lembar Kerja TK',
    tier: 'paud',
    color: '#C4A0B0',
  },
}

const ORDERED_JENJANG_KEYS = [
  'SD',
  'SMP',
  'SMA',
  'SMK',
  'PROD',
  'MADRASAH',
  'AKM & P5',
  'ASAJ UM',
  'TKA',
  'JURNAL & TK',
]

const TIERS = [
  { id: 'all', label: 'Semua Jenjang' },
  { id: 'dasar', label: 'Pendidikan Dasar' },
  { id: 'menengah', label: 'Pendidikan Menengah' },
  { id: 'keagamaan', label: 'Keagamaan & Asesmen' },
  { id: 'paud', label: 'PAUD & Administrasi' },
] as const

type TierId = typeof TIERS[number]['id']

const SEARCH_ALIASES: Record<string, string[]> = {
  pkn: ['ppkn', 'pancasila', 'kewarganegaraan'],
  ppkn: ['pkn', 'pancasila', 'kewarganegaraan'],
  pancasila: ['pkn', 'ppkn', 'kewarganegaraan'],
  pjok: ['penjas', 'olahraga', 'jasmani'],
  penjas: ['pjok', 'olahraga', 'jasmani'],
  olahraga: ['pjok', 'penjas'],
  matematika: ['mtk', 'math'],
  mtk: ['matematika', 'math'],
  pai: ['agama', 'islam', 'pendidikan agama'],
  agama: ['pai', 'islam', 'pend. agama'],
  islam: ['pai', 'agama', 'pendidikan agama'],
  indo: ['indonesia', 'bahasa indonesia', 'b. indo', 'bhs. indonesia'],
  indonesia: ['indo', 'bahasa indonesia', 'b. indo'],
  inggris: ['english', 'bahasa inggris', 'b. inggris'],
  english: ['inggris', 'bahasa inggris'],
  jawa: ['jateng', 'jatim', 'bajatim'],
  ipa: ['sains', 'ipas'],
  ips: ['sosial', 'ipas'],
  ipas: ['ipa', 'ips', 'sains'],
  tik: ['informatika', 'komputer', 'koding'],
  informatika: ['tik', 'komputer', 'koding'],
  koding: ['tik', 'informatika'],
  bk: ['konseling', 'bimbingan konseling'],
}

export function Bookshelf({ jenjangData }: { jenjangData: JenjangData[] }) {
  const [activeTier, setActiveTier] = useState<TierId>('all')
  const [selectedJenjang, setSelectedJenjang] = useState<string | null>(null)
  const [booksCache, setBooksCache] = useState<Record<string, BookItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Map incoming data by jenjang code
  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    jenjangData.forEach(j => map.set(j.jenjang, j._count))
    return map
  }, [jenjangData])

  // Sort according to educational hierarchy rather than raw alphabetical
  const sortedItems = useMemo(() => {
    const ordered: { jenjang: string; _count: number; meta: JenjangMeta }[] = []
    ORDERED_JENJANG_KEYS.forEach(key => {
      const count = countMap.get(key)
      if (count !== undefined) {
        ordered.push({
          jenjang: key,
          _count: count,
          meta: JENJANG_METAS[key] || {
            code: key,
            name: key,
            levelDesc: 'Buku Pelajaran',
            tier: 'dasar',
            color: '#B0A0C8',
          },
        })
      }
    })
    // Append any unknown jenjangs if they exist in DB
    jenjangData.forEach(j => {
      if (!ORDERED_JENJANG_KEYS.includes(j.jenjang)) {
        ordered.push({
          jenjang: j.jenjang,
          _count: j._count,
          meta: {
            code: j.jenjang,
            name: j.jenjang,
            levelDesc: 'Buku Pelajaran',
            tier: 'dasar',
            color: '#A09080',
          },
        })
      }
    })
    return ordered
  }, [jenjangData, countMap])

  // Filter by active tier
  const filteredItems = useMemo(() => {
    if (activeTier === 'all') return sortedItems
    return sortedItems.filter(item => item.meta.tier === activeTier)
  }, [sortedItems, activeTier])

  const fetchBooksForJenjang = useCallback((jenjang: string) => {
    setLoading(true)
    setError(null)

    fetch(`/api/books?jenjang=${encodeURIComponent(jenjang)}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal memuat katalog buku')
        return res.json()
      })
      .then((data: BookItem[]) => {
        setBooksCache(prev => ({ ...prev, [jenjang]: data }))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Terjadi kesalahan')
        setLoading(false)
      })
  }, [])

  // Close drawer on Escape key and manage body overflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedJenjang(null)
      }
    }
    if (selectedJenjang) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedJenjang])

  const openPreview = useCallback((jenjang: string) => {
    setSelectedJenjang(jenjang)
    setSearchQuery('')
    if (!booksCache[jenjang]) {
      fetchBooksForJenjang(jenjang)
    }
  }, [booksCache, fetchBooksForJenjang])

  const closeDrawer = useCallback(() => {
    setSelectedJenjang(null)
    setSearchQuery('')
  }, [])

  const currentMeta = selectedJenjang ? JENJANG_METAS[selectedJenjang] : null
  const currentBooks = useMemo(() => {
    return selectedJenjang ? booksCache[selectedJenjang] || [] : []
  }, [selectedJenjang, booksCache])

  const displayedBooks = useMemo(() => {
    const raw = searchQuery.trim().toLowerCase()
    if (!raw) return currentBooks
    const tokens = raw.split(/\s+/).filter(Boolean)

    return currentBooks.filter(book => {
      const subject = book.bidangStudi.toLowerCase()
      const kelas = book.kelas ? book.kelas.toLowerCase() : ''

      return tokens.every(token => {
        if (subject.includes(token) || kelas.includes(token)) return true
        const aliases = SEARCH_ALIASES[token]
        if (aliases) {
          return aliases.some(alias => subject.includes(alias))
        }
        return false
      })
    })
  }, [currentBooks, searchQuery])

  // Chunk books into shelves of max 5 per plank
  const shelfRows = useMemo(() => {
    const rows: (typeof filteredItems)[] = []
    const perRow = 5
    for (let i = 0; i < filteredItems.length; i += perRow) {
      rows.push(filteredItems.slice(i, i + perRow))
    }
    return rows
  }, [filteredItems])

  return (
    <div className="lp-bookshelf-container">
      {/* Tier Filter Tabs */}
      <div className="lp-shelf-tiers" role="tablist" aria-label="Filter jenjang pendidikan">
        {TIERS.map(tier => (
          <button
            key={tier.id}
            type="button"
            role="tab"
            aria-selected={activeTier === tier.id}
            className={`lp-tier-btn${activeTier === tier.id ? ' lp-tier-btn--active' : ''}`}
            onClick={() => setActiveTier(tier.id)}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* 3D Bookshelf */}
      {filteredItems.length > 0 ? (
        <div className="lp-bookshelf">
          {shelfRows.map((row, rowIndex) => (
            <div key={rowIndex} className="lp-shelf-row">
              <div className="lp-shelf-books">
                {row.map(item => {
                  const color = item.meta.color
                  return (
                    <button
                      key={item.jenjang}
                      type="button"
                      className="lp-book"
                      onClick={() => openPreview(item.jenjang)}
                      style={{ '--book-color': color } as React.CSSProperties}
                      aria-label={`Buka pratinjau katalog ${item.meta.name} (${item._count} judul buku)`}
                      title={`Klik untuk melihat katalog ${item.meta.name}`}
                    >
                      <div className="lp-book-body">
                        <div className="lp-book-front">
                          <div className="lp-book-bind" />
                          <div className="lp-book-stripe" />
                          <div className="lp-book-info">
                            <div className="lp-book-bind lp-book-bind--light" />
                            <span className="lp-book-title">{item.jenjang}</span>
                            <span className="lp-book-desc">{item.meta.levelDesc.split('·')[0].trim()}</span>
                            <span className="lp-book-count">{item._count} judul</span>
                          </div>
                          <div className="lp-book-border" />
                        </div>
                        <div className="lp-book-spine" />
                        <div className="lp-book-back" />
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="lp-shelf-plank" />
            </div>
          ))}
        </div>
      ) : (
        <p className="lp-empty">
          Tidak ada buku dalam kategori ini.{' '}
          <button
            type="button"
            className="lp-empty-link"
            onClick={() => setActiveTier('all')}
          >
            Tampilkan semua jenjang
          </button>
        </p>
      )}

      {/* Interactive Preview Drawer */}
      {selectedJenjang && (
        <div
          className="lp-drawer-backdrop"
          onClick={closeDrawer}
          role="presentation"
        >
          <div
            className="lp-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            onClick={e => e.stopPropagation()}
          >
            {/* Washi Header Strip */}
            <div
              className="lp-drawer-washi"
              style={{ background: currentMeta?.color || '#C4727E' }}
            />

            {/* Drawer Header */}
            <div className="lp-drawer-header">
              <div className="lp-drawer-title-group">
                <span className="lp-drawer-kicker">
                  {currentMeta?.code} &middot; CV Putra Nugraha
                </span>
                <h3 id="drawer-title" className="lp-drawer-title">
                  {currentMeta?.name || selectedJenjang}
                </h3>
                <p className="lp-drawer-sub">
                  {currentMeta?.levelDesc} &bull; {currentBooks.length || item_count(countMap, selectedJenjang)} Judul Tersedia
                </p>
              </div>
              <button
                type="button"
                className="lp-drawer-close"
                onClick={closeDrawer}
                aria-label="Tutup pratinjau katalog"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Value Callout Strip */}
            <div className="lp-drawer-trust-banner">
              <div className="lp-drawer-trust-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Rabat 10% Otomatis</span>
              </div>
              <div className="lp-drawer-trust-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>Kurikulum Merdeka</span>
              </div>
              <div className="lp-drawer-trust-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h10M7 12h10M7 17h6" />
                </svg>
                <span>Nota SPJ Resmi</span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="lp-drawer-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lp-drawer-search-icon" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="lp-drawer-search"
                placeholder="Cari mata pelajaran (misal: Matematika, Pancasila)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Cari mata pelajaran"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="lp-drawer-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Drawer Book List */}
            <div className="lp-drawer-content">
              {loading ? (
                <div className="lp-drawer-loading">
                  <div className="lp-drawer-spinner" />
                  <p>Memuat daftar buku {selectedJenjang}...</p>
                </div>
              ) : error ? (
                <div className="lp-drawer-error">
                  <p>{error}</p>
                  <button
                    type="button"
                    className="lp-btn-secondary"
                    onClick={() => {
                      if (selectedJenjang) {
                        fetchBooksForJenjang(selectedJenjang)
                      }
                    }}
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : displayedBooks.length === 0 ? (
                <div className="lp-drawer-empty">
                  {searchQuery ? (
                    <p>Tidak ditemukan buku dengan kata kunci &ldquo;{searchQuery}&rdquo;</p>
                  ) : (
                    <p>Belum ada daftar judul buku untuk jenjang ini.</p>
                  )}
                </div>
              ) : (
                <div className="lp-drawer-book-list">
                  {displayedBooks.map(book => (
                    <div key={book.id} className="lp-drawer-book-item">
                      <div className="lp-drawer-book-main">
                        <div className="lp-drawer-book-badges">
                          {book.kelas && (
                            <span className="lp-badge-kelas">Kelas {book.kelas}</span>
                          )}
                          {book.halaman && (
                            <span className="lp-badge-hlm">{book.halaman} hlm</span>
                          )}
                          {book.jenis && (
                            <span className="lp-badge-jenis">{book.jenis}</span>
                          )}
                        </div>
                        <h4 className="lp-drawer-book-title">{book.bidangStudi}</h4>
                      </div>
                      <div className="lp-drawer-book-prices">
                        {book.hargaLks !== null && book.hargaLks !== undefined && (
                          <div className="lp-price-tag">
                            <span className="lp-price-label">LKS</span>
                            <span className="lp-price-val">
                              Rp {book.hargaLks.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                        {book.hargaPg !== null && book.hargaPg !== undefined && (
                          <div className="lp-price-tag lp-price-tag--pg">
                            <span className="lp-price-label">PG</span>
                            <span className="lp-price-val">
                              Rp {book.hargaPg.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Actions Footer */}
            <div className="lp-drawer-footer">
              <div className="lp-drawer-actions">
                <Link
                  href={`/login?redirect=/user/order?jenjang=${encodeURIComponent(selectedJenjang)}`}
                  className="lp-btn-primary lp-drawer-cta-primary"
                >
                  <span>Masuk untuk Pesan {selectedJenjang}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
                <a
                  href={`https://wa.me/6281229778899?text=Halo%20CV%20Putra%20Nugraha,%20saya%20ingin%20tanya%20katalog%20dan%20aktivasi%20akun%20pemesanan%20buku%20jenjang%20${encodeURIComponent(selectedJenjang)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-btn-wa-secondary"
                  aria-label="Konsultasi via WhatsApp"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.28-2.42 5.84a8.19 8.19 0 0 1-5.82 2.41c-1.47 0-2.93-.39-4.2-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.27-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.16 0-.35.06-.53.25-.19.19-.71.69-.71 1.69s.73 1.96.83 2.1c.1.13 1.41 2.22 3.49 3.07.49.21.88.33 1.18.43.5.16.95.14 1.31.08.4-.06 1.22-.5 1.39-.98.17-.49.17-.91.12-.99-.05-.09-.19-.14-.4-.25s-1.22-.6-1.41-.67c-.19-.07-.33-.1-.47.1-.14.2-.54.67-.66.81-.12.14-.24.16-.45.05s-.89-.33-1.69-1.05c-.63-.56-1.05-1.25-1.17-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.13-.64-1.55-.17-.42-.35-.36-.48-.37l-.41-.01z" />
                  </svg>
                  <span>Tanya WhatsApp</span>
                </a>
              </div>
              <p className="lp-drawer-footer-note">
                Akun sekolah diaktivasi oleh CV Putra Nugraha. Belum memiliki akun? Hubungi kami via WhatsApp untuk pendaftaran resmi.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function item_count(map: Map<string, number>, key: string): number {
  return map.get(key) || 0
}
