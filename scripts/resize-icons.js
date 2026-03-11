import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const logoPath = path.join(publicDir, 'logo.png');

async function resizeIcons() {
  if (!fs.existsSync(logoPath)) {
    console.error('logo.png not found in public directory.');
    process.exit(1);
  }

  console.log('Generating PWA icons...');
  
  try {
    // PWA Install Icons
    await sharp(logoPath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
      
    await sharp(logoPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(publicDir, 'pwa-512x512.png'));

    // Apple Touch Icon
    await sharp(logoPath)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Push Notification Badge (Must be monochromatic/transparent for Android, we'll try to just resize first, 
    // Android ignores color channels and uses alpha channel for badges).
    await sharp(logoPath)
      .resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .greyscale() // Convert to greyscale for better badge compatibility
      .toFile(path.join(publicDir, 'badge.png'));

    console.log('✅ Icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

resizeIcons();
