'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

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
  items: Array<{ jumlah: number; totalHarga: number; book: { bidangStudi: string } }>
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

type Tab = 'dashboard' | 'pesanan' | 'katalog' | 'pengaturan'

const navItems: { icon: string; label: string; sub: string; tab: Tab }[] = [
  { icon: '/assets/Screenshot 2026-09-28 234844.png', label: 'Dashboard', sub: 'ダッシュボード', tab: 'dashboard' },
  { icon: '/assets/Screenshot 2026-09-28 234951.png', label: 'Books', sub: '書籍一覧', tab: 'katalog' },
  { icon: '/assets/Screenshot 2026-09-28 235034.png', label: 'Orders', sub: '注文管理', tab: 'pesanan' },
  { icon: '/assets/Screenshot 2026-09-28 235317.png', label: 'Customers', sub: '顧客リスト', tab: 'pesanan' },
  { icon: '/assets/Screenshot 2026-09-28 235452.png', label: 'Sales', sub: '売上分析', tab: 'dashboard' },
  { icon: '/assets/Screenshot 2026-09-28 235127.png', label: 'Promotions', sub: 'キャンペーン', tab: 'pengaturan' },
  { icon: '/assets/Screenshot 2026-09-28 235823.png', label: 'Settings', sub: '設定', tab: 'pengaturan' },
]

