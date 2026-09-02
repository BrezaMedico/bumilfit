import prisma from '../src/lib/prisma.js';

// Helper to convert gestational weeks to month of pregnancy (1 - 9)
function getPregnancyMonth(weeks: number): number {
  if (weeks <= 4) return 1;
  if (weeks <= 8) return 2;
  if (weeks <= 12) return 3;
  if (weeks <= 16) return 4;
  if (weeks <= 20) return 5;
  if (weeks <= 24) return 6;
  if (weeks <= 28) return 7;
  if (weeks <= 32) return 8;
  return 9; // 33 weeks and beyond is Month 9
}

async function runTest() {
  console.log('=== STARTING LOGIC & QUERY VERIFICATION (MONTH & RISK MODEL) ===');
  
  const testEmail = 'testmother_logic@example.com';
  
  // Clean up existing test user if any
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create a Test User and ProfilIbuHamil (Week 8, Day 3, Risiko Tinggi)
  console.log('\n[1] Membuat User Test & Profil Ibu Hamil (Minggu 8, Hari 3, Risiko Tinggi)...');
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: 'hashedpassword123',
      role: 'IBU_HAMIL',
      isVerified: true,
      profilIbu: {
        create: {
          namaIbu: 'Jane Doe',
          usiaKehamilanMinggu: 8,
          usiaKehamilanHari: 3,
          nomorWhatsapp: '081234567890',
          kategoriSkrining: 'Risiko Tinggi' // Will map to TINGGI
        }
      }
    },
    include: {
      profilIbu: true
    }
  });

  const profile = user.profilIbu!;
  console.log(`User created. ID: ${user.id}`);

  // 2. Fetch Tasks - Expected: Month 2 (since week 8 is Month 2), Day 4
  console.log('\n[2] Menguji pengambilan tugas saat kondisi Risiko Tinggi...');
  
  const lastUpdate = new Date(profile.usiaKehamilanUpdatedAt);
  const now = new Date();
  
  const lastUpdateDateOnly = Date.UTC(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
  const nowDateOnly = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.max(0, Math.floor((nowDateOnly - lastUpdateDateOnly) / (1000 * 60 * 60 * 24)));
  
  const totalDays = (profile.usiaKehamilanMinggu * 7) + profile.usiaKehamilanHari + diffDays;
  const currentWeek = Math.floor(totalDays / 7);
  const currentDay = totalDays % 7; // 0 sampai 6
  
  const pregnancyMonth = getPregnancyMonth(currentWeek);
  const dayOfCycle = (totalDays % 7) + 1; // 1 s.d. 7 (Siklus Harian)
  
  console.log(`Gestational Age calculated: Minggu ${currentWeek}, Hari ${currentDay}`);
  console.log(`Pregnancy Month: Bulan ${pregnancyMonth}, Hari Siklus: Hari ${dayOfCycle}`);
  
  if (pregnancyMonth !== 2 || dayOfCycle !== 4) {
    throw new Error(`Kalkulasi bulan/hari salah. Diperoleh Bulan ${pregnancyMonth}, Hari ${dayOfCycle}. Ekspektasi Bulan 2, Hari 4.`);
  }

  // Tentukan Kategori Risiko
  const normRisk = profile.kategoriSkrining!.toLowerCase();
  const riskCategory = normRisk.includes('tinggi') ? 'TINGGI' : normRisk.includes('sedang') ? 'SEDANG' : 'RENDAH';
  console.log(`Kategori Risiko: ${riskCategory}`);

  // Ambil 5 Tugas MasterTemplate
  const masterTodos = await prisma.masterTodo.findMany({
    where: {
      bulan: pregnancyMonth,
      kategoriRisiko: riskCategory as any,
      hariKe: dayOfCycle
    },
    orderBy: {
      noTugas: 'asc'
    }
  });

  console.log(`Ditemukan ${masterTodos.length} tugas master untuk hari ini.`);
  masterTodos.forEach(t => {
    console.log(` - No. ${t.noTugas} [${t.kategoriAktivitas}] -> "${t.tugasHarian}"`);
  });

  if (masterTodos.length !== 5) {
    throw new Error(`Jumlah tugas salah. Diperoleh ${masterTodos.length}, ekspektasi 5.`);
  }
  console.log('✔ Pengambilan 5 tugas harian berdasarkan Month & Risk sukses!');

  // 3. Mark task 1 as completed
  console.log('\n[3] Menyelesaikan tugas ke-1...');
  const targetTask = masterTodos[0]!;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const completed = await prisma.userTodo.create({
    data: {
      userId: user.id,
      masterTodoId: targetTask.id,
      tanggal: startOfToday,
      isCompleted: true,
      completedAt: new Date()
    }
  });

  console.log(`Tugas ditandai selesai. ID UserTodo: ${completed.id}`);

  // 4. Check progress
  console.log('\n[4] Memverifikasi progress...');
  const userTodos = await prisma.userTodo.findMany({
    where: {
      userId: user.id,
      tanggal: startOfToday
    }
  });

  const completedCount = userTodos.filter(ut => ut.isCompleted).length;
  const percentage = Math.round((completedCount / masterTodos.length) * 100);
  console.log(`Progress: ${completedCount}/${masterTodos.length} (${percentage}% selesai)`);

  if (completedCount !== 1 || percentage !== 20) {
    throw new Error(`Kalkulasi progress salah. Diperoleh ${completedCount} tugas, ${percentage}%. Ekspektasi 1 tugas, 20%.`);
  }
  console.log('✔ Verifikasi progress sukses!');

  // 5. Change risk category to Sedang and verify tasks update
  console.log('\n[5] Mengubah kategori risiko menjadi Risiko Sedang...');
  await prisma.profilIbuHamil.update({
    where: { userId: user.id },
    data: { kategoriSkrining: 'Risiko Sedang' }
  });

  const updatedProfile = await prisma.profilIbuHamil.findUnique({
    where: { userId: user.id }
  });
  const updatedRisk = updatedProfile!.kategoriSkrining!.toLowerCase().includes('sedang') ? 'SEDANG' : 'RENDAH';

  const updatedTodos = await prisma.masterTodo.findMany({
    where: {
      bulan: pregnancyMonth,
      kategoriRisiko: updatedRisk as any,
      hariKe: dayOfCycle
    },
    orderBy: {
      noTugas: 'asc'
    }
  });

  console.log(`Ditemukan ${updatedTodos.length} tugas baru setelah perubahan risiko ke SEDANG.`);
  updatedTodos.forEach(t => {
    console.log(` - No. ${t.noTugas} [${t.kategoriAktivitas}] -> "${t.tugasHarian}"`);
  });

  if (updatedTodos.length !== 5) {
    throw new Error(`Jumlah tugas setelah ubah risiko salah. Diperoleh ${updatedTodos.length}, ekspektasi 5.`);
  }
  if (updatedTodos[0]!.id === targetTask.id) {
    throw new Error('Konten tugas tidak berganti setelah kategori risiko diubah.');
  }
  console.log('✔ Segmentasi tugas harian responsif terhadap perubahan kategori risiko!');

  // 6. Clean up
  console.log('\n[6] Membersihkan data test...');
  await prisma.user.delete({ where: { id: user.id } });
  console.log('Test user deleted.');

  console.log('\n=== LOGIC & QUERY VERIFICATION SUCCESSFUL ===');
}

runTest()
  .catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  });
