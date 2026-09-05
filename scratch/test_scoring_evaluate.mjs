import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import prisma from '../backend/dist/lib/prisma.js';

async function runTest() {
  console.log('--- Testing Evaluate Symptoms & AI Synthesis ---');
  
  // 1. Get or find a user
  let user = await prisma.user.findFirst({
    include: { profilIbu: true }
  });

  if (!user) {
    console.error('No user found in database.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Using user: ${user.email} (ID: ${user.id})`);
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

  // 2. Test Case A: Kondisi Normal (Skor 0 - Baik / Tidak Ada Keluhan)
  console.log('\n--- Case 1: Normal Condition (Skor 0) ---');
  const normalPayload = {
    completedTasks: ['Minum tablet tambah darah (TTD)', 'Konsumsi 8 gelas air mineral'],
    uncompletedTasks: ['Jalan pagi santai 15 menit'],
    symptoms: [
      { name: 'Mual & Muntah (Morning Sickness)', severity: 'Tidak Ada' },
      { name: 'Nyeri Punggung & Pinggang', severity: 'Tidak Ada' },
      { name: 'Kelelahan Ekstrem & Lemas', severity: 'Tidak Ada' },
      { name: 'Pusing & Sakit Kepala', severity: 'Tidak Ada' },
      { name: 'Kram Perut Ringan', severity: 'Tidak Ada' }
    ]
  };

  const res1 = await fetch('http://localhost:5000/api/todo/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(normalPayload)
  });

  const data1 = await res1.json();
  console.log('Case 1 Status:', res1.status);
  console.log('Case 1 Data:', {
    totalScore: data1.data?.totalScore,
    isRedFlag: data1.data?.isRedFlag,
    tingkatKeparahan: data1.data?.tingkatKeparahan,
    advice: data1.data?.advice
  });

  if (data1.data?.totalScore === 0 && data1.data?.isRedFlag === false) {
    console.log('✓ Case 1 PASSED: Score is 0 and isRedFlag is false');
  } else {
    console.error('✗ Case 1 FAILED');
  }

  // 3. Test Case B: Kondisi Bahaya (Skor >= 4, Wajib Lapor Dokter)
  console.log('\n--- Case 2: Danger / Red Flag Condition (Skor >= 4 / Berat) ---');
  const dangerPayload = {
    completedTasks: ['Istirahat cukup 8 jam'],
    uncompletedTasks: ['Senam hamil ringan', 'Porsi makan bergizi seimbang'],
    symptoms: [
      { name: 'Mual & Muntah (Morning Sickness)', severity: 'Berat / Sangat Mengganggu' },
      { name: 'Pusing & Sakit Kepala', severity: 'Berat / Sangat Mengganggu' },
      { name: 'Kelelahan Ekstrem & Lemas', severity: 'Ringan / Sesekali' },
      { name: 'Nyeri Punggung & Pinggang', severity: 'Tidak Ada' },
      { name: 'Kram Perut Ringan', severity: 'Tidak Ada' }
    ]
  };

  const res2 = await fetch('http://localhost:5000/api/todo/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(dangerPayload)
  });

  const data2 = await res2.json();
  console.log('Case 2 Status:', res2.status);
  console.log('Case 2 Data:', {
    totalScore: data2.data?.totalScore,
    isRedFlag: data2.data?.isRedFlag,
    tingkatKeparahan: data2.data?.tingkatKeparahan,
    advice: data2.data?.advice
  });

  // Mual berat (2) + Pusing berat (2) + Lemas ringan (1) = Skor 5 (>= 4)
  if (data2.data?.totalScore === 5 && data2.data?.isRedFlag === true && data2.data?.tingkatKeparahan === 'BERAT') {
    console.log('✓ Case 2 PASSED: Score is 5, isRedFlag is true, status is BERAT');
  } else {
    console.error('✗ Case 2 FAILED');
  }

  await prisma.$disconnect();
}

runTest().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
