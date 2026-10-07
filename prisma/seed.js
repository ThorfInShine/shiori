const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const file = path.join(__dirname, '..', 'public', 'excel', 'ZAMRUD - ESTIMASI SMT 2 Th 2026-2027.xlsx');
  const wb = XLSX.readFile(file);

  // Sheet configs: [sheetName, jenjang, headerRow, dataStartRow, colMap]
  // colMap: { bidangStudi, kelas, halaman, hargaLks, hargaPg, halPg, jenis }
  const sheets = [
    { name: 'AKM & P5', jenjang: 'AKM & P5', headerRow: 3, startRow: 4,
      cols: { bidangStudi: 3, kelas: 4, halaman: 5, hargaLks: 6, hargaPg: 8, jenis: 2 } },
    { name: 'sd', jenjang: 'SD', headerRow: 3, startRow: 5,
      cols: { bidangStudi: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 } },
    { name: 'SMP', jenjang: 'SMP', headerRow: 3, startRow: 5,
      cols: { bidangStudi: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 } },
    { name: 'SMA', jenjang: 'SMA', headerRow: 3, startRow: 5,
      cols: { bidangStudi: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 } },
    { name: 'SMK', jenjang: 'SMK', headerRow: 3, startRow: 5,
      cols: { bidangStudi: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 } },
    { name: 'MADRASAH', jenjang: 'MADRASAH', headerRow: 3, startRow: 5,
      cols: { bidangStudi: 1, kelas: 2, halaman: 3, hargaLks: 4, hargaPg: 6, halPg: 7 } },
  ];

  // Also parse remaining sheets
  const extraSheets = ['PROD', 'TKA', 'ASAJ UM', 'jurnal & tk'];

  let totalInserted = 0;

  for (const cfg of sheets) {
    const ws = wb.Sheets[cfg.name];
    if (!ws) { console.log(`Sheet "${cfg.name}" not found, skipping.`); continue; }
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let count = 0;
    for (let i = cfg.startRow; i < data.length; i++) {
      const row = data[i];
      const bidangStudi = String(row[cfg.cols.bidangStudi] || '').trim();
      if (!bidangStudi || bidangStudi === '') continue;

      const kelas = row[cfg.cols.kelas];
      const halaman = row[cfg.cols.halaman];
      const hargaLks = row[cfg.cols.hargaLks];
      const hargaPg = row[cfg.cols.hargaPg];
      const halPg = cfg.cols.halPg != null ? row[cfg.cols.halPg] : null;
      const jenis = cfg.cols.jenis != null ? String(row[cfg.cols.jenis] || '').trim() : null;

      // Skip summary rows
      if (bidangStudi.toLowerCase().includes('jumlah') || bidangStudi.toLowerCase().includes('total')) continue;
      if (bidangStudi.toLowerCase().includes('nama') || bidangStudi.toLowerCase().includes('area')) continue;
      if (bidangStudi.toLowerCase().includes('tanda tangan')) continue;

      await prisma.book.create({
        data: {
          bidangStudi,
          jenjang: cfg.jenjang,
          kategori: cfg.name,
          kelas: kelas ? String(kelas) : null,
          halaman: halaman ? parseInt(halaman) || null : null,
          hargaLks: hargaLks ? parseInt(hargaLks) || null : null,
          hargaPg: hargaPg ? parseInt(hargaPg) || null : null,
          halPg: halPg ? parseInt(halPg) || null : null,
          jenis: jenis || null,
        },
      });
      count++;
    }
    console.log(`✓ ${cfg.name}: ${count} books inserted`);
    totalInserted += count;
  }

  // Parse extra sheets with same structure as SMP/SMA
  for (const sheetName of extraSheets) {
    const ws = wb.Sheets[sheetName];
    if (!ws) { console.log(`Sheet "${sheetName}" not found, skipping.`); continue; }
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    let count = 0;
    // Find header row (look for "No" in first col)
    let startRow = 4;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      if (String(data[i][0]).toLowerCase().includes('no')) {
        startRow = i + 1;
        // Skip empty row after header
        if (data[startRow] && !data[startRow][1]) startRow++;
        break;
      }
    }

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      const bidangStudi = String(row[1] || '').trim();
      if (!bidangStudi || bidangStudi === '') continue;
      if (bidangStudi.toLowerCase().includes('jumlah') || bidangStudi.toLowerCase().includes('total')) continue;
      if (bidangStudi.toLowerCase().includes('nama') || bidangStudi.toLowerCase().includes('area')) continue;
      if (bidangStudi.toLowerCase().includes('tanda tangan') || bidangStudi.includes('…')) continue;

      const kelas = row[2];
      const halaman = row[3];
      const hargaLks = row[4];
      const hargaPg = row[6];
      const halPg = row[7];

      await prisma.book.create({
        data: {
          bidangStudi,
          jenjang: sheetName.toUpperCase(),
          kategori: sheetName,
          kelas: kelas ? String(kelas) : null,
          halaman: halaman ? parseInt(halaman) || null : null,
          hargaLks: hargaLks ? parseInt(hargaLks) || null : null,
          hargaPg: hargaPg ? parseInt(hargaPg) || null : null,
          halPg: halPg ? parseInt(halPg) || null : null,
          jenis: null,
        },
      });
      count++;
    }
    console.log(`✓ ${sheetName}: ${count} books inserted`);
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
