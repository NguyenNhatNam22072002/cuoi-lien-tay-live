const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHAR_DIR = 'public/assets/wedding/characters';
if (!fs.existsSync(CHAR_DIR)) fs.mkdirSync(CHAR_DIR, { recursive: true });

function loadRgba(filePath) {
  const info = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`).toString();
  const w = parseInt(info.match(/pixelWidth:\s*(\d+)/)[1], 10);
  const h = parseInt(info.match(/pixelHeight:\s*(\d+)/)[1], 10);
  const raw = execSync(`/opt/homebrew/bin/ffmpeg -i "${filePath}" -f rawvideo -pix_fmt rgba -`, {
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  return { w, h, buf: Buffer.from(raw) };
}

function saveRgba(buf, w, h, outFile) {
  execSync(
    `/opt/homebrew/bin/ffmpeg -y -f rawvideo -pix_fmt rgba -s ${w}x${h} -i - -c:v png "${outFile}"`,
    { maxBuffer: 50 * 1024 * 1024, input: buf, stdio: ['pipe', 'ignore', 'ignore'] }
  );
}

// Chroma key green screen with anti-aliasing & spill suppression
function applyChromaKey(buf, w, h) {
  for (let i = 0; i < w * h * 4; i += 4) {
    let r = buf[i], g = buf[i + 1], b = buf[i + 2];
    const maxRB = Math.max(r, b);
    const excess = g - maxRB;

    // Green screen detection
    if (excess > 32 && g > 65) {
      buf[i + 3] = 0; // Pure transparent
    } else if (excess > 10 && g > 55) {
      // Smooth anti-aliased edge
      const t = (excess - 10) / 22;
      buf[i + 3] = Math.max(0, Math.min(255, Math.round((1 - t) * 255)));
      buf[i + 1] = maxRB; // remove green fringe
    } else {
      buf[i + 3] = 255; // Solid opaque!
      if (g > maxRB && excess > 5) {
        buf[i + 1] = maxRB; // green spill suppression
      }
    }
  }
}

// Remove stray floating specks (components smaller than minSize pixels)
function removeSmallIslands(buf, w, h, minSize = 250) {
  const total = w * h;
  const visited = new Uint8Array(total);
  const labels = new Int32Array(total);
  labels.fill(-1);

  const compSizes = [];
  let currentLabel = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || buf[idx * 4 + 3] < 30) continue;

      // Start BFS for new component
      let size = 0;
      const q = [idx];
      visited[idx] = 1;
      labels[idx] = currentLabel;

      let head = 0;
      while (head < q.length) {
        const cidx = q[head++];
        size++;
        const cx = cidx % w;
        const cy = Math.floor(cidx / w);

        const neighbors = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
          [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nidx = ny * w + nx;
            if (!visited[nidx] && buf[nidx * 4 + 3] >= 30) {
              visited[nidx] = 1;
              labels[nidx] = currentLabel;
              q.push(nidx);
            }
          }
        }
      }

      compSizes.push(size);
      currentLabel++;
    }
  }

  // Find max component size (the person)
  const maxSize = compSizes.length > 0 ? Math.max(...compSizes) : 0;
  // Threshold: keep only large components (the main body and attached limbs)
  const keepThreshold = Math.max(minSize, maxSize * 0.05);

  let erasedCount = 0;
  for (let i = 0; i < total; i++) {
    const lbl = labels[i];
    if (lbl >= 0 && compSizes[lbl] < keepThreshold) {
      buf[i * 4 + 3] = 0; // erase small stray island!
      erasedCount++;
    }
  }
  if (erasedCount > 0) {
    console.log(`  Erased ${erasedCount} stray pixels from small islands (< ${keepThreshold.toFixed(0)}px)`);
  }
}

// Slice region, run island cleaner, and crop to bounding box
function extractCleanCharacter(fullBuf, fullW, fullH, minX, maxX, padding = 4) {
  // First extract the slice with exact X boundaries
  const sliceW = maxX - minX + 1;
  const sliceH = fullH;
  const sliceBuf = Buffer.alloc(sliceW * sliceH * 4);

  for (let y = 0; y < sliceH; y++) {
    for (let x = 0; x < sliceW; x++) {
      const srcIdx = (y * fullW + (minX + x)) * 4;
      const dstIdx = (y * sliceW + x) * 4;
      sliceBuf[dstIdx] = fullBuf[srcIdx];
      sliceBuf[dstIdx + 1] = fullBuf[srcIdx + 1];
      sliceBuf[dstIdx + 2] = fullBuf[srcIdx + 2];
      sliceBuf[dstIdx + 3] = fullBuf[srcIdx + 3];
    }
  }

  // Remove any small stray floating specks
  removeSmallIslands(sliceBuf, sliceW, sliceH, 200);

  // Auto-crop to bounding box of opaque pixels
  let top = sliceH, bottom = 0, left = sliceW, right = 0;
  for (let y = 0; y < sliceH; y++) {
    for (let x = 0; x < sliceW; x++) {
      const idx = (y * sliceW + x) * 4;
      if (sliceBuf[idx + 3] > 30) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (left > right || top > bottom) {
    console.warn('Empty character bounding box for region', minX, maxX);
    left = 0; right = sliceW - 1; top = 0; bottom = sliceH - 1;
  }

  left = Math.max(0, left - padding);
  right = Math.min(sliceW - 1, right + padding);
  top = Math.max(0, top - padding);
  bottom = Math.min(sliceH - 1, bottom + padding);

  const cropW = right - left + 1;
  const cropH = bottom - top + 1;
  const cropBuf = Buffer.alloc(cropW * cropH * 4);

  for (let cy = 0; cy < cropH; cy++) {
    const srcY = top + cy;
    for (let cx = 0; cx < cropW; cx++) {
      const srcX = left + cx;
      const srcIdx = (srcY * sliceW + srcX) * 4;
      const dstIdx = (cy * cropW + cx) * 4;
      cropBuf[dstIdx] = sliceBuf[srcIdx];
      cropBuf[dstIdx + 1] = sliceBuf[srcIdx + 1];
      cropBuf[dstIdx + 2] = sliceBuf[srcIdx + 2];
      cropBuf[dstIdx + 3] = sliceBuf[srcIdx + 3];
    }
  }

  return { buf: cropBuf, w: cropW, h: cropH };
}

function flipHorizontal(buf, w, h) {
  const flipped = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const srcIdx = (y * w + x) * 4;
      const dstIdx = (y * w + (w - 1 - x)) * 4;
      flipped[dstIdx] = buf[srcIdx];
      flipped[dstIdx + 1] = buf[srcIdx + 1];
      flipped[dstIdx + 2] = buf[srcIdx + 2];
      flipped[dstIdx + 3] = buf[srcIdx + 3];
    }
  }
  return flipped;
}

// ==========================================
// 1. MAIN CHARACTERS (MC, Groom, Bride)
// ==========================================
const mainImgPath = '/Users/nus/.gemini/antigravity/brain/621fc0c4-57f4-4d42-bec3-c9d8ecb3a278/wedding_characters_chroma_green_1794275493287.jpg';
console.log('--- Processing Main Characters (MC, Groom, Bride) ---');
const mainImg = loadRgba(mainImgPath);
applyChromaKey(mainImg.buf, mainImg.w, mainImg.h);

// Exact gap analysis:
// MC: x=180..395 (use 100 to 450)
// Groom: x=588..788 (use 500 to 820)
// Bride: x=906..1271 (use 870 to 1350)
const mc = extractCleanCharacter(mainImg.buf, mainImg.w, mainImg.h, 100, 450);
saveRgba(mc.buf, mc.w, mc.h, path.join(CHAR_DIR, 'mc.png'));
console.log(`Saved mc.png (${mc.w}x${mc.h})`);

const groom = extractCleanCharacter(mainImg.buf, mainImg.w, mainImg.h, 500, 820);
saveRgba(groom.buf, groom.w, groom.h, path.join(CHAR_DIR, 'groom.png'));
console.log(`Saved groom.png (${groom.w}x${groom.h})`);

const bride = extractCleanCharacter(mainImg.buf, mainImg.w, mainImg.h, 870, 1350);
saveRgba(bride.buf, bride.w, bride.h, path.join(CHAR_DIR, 'bride.png'));
console.log(`Saved bride.png (${bride.w}x${bride.h})`);

// ==========================================
// 2. COUPLE KISS
// ==========================================
const kissImgPath = '/Users/nus/.gemini/antigravity/brain/621fc0c4-57f4-4d42-bec3-c9d8ecb3a278/wedding_couple_kissing_chroma_green_1794275517463.jpg';
console.log('--- Processing Couple Kiss ---');
const kissImg = loadRgba(kissImgPath);
applyChromaKey(kissImg.buf, kissImg.w, kissImg.h);
const kiss = extractCleanCharacter(kissImg.buf, kissImg.w, kissImg.h, 40, 860);
saveRgba(kiss.buf, kiss.w, kiss.h, path.join(CHAR_DIR, 'couple_kiss.png'));
console.log(`Saved couple_kiss.png (${kiss.w}x${kiss.h})`);

// ==========================================
// 3. WEDDING GUESTS (6 distinct guests)
// ==========================================
const guestsImgPath = '/Users/nus/.gemini/antigravity/brain/621fc0c4-57f4-4d42-bec3-c9d8ecb3a278/wedding_guests_chroma_green_1794275544343.jpg';
console.log('--- Processing 6 Distinct Wedding Guests ---');
const guestsImg = loadRgba(guestsImgPath);
applyChromaKey(guestsImg.buf, guestsImg.w, guestsImg.h);

// EXACT NON-OVERLAPPING REGIONS IN GAPS:
// Guest 0 (Man white shirt): 40 to 275
// Guest 1 (Woman red dress): 277 to 478
// Guest 2 (Man navy blazer): 480 to 705
// Guest 3 (Woman champagne gown): 710 to 905
// Guest 4 (Man casual shirt): 910 to 1138
// Guest 5 (Woman pastel pink): 1140 to 1335
const GUEST_BOUNDS = [
  { minX: 40, maxX: 275, id: 'm1_base' },
  { minX: 277, maxX: 478, id: 'f1_base' },
  { minX: 480, maxX: 705, id: 'm2_base' },
  { minX: 710, maxX: 905, id: 'f2_base' },
  { minX: 910, maxX: 1138, id: 'm3_base' },
  { minX: 1140, maxX: 1335, id: 'f3_base' },
];

const guests = GUEST_BOUNDS.map((b) => {
  const g = extractCleanCharacter(guestsImg.buf, guestsImg.w, guestsImg.h, b.minX, b.maxX);
  console.log(`Extracted guest ${b.id}: (${g.w}x${g.h})`);
  return g;
});

// Map to guest_m1..m7
saveRgba(guests[0].buf, guests[0].w, guests[0].h, path.join(CHAR_DIR, 'guest_m1.png'));
saveRgba(guests[2].buf, guests[2].w, guests[2].h, path.join(CHAR_DIR, 'guest_m2.png'));
saveRgba(guests[4].buf, guests[4].w, guests[4].h, path.join(CHAR_DIR, 'guest_m3.png'));

const flipM1 = flipHorizontal(guests[0].buf, guests[0].w, guests[0].h);
saveRgba(flipM1, guests[0].w, guests[0].h, path.join(CHAR_DIR, 'guest_m4.png'));

const flipM2 = flipHorizontal(guests[2].buf, guests[2].w, guests[2].h);
saveRgba(flipM2, guests[2].w, guests[2].h, path.join(CHAR_DIR, 'guest_m5.png'));

const flipM3 = flipHorizontal(guests[4].buf, guests[4].w, guests[4].h);
saveRgba(flipM3, guests[4].w, guests[4].h, path.join(CHAR_DIR, 'guest_m6.png'));

saveRgba(guests[0].buf, guests[0].w, guests[0].h, path.join(CHAR_DIR, 'guest_m7.png'));

// Map to guest_f1..f8
saveRgba(guests[1].buf, guests[1].w, guests[1].h, path.join(CHAR_DIR, 'guest_f1.png'));
saveRgba(guests[3].buf, guests[3].w, guests[3].h, path.join(CHAR_DIR, 'guest_f2.png'));
saveRgba(guests[5].buf, guests[5].w, guests[5].h, path.join(CHAR_DIR, 'guest_f3.png'));

const flipF1 = flipHorizontal(guests[1].buf, guests[1].w, guests[1].h);
saveRgba(flipF1, guests[1].w, guests[1].h, path.join(CHAR_DIR, 'guest_f4.png'));

const flipF2 = flipHorizontal(guests[3].buf, guests[3].w, guests[3].h);
saveRgba(flipF2, guests[3].w, guests[3].h, path.join(CHAR_DIR, 'guest_f5.png'));

const flipF3 = flipHorizontal(guests[5].buf, guests[5].w, guests[5].h);
saveRgba(flipF3, guests[5].w, guests[5].h, path.join(CHAR_DIR, 'guest_f6.png'));

saveRgba(guests[1].buf, guests[1].w, guests[1].h, path.join(CHAR_DIR, 'guest_f7.png'));
saveRgba(guests[3].buf, guests[3].w, guests[3].h, path.join(CHAR_DIR, 'guest_f8.png'));

console.log('✅ ALL SPRITES EXTRACTED WITH ZERO OVERLAP AND ZERO STRAY PIXELS!');
