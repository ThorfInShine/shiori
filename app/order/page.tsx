'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

type Book = {
  id: number
  bidangStudi: string
  jenjang: string
  kelas: string | null
  halaman: number | null
  hargaLks: number | null
  hargaPg: number | null
  halPg: number | null
  jenis: string | null
}

type CartItem = { bookId: number; jumlah: number; tipe: 'lks' | 'pg' }

function formatRp(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function OrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jenjang = searchParams.get('jenjang') || ''

  const [books, setBooks] = useState<Book[]>([])
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map())
  const [nama, setNama] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'review'>('select')

  useEffect(() => {
    fetch(`/api/books?jenjang=${encodeURIComponent(jenjang)}`)
      .then(r => r.json())
      .then(setBooks)
  }, [jenjang])

  const updateCart = (bookId: number, tipe: 'lks' | 'pg', jumlah: number) => {
    const key = `${bookId}-${tipe}`
    const next = new Map(cart)
    if (jumlah <= 0) {
      next.delete(key)
    } else {
      next.set(key, { bookId, jumlah, tipe })
    }
    setCart(next)
  }

  const getQty = (bookId: number, tipe: 'lks' | 'pg') => {
    return cart.get(`${bookId}-${tipe}`)?.jumlah || 0
  }

  const cartItems = Array.from(cart.values()).filter(c => c.jumlah > 0)
  const cartBooks = cartItems.map(c => {
    const book = books.find(b => b.id === c.bookId)!
    const harga = c.tipe === 'pg' ? (book?.hargaPg || 0) : (book?.hargaLks || 0)
    return { ...c, book, harga, total: harga * c.jumlah }
  })
  const subtotal = cartBooks.reduce((s, c) => s + c.total, 0)
  const potongan = Math.round(subtotal * 0.1)
  const netto = subtotal - potongan

  const handleSubmit = async () => {
    if (!nama.trim() || !area.trim()) return alert('Isi nama dan area terlebih dahulu')
    if (!cartItems.length) return alert('Belum ada item yang dipesan')
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: nama.trim(),
          area: area.trim(),
          jenjangFilter: jenjang,
          items: cartItems,
          potonganPersen: 10,
        }),
      })
      const order = await res.json()
      if (order.id) {
        router.push(`/order/${order.id}/nota`)
      }
    } catch {
      alert('Gagal membuat pesanan')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'review') {
    return (
      <div className="order-page">
        <div className="order-header">
          <Image src="/assets/Screenshot 2026-09-28 234611.png" alt="Logo" width={48} height={48} />
          <h1>Rekap Pesanan</h1>
          <button className="back-link btn btn-outline btn-sm" onClick={() => setStep('select')}>
            ← Kembali
          </button>
        </div>

        <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="order-form-row">
            <div className="form-group">
              <label>Nama</label>
              <input className="input" value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama pembeli" />
            </div>
            <div className="form-group">
              <label>Area</label>
              <input className="input" value={area} onChange={e => setArea(e.target.value)} placeholder="Area / kota" />
            </div>
          </div>
        </div>

        <div className="glass-card books-table-wrap" style={{ padding: 20 }}>
          <table className="books-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Bidang Studi</th>
                <th>Kelas</th>
                <th>Tipe</th>
                <th>Jumlah</th>
                <th>Harga</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cartBooks.map((c, i) => (
                <tr key={`${c.bookId}-${c.tipe}`}>
                  <td>{i + 1}</td>
                  <td>{c.book?.bidangStudi}</td>
                  <td style={{ textAlign: 'center' }}>{c.book?.kelas || '-'}</td>
                  <td style={{ textAlign: 'center' }}>{c.tipe.toUpperCase()}</td>
                  <td style={{ textAlign: 'center' }}>{c.jumlah}</td>
                  <td style={{ textAlign: 'right' }}>{formatRp(c.harga)}</td>
                  <td style={{ textAlign: 'right' }}>{formatRp(c.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card order-summary">
          <div className="summary-row">
            <span>Jumlah Item</span>
            <span>{cartBooks.reduce((s, c) => s + c.jumlah, 0)} eksemplar</span>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatRp(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Potongan (10%)</span>
            <span>- {formatRp(potongan)}</span>
          </div>
          <div className="summary-row total">
            <span>Netto</span>
            <span>{formatRp(netto)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setStep('select')}>← Edit Pesanan</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Memproses...' : '✓ Konfirmasi Pesanan'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-page">
      <div className="order-header">
        <Image src="/assets/Screenshot 2026-09-28 234611.png" alt="Logo" width={48} height={48} />
        <h1>Pesan Buku — {jenjang}</h1>
        <Link href="/" className="back-link">← Kembali ke beranda</Link>
      </div>

      <div className="glass-card books-table-wrap" style={{ padding: 20 }}>
        <table className="books-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Bidang Studi</th>
              <th>Kelas</th>
              <th>Hal</th>
              <th>Harga LKS</th>
              <th>Pesan LKS</th>
              {books.some(b => b.hargaPg) && <>
                <th>Harga PG</th>
                <th>Pesan PG</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {books.map((book, i) => (
              <tr key={book.id}>
                <td>{i + 1}</td>
                <td>
                  {book.jenis ? <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>[{book.jenis}] </span> : ''}
                  {book.bidangStudi}
                </td>
                <td style={{ textAlign: 'center' }}>{book.kelas || '-'}</td>
                <td style={{ textAlign: 'center' }}>{book.halaman || '-'}</td>
                <td style={{ textAlign: 'right' }}>{book.hargaLks ? formatRp(book.hargaLks) : '-'}</td>
                <td>
                  {book.hargaLks ? (
                    <input
                      type="number"
                      min={0}
                      value={getQty(book.id, 'lks') || ''}
                      onChange={e => updateCart(book.id, 'lks', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  ) : '-'}
                </td>
                {books.some(b => b.hargaPg) && <>
                  <td style={{ textAlign: 'right' }}>{book.hargaPg ? formatRp(book.hargaPg) : '-'}</td>
                  <td>
                    {book.hargaPg ? (
                      <input
                        type="number"
                        min={0}
                        value={getQty(book.id, 'pg') || ''}
                        onChange={e => updateCart(book.id, 'pg', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    ) : '-'}
                  </td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cartItems.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {cartItems.length} item · {formatRp(subtotal)}
          </span>
          <button className="btn btn-primary" onClick={() => setStep('review')}>
            Lihat Rekap Pesanan →
          </button>
        </div>
      )}
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="order-page"><p>Memuat...</p></div>}>
      <OrderContent />
    </Suspense>
  )
}
