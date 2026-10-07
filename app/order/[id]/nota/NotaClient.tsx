'use client'

import Image from 'next/image'
import Link from 'next/link'

type OrderData = {
  id: number
  nomorNota: string
  tanggal: string
  jenjangFilter: string | null
  subtotal: number
  potonganPersen: number
  potonganNominal: number
  netto: number
  status: string
  buyer: { nama: string; area: string }
  items: Array<{
    id: number
    jumlah: number
    hargaSatuan: number
    totalHarga: number
    book: { bidangStudi: string; kelas: string | null; jenis: string | null }
  }>
}

function formatRp(n: number) { return 'Rp ' + n.toLocaleString('id-ID') }

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })
}

export default function NotaClient({ order }: { order: OrderData }) {
  const totalEks = order.items.reduce((s, i) => s + i.jumlah, 0)

  const handleConfirm = async () => {
    await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    window.location.reload()
  }

  return (
    <div className="nota-page">
      <div className="nota-container">
        {/* Header */}
        <div className="nota-header">
          <h1>— NOTA ESTIMASI —</h1>
          <h2>CV PUTRA NUGRAHA</h2>
          <p>Jl. Merapi Raya No 17 Mojosongo Jebres Solo</p>
        </div>

        {/* Info */}
        <div className="nota-info">
          <div>
            <div className="nota-info-item">
              <span className="label">Nama :</span>
              <span>{order.buyer.nama}</span>
            </div>
            <div className="nota-info-item">
              <span className="label">Area :</span>
              <span>{order.buyer.area}</span>
            </div>
          </div>
          <div>
            <div className="nota-info-item">
              <span className="label">Tanggal :</span>
              <span>{formatDate(order.tanggal)}</span>
            </div>
            <div className="nota-info-item">
              <span className="label">Nomer :</span>
              <span>{order.nomorNota}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{order.jenjangFilter || ''}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Smt. 2 TA. 26-27</div>
          </div>
        </div>

        {/* Table */}
        <table className="nota-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>No</th>
              <th>Bidang Study</th>
              <th style={{ width: 50 }}>Kelas</th>
              <th style={{ width: 70 }}>Jumlah</th>
              <th style={{ width: 90 }}>Harga</th>
              <th style={{ width: 110 }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id}>
                <td className="center">{i + 1}</td>
                <td>{item.book.bidangStudi}</td>
                <td className="center">{item.book.kelas || '-'}</td>
                <td className="center">{item.jumlah}</td>
                <td className="right">{formatRp(item.hargaSatuan)}</td>
                <td className="right">{formatRp(item.totalHarga)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="nota-totals">
          <div className="row">
            <span className="label">Jumlah :</span>
            <span>{totalEks.toLocaleString('id-ID')} eks</span>
            <span style={{ minWidth: 120, textAlign: 'right' }}>{formatRp(order.subtotal)}</span>
          </div>
          <div className="row">
            <span className="label">Potongan :</span>
            <span>{order.potonganPersen}%</span>
            <span style={{ minWidth: 120, textAlign: 'right' }}>{formatRp(order.potonganNominal)}</span>
          </div>
          <div className="row netto">
            <span className="label">Netto :</span>
            <span></span>
            <span style={{ minWidth: 120, textAlign: 'right' }}>{formatRp(order.netto)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="nota-actions no-print">
        <Link href="/" className="btn btn-outline">← Beranda</Link>
        <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Cetak Nota</button>
        {order.status === 'pending' && (
          <button className="btn btn-primary" onClick={handleConfirm}>✓ Konfirmasi Pesanan</button>
        )}
        {order.status === 'confirmed' && (
          <span style={{ padding: '10px 24px', background: 'rgba(76,175,80,0.12)', color: '#2e7d32', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>
            ✓ Pesanan Dikonfirmasi
          </span>
        )}
      </div>
    </div>
  )
}
