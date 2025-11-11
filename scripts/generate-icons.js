const fs = require('fs');
const path = require('path');

// Placeholder icon generator using Canvas
// Untuk production, Anda bisa menggunakan sharp atau library lainnya
// atau generate icons secara manual menggunakan design tool

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    // Check if we have sharp installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.log('Sharp not found. Please install it: npm install --save-dev sharp');
      console.log('Or manually create icons with these sizes:', iconSizes.map(s => `${s}x${s}`).join(', '));
      console.log('Place them in the public folder with names like: icon-192x192.png');
      return;
    }

    const logoPath = path.join(__dirname, '../public/logo.png');

    if (!fs.existsSync(logoPath)) {
      console.log('Logo not found at public/logo.png');
      console.log('Please add a logo.png file (minimum 512x512px) to the public folder');
      console.log('Then run this script again: node scripts/generate-icons.js');
      return;
    }

    console.log('Generating PWA icons...');

    for (const size of iconSizes) {
      const outputPath = path.join(__dirname, '../public', `icon-${size}x${size}.png`);

      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon-${size}x${size}.png`);
    }

    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
