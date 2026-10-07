'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const JENJANG_COLORS: Record<string, string> = {
  SD: '#D4808A', SMP: '#7BA8C4', SMA: '#E8D070', SMK: '#C94C4C',
  MADRASAH: '#B0A0C8', 'AKM & P5': '#7BA784', PROD: '#E89668',
  TKA: '#D4A86A', 'ASAJ UM': '#8BAAB0', 'JURNAL & TK': '#C4A0B0',
  MTS: '#9BB09B', MI: '#C4A070', 'SMA-SMK': '#aaa',
}


type Book = {
  id: number
  bidangStudi: string
  jenjang: string
  kelas: string | null
  hargaLks: number | null
  hargaPg: number | null
}

type CartItem = {
  book: Book
  jenis: 'lks' | 'pg'
  jumlah: number
}

type OrderData = {
  id: number
  nomorNota: string
  tanggal: string
  subtotal: number
  netto: number
  status: string
  buyer: { nama: string; area: string }
  items: { id: number; jumlah: number; hargaSatuan: number; totalHarga: number; book: { bidangStudi: string } }[]
}

type Step = 'jenjang' | 'buku' | 'cart' | 'checkout'
type Tab = 'order' | 'history'

const STEP_LIST: { key: Step; label: string }[] = [
  { key: 'jenjang', label: 'Jenjang' },
  { key: 'buku', label: 'Pilih Buku' },
  { key: 'cart', label: 'Keranjang' },
  { key: 'checkout', label: 'Kirim' },
]

