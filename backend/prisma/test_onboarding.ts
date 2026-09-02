import prisma from '../src/lib/prisma.js';

async function runOnboardingTest() {
  console.log('=== STARTING ONBOARDING STATE PERSISTENCE TEST ===');
  
  const testEmail = 'testmother_onboarding@example.com';
  
  // Clean up if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create a user (default sudahSkrining should be false)
  console.log('\n[1] Membuat User baru...');
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: 'hashedpassword123',
      role: 'IBU_HAMIL',
      isVerified: true,
      profilIbu: {
        create: {
          namaIbu: 'Jane Doe Onboarding',
          usiaKehamilanMinggu: 4,
          usiaKehamilanHari: 2,
          nomorWhatsapp: '089999999999'
        }
      }
    },
    include: {
      profilIbu: true
    }
  });

  console.log(`User Berhasil Dibuat. ID: ${user.id}`);
  console.log(`Status sudahSkrining Awal (Ekspektasi: false): ${user.profilIbu?.sudahSkrining}`);

  if (user.profilIbu?.sudahSkrining !== false) {
    throw new Error(`Gagal: sudahSkrining awal harus bernilai false secara default!`);
  }
  console.log('✔ Status default sudahSkrining sudah benar!');

  // 2. Simulasikan update profile dari survei onboarding (set sudahSkrining: true, skor: 12)
  console.log('\n[2] Mensimulasikan penyelesaian survei onboarding...');
  const updatedProfile = await prisma.profilIbuHamil.update({
    where: { userId: user.id },
    data: {
      sudahSkrining: true,
      skorSkrining: 12,
      kategoriSkrining: 'Risiko Sedang'
    }
  });

  console.log(`Status sudahSkrining Setelah Update (Ekspektasi: true): ${updatedProfile.sudahSkrining}`);
  console.log(`Skor Skrining Setelah Update (Ekspektasi: 12): ${updatedProfile.skorSkrining}`);
  console.log(`Kategori Skrining Setelah Update (Ekspektasi: Risiko Sedang): ${updatedProfile.kategoriSkrining}`);

  if (updatedProfile.sudahSkrining !== true || updatedProfile.skorSkrining !== 12 || updatedProfile.kategoriSkrining !== 'Risiko Sedang') {
    throw new Error(`Gagal: Data hasil skrining tidak tersimpan dengan benar!`);
  }
  console.log('✔ Penyimpanan data skrining ke database berhasil!');

  // 3. Bersihkan data test
  console.log('\n[3] Membersihkan data test...');
  await prisma.user.delete({ where: { id: user.id } });
  console.log('User test onboarding dibersihkan.');

  console.log('\n=== ONBOARDING STATE PERSISTENCE TEST SUCCESSFUL ===');
}

runOnboardingTest()
  .catch(err => {
    console.error('\n❌ ONBOARDING TEST FAILED:', err);
    process.exit(1);
  });
