import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, '').trim());
}

function getRiskCategory(val: string): 'RENDAH' | 'SEDANG' | 'TINGGI' {
  const norm = val.toLowerCase();
  if (norm.includes('tinggi')) return 'TINGGI';
  if (norm.includes('sedang')) return 'SEDANG';
  return 'RENDAH';
}

async function main() {
  const csvPath = path.resolve(__dirname, 'todo_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`File CSV tidak ditemukan di: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Baris pertama adalah header
  const rows = lines.slice(1);
  console.log(`Menemukan ${rows.length} data to-do untuk di-seed.`);

  let successCount = 0;

  for (const row of rows) {
    const columns = parseCSVLine(row);
    if (columns.length < 7) {
      console.warn(`Baris dilewati karena format tidak lengkap: ${row}`);
      continue;
    }

    const bulan = parseInt(columns[0], 10);
    const trimester = columns[1];
    const kategoriRisiko = getRiskCategory(columns[2]);
    const hariKe = parseInt(columns[3], 10);
    const noTugas = parseInt(columns[4], 10);
    const tugasHarian = columns[5];
    const kategoriAktivitas = columns[6];

    if (isNaN(bulan) || isNaN(hariKe) || isNaN(noTugas)) {
      console.warn(`Data angka tidak valid pada baris: ${row}`);
      continue;
    }

    try {
      await prisma.masterTodo.upsert({
        where: {
          bulan_kategoriRisiko_hariKe_noTugas: {
            bulan,
            kategoriRisiko,
            hariKe,
            noTugas,
          }
        },
        update: {
          trimester,
          tugasHarian,
          kategoriAktivitas
        },
        create: {
          bulan,
          trimester,
          kategoriRisiko,
          hariKe,
          noTugas,
          tugasHarian,
          kategoriAktivitas
        }
      });
      successCount++;
    } catch (err: any) {
      console.error(`Gagal melakukan upsert untuk bulan ${bulan} hari ${hariKe} tugas ${noTugas}:`, err.message);
    }
  }

  console.log(`Berhasil memproses ${successCount} baris data ke database.`);
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
