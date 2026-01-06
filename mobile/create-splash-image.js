/* eslint-env node */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iosSvgPath = '/Users/beomsu/Desktop/tymee_app_icon_ios.svg';

// Android splash screen sizes (different densities)
const androidSizes = [
  { folder: 'drawable-mdpi', width: 320, height: 480 },
  { folder: 'drawable-hdpi', width: 480, height: 800 },
  { folder: 'drawable-xhdpi', width: 640, height: 960 },
  { folder: 'drawable-xxhdpi', width: 960, height: 1440 },
  { folder: 'drawable-xxxhdpi', width: 1280, height: 1920 },
];

async function createSplashScreens() {
  console.log('Android 스플래시 스크린 생성 중...\n');

  // Read the SVG icon
  const svgBuffer = fs.readFileSync(iosSvgPath);

  const locales = [
    { code: '', text: 'Tymee', name: '기본 (영어)' },
    { code: '-ko', text: '타이미', name: '한국어' },
  ];

  for (const locale of locales) {
    console.log(`\n${locale.name}:`);

    for (const size of androidSizes) {
      const folderPath = path.join(__dirname, `android/app/src/main/res/${size.folder}${locale.code}`);

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const outputPath = path.join(folderPath, 'splash_screen.png');

      // Calculate icon size (smaller than screen)
      const iconSize = Math.min(size.width, size.height) * 0.25; // 25% of smaller dimension
      const textSize = iconSize * 0.3; // Text size relative to icon

      // Create SVG with icon and text
      const splashSvg = `
        <svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
          <!-- Background -->
          <rect width="${size.width}" height="${size.height}" fill="#F3F8FF"/>

          <!-- App Icon (centered, upper part) -->
          <image
            href="data:image/svg+xml;base64,${svgBuffer.toString('base64')}"
            x="${(size.width - iconSize) / 2}"
            y="${(size.height - iconSize) / 2 - iconSize * 0.3}"
            width="${iconSize}"
            height="${iconSize}"/>

          <!-- App Name -->
          <text
            x="${size.width / 2}"
            y="${(size.height - iconSize) / 2 + iconSize * 0.8}"
            font-family="sans-serif"
            font-size="${textSize}"
            font-weight="600"
            fill="#42A5F5"
            text-anchor="middle">${locale.text}</text>
        </svg>
      `;

      // Convert to PNG
      await sharp(Buffer.from(splashSvg))
        .png()
        .toFile(outputPath);

      console.log(`✓ ${size.folder}${locale.code}/splash_screen.png (${size.width}x${size.height})`);
    }
  }

  console.log('\n✅ 모든 Android 스플래시 스크린 생성 완료!');
}

createSplashScreens().catch(console.error);
