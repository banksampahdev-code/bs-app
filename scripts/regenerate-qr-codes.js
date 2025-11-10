/**
 * Script untuk regenerate QR codes untuk existing users
 *
 * KAPAN DIGUNAKAN:
 * - Setelah menjalankan database migration (ALTER TABLE add qr_data)
 * - Untuk existing users yang belum punya qr_data
 * - Untuk memastikan qr_code (image) dan qr_data (string) match
 *
 * CARA PAKAI:
 * 1. Pastikan sudah install dependencies: npm install
 * 2. Setup environment variables di .env
 * 3. Jalankan: node scripts/regenerate-qr-codes.js
 *
 * PERINGATAN:
 * - QR code lama akan diganti dengan yang baru
 * - User harus download QR code baru dari dashboard mereka
 * - Backup database dulu sebelum jalankan script ini!
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const QRCode = require('qrcode');

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function regenerateQRCodes() {
  try {
    console.log('🚀 Starting QR code regeneration...\n');

    // Fetch all users with role 'pengguna' yang belum punya qr_data atau qr_data nya kosong
    console.log('📋 Fetching users without qr_data...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, nama_lengkap, created_at, qr_data, qr_code')
      .eq('role', 'pengguna')
      .or('qr_data.is.null,qr_data.eq.');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('✅ No users need QR code regeneration. All users already have qr_data!');
      return;
    }

    console.log(`📊 Found ${users.length} user(s) without qr_data\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n[${i + 1}/${users.length}] Processing: ${user.nama_lengkap} (${user.email})`);

      try {
        // Generate new QR data (format: BANKSAMPAH-email-timestamp)
        const timestamp = new Date(user.created_at).getTime();
        const qrData = `BANKSAMPAH-${user.email}-${timestamp}`;

        console.log(`   📝 QR Data: ${qrData}`);

        // Generate QR code image
        const qrCodeImage = await QRCode.toDataURL(qrData);

        // Update user with new qr_code and qr_data
        const { error: updateError } = await supabase
          .from('users')
          .update({
            qr_code: qrCodeImage,
            qr_data: qrData
          })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`   ✅ Success! Updated QR code and data`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 REGENERATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total processed: ${users.length}`);
    console.log('='.repeat(50) + '\n');

    if (successCount > 0) {
      console.log('⚠️  IMPORTANT NOTES:');
      console.log('   1. QR codes have been regenerated');
      console.log('   2. Users need to download NEW QR codes from their dashboard');
      console.log('   3. Old QR codes (if printed) are now INVALID');
      console.log('   4. Verify scanning works with new QR codes\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('='.repeat(50));
console.log('  QR CODE REGENERATION SCRIPT');
console.log('='.repeat(50));
console.log('⚠️  WARNING: This will update QR codes in production!');
console.log('   Make sure you have backed up your database.\n');

// Confirmation prompt
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Continue? (yes/no): ', (answer) => {
  readline.close();

  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    regenerateQRCodes()
      .then(() => {
        console.log('✅ Script completed successfully!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
      });
  } else {
    console.log('❌ Cancelled by user');
    process.exit(0);
  }
});
