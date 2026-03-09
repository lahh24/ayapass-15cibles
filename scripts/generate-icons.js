// Generate PWA icons as SVG-based PNGs
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

function generateSVG(size) {
  const fontSize = Math.round(size * 0.5);
  const radius = Math.round(size * 0.18);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0a0a0a"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#f97316" font-family="Arial,sans-serif" font-weight="bold" font-size="${fontSize}">A</text>
</svg>`;
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Write SVG versions (browsers can use these)
fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), generateSVG(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.svg'), generateSVG(512));

console.log('SVG icons generated in public/icons/');
console.log('Note: For production PNG icons, convert these SVGs to PNG.');
