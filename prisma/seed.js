const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

// --- Helper ---
// text(): null/undefined -> '', sisanya jadi string yang sudah di-trim.
// Sengaja tidak memakai `v || ''` seperti seed lama, karena nilai 0
// (misalnya sel footer AKM) akan ikut lolos sebagai judul '0' kalau
// hanya mengandalkan falsy check.
function text(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function intOrNull(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

// Kolom "No" harus berisi angka. Ini menyaring baris header,
// baris judul seksi (misalnya 'INTENS SMK'), baris footer
// (Nama/Area/Tanggal), dan baris kosong.
function isNumberLike(v) {
  if (v === undefined || v === null || String(v).trim() === '') return false;
  return !Number.isNaN(Number(v));
}

function isSkippedTitle(bidangStudi) {
  const low = bidangStudi.toLowerCase();
  return (
    low.includes('jumlah') ||
    low.includes('total') ||
    low.includes('nama') ||
    low.includes('area') ||
    low.includes('tanda tangan') ||
    bidangStudi.includes('…')
  );
}

async function main() {
  const file = path.join(__dirname, '..', 'public', 'excel', 'ZAMRUD - ESTIMASI SMT 2 Th 2026-2027.xlsx');
  const wb = XLSX.readFile(file);

  // Reset katalog dulu, supaya re-seed tidak menduplikasi.
  // Tanpa ini, menjalankan seed kedua akan menghasilkan
  // 429 buku lama + 526 buku baru = 955 baris.
  // SavedCart dihapus dulu karena mereferensikan Book.
  // PERHATIAN: kalau sudah ada Order/OrderItem yang mereferensikan
  // Book, deleteMany di bawah akan gagal karena foreign key.
  // Itu sengaja — jangan hapus order diam-diam. Kosongkan order
  // dulu di database dev, atau jangan pakai reset ini di database
  // yang sudah berisi order asli.
  await prisma.savedCart.deleteMany();
  await prisma.book.deleteMany();

  // Konfigurasi sheet.
  // - startRow adalah indeks array 0-based dari sheet_to_json(header: 1),
  //   jadi startRow 4 = baris Excel 5, startRow 5 = baris Excel 6, dst.
  // - Angka di `cols` adalah indeks kolom 0-based:
  //   0=A, 1=B, 2=C, 3=D, 4=E, 5=F, 6=G, 7=H, 8=I, dst.
  // - Satu sheet bisa punya 2 tabel (SD dan SMA punya tabel kiri
  //   dan kanan). Seed lama hanya membaca tabel kiri, sehingga
  //   12 SD Terpadu dan 17 SMA kelas 12 hilang.
  const sheets = [
    // AKM & P5: A=No, B=Jenjang, C=Jenis, D=Bidang, E=Kls,
    // F=Hal, G=Harga, I=Harga PG. Tidak ada kolom Hal PG.
    { name: 'AKM & P5', jenjang: 'AKM & P5', startRow: 4,
      tables: [{ no: 0, bidang: 3, jenis: 2, kelas: 4, halaman: 5, hargaLks: 6, hargaPg: 8 }] },
    // SD kiri: B=Bidang, C=Kls, D=Hal, E=Harga, G=Harga PG, H=Hal PG.
    // SD kanan (Terpadu): M=No, N=Bidang, O=Kls, P=Hal, Q=Harga,
    // S=Harga PG, T=Hal PG.
    { name: 'sd', jenjang: 'SD', startRow: 5,
      tables: [
        { no: 0, bidang: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 },
        { no: 12, bidang: 13, kelas: 14, halaman: 15, hargaLks: 16, hargaPg: 18, halPg: 19 },
      ] },
    // SMP: B=Bidang, C=Kls, D=Hal, E=Harga, G=Harga PG, H=Hal PG.
    { name: 'SMP', jenjang: 'SMP', startRow: 5,
      tables: [{ no: 0, bidang: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 }] },
    // SMA kiri: sama seperti SMP.
    // SMA kanan (kelas 12): M=No, N=Bidang, O=Kls, P=Hal, Q=Harga,
    // S=Harga PG. (Kolom Hal PG kanan kosong di Excel, jadi null.)
    { name: 'SMA', jenjang: 'SMA', startRow: 5,
      tables: [
        { no: 0, bidang: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 },
        { no: 12, bidang: 13, kelas: 14, halaman: 15, hargaLks: 16, hargaPg: 18, halPg: 19 },
      ] },
    // SMK — PERBAIKAN dari seed lama: kolom sebenarnya adalah
    // B=Bidang, C=Kode (tidak ada di schema Book, diabaikan),
    // D=Kelas, E=Hal, F=Harga, H=Harga PG.
    // Seed lama memakai C sebagai Kelas, D sebagai Hal, dst.,
    // sehingga kelas/harga yang tersimpan bergeser.
    { name: 'SMK', jenjang: 'SMK', startRow: 5,
      tables: [{ no: 0, bidang: 1, kelas: 3, halaman: 4, hargaLks: 5, hargaPg: 7 }] },
    // MADRASAH — PERBAIKAN dari seed lama: kolom sebenarnya adalah
    // B=Bidang, C=Kls, D=Tingkat (tidak ada di schema Book, diabaikan),
    // E=Hal, F=Harga, H=Harga PG, I=Hal PG.
    { name: 'MADRASAH', jenjang: 'MADRASAH', startRow: 5,
      tables: [{ no: 0, bidang: 1, kelas: 2, halaman: 4, hargaLks: 5, hargaPg: 7, halPg: 8 }] },
    // PROD — PERBAIKAN dari seed lama: judul ada di kolom C, bukan B.
    // Kolom B adalah nama kelompok/jurusan (misalnya '2.1.1 Teknik
    // Pemesinan'), dan kosong di sebagian besar baris. Kalau C kosong,
    // barulah pakai B — itu baris judul 'KREATIVITAS, INOVASI, DAN
    // KEWIRAUSAHAAN' yang memang bukunya sendiri.
    // Kolom: A=No, D=Jumlah Halaman, F=Harga, H=Harga PG.
    // (Kolom E=Finishing tidak ada di schema Book, diabaikan.)
    { name: 'PROD', jenjang: 'PROD', startRow: 3,
      tables: [{ no: 0, bidang: 2, bidangFallback: 1, halaman: 3, hargaLks: 5, hargaPg: 7 }] },
    // TKA — PERBAIKAN dari seed lama: judul ada di kolom C, bukan B.
    // Kolom B adalah Tingkat (SD/MI, SMP/MTS, SMA-SMK/MA) yang hanya
    // diisi di baris pertama tiap kelompok — itulah kenapa seed lama
    // hanya memasukkan 3 baris TKA. Tingkat tidak ada di schema Book,
    // jadi diabaikan; judul diambil dari C.
    // Kolom: A=No, C=Bidang, D=Kls, E=Hal, F=Harga, H=Harga PG.
    { name: 'TKA', jenjang: 'TKA', startRow: 4,
      tables: [{ no: 0, bidang: 2, kelas: 3, halaman: 4, hargaLks: 5, hargaPg: 7 }] },
    // ASAJ UM: B=Bidang, C=Kls, D=Hal, E=Harga Satuan, G=Harga PG.
    // Tidak ada kolom Hal PG.
    { name: 'ASAJ UM', jenjang: 'ASAJ UM', startRow: 4,
      tables: [{ no: 0, bidang: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6 }] },
    // jurnal & tk: header di baris Excel 4, baris 5 kosong, data
    // mulai baris Excel 6 (startRow 5). B=Bidang, C=Kls, D=Hal,
    // E=Harga. Tidak ada Harga/Hal PG.
    { name: 'jurnal & tk', jenjang: 'JURNAL & TK', startRow: 5,
      tables: [{ no: 0, bidang: 1, kelas: 2, halaman: 3, hargaLks: 4 }] },
  ];

  let totalInserted = 0;

  for (const cfg of sheets) {
    const ws = wb.Sheets[cfg.name];
    if (!ws) { console.log(`Sheet "${cfg.name}" not found, skipping.`); continue; }
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    const tableCounts = cfg.tables.map(() => 0);
    for (let i = cfg.startRow; i < data.length; i++) {
      const row = data[i];
      for (let t = 0; t < cfg.tables.length; t++) {
        const cols = cfg.tables[t];
        if (!isNumberLike(row[cols.no])) continue;

        let bidangStudi = text(row[cols.bidang]);
        if (!bidangStudi && cols.bidangFallback != null) {
          bidangStudi = text(row[cols.bidangFallback]);
        }
        if (!bidangStudi || bidangStudi === '0') continue;
        if (isSkippedTitle(bidangStudi)) continue;

        await prisma.book.create({
          data: {
            bidangStudi,
            jenjang: cfg.jenjang,
            kategori: cfg.name,
            kelas: cols.kelas != null ? (text(row[cols.kelas]) || null) : null,
            halaman: cols.halaman != null ? intOrNull(row[cols.halaman]) : null,
            hargaLks: cols.hargaLks != null ? intOrNull(row[cols.hargaLks]) : null,
            hargaPg: cols.hargaPg != null ? intOrNull(row[cols.hargaPg]) : null,
            halPg: cols.halPg != null ? intOrNull(row[cols.halPg]) : null,
            jenis: cols.jenis != null ? (text(row[cols.jenis]) || null) : null,
          },
        });
        tableCounts[t]++;
      }
    }
    const count = tableCounts.reduce((a, b) => a + b, 0);
    const detail = cfg.tables.length > 1 ? ` (${tableCounts.join(' + ')})` : '';
    console.log(`✓ ${cfg.name}: ${count} books inserted${detail}`);
    totalInserted += count;
  }

  // Create default admin
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: hash },
  });
  console.log('✓ Default admin created (admin / admin123)');

  console.log(`\n✅ Total: ${totalInserted} books seeded`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
