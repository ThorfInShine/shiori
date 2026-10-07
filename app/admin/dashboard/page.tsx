'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Book = {
  id: number
  bidangStudi: string
  jenjang: string
  kelas: string | null
  hargaLks: number | null
  hargaPg: number | null
}

type Order = {
  id: number
  nomorNota: string
  tanggal: string
  subtotal: number
  netto: number
  status: string
  jenjangFilter: string | null
  buyer: { nama: string; area: string }
  items: Array<{ jumlah: number; totalHarga: number; book: { bidangStudi: string; jenjang: string } }>
}

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
}

function drawChart(canvas: HTMLCanvasElement, orders: Order[]) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  const w = rect.width, h = rect.height
  const pad = { top: 24, right: 16, bottom: 28, left: 48 }
  const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom

  const dailyMap = new Map<string, number>()
  orders.forEach(o => {
    const day = new Date(o.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
    dailyMap.set(day, (dailyMap.get(day) || 0) + o.netto)
  })
  const labels = Array.from(dailyMap.keys()).slice(-12)
  const data = labels.map(l => dailyMap.get(l) || 0)
  const maxVal = Math.max(...data, 100000)

  ctx.fillStyle = '#b5a094'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right'
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal / 4) * i
    const y = pad.top + ch - (ch * val) / maxVal
    ctx.fillText((val / 1000).toFixed(0) + 'k', pad.left - 8, y + 4)
    ctx.strokeStyle = 'rgba(210,170,150,0.12)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke()
  }
  ctx.textAlign = 'center'
  labels.forEach((l, i) => {
    ctx.fillText(l, pad.left + (cw / Math.max(labels.length - 1, 1)) * i, h - 6)
  })
  if (!data.length) return
  const pts: [number, number][] = data.map((v, i) => [
    pad.left + (cw / Math.max(data.length - 1, 1)) * i,
    pad.top + ch - (ch * v) / maxVal
  ])
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch)
  grad.addColorStop(0, 'rgba(212,128,138,0.3)'); grad.addColorStop(1, 'rgba(212,128,138,0.02)')
  ctx.beginPath(); ctx.moveTo(pts[0][0], pad.top + ch)
  pts.forEach(([x, y], i) => {
    if (i === 0) ctx.lineTo(x, y)
    else { const cx = (pts[i-1][0] + x) / 2; ctx.bezierCurveTo(cx, pts[i-1][1], cx, y, x, y) }
  })
  ctx.lineTo(pts[pts.length-1][0], pad.top + ch); ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
  ctx.beginPath()
  pts.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y)
    else { const cx = (pts[i-1][0] + x) / 2; ctx.bezierCurveTo(cx, pts[i-1][1], cx, y, x, y) }
  })
  ctx.strokeStyle = '#d4808a'; ctx.lineWidth = 2.5; ctx.stroke()
  pts.forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#d4808a'; ctx.fill()
    ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke()
  })
}

type Tab = 'dashboard' | 'pesanan' | 'katalog' | 'pengaturan' | 'akun'

const JENJANG_COLORS: Record<string, string> = {
  SD: '#D4808A', SMP: '#7BA8C4', SMA: '#E8D070', SMK: '#C94C4C',
  MADRASAH: '#B0A0C8', 'AKM & P5': '#7BA784', PROD: '#E89668',
  TKA: '#D4A86A', 'ASAJ UM': '#8BAAB0', 'JURNAL & TK': '#C4A0B0',
  MTS: '#9BB09B', MI: '#C4A070',
}

const navItems: { icon: string; label: string; sub: string; tab: Tab }[] = [
  { icon: '/assets/icon-dashboard.png', label: 'Dasbor', sub: 'ダッシュボード', tab: 'dashboard' },
  { icon: '/assets/icon-books.png', label: 'Katalog', sub: '書籍一覧', tab: 'katalog' },
  { icon: '/assets/icon-orders.png', label: 'Pesanan', sub: '注文管理', tab: 'pesanan' },
  { icon: '/assets/icon-customers.png', label: 'Akun', sub: 'アカウント', tab: 'akun' },
  { icon: '/assets/icon-settings.png', label: 'Pengaturan', sub: '設定', tab: 'pengaturan' },
]