const statCards = [
  { title: 'Registered Books', sub: '登録書籍', icon: '/assets/Screenshot 2026-09-29 103503.png', key: 'books' },
  { title: 'New Orders', sub: '新着注文', icon: '/assets/Screenshot 2026-09-29 102944.png', key: 'orders' },
  { title: 'Daily Revenue', sub: '本日の売上', icon: '/assets/Screenshot 2026-09-29 103136.png', key: 'revenue' },
  { title: 'Active Users', sub: 'アクティブユーザー', icon: '/assets/Screenshot 2026-09-29 102900.png', key: 'users' },
]

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [activeNavIdx, setActiveNavIdx] = useState(0)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogJenjang, setCatalogJenjang] = useState('')
  const chartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(data => {
      setOrders(data)
      setTimeout(() => { if (chartRef.current) drawChart(chartRef.current, data) }, 100)
    })
    fetch('/api/books').then(r => r.json()).then(setBooks)
  }, [])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      setTimeout(() => { if (chartRef.current) drawChart(chartRef.current, orders) }, 50)
    }
  }, [activeTab, orders])

  useEffect(() => {
    const onResize = () => { if (chartRef.current && activeTab === 'dashboard') drawChart(chartRef.current, orders) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [orders, activeTab])

  const totalNetto = orders.reduce((s, o) => s + o.netto, 0)
  const totalEks = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.jumlah, 0), 0)
  const confirmed = orders.filter(o => o.status === 'confirmed').length
  const pending = orders.filter(o => o.status === 'pending').length

  const bookSales = new Map<string, number>()
  orders.forEach(o => o.items.forEach(i => {
    bookSales.set(i.book.bidangStudi, (bookSales.get(i.book.bidangStudi) || 0) + i.jumlah)
  }))
  const bestSellers = Array.from(bookSales.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  function getStatValue(key: string) {
    switch (key) {
      case 'books': return { val: books.length.toLocaleString('id-ID'), unit: 'books' }
      case 'orders': return { val: String(orders.length), unit: 'total' }
      case 'revenue': return { val: formatRp(totalNetto), unit: '' }
      case 'users': return { val: String(confirmed + pending), unit: '' }
      default: return { val: '0', unit: '' }
    }
  }

  function handleNav(idx: number) {
    setActiveNavIdx(idx)
    setActiveTab(navItems[idx].tab)
  }

  return (
    <div className="db-root">
      {/* ===== SIDEBAR ===== */}
      <aside className="db-sidebar">
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
            <img src="/assets/Screenshot 2026-09-28 234611.png" alt="Shiori" className="db-logo-mascot" />
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
            <img src="/assets/Screenshot 2026-09-29 102900.png" alt="" className="db-sidebar-lantern" />

          </div>
          {/* Seigaiha wave - div with background-image for proper tiling */}
          <div className="db-sidebar-wave" />
        </div>
        {/* Cloud - outside inner to avoid overflow:hidden clipping */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/Screenshot 2026-09-29 153513.png" alt="" className="db-sidebar-cloud" />
      </aside>

      {/* ===== MAIN ===== */}
      <main className="db-main">
        {/* Top bar */}
        <header className="db-topbar">
          <h1 className="db-title">栞 Shiori Dashboard</h1>
          <div className="db-topbar-actions">
            <Link href="/" className="db-home-btn">🏠 Beranda</Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/Screenshot 2026-09-29 000844.png" alt="Notif" className="db-notif-icon" />
            <div className="db-user-pill">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/Screenshot 2026-09-29 103640.png" alt="Admin" className="db-user-avatar" />
              <span>Admin</span>
              <span className="db-chevron">▾</span>
            </div>
          </div>
        </header>

        {/* Content wrapper */}
        <div className="db-content-wrap">

            {/* ===== DASHBOARD ===== */}
            {activeTab === 'dashboard' && (
              <>
                <div className="db-welcome-row">
                  <p className="db-welcome">Welcome Back, Admin! ｜ <span>おかえりなさい！</span></p>
                  <div className="db-search">
                    <span>🔍</span>
                    <input type="text" placeholder="Search..." />
                  </div>
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
                      <h3>Sales Performance <span>(売上推移)</span></h3>
                      <span className="db-panel-badge">Last 30 days ▾</span>
                    </div>
                    <div style={{ width: '100%', height: 220, position: 'relative' }}>
                      <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
                    </div>
                  </div>

                  <div className="db-panel db-bestseller">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/Screenshot 2026-09-29 153513.png" alt="" className="db-best-cloud" />
                    <h3>Best Selling Books</h3>
                    <p className="db-best-jp">ベストセラー</p>
                    <div className="db-best-list">
                      {bestSellers.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada data</p>}
                      {bestSellers.map(([name, qty], i) => (
                        <div key={name} className="db-best-item">
                          <div className="db-best-rank">#{i + 1}</div>
                          <div className="db-best-cover" />
                          <div className="db-best-info">
                            <div className="db-best-name">{name}</div>
                            <div className="db-best-qty">#{qty} sales</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="db-panel db-orders-panel">
                    <div className="db-panel-head">
                      <h3>Recent Orders <span>(最新の注文)</span></h3>
                    </div>
                    <table className="db-tbl">
                      <thead>
                        <tr><th>Order ID</th><th>Customer</th><th>Book Title</th><th>Date</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 && <tr><td colSpan={5} className="db-tbl-empty">Belum ada pesanan</td></tr>}
                        {orders.slice(0, 6).map(o => (
                          <tr key={o.id} onClick={() => window.location.href = `/order/${o.id}/nota`} style={{ cursor: 'pointer' }}>
                            <td className="db-tbl-id">{o.nomorNota}</td>
                            <td>{o.buyer.nama}</td>
                            <td>{o.items[0]?.book.bidangStudi || '-'}</td>
                            <td>{formatDate(o.tanggal)}</td>
                            <td>
                              <span className={`db-status ${o.status === 'confirmed' ? 'confirmed' : 'pending'}`}>
                                {o.status === 'confirmed' ? 'Shipped' : 'Pending'}
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
            {activeTab === 'pesanan' && (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Daftar Pesanan <span>(注文管理)</span></h3>
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
                          <td><button className="db-sm-btn" onClick={() => window.location.href = `/order/${o.id}/nota`}>📄 Nota</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ===== KATALOG ===== */}
            {activeTab === 'katalog' && (() => {
              const q = catalogSearch.toLowerCase()
              const jenjangList = Array.from(new Set(books.map(b => b.jenjang))).sort()
              const filtered = books.filter(b =>
                (!q || b.bidangStudi.toLowerCase().includes(q)) &&
                (!catalogJenjang || b.jenjang === catalogJenjang)
              )
              return (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Katalog Buku <span>(書籍一覧) — {filtered.length} buku</span></h3>
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

            {/* ===== PENGATURAN ===== */}
            {activeTab === 'pengaturan' && (
              <>
                <div className="db-panel-head" style={{ marginBottom: 16 }}>
                  <h3>Pengaturan <span>(設定)</span></h3>
                </div>
                <div className="db-panel" style={{ padding: 24 }}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Potongan Default (%)</label>
                    <input className="input" type="number" defaultValue={10} style={{ maxWidth: 200 }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Nama Perusahaan</label>
                    <input className="input" defaultValue="CV PUTRA NUGRAHA" style={{ maxWidth: 400 }} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Alamat</label>
                    <input className="input" defaultValue="Jl. Merapi Raya No 17 Mojosongo Jebres Solo" style={{ maxWidth: 400 }} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>* Pengaturan ini saat ini hanya tampilan preview</p>
                </div>
              </>
            )}
        </div>
      </main>
    </div>
  )
}