export default function UserOrderPage() {
  const router = useRouter()
  const [divisionName, setDivisionName] = useState('')
  const [divisionId, setDivisionId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('order')
  const [step, setStep] = useState<Step>('jenjang')
  const [browseStep, setBrowseStep] = useState<'jenjang' | 'buku'>('jenjang')
  const [jenjangList, setJenjangList] = useState<string[]>([])
  const [selectedJenjang, setSelectedJenjang] = useState('')
  const [books, setBooks] = useState<Book[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [buyerNama, setBuyerNama] = useState('')
  const [buyerArea, setBuyerArea] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [orderId, setOrderId] = useState<number | null>(null)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const saveTimer = useState<ReturnType<typeof setTimeout> | null>(null)

  // Debounced save cart to DB whenever cart changes
  useEffect(() => {
    if (divisionId == null) return
    if (saveTimer[0]) clearTimeout(saveTimer[0])
    saveTimer[0] = setTimeout(() => {
      fetch('/api/user/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: cart.map(c => ({ bookId: c.book.id, jenis: c.jenis, jumlah: c.jumlah })) }),
      }).catch(() => {})
    }, 500)
    return () => { if (saveTimer[0]) clearTimeout(saveTimer[0]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, divisionId])

  useEffect(() => {
    fetch('/api/user/session').then(r => r.json()).then(d => {
      if (!d.ok) { router.push('/admin'); return }
      setDivisionName(d.name)
      setDivisionId(d.id)
      // Load cart from DB
      fetch('/api/user/cart').then(r => r.json()).then(data => {
        if (data.ok && data.cart?.length) setCart(data.cart)
      }).catch(() => {})
    }).catch(() => router.push('/admin'))

    fetch('/api/books').then(r => r.json()).then((data: Book[]) => {
      const j = [...new Set(data.map(b => b.jenjang))].sort()
      setJenjangList(j)
    })
  }, [router])

  const loadOrders = () => {
    setOrdersLoading(true)
    fetch('/api/user/order').then(r => r.json()).then((data: OrderData[]) => {
      setOrders(data)
      setOrdersLoading(false)
    }).catch(() => setOrdersLoading(false))
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    if (t === 'history') loadOrders()
  }

  const selectJenjang = (j: string) => {
    setSelectedJenjang(j)
    setLoading(true)
    fetch(`/api/books?jenjang=${encodeURIComponent(j)}`).then(r => r.json()).then((data: Book[]) => {
      setBooks(data)
      setLoading(false)
      setStep('buku')
      setBrowseStep('buku')
    })
  }

  const addToCart = (book: Book, jenis: 'lks' | 'pg') => {
    setCart(prev => {
      const existing = prev.find(c => c.book.id === book.id && c.jenis === jenis)
      if (existing) {
        return prev.map(c => c.book.id === book.id && c.jenis === jenis ? { ...c, jumlah: c.jumlah + 1 } : c)
      }
      return [...prev, { book, jenis, jumlah: 1 }]
    })
  }

  const updateQty = (bookId: number, jenis: 'lks' | 'pg', qty: number) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(c => !(c.book.id === bookId && c.jenis === jenis)))
    } else {
      setCart(prev => {
        const exists = prev.some(c => c.book.id === bookId && c.jenis === jenis)
        if (exists) return prev.map(c => c.book.id === bookId && c.jenis === jenis ? { ...c, jumlah: qty } : c)
        const book = books.find(b => b.id === bookId)
        if (!book) return prev
        return [...prev, { book, jenis, jumlah: qty }]
      })
    }
  }

  const getPrice = (item: CartItem) => item.jenis === 'lks' ? (item.book.hargaLks || 0) : (item.book.hargaPg || 0)
  const subtotal = cart.reduce((sum, item) => sum + getPrice(item) * item.jumlah, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.jumlah, 0)
  const getCartQty = (bookId: number, jenis: 'lks' | 'pg') => cart.find(c => c.book.id === bookId && c.jenis === jenis)?.jumlah || 0
  const stepIdx = STEP_LIST.findIndex(s => s.key === step)

  const handleSubmit = async () => {
    if (!buyerNama.trim() || !buyerArea.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/user/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerNama: buyerNama.trim(),
          buyerArea: buyerArea.trim(),
          items: cart.map(c => ({ bookId: c.book.id, jumlah: c.jumlah, hargaSatuan: getPrice(c) })),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setSubmitOk(true); setOrderId(data.orderId)
        fetch('/api/user/cart', { method: 'DELETE' }).catch(() => {})
      } else {
        setSubmitError(data.error || 'Gagal mengirim pesanan. Coba lagi.')
      }
    } catch { setSubmitError('Koneksi gagal. Periksa internet dan coba lagi.') } finally { setSubmitting(false) }
  }

  const fmt = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (submitOk) {
    return (
      <div className="uo-root">
        <div className="uo-success">
          <div className="uo-success-confetti">
            {[...Array(12)].map((_, i) => <span key={i} className="uo-confetti-dot" style={{ '--ci': i, '--cc': ['#e85d4a','#E8D070','#7BA8C4','#7BA784','#D4808A','#B0A0C8'][i % 6] } as React.CSSProperties} />)}
          </div>
          <div className="uo-success-icon">{'\u2714\uFE0F'}</div>
          <h2>Pesanan Berhasil Dikirim!</h2>
          <p>Pesanan Anda telah dikirim dan sedang menunggu konfirmasi admin.</p>
          {orderId && <p className="uo-order-id">ID Pesanan: #{orderId}</p>}
          <div className="uo-success-actions">
            <button className="uo-btn uo-btn-primary" onClick={() => { setCart([]); setStep('jenjang'); setSubmitOk(false); setBuyerNama(''); setBuyerArea('') }}>Pesan Lagi</button>
            <button className="uo-btn uo-btn-secondary" onClick={() => { setSubmitOk(false); switchTab('history') }}>Lihat Pesanan</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="uo-root">
      {/* Header */}
      <header className="uo-header">
        <div className="uo-header-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/shiori-mascot.png" alt="" className="uo-header-mascot" />
          <div>
            <h1 className="uo-title">{'\u681E'} Shiori</h1>
            <p className="uo-division">{divisionName}</p>
          </div>
        </div>
        <div className="uo-header-right">
          <button className="uo-cart-btn" onClick={() => { setTab('order'); cart.length > 0 && setStep('cart') }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cartCount > 0 && <span className="uo-cart-badge">{cartCount}</span>}
          </button>
          <button className="uo-logout-btn" onClick={() => { document.cookie = 'division_session=; path=/; max-age=0'; router.push('/admin') }} title="Keluar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="uo-tabs">
        <button className={`uo-tab ${tab === 'order' ? 'uo-tab--active' : ''}`} onClick={() => switchTab('order')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          Pesan Buku
        </button>
        <button className={`uo-tab ${tab === 'history' ? 'uo-tab--active' : ''}`} onClick={() => switchTab('history')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Pesanan Saya
        </button>
      </div>

      {/* ORDER TAB */}
      {tab === 'order' && (
        <>
          {/* Steps indicator with connecting line */}
          <div className="uo-steps">
            {STEP_LIST.map((s, i) => (
              <div key={s.key} className={`uo-step ${step === s.key ? 'uo-step--active' : ''} ${stepIdx > i ? 'uo-step--done' : ''}`}>
                <div className="uo-step-dot">{stepIdx > i ? '\u2713' : i + 1}</div>
                <span className="uo-step-label">{s.label}</span>
                {i < STEP_LIST.length - 1 && <div className="uo-step-line" />}
              </div>
            ))}
          </div>

          {/* Step 1: Jenjang */}
          {step === 'jenjang' && (
            <div className="uo-content">
              <h2 className="uo-content-title">Pilih Jenjang</h2>
              <p className="uo-content-sub">Pilih jenjang pendidikan untuk melihat buku yang tersedia</p>
              <div className="lp-bookshelf">
                {Array.from({ length: Math.ceil(jenjangList.length / 5) }, (_, row) => (
                  <div key={row} className="lp-shelf-row">
                    <div className="lp-shelf-books">
                      {jenjangList.slice(row * 5, row * 5 + 5).map(j => {
                        const c = JENJANG_COLORS[j] || '#b0b0b0'
                        return (
                          <button
                            key={j}
                            className="uo-jenjang-btn"
                            onClick={() => selectJenjang(j)}
                            style={{ '--book-color': c } as React.CSSProperties}
                          >
                            <div className="lp-book">
                              <div className="lp-book-body">
                                <div className="lp-book-front">
                                  <div className="lp-book-bind" />
                                  <div className="lp-book-stripe" />
                                  <div className="lp-book-info">
                                    <div className="lp-book-bind lp-book-bind--light" />
                                    <span className="lp-book-title">{j}</span>
                                  </div>
                                  <div className="lp-book-border" />
                                </div>
                                <div className="lp-book-spine" />
                                <div className="lp-book-back" />
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <div className="lp-shelf-plank" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Books */}
          {step === 'buku' && (
            <div className="uo-content">
              <div className="uo-content-header">
                <button className="uo-back" onClick={() => { setStep('jenjang'); setBrowseStep('jenjang'); setBookSearch('') }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Kembali
                </button>
                <h2 className="uo-content-title">
                  <span className="uo-content-jenjang-dot" style={{ background: JENJANG_COLORS[selectedJenjang] || '#b0b0b0' }} />
                  Buku {selectedJenjang}
                </h2>
              </div>
              <input className="uo-search" type="search" value={bookSearch} onChange={e => setBookSearch(e.target.value)} placeholder="Cari buku..." />
              {loading ? (
                <p className="uo-loading">Memuat buku...</p>
              ) : (
                <div className="uo-book-list">
                  {books.filter(b => !bookSearch || b.bidangStudi.toLowerCase().includes(bookSearch.toLowerCase())).map(book => (
                    <div key={book.id} className="uo-book-row" style={{ '--jc': JENJANG_COLORS[book.jenjang] || '#b0b0b0' } as React.CSSProperties}>
                      <div className="uo-book-info">
                        <div className="uo-book-name">{book.bidangStudi}</div>
                        <div className="uo-book-meta">{book.kelas && <span>Kelas {book.kelas}</span>}</div>
                      </div>
                      <div className="uo-book-actions">
                        {book.hargaLks != null && book.hargaLks > 0 && (
                          <div className="uo-book-type">
                            <div className="uo-book-price">{fmt(book.hargaLks)}</div>
                            <div className="uo-qty-row">
                              <button className="uo-qty-btn" onClick={() => updateQty(book.id, 'lks', getCartQty(book.id, 'lks') - 1)}>{'\u2212'}</button>
                              <input type="number" className="uo-qty-val" value={getCartQty(book.id, 'lks') || ''} min={0} onChange={e => updateQty(book.id, 'lks', parseInt(e.target.value) || 0)} placeholder="0" />
                              <button className="uo-qty-btn" onClick={() => addToCart(book, 'lks')}>+</button>
                            </div>
                            <span className="uo-type-label" title="Lembar Kerja Siswa">LKS</span>
                          </div>
                        )}
                        {book.hargaPg != null && book.hargaPg > 0 && (
                          <div className="uo-book-type">
                            <div className="uo-book-price">{fmt(book.hargaPg)}</div>
                            <div className="uo-qty-row">
                              <button className="uo-qty-btn" onClick={() => updateQty(book.id, 'pg', getCartQty(book.id, 'pg') - 1)}>{'\u2212'}</button>
                              <input type="number" className="uo-qty-val" value={getCartQty(book.id, 'pg') || ''} min={0} onChange={e => updateQty(book.id, 'pg', parseInt(e.target.value) || 0)} placeholder="0" />
                              <button className="uo-qty-btn" onClick={() => addToCart(book, 'pg')}>+</button>
                            </div>
                            <span className="uo-type-label" title="Perangkat Guru">PG</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {cart.length > 0 && (
                <button className="uo-fab" onClick={() => setStep('cart')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  Keranjang ({cartCount}) — {fmt(subtotal)}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Cart */}
          {step === 'cart' && (
            <div className="uo-content">
              <div className="uo-content-header">
                <button className="uo-back" onClick={() => setStep(browseStep)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Kembali
                </button>
                <h2 className="uo-content-title">Keranjang</h2>
              </div>
              {cart.length === 0 ? (
                <div className="uo-empty-state">
                  <div className="uo-empty-icon">{'\uD83D\uDED2'}</div>
                  <p>Keranjang masih kosong</p>
                  <button className="uo-btn uo-btn-secondary" onClick={() => setStep('jenjang')}>Mulai Belanja</button>
                </div>
              ) : (
                <>
                  <div className="uo-cart-list">
                    {cart.map(item => (
                      <div key={`${item.book.id}-${item.jenis}`} className="uo-cart-item" style={{ '--jc': JENJANG_COLORS[item.book.jenjang] || '#b0b0b0' } as React.CSSProperties}>
                        <div className="uo-cart-item-info">
                          <div className="uo-cart-item-name">{item.book.bidangStudi}</div>
                          <div className="uo-cart-item-meta">
                            <span className="uo-cart-item-type">{item.jenis.toUpperCase()}</span>
                            <span>{fmt(getPrice(item))}</span>
                          </div>
                        </div>
                        <div className="uo-qty-row">
                          <button className="uo-qty-btn" onClick={() => updateQty(item.book.id, item.jenis, item.jumlah - 1)}>{'\u2212'}</button>
                          <input type="number" className="uo-qty-val" value={item.jumlah || ''} min={1} onChange={e => updateQty(item.book.id, item.jenis, parseInt(e.target.value) || 0)} />
                          <button className="uo-qty-btn" onClick={() => updateQty(item.book.id, item.jenis, item.jumlah + 1)}>+</button>
                        </div>
                        <div className="uo-cart-item-total">{fmt(getPrice(item) * item.jumlah)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="uo-cart-summary">
                    <div className="uo-cart-total">
                      <span>Subtotal ({cartCount} item)</span>
                      <strong>{fmt(subtotal)}</strong>
                    </div>
                    <button className="uo-btn uo-btn-primary" onClick={() => setStep('checkout')}>Lanjut ke Pengiriman</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Checkout */}
          {step === 'checkout' && (
            <div className="uo-content">
              <div className="uo-content-header">
                <button className="uo-back" onClick={() => setStep('cart')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Kembali
                </button>
                <h2 className="uo-content-title">Data Pemesan</h2>
              </div>
              <div className="uo-checkout-form">
                <div className="uo-field">
                  <label className="uo-label">Nama Pemesan</label>
                  <input className={`uo-input${touched.nama && !buyerNama.trim() ? ' uo-input--error' : ''}`} value={buyerNama} onChange={e => setBuyerNama(e.target.value)} onBlur={() => setTouched(p => ({ ...p, nama: true }))} placeholder="Nama lengkap pemesan" />
                  {touched.nama && !buyerNama.trim() && <span className="uo-field-hint">Nama pemesan wajib diisi</span>}
                </div>
                <div className="uo-field">
                  <label className="uo-label">Area / Wilayah</label>
                  <input className={`uo-input${touched.area && !buyerArea.trim() ? ' uo-input--error' : ''}`} value={buyerArea} onChange={e => setBuyerArea(e.target.value)} onBlur={() => setTouched(p => ({ ...p, area: true }))} placeholder="Contoh: Surabaya, Sidoarjo" maxLength={100} />
                  {touched.area && !buyerArea.trim() && <span className="uo-field-hint">Area / wilayah wajib diisi</span>}
                </div>
                <div className="uo-checkout-summary">
                  <h3>Ringkasan Pesanan</h3>
                  {cart.map(item => (
                    <div key={`${item.book.id}-${item.jenis}`} className="uo-checkout-line">
                      <span>{item.book.bidangStudi} ({item.jenis.toUpperCase()}) {'\u00D7'} {item.jumlah}</span>
                      <span>{fmt(getPrice(item) * item.jumlah)}</span>
                    </div>
                  ))}
                  <div className="uo-checkout-total">
                    <span>Total</span>
                    <strong>{fmt(subtotal)}</strong>
                  </div>
                </div>
                {submitError && <div className="uo-toast-error">{submitError}</div>}
                <button className="uo-btn uo-btn-primary" onClick={handleSubmit} disabled={submitting || !buyerNama.trim() || !buyerArea.trim()}>
                  {submitting ? 'Mengirim...' : 'Kirim Pesanan'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="uo-content">
          <h2 className="uo-content-title">Pesanan Saya</h2>
          <p className="uo-content-sub">Riwayat pesanan dari divisi Anda</p>
          {ordersLoading ? (
            <p className="uo-loading">Memuat pesanan...</p>
          ) : orders.length === 0 ? (
            <div className="uo-empty-state">
              <div className="uo-empty-icon">{'\uD83D\uDCCB'}</div>
              <p>Belum ada pesanan</p>
            </div>
          ) : (
            <div className="uo-orders-list">
              {orders.map(order => (
                <div key={order.id} className="uo-order-card">
                  <div className="uo-order-header">
                    <div>
                      <div className="uo-order-nota">{order.nomorNota}</div>
                      <div className="uo-order-date">{fmtDate(order.tanggal)}</div>
                    </div>
                    <span className={`uo-order-status uo-order-status--${order.status}`}>
                      {order.status === 'confirmed' ? '\u2713 Dikonfirmasi' : '\u23F3 Menunggu'}
                    </span>
                  </div>
                  <div className="uo-order-buyer">
                    <span>{order.buyer.nama}</span>
                    <span className="uo-order-area">{order.buyer.area}</span>
                  </div>
                  <div className="uo-order-items">
                    {order.items.slice(0, 3).map(item => (
                      <div key={item.id} className="uo-order-item-line">
                        <span>{item.book.bidangStudi} {'\u00D7'} {item.jumlah}</span>
                        <span>{fmt(item.totalHarga)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="uo-order-more">+{order.items.length - 3} item lainnya</div>
                    )}
                  </div>
                  <div className="uo-order-footer">
                    <div className="uo-order-total">
                      <span>Total</span>
                      <strong>{fmt(order.netto)}</strong>
                    </div>
                    {order.status === 'confirmed' && (
                      <Link href={`/user/order/nota/${order.id}`} className="uo-btn uo-btn-nota">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Lihat Nota
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
