// Seed script: create a test division account
// Run: node prisma/seed-division.js

const bcrypt = require('bcryptjs')

async function main() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()

  const hash = await bcrypt.hash('divisi123', 10)
  const division = await prisma.division.upsert({
    where: { username: 'divisi_solo' },
    update: {},
    create: {
      namaDivisi: 'Divisi Solo',
      username: 'divisi_solo',
      passwordHash: hash,
    },
  })
  console.log('Division created:', division)
  await prisma.$disconnect()
}

main()
