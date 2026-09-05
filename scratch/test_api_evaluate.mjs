import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function runTest() {
  const userId = '8324679f-7d92-4a62-8b78-74366cb17ade';
  const secret = process.env.JWT_SECRET || 'super-secret-key-change-this-in-production';
  const token = jwt.sign({ id: userId, role: 'IBU_HAMIL' }, secret, { expiresIn: '1h' });

  console.log('=== TEST 1: Kondisi Stabil / Rendah (Skor 0 - 1) ===');
  const payloadNormal = {
    completedTasks: [
      'Minum tablet tambah darah (TTD)',
      'Konsumsi 8 gelas air mineral',
      'Porsi makan bergizi seimbang'
    ],
    uncompletedTasks: [
      'Jalan pagi santai 15 menit'
    ],
    symptoms: [
      { name: 'Mual & Muntah (Morning Sickness)', severity: 'Tidak Ada' },
      { name: 'Nyeri Punggung & Pinggang', severity: 'Tidak Ada' },
      { name: 'Kelelahan Ekstrem & Lemas', severity: 'Ringan / Sesekali' },
      { name: 'Pusing & Sakit Kepala', severity: 'Tidak Ada' },
      { name: 'Kram Perut Ringan', severity: 'Tidak Ada' }
    ],
    score: 1
  };

  const res1 = await fetch('http://localhost:5000/api/todo/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payloadNormal)
  });

  const json1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Response:', JSON.stringify(json1, null, 2));

  console.log('\n=== TEST 2: Kondisi Bahaya / Ambang Batas Medis (Skor >= 4 / Berat) ===');
  const payloadDanger = {
    completedTasks: [
      'Istirahat berbaring miring ke kiri'
    ],
    uncompletedTasks: [
      'Minum tablet tambah darah (TTD)',
      'Jalan santai 15 menit',
      'Senam hamil trimester'
    ],
    symptoms: [
      { name: 'Mual & Muntah (Morning Sickness)', severity: 'Berat / Sangat Mengganggu' },
      { name: 'Pusing & Sakit Kepala', severity: 'Berat / Sangat Mengganggu' },
      { name: 'Kelelahan Ekstrem & Lemas', severity: 'Ringan / Sesekali' },
      { name: 'Nyeri Punggung & Pinggang', severity: 'Ringan / Sesekali' },
      { name: 'Kram Perut Ringan', severity: 'Tidak Ada' }
    ],
    score: 6 // 2 + 2 + 1 + 1 = 6
  };

  const res2 = await fetch('http://localhost:5000/api/todo/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payloadDanger)
  });

  const json2 = await res2.json();
  console.log('Status:', res2.status);
  console.log('Response:', JSON.stringify(json2, null, 2));

  // Assertions
  const pass1 = json1.success === true && json1.data?.totalScore === 1 && json1.data?.isRedFlag === false;
  const pass2 = json2.success === true && json2.data?.totalScore === 6 && json2.data?.isRedFlag === true && json2.data?.tingkatKeparahan === 'BERAT';

  console.log('\n--- HASIL VALIDASI SISTEM SKORING & KESIMPULAN TERPADU AI ---');
  console.log('Test 1 (Normal/Stabil, Skor 1, Tidak Bahaya):', pass1 ? 'LULUS ✓' : 'GAGAL ✗');
  console.log('Test 2 (Bahaya/Wajib Lapor, Skor 6, Red Flag Aktif):', pass2 ? 'LULUS ✓' : 'GAGAL ✗');

  if (!pass1 || !pass2) {
    process.exit(1);
  }
}

runTest().catch(e => {
  console.error(e);
  process.exit(1);
});
