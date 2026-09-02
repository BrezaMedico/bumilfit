import prisma from '../src/lib/prisma.js';

async function runEvaluationTest() {
  console.log('=== STARTING SYMPTOM EVALUATION LOGIC TEST ===');
  
  const testEmail = 'testmother_eval@example.com';
  
  // Clean up if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create a user
  console.log('\n[1] Membuat User baru...');
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: 'hashedpassword123',
      role: 'IBU_HAMIL',
      isVerified: true,
      profilIbu: {
        create: {
          namaIbu: 'Jane Doe Eval',
          usiaKehamilanMinggu: 14,
          usiaKehamilanHari: 5,
          nomorWhatsapp: '081111111111'
        }
      }
    }
  });
  console.log(`User created. ID: ${user.id}`);

  // 2. Simulate symptom list with a Heavy category (expects tingkatKeparahan: BERAT, isRedFlag: true)
  console.log('\n[2] Menguji evaluasi keluhan berat (Red Flag)...');
  const heavySymptoms = [
    { name: 'Mual dan Muntah (Morning Sickness)', severity: 'Berat / Sangat Mengganggu' },
    { name: 'Nyeri Punggung dan Pinggang', severity: 'Tidak Ada' }
  ];

  let hasHeavy = false;
  let hasMedium = false;
  const activeSymptomsList: string[] = [];

  heavySymptoms.forEach((s: any) => {
    activeSymptomsList.push(`${s.name}: ${s.severity}`);
    if (s.severity.includes('Berat')) {
      hasHeavy = true;
    } else if (s.severity.includes('Ringan')) {
      hasMedium = true;
    }
  });

  const tingkatKeparahanHeavy = hasHeavy ? 'BERAT' : hasMedium ? 'SEDANG' : 'RINGAN';
  const isRedFlagHeavy = hasHeavy;

  console.log(`Tingkat Keparahan (Ekspektasi: BERAT): ${tingkatKeparahanHeavy}`);
  console.log(`Is Red Flag (Ekspektasi: true): ${isRedFlagHeavy}`);

  if (tingkatKeparahanHeavy !== 'BERAT' || isRedFlagHeavy !== true) {
    throw new Error('Gagal: Evaluasi keluhan berat salah!');
  }

  // 3. Create a KeluhanLog in database to verify schema constraints
  const heavyLog = await prisma.keluhanLog.create({
    data: {
      userId: user.id,
      daftarKeluhan: activeSymptomsList,
      tingkatKeparahan: tingkatKeparahanHeavy as any,
      isRedFlag: isRedFlagHeavy,
      catatanBebas: 'Mock AI Advice for Heavy condition.'
    }
  });
  console.log(`Log Berat sukses disimpan ke DB. ID: ${heavyLog.id}`);

  // 4. Simulate symptom list with a Medium/Light category (expects tingkatKeparahan: SEDANG, isRedFlag: false)
  console.log('\n[3] Menguji evaluasi keluhan sedang...');
  const mediumSymptoms = [
    { name: 'Mual dan Muntah (Morning Sickness)', severity: 'Ringan / Sesekali' },
    { name: 'Nyeri Punggung dan Pinggang', severity: 'Tidak Ada' }
  ];

  let hasHeavyMed = false;
  let hasMediumMed = false;
  const activeSymptomsListMed: string[] = [];

  mediumSymptoms.forEach((s: any) => {
    activeSymptomsListMed.push(`${s.name}: ${s.severity}`);
    if (s.severity.includes('Berat')) {
      hasHeavyMed = true;
    } else if (s.severity.includes('Ringan')) {
      hasMediumMed = true;
    }
  });

  const tingkatKeparahanMed = hasHeavyMed ? 'BERAT' : hasMediumMed ? 'SEDANG' : 'RINGAN';
  const isRedFlagMed = hasHeavyMed;

  console.log(`Tingkat Keparahan (Ekspektasi: SEDANG): ${tingkatKeparahanMed}`);
  console.log(`Is Red Flag (Ekspektasi: false): ${isRedFlagMed}`);

  if (tingkatKeparahanMed !== 'SEDANG' || isRedFlagMed !== false) {
    throw new Error('Gagal: Evaluasi keluhan sedang salah!');
  }

  const medLog = await prisma.keluhanLog.create({
    data: {
      userId: user.id,
      daftarKeluhan: activeSymptomsListMed,
      tingkatKeparahan: tingkatKeparahanMed as any,
      isRedFlag: isRedFlagMed,
      catatanBebas: 'Mock AI Advice for Medium condition.'
    }
  });
  console.log(`Log Sedang sukses disimpan ke DB. ID: ${medLog.id}`);

  // 5. Clean up
  console.log('\n[4] Membersihkan data test...');
  await prisma.user.delete({ where: { id: user.id } });
  console.log('User test evaluation dibersihkan.');

  console.log('\n=== SYMPTOM EVALUATION LOGIC TEST SUCCESSFUL ===');
}

runEvaluationTest()
  .catch(err => {
    console.error('\n❌ EVALUATION TEST FAILED:', err);
    process.exit(1);
  });