const statCards = [
  { title: 'Buku Terdaftar', sub: '登録書籍', icon: '/assets/icon-registered-books.png', key: 'books' },
  { title: 'Pesanan Baru', sub: '新着注文', icon: '/assets/icon-new-orders.png', key: 'orders' },
  { title: 'Pendapatan Hari Ini', sub: '本日の売上', icon: '/assets/icon-revenue.png', key: 'revenue' },
  { title: 'Pengguna Aktif', sub: 'アクティブユーザー', icon: '/assets/icon-users.png', key: 'users' },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [activeNavIdx, setActiveNavIdx] = useState(0)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogJenjang, setCatalogJenjang] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)

  // Account management state
  type AccAdmin = { id: number; username: string; createdAt: string }
  type AccDiv = { id: number; namaDivisi: string; username: string; createdAt: string }
  const [accAdmins, setAccAdmins] = useState<AccAdmin[]>([])
  const [accDivisions, setAccDivisions] = useState<AccDiv[]>([])
  const [accLoading, setAccLoading] = useState(false)
  const [accMsg, setAccMsg] = useState('')
  const [accForm, setAccForm] = useState<{ type: 'admin' | 'division'; username: string; password: string; namaDivisi: string }>({ type: 'division', username: '', password: '', namaDivisi: '' })
  const [resetTarget, setResetTarget] = useState<{ type: 'admin' | 'division'; id: number; username: string } | null>(null)
  const [resetPw, setResetPw] = useState('')

  const loadAccounts = () => {
    setAccLoading(true)
    fetch('/api/admin/accounts').then(r => r.json()).then(d => {
      setAccAdmins(d.admins || [])
      setAccDivisions(d.divisions || [])
      setAccLoading(false)
    }).catch(() => setAccLoading(false))
  }

  const fetchData = useRef<() => void>(() => {})
  fetchData.current = () => {
    const ac = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/api/orders', { signal: ac.signal }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }),
      fetch('/api/books', { signal: ac.signal }).then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json() }),
    ]).then(([ordersData, booksData]) => {
      setOrders(ordersData)
      setBooks(booksData)
      setLoading(false)
      setTimeout(() => { if (chartRef.current) drawChart(chartRef.current, ordersData) }, 100)
    }).catch(e => {
      if (e.name !== 'AbortError') { setError('Gagal memuat data. Periksa koneksi Anda.'); setLoading(false) }
    })
    return () => ac.abort()
  }

  useEffect(() => {
    const cleanup = fetchData.current()
    return cleanup
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setTimeout(() => { if (chartRef.current) drawChart(chartRef.current, orders) }, 50)
    }
    if (activeTab === 'akun') loadAccounts()
  }, [activeTab, orders])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { if (chartRef.current && activeTab === 'dashboard') drawChart(chartRef.current, orders) }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => { clearTimeout(timer); window.removeEventListener('resize', onResize) }
  }, [orders, activeTab])

  const totalNetto = orders.reduce((s, o) => s + o.netto, 0)
  const totalEks = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.jumlah, 0), 0)
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const pending = orders.filter(o => o.status === 'pending').length

  const confirmOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) })
      if (res.ok) setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'confirmed' } : o))
    } catch { /* noop */ }
  }

  const bookSales = new Map<string, number>()
  const bookJenjang = new Map<string, string>()
  orders.forEach(o => o.items.forEach(i => {
    bookSales.set(i.book.bidangStudi, (bookSales.get(i.book.bidangStudi) || 0) + i.jumlah)
    if (!bookJenjang.has(i.book.bidangStudi)) bookJenjang.set(i.book.bidangStudi, i.book.jenjang)
  }))
  const bestSellers = Array.from(bookSales.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  function getStatValue(key: string) {
    switch (key) {
      case 'books': return { val: books.length.toLocaleString('id-ID'), unit: 'buku' }
      case 'orders': return { val: String(orders.length), unit: 'total' }
      case 'revenue': return { val: formatRp(totalNetto), unit: '' }
      case 'users': return { val: String(confirmed + pending), unit: '' }
      default: return { val: '0', unit: '' }
    }
  }

  function handleNav(idx: number) {
    setActiveNavIdx(idx)
    setActiveTab(navItems[idx].tab)
    setSidebarOpen(false)
  }

  return (
    <div className="db-root">
      {/* Backdrop */}
      {sidebarOpen && <div className="db-backdrop" onClick={() => setSidebarOpen(false)} />}
      {/* ===== SIDEBAR ===== */}
      <aside className={`db-sidebar${sidebarOpen ? ' db-sidebar--open' : ''}`}>
        {/* Red accent bar */}
        <div className="db-sidebar-accent" />

        {/* Sidebar inner content */}
        <div className="db-sidebar-inner">
          {/* Logo */}
          <div className="db-sidebar-top">
            <div className="db-brand-cols">
              <span className="db-brand-col">SHIORI</span>
              <span className="db-brand-col brand-red">BOOKS</span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/shiori-mascot.png" alt="Shiori" className="db-logo-mascot" />
          </div>

          {/* Nav */}
          <nav className="db-nav">
            {navItems.map((item, idx) => (
              <button
                key={item.label}
                className={`db-nav-btn${activeNavIdx === idx ? ' active' : ''}`}
                onClick={() => handleNav(idx)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt="" className="db-nav-ico" />
                <div className="db-nav-txt">
                  <span className="db-nav-lbl">{item.label}</span>
                  <span className="db-nav-jp">{item.sub}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Decorative elements at bottom */}
          <div className="db-sidebar-deco">
            {/* Lantern - large, left side */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icon-users.png" alt="" className="db-sidebar-lantern" />

          </div>
          {/* Seigaiha wave - div with background-image for proper tiling */}
          <div className="db-sidebar-wave" />
        </div>
        {/* Cloud - outside inner to avoid overflow:hidden clipping */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/deco-cloud.png" alt="" className="db-sidebar-cloud" />
      </aside>

      {/* ===== MAIN ===== */}
      <main className="db-main">
        {/* Top bar */}
        <header className="db-topbar">
          <div className="db-topbar-brand">
            <button className="db-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/shiori-mascot.png" alt="" className="db-topbar-mascot" />
            <h1 className="db-title">栞 Shiori <span className="db-title-full">Dashboard</span></h1>
          </div>
          <div className="db-topbar-actions">
            <Link href="/" className="db-home-btn">🏠 Beranda</Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icon-notification.png" alt="Notif" className="db-notif-icon" />
            <div className="db-user-wrap">
              <button className="db-user-pill" onClick={() => setShowUserMenu(v => !v)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/avatar-admin.png" alt="Admin" className="db-user-avatar" />
                <span>Admin</span>
                <span className="db-chevron">▾</span>
              </button>
              {showUserMenu && (
                <>
                  <div className="db-user-backdrop" onClick={() => setShowUserMenu(false)} />
                  <div className="db-user-menu">
                    <button className="db-user-menu-item" onClick={() => { document.cookie = 'admin_session=; path=/; max-age=0'; router.push('/admin') }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content wrapper */}
        <div className="db-content-wrap">

            {/* Loading state */}
            {loading && (
              <div className="db-loading">
                <div className="db-loading-spinner" />
                <p>Memuat data...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="db-error">
                <p>{error}</p>
                <button className="db-sm-btn" onClick={() => fetchData.current()}>Coba lagi</button>
              </div>
            )}

            {/* ===== DASHBOARD ===== */}
            {!loading && !error && activeTab === 'dashboard' && (
              <>
                <div className="db-welcome-row">
                  <p className="db-welcome">Selamat Datang, Admin! ｜ <span>おかえりなさい！</span></p>
                </div>

                <div className="db-stat-grid">
                  {statCards.map(s => {
                    const { val, unit } = getStatValue(s.key)
                    return (
                      <div key={s.key} className="db-stat">
                        <div className="db-stat-left">
                          <div className="db-stat-title">{s.title}</div>
                          <div className="db-stat-jp">{s.sub}</div>
                          <div className="db-stat-val">{val}<small>{unit && ` ${unit}`}</small></div>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.icon} alt="" className="db-stat-img" />
                      </div>
                    )
                  })}
                </div>

                <div className="db-sales-row">
                  <div className="db-panel db-sales-panel">
                    <div className="db-panel-head">
                      <h3>Performa Penjualan <span>(売上推移)</span></h3>
                      <span className="db-panel-badge">30 hari terakhir ▾</span>
                    </div>
                    <div style={{ width: '100%', height: 220, position: 'relative' }}>
                      <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
                    </div>
                  </div>

                  <div className="db-panel db-bestseller">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/deco-cloud.png" alt="" className="db-best-cloud" />
                    <h3>Buku Terlaris</h3>
                    <p className="db-best-jp">ベストセラー</p>
                    <div className="db-best-list">
                      {bestSellers.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada data</p>}
                      {bestSellers.map(([name, qty], i) => {
                        const j = bookJenjang.get(name) || ''
                        const c = JENJANG_COLORS[j] || '#b0b0b0'
                        return (
                          <div key={name} className="db-best-item">
                            <div className="db-best-rank">#{i + 1}</div>
                            <div className="db-best-book" style={{ '--bk': c } as React.CSSProperties}>
                              <div className="db-best-book-spine" />
                              <div className="db-best-book-front">
                                <div className="db-best-book-stripe" />
                              </div>
                            </div>
                            <div className="db-best-info">
                              <div className="db-best-name">{name}</div>
                              <div className="db-best-qty">{qty} terjual</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="db-panel db-orders-panel">
                    <div className="db-panel-head">
                      <h3>Pesanan Terbaru</h3>
                    </div>
                    <table className="db-tbl">
                      <thead>
                        <tr><th>ID Pesanan</th><th>Pelanggan</th><th>Buku</th><th>Tanggal</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 && <tr><td colSpan={5} className="db-tbl-empty">Belum ada pesanan</td></tr>}
                        {orders.slice(0, 6).map(o => (
                          <tr key={o.id} onClick={() => window.location.href = `/admin/dashboard/nota/${o.id}`} style={{ cursor: 'pointer' }}>
                            <td className="db-tbl-id">{o.nomorNota}</td>
                            <td>{o.buyer.nama}</td>
                            <td>{o.items[0]?.book.bidangStudi || '-'}</td>
                            <td>{formatDate(o.tanggal)}</td>
                            <td>
                              <span className={`db-status ${o.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                                {o.status === 'confirmed' ? 'Terkirim' : 'Menunggu'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ===== PESANAN ===== */}
            {!loading && !error && activeTab === 'pesanan' && (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Daftar Pesanan</h3>
                </div>
                <div className="db-panel">
                  <table className="db-tbl">
                    <thead>
                      <tr>
                        <th>No</th><th>Nota</th><th>Pembeli</th><th>Area</th><th>Jenjang</th><th>Eks</th><th>Subtotal</th><th>Netto</th><th>Status</th><th>Tanggal</th><th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 && <tr><td colSpan={11} className="db-tbl-empty">Belum ada pesanan</td></tr>}
                      {orders.map((o, i) => (
                        <tr key={o.id}>
                          <td>{i + 1}</td>
                          <td className="db-tbl-id">#{o.nomorNota}</td>
                          <td>{o.buyer.nama}</td>
                          <td>{o.buyer.area}</td>
                          <td>{o.jenjangFilter || '-'}</td>
                          <td style={{ textAlign: 'center' }}>{o.items.reduce((s, it) => s + it.jumlah, 0)}</td>
                          <td className="db-tbl-money">{formatRp(o.subtotal)}</td>
                          <td className="db-tbl-money" style={{ fontWeight: 700 }}>{formatRp(o.netto)}</td>
                          <td>
                            <span className={`db-status ${o.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                              {o.status === 'confirmed' ? '✓ Dikonfirmasi' : '⏳ Pending'}
                            </span>
                          </td>
                          <td>{formatDate(o.tanggal)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {o.status === 'pending' && <button className="db-sm-btn db-sm-btn--confirm" onClick={() => confirmOrder(o.id)}>✓ Konfirmasi</button>}
                              <button className="db-sm-btn" onClick={() => window.location.href = `/admin/dashboard/nota/${o.id}`}>📄 Nota</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ===== KATALOG ===== */}
            {!loading && !error && activeTab === 'katalog' && (() => {
              const q = catalogSearch.toLowerCase()
              const jenjangList = Array.from(new Set(books.map(b => b.jenjang))).sort()
              const filtered = books.filter(b =>
                (!q || b.bidangStudi.toLowerCase().includes(q)) &&
                (!catalogJenjang || b.jenjang === catalogJenjang)
              )
              return (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Katalog Buku <span>— {filtered.length} buku</span></h3>
                </div>
                <div className="db-catalog-toolbar">
                  <div className="db-catalog-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input
                      type="text"
                      placeholder="Cari bidang studi..."
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="db-catalog-filter"
                    value={catalogJenjang}
                    onChange={e => setCatalogJenjang(e.target.value)}
                  >
                    <option value="">Semua Jenjang</option>
                    {jenjangList.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div className="db-panel">
                  <table className="db-tbl">
                    <thead>
                      <tr><th>No</th><th>Bidang Studi</th><th>Jenjang</th><th>Kelas</th><th>Harga LKS</th><th>Harga PG</th></tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && <tr><td colSpan={6} className="db-tbl-empty">Tidak ada buku ditemukan</td></tr>}
                      {filtered.slice(0, 50).map((b, i) => (
                        <tr key={b.id}>
                          <td>{i + 1}</td>
                          <td>{b.bidangStudi}</td>
                          <td>{b.jenjang}</td>
                          <td style={{ textAlign: 'center' }}>{b.kelas || '-'}</td>
                          <td className="db-tbl-money">{b.hargaLks ? formatRp(b.hargaLks) : '-'}</td>
                          <td className="db-tbl-money">{b.hargaPg ? formatRp(b.hargaPg) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 50 && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>Menampilkan 50 dari {filtered.length} buku</p>}
                </div>
              </>
              )
            })()}

            {/* ===== AKUN ===== */}
            {!loading && !error && activeTab === 'akun' && (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Manajemen Akun</h3>
                </div>

                {accMsg && <div className="db-acc-msg" onClick={() => setAccMsg('')}>{accMsg}</div>}

                {/* Create form */}
                <div className="db-panel" style={{ padding: 20, marginBottom: 16 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-brown)', marginBottom: 12 }}>Buat Akun Baru</h4>
                  <div className="db-acc-form">
                    <div className="db-acc-row">
                      <select className="db-acc-input" value={accForm.type} onChange={e => setAccForm(f => ({ ...f, type: e.target.value as 'admin' | 'division' }))}>
                        <option value="division">Divisi (User)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {accForm.type === 'division' && (
                      <div className="db-acc-row">
                        <input className="db-acc-input" placeholder="Nama Divisi" value={accForm.namaDivisi} onChange={e => setAccForm(f => ({ ...f, namaDivisi: e.target.value }))} />
                      </div>
                    )}
                    <div className="db-acc-row">
                      <input className="db-acc-input" placeholder="Username" value={accForm.username} onChange={e => setAccForm(f => ({ ...f, username: e.target.value }))} />
                    </div>
                    <div className="db-acc-row">
                      <input className="db-acc-input" type="password" placeholder="Password" value={accForm.password} onChange={e => setAccForm(f => ({ ...f, password: e.target.value }))} />
                    </div>
                    <button className="db-acc-btn db-acc-btn-primary" onClick={async () => {
                      const res = await fetch('/api/admin/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(accForm) })
                      const d = await res.json()
                      if (d.ok) { setAccMsg('Akun berhasil dibuat!'); setAccForm({ type: 'division', username: '', password: '', namaDivisi: '' }); loadAccounts() }
                      else setAccMsg(d.error || 'Gagal membuat akun')
                    }}>Buat Akun</button>
                  </div>
                </div>

                {accLoading ? <p className="uo-loading">Memuat...</p> : (
                  <>
                    {/* Admin list */}
                    <div className="db-panel" style={{ padding: 20, marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-brown)', marginBottom: 12 }}>
                        Akun Admin <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({accAdmins.length})</span>
                      </h4>
                      {accAdmins.map(a => (
                        <div key={a.id} className="db-acc-item">
                          <div>
                            <div className="db-acc-item-name">{a.username}</div>
                            <div className="db-acc-item-meta">Admin</div>
                          </div>
                          <button className="db-acc-btn db-acc-btn-reset" onClick={() => { setResetTarget({ type: 'admin', id: a.id, username: a.username }); setResetPw('') }}>Reset Password</button>
                        </div>
                      ))}
                    </div>

                    {/* Division list */}
                    <div className="db-panel" style={{ padding: 20 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-brown)', marginBottom: 12 }}>
                        Akun Divisi <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({accDivisions.length})</span>
                      </h4>
                      {accDivisions.map(d => (
                        <div key={d.id} className="db-acc-item">
                          <div>
                            <div className="db-acc-item-name">{d.namaDivisi}</div>
                            <div className="db-acc-item-meta">@{d.username}</div>
                          </div>
                          <button className="db-acc-btn db-acc-btn-reset" onClick={() => { setResetTarget({ type: 'division', id: d.id, username: d.username }); setResetPw('') }}>Reset Password</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Reset password modal */}
                {resetTarget && (
                  <>
                    <div className="db-user-backdrop" onClick={() => setResetTarget(null)} />
                    <div className="db-acc-modal">
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-brown)', marginBottom: 4 }}>Reset Password</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Akun: <strong>{resetTarget.username}</strong></p>
                      <input className="db-acc-input" type="password" placeholder="Password baru" value={resetPw} onChange={e => setResetPw(e.target.value)} style={{ marginBottom: 12 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="db-acc-btn db-acc-btn-primary" onClick={async () => {
                          if (!resetPw.trim()) return
                          const res = await fetch('/api/admin/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: resetTarget.type, id: resetTarget.id, password: resetPw }) })
                          const d = await res.json()
                          if (d.ok) { setAccMsg('Password berhasil direset!'); setResetTarget(null) }
                          else setAccMsg(d.error || 'Gagal reset password')
                        }}>Simpan</button>
                        <button className="db-acc-btn" style={{ background: 'rgba(210,170,150,0.15)', color: 'var(--accent-brown)' }} onClick={() => setResetTarget(null)}>Batal</button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ===== PENGATURAN ===== */}
            {!loading && !error && activeTab === 'pengaturan' && (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Pengaturan</h3>
                </div>
                <div className="db-panel" style={{ padding: 24, textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Fitur pengaturan sedang dalam pengembangan.</p>
                  <button className="db-sm-btn" onClick={() => setActiveTab('akun')}>Kelola Akun</button>
                </div>
              </>
            )}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="db-bottom-nav">
        {([
          { icon: '/assets/icon-dashboard.png', label: 'Dasbor', tab: 'dashboard' as Tab },
          { icon: '/assets/icon-books.png', label: 'Katalog', tab: 'katalog' as Tab },
          { icon: '/assets/icon-orders.png', label: 'Pesanan', tab: 'pesanan' as Tab },
          { icon: '/assets/icon-customers.png', label: 'Akun', tab: 'akun' as Tab },
          { icon: '/assets/icon-settings.png', label: 'Lainnya', tab: 'pengaturan' as Tab },
        ]).map(item => (
          <button
            key={item.tab}
            className={`db-bottom-tab${activeTab === item.tab ? ' db-bottom-tab--active' : ''}`}
            onClick={() => setActiveTab(item.tab)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.icon} alt="" className="db-bottom-tab-ico" />
            <span className="db-bottom-tab-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
