import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Table for CRC32
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const header = Buffer.alloc(4);
  header.writeUInt32BE(len, 0);

  const crcData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcData);
  const footer = Buffer.alloc(4);
  footer.writeUInt32BE(crcVal, 0);

  return Buffer.concat([header, typeBuf, data, footer]);
}

function generatePNG(width, height, drawFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8-bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines: (1 byte filter (0) + width * 4) * height
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Draw brand icon
function drawBrandIcon(isMaskable) {
  return (x, y, width, height) => {
    // Normalised coords -1 to 1
    const nx = (x / width) * 2 - 1;
    const ny = (y / height) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);

    // Rounded rectangle / squircle background for standard, full bleed for maskable
    const cornerRadius = 0.35;
    const absX = Math.abs(nx);
    const absY = Math.abs(ny);
    const inBox = Math.max(absX, absY) <= 0.92;
    const isCorner = absX > (1 - cornerRadius) && absY > (1 - cornerRadius);
    const cornerDist = Math.sqrt(Math.pow(absX - (1 - cornerRadius), 2) + Math.pow(absY - (1 - cornerRadius), 2));

    let inShape = true;
    if (!isMaskable) {
      if (!inBox || (isCorner && cornerDist > cornerRadius)) {
        inShape = false;
      }
    }

    if (!inShape) {
      return [0, 0, 0, 0];
    }

    // Gradient background: Deep vibrant teal to dark indigo (#0d4a63 to #162447)
    // with subtle glowing radial center
    const gradFactor = (ny + 1) / 2;
    let r = Math.round(13 + gradFactor * 10);
    let g = Math.round(74 - gradFactor * 35);
    let b = Math.round(99 + gradFactor * 25);

    // Radial highlight in center-top
    const highlightDist = Math.sqrt(Math.pow(nx, 2) + Math.pow(ny + 0.3, 2));
    if (highlightDist < 0.9) {
      const hAmount = (1 - highlightDist / 0.9) * 0.28;
      r = Math.min(255, Math.round(r + 30 * hAmount));
      g = Math.min(255, Math.round(g + 130 * hAmount));
      b = Math.min(255, Math.round(b + 160 * hAmount));
    }

    // Central graphic: Stylized 'S' inside safe area
    // Scale down if maskable (safe zone is inner 80%)
    const scale = isMaskable ? 0.65 : 0.75;
    const sx = nx / scale;
    const sy = ny / scale;

    // Stylized letter "S" geometry + book baseline
    let isS = false;
    let isAccent = false;

    // Outer radius ~ 0.55, thickness ~ 0.2
    // Top curve: center at (0, -0.28), radius 0.28 to 0.48, angles top & left
    const dTopCenter = Math.sqrt(sx * sx + (sy + 0.26) * (sy + 0.26));
    if (dTopCenter >= 0.18 && dTopCenter <= 0.44 && (sy < -0.26 || sx < 0.05)) {
      if (sy < 0.02) isS = true;
    }

    // Bottom curve: center at (0, 0.26), radius 0.18 to 0.44, angles bottom & right
    const dBotCenter = Math.sqrt(sx * sx + (sy - 0.26) * (sy - 0.26));
    if (dBotCenter >= 0.18 && dBotCenter <= 0.44 && (sy > 0.26 || sx > -0.05)) {
      if (sy > -0.02) isS = true;
    }

    // Center diagonal stroke connecting top and bottom loops
    if (Math.abs(sx * 1.2 + sy * 1.5) < 0.22 && sy >= -0.28 && sy <= 0.28) {
      isS = true;
    }

    // Book spine/page curves at the bottom (accent)
    // Left page
    if (sy > 0.58 && sy < 0.72) {
      const bookLeft = Math.abs(sx + 0.32) < 0.28 && Math.abs(sy - (0.64 + 0.08 * (sx + 0.32))) < 0.04;
      const bookRight = Math.abs(sx - 0.32) < 0.28 && Math.abs(sy - (0.64 - 0.08 * (sx - 0.32))) < 0.04;
      if (bookLeft || bookRight) isAccent = true;
    }

    // Sparkle / star on top right
    const spX = sx - 0.42;
    const spY = sy + 0.52;
    const spDist = Math.abs(spX) + Math.abs(spY);
    if (spDist < 0.14) {
      isAccent = true;
    }

    if (isAccent) {
      // Warm gold / yellow #FFC93C
      return [255, 201, 60, 255];
    }

    if (isS) {
      // Pure crisp white with subtle bevel
      return [255, 255, 255, 255];
    }

    // Subtle inner border ring
    if (!isMaskable && dist > 0.88 && dist < 0.91) {
      return [Math.min(255, r + 45), Math.min(255, g + 65), Math.min(255, b + 65), 180];
    }

    return [r, g, b, 255];
  };
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 192x192
const pwa192 = generatePNG(192, 192, drawBrandIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('Generated pwa-192x192.png');

// 2. Generate 512x512
const pwa512 = generatePNG(512, 512, drawBrandIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('Generated pwa-512x512.png');

// 3. Generate Maskable 512x512 (with safe zone bleed)
const pwaMaskable512 = generatePNG(512, 512, drawBrandIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
console.log('Generated pwa-maskable-512x512.png');

// 4. Generate Apple Touch Icon 180x180
const appleTouch = generatePNG(180, 180, drawBrandIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
console.log('Generated apple-touch-icon.png');

// 5. Generate favicon.ico (compatible 32x32 PNG inside or direct PNG favicon)
const favicon = generatePNG(64, 64, drawBrandIcon(false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);
console.log('Generated favicon.ico');

console.log('All PWA PNG icons successfully created!');
